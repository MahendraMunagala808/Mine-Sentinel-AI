"""
Mine Sentinel AI - Telemetry Simulator
Dual-Mode Resilient Simulator:
1. Primary: Streams simulated multi-node telemetry over MQTT (broker.emqx.io:1883).
2. Fallback: If MQTT broker is unreachable or DNS fails, streams directly via HTTP REST API (http://127.0.0.1:8000/api/telemetry).
"""

import time
import json
import random
import os
import socket
import urllib.request
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

load_dotenv()

BROKER = os.getenv("MQTT_BROKER", "broker.emqx.io")
PORT = int(os.getenv("MQTT_PORT", 1883))
HTTP_API_URL = os.getenv("BACKEND_API_URL", "http://127.0.0.1:8000/api/telemetry")

DEVICES = [
    {
        "device_id": "NODE_ESP32_01",
        "sector_id": "SEC-01",
        "sector_name": "Level -100m Main Adit",
        "level": "Level -100m",
        "battery": 96.5,
        "rssi": -58
    },
    {
        "device_id": "NODE_ESP32_02",
        "sector_id": "SEC-02",
        "sector_name": "Level -250m Deep Face",
        "level": "Level -250m",
        "battery": 88.0,
        "rssi": -72
    },
    {
        "device_id": "NODE_ESP32_03",
        "sector_id": "SEC-03",
        "sector_name": "Level -400m Ventilation Trunk B",
        "level": "Level -400m",
        "battery": 92.5,
        "rssi": -65
    },
    {
        "device_id": "NODE_ESP32_04",
        "sector_id": "SEC-04",
        "sector_name": "Sub-Shaft 03 Extraction Zone",
        "level": "Level -300m",
        "battery": 79.0,
        "rssi": -78
    }
]

def generate_sensor_data(device_info, scenario="normal"):
    """Generate simulated sensor data based on a scenario for a specific device."""
    if scenario == "normal":
        gas = random.uniform(100, 250)
        co = random.uniform(5, 25)
        temp = random.uniform(22, 32)
        hum = random.uniform(45, 60)
        flame = 0
    elif scenario == "gas_leak":
        gas = random.uniform(900, 1500)
        co = random.uniform(40, 90)
        temp = random.uniform(24, 34)
        hum = random.uniform(45, 60)
        flame = 0
    elif scenario == "fire":
        gas = random.uniform(500, 1000)
        co = random.uniform(130, 300)
        temp = random.uniform(52, 70)
        hum = random.uniform(25, 45)
        flame = 1  # Flame detected!
    else:
        # Warning (Elevated)
        gas = random.uniform(480, 750)
        co = random.uniform(55, 100)
        temp = random.uniform(41, 48)
        hum = random.uniform(65, 88)
        flame = 0

    is_hazard = (scenario in ["warning", "gas_leak", "fire"])
    t1_status = "CRITICAL" if scenario in ["gas_leak", "fire"] else ("WARNING" if scenario == "warning" else "SAFE")
    return {
        "device_id": device_info["device_id"],
        "tunnel": "Tunnel 1",
        "tunnel_1_status": t1_status,
        "tunnel_2_alert": 1 if is_hazard else 0,
        "sector_id": device_info["sector_id"],
        "sector_name": device_info["sector_name"],
        "level": device_info["level"],
        "battery": round(max(10.0, device_info["battery"] - random.uniform(0.01, 0.05)), 1),
        "rssi": device_info["rssi"] + random.randint(-2, 2),
        "gas": round(gas, 2),
        "co": round(co, 2),
        "temperature": round(temp, 2),
        "humidity": round(hum, 2),
        "flame": flame
    }

def try_connect_mqtt():
    """Attempts resilient MQTT connection across hostnames and fallback IP addresses."""
    hosts = [BROKER, "34.243.217.54", "35.172.255.228", "127.0.0.1", "localhost"]
    
    # Instantiate client with version safety
    try:
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    except AttributeError:
        try:
            client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
        except AttributeError:
            client = mqtt.Client()

    for h in hosts:
        try:
            print(f"[MQTT] Checking broker '{h}:{PORT}'...", flush=True)
            client.connect(h, PORT, keepalive=60)
            client.loop_start()
            print(f"[MQTT] Successfully connected to broker: {h}:{PORT}", flush=True)
            return client
        except Exception as e:
            print(f"[MQTT] Host '{h}' unreachable: {e}", flush=True)
            continue
            
    return None

def send_http_telemetry(data):
    """Fallback: sends telemetry directly to local FastAPI backend via HTTP."""
    try:
        payload = json.dumps(data).encode("utf-8")
        req = urllib.request.Request(
            HTTP_API_URL,
            data=payload,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=2) as resp:
            return resp.status in (200, 201)
    except Exception as e:
        return False

def main():
    print("=" * 65, flush=True)
    print("  MINE SENTINEL AI - MULTI-NODE TELEMETRY SIMULATOR", flush=True)
    print("=" * 65, flush=True)

    mqtt_client = try_connect_mqtt()
    if mqtt_client:
        mode = "MQTT"
        print("[Simulator] Mode: MQTT Publishing (Real-time Broker)", flush=True)
    else:
        mode = "HTTP"
        print(f"[Simulator] Mode: HTTP Direct Stream ({HTTP_API_URL})", flush=True)
        print("[Simulator] Live telemetry streaming directly to local backend!", flush=True)

    scenarios = ["normal", "normal", "normal", "warning", "gas_leak", "normal", "fire", "normal"]
    dev_scenarios = {d["device_id"]: "normal" for d in DEVICES}

    try:
        while True:
            for dev in DEVICES:
                if random.random() < 0.08:
                    dev_scenarios[dev["device_id"]] = random.choice(scenarios)

                curr_scenario = dev_scenarios[dev["device_id"]]
                data = generate_sensor_data(dev, curr_scenario)
                payload = json.dumps(data)

                if mode == "MQTT" and mqtt_client:
                    topic = f"minesentinel/device/{dev['device_id']}/telemetry"
                    mqtt_client.publish(topic, payload)
                    print(f"[{dev['device_id']}] [{curr_scenario.upper()}] [MQTT] Gas={data['gas']} PPM, CO={data['co']} PPM, Temp={data['temperature']}C", flush=True)
                else:
                    success = send_http_telemetry(data)
                    status_flag = "OK" if success else "BACKEND WAITING"
                    print(f"[{dev['device_id']}] [{curr_scenario.upper()}] [HTTP {status_flag}] Gas={data['gas']} PPM, CO={data['co']} PPM, Temp={data['temperature']}C", flush=True)

            time.sleep(2.5)

    except KeyboardInterrupt:
        print("\nSimulator stopped by user.", flush=True)
        if mqtt_client:
            mqtt_client.loop_stop()
            mqtt_client.disconnect()

if __name__ == "__main__":
    main()
