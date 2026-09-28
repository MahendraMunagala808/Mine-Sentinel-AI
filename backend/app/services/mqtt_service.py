import os
import json
from datetime import datetime, timezone
import paho.mqtt.client as mqtt
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.domain import SensorReading, Device, Alert
from app.schemas.domain import SensorDataCreate
from app.services.ml_service import predictor, get_risk_label
import threading
import socket
import time

class MQTTClient:
    def __init__(self):
        self.broker = os.getenv("MQTT_BROKER", "broker.emqx.io")
        self.port = int(os.getenv("MQTT_PORT", 1883))
        self.topic_telemetry = os.getenv("MQTT_TOPIC_TELEMETRY", "minesentinel/device/+/telemetry")
        self.is_connected = False
        
        try:
            self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        except AttributeError:
            try:
                self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
            except AttributeError:
                self.client = mqtt.Client()
        
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.on_disconnect = self.on_disconnect

    def _resolve_broker(self) -> str:
        """Resolves broker hostname; falls back to known resilient public EMQX IPs if local DNS fails."""
        try:
            return socket.gethostbyname(self.broker)
        except (socket.gaierror, socket.herror, Exception) as e:
            print(f"[MQTT] DNS resolution for '{self.broker}' failed ({e}). Testing fallback IP addresses...")
            fallbacks = ["34.243.217.54", "35.172.255.228", "44.232.241.40"]
            for ip in fallbacks:
                try:
                    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    s.settimeout(2.0)
                    s.connect((ip, self.port))
                    s.close()
                    print(f"[MQTT] Connected successfully to fallback broker IP {ip}:{self.port}")
                    return ip
                except Exception:
                    continue
            return self.broker

    def _connect_worker(self):
        while not self.is_connected:
            target_host = self._resolve_broker()
            print(f"[MQTT] Attempting connection to MQTT Broker {target_host}:{self.port}...")
            try:
                self.client.connect(target_host, self.port, 60)
                self.client.loop_start()
                return
            except Exception as e:
                print(f"[MQTT] Connection to {target_host} failed: {e}. Retrying in 5s...")
                time.sleep(5)

    def start(self):
        t = threading.Thread(target=self._connect_worker, daemon=True)
        t.start()

    def on_connect(self, client, userdata, flags, reason_code_or_rc, properties=None):
        rc = getattr(reason_code_or_rc, "value", reason_code_or_rc)
        is_ok = (rc == 0) or (hasattr(reason_code_or_rc, "is_failure") and not reason_code_or_rc.is_failure)
        if is_ok:
            self.is_connected = True
            print(f"[MQTT] Connected to MQTT broker successfully.")
            client.subscribe(self.topic_telemetry)
            print(f"[MQTT] Subscribed to topic: {self.topic_telemetry}")
        else:
            print(f"[MQTT] Bad connection. Code: {reason_code_or_rc}")

    def on_disconnect(self, client, userdata, *args, **kwargs):
        self.is_connected = False
        print(f"[MQTT] Disconnected from broker. Will attempt reconnection...")
        t = threading.Thread(target=self._connect_worker, daemon=True)
        t.start()

    def on_message(self, client, userdata, msg):
        try:
            payload = msg.payload.decode('utf-8')
            data = json.loads(payload)
            
            # Extract device ID from topic or payload
            topic_parts = msg.topic.split('/')
            device_id = topic_parts[2] if len(topic_parts) >= 3 else data.get('device_id', 'unknown')
            
            self.process_telemetry(device_id, data)
        except Exception as e:
            print(f"Error processing MQTT message: {e}")

    def process_telemetry(self, device_id: str, data: dict):
        db: Session = SessionLocal()
        try:
            # Ensure device exists
            device = db.query(Device).filter(Device.device_id == device_id).first()
            if not device:
                device = Device(
                    device_id=device_id,
                    location=data.get('location', 'Zone 1'),
                    sector_id=data.get('sector_id', 'SEC-01'),
                    sector_name=data.get('sector_name', 'Level -100m Main Adit'),
                    level=data.get('level', 'Level -100m'),
                    battery_level=data.get('battery', 95.0),
                    rssi_dbm=data.get('rssi', -60),
                    firmware_ver=data.get('firmware', 'v2.4.1-ESP32-ADC16'),
                    packet_drop_pct=data.get('packet_drop', 0.2),
                    uptime_mins=data.get('uptime_mins', 1440),
                    is_active=True
                )
                db.add(device)
                db.commit()
            # Update device live connection status and telemetry
            device.is_active = True
            device.last_seen = datetime.now()
            if 'battery' in data:
                device.battery_level = float(data['battery'])
            if 'rssi' in data:
                device.rssi_dbm = int(data['rssi'])
            if 'firmware' in data:
                device.firmware_ver = str(data['firmware'])
            if 'packet_drop' in data:
                device.packet_drop_pct = float(data['packet_drop'])
            if 'uptime_mins' in data:
                device.uptime_mins = int(data['uptime_mins'])
            db.commit()

            # Predict risk
            risk_level = predictor.predict_risk({
                'gas': data.get('gas', 0),
                'co': data.get('co', 0),
                'temperature': data.get('temperature', 0),
                'humidity': data.get('humidity', 0),
                'flame': data.get('flame', 0)
            })
            risk_label = get_risk_label(risk_level)

            # Prevent storing duplicate packet received in rapid succession (< 1.5s)
            last_reading = db.query(SensorReading).filter(SensorReading.device_id == device_id).order_by(SensorReading.id.desc()).first()
            if last_reading and last_reading.timestamp:
                try:
                    last_ts = last_reading.timestamp.replace(tzinfo=None) if last_reading.timestamp.tzinfo else last_reading.timestamp
                    current_ts = datetime.now(timezone.utc).replace(tzinfo=None)
                    diff = abs((current_ts - last_ts).total_seconds())
                    flame_in = int(data.get('flame', 0) or 0)
                    last_flame = int(last_reading.flame or 0)
                    # Flame state changes (fire detected or cleared) must NEVER be dropped
                    if flame_in == last_flame and diff < 1.5 and abs((last_reading.gas or 0) - float(data.get('gas', 0))) < 0.01 and abs((last_reading.co or 0) - float(data.get('co', 0))) < 0.01:
                        return
                except Exception:
                    pass

            # Store reading
            reading = SensorReading(
                device_id=device_id,
                gas=data.get('gas', 0),
                co=data.get('co', 0),
                temperature=data.get('temperature', 0),
                humidity=data.get('humidity', 0),
                flame=data.get('flame', 0),
                risk_level=risk_level,
                risk_label=risk_label
            )
            db.add(reading)
            db.commit()

            # Create Alert if warning or critical
            if risk_level > 0:
                alert = Alert(
                    device_id=device_id,
                    alert_type=risk_label,
                    message=f"{risk_label} conditions detected. Gas: {data.get('gas', 0)} ppm, CO: {data.get('co', 0)} ppm, Temp: {data.get('temperature', 0)}°C, Flame: {data.get('flame', 0)}"
                )
                db.add(alert)
                db.commit()

            # Dispatch real-time mobile push notification via ntfy (if conditions warrant or recovery)
            try:
                from app.services.ntfy_service import ntfy_service
                ntfy_service.dispatch_hazard_telemetry(device_id, risk_label, data)
            except Exception as push_err:
                print(f"[ntfy] Push dispatch non-fatal error: {push_err}")
                
            print(f"Stored reading from {device_id} | Risk: {risk_label}")

        except Exception as e:
            print(f"DB Error processing telemetry: {e}")
            db.rollback()
        finally:
            db.close()

mqtt_client = MQTTClient()
