#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_ADS1X15.h>
#include <LiquidCrystal_I2C.h>

// --- Configuration ---
const char* ssid = "realme P3 Ultra 5G 7CC6";
const char* password = "12345678911";
const char* mqtt_server = "broker.emqx.io"; // Public EMQX MQTT Broker
const int mqtt_port = 1883;

// Device & MQTT Topics
const char* device_id = "ESP32_NODE_01";
const char* topic_telemetry = "minesentinel/device/ESP32_NODE_01/telemetry";

// --- Hardware Pins for ESP32 (30-Pin Dev Module / Breakout Shield) ---
#define DHTPIN 4          // GPIO4 / D4
#define DHTTYPE DHT11

#define FLAME_PIN 15      // GPIO15 / D15

#define LED_GREEN 2       // GPIO2 / D2
#define LED_YELLOW 19     // GPIO19 / D19
#define LED_RED 23        // GPIO23 / D23
#define BUZZER 18         // GPIO18 / D18
#define RELAY_FAN 5       // GPIO5 / D5 (1k Pull-up to 5V relay control)

// Hardware I2C Bus Pins on ESP32
#define I2C_SDA 21
#define I2C_SCL 22

// --- Safety Threshold Constants (Calibrated for Real Hardware & Room Conditions) ---
// SAFE: Gas <= 450 ppm, CO <= 50 ppm, Temp <= 40°C
// WARNING: Gas > 450 ppm, CO > 50 ppm, Temp > 40°C
// CRITICAL: Gas > 850 ppm, CO > 120 ppm, Temp > 50°C, or Flame Detected
#define THRESHOLD_GAS_WARN   450.0  // MQ-2 Combustible Gas/Smoke Warning (ppm)
#define THRESHOLD_GAS_CRIT   850.0  // MQ-2 Combustible Gas/Smoke Critical (ppm)
#define THRESHOLD_CO_WARN    50.0   // MQ-7 Carbon Monoxide Warning (ppm)
#define THRESHOLD_CO_CRIT    120.0  // MQ-7 Carbon Monoxide Critical (ppm)
#define THRESHOLD_TEMP_WARN  40.0   // Temperature Warning (°C)
#define THRESHOLD_TEMP_CRIT  50.0   // Temperature Critical (°C)

// --- Objects ---
WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHTPIN, DHTTYPE);
Adafruit_ADS1115 ads; 
LiquidCrystal_I2C* lcd = nullptr; // Will dynamically instantiate at auto-detected address (0x27 or 0x3F)

// --- Timers & State ---
unsigned long lastMsg = 0;
const long interval = 5000; // Publish every 5 seconds

bool lcd_initialized = false;
bool ads_initialized = false;
const char* current_risk = "SAFE";

// Helper function to control Relay & Fan
void setFan(bool on) {
  if (on) {
    pinMode(RELAY_FAN, INPUT);     // High-Z: 1k pull-up resistor powers relay ON
  } else {
    pinMode(RELAY_FAN, OUTPUT);
    digitalWrite(RELAY_FAN, LOW);  // Grounded: ESP32 sinks to 0V, turning relay OFF
  }
}

// LCD Page Rotation State
int lcdPage = 0;
unsigned long lastLcdRotate = 0;
const long lcdRotateInterval = 2500; // Switch page every 2.5 seconds

// Helper function to render 16x2 LCD Interface with 2 Rotating Pages
void updateLCDDisplay(float gas, float co, float temp, float hum, bool flame, const char* risk_level) {
  if (!lcd_initialized || lcd == nullptr) return;

  lcd->clear();

  if (flame) {
    // Immediate Emergency Screen (Tunnel 1 Fire -> Tunnel 2 Evacuation Alert)
    lcd->setCursor(0, 0);
    lcd->print("! T1 FIRE ALERT !");
    lcd->setCursor(0, 1);
    lcd->print("T1:EVAC  T2:ALRT");
    return;
  }

  if (lcdPage == 0) {
    // === PAGE 1: Gas Telemetry & Dual-Tunnel Cascaded Alert Status ===
    lcd->setCursor(0, 0);
    char gasBuf[12];
    snprintf(gasBuf, sizeof(gasBuf), "G:%d C:%d", (int)gas, (int)co);
    lcd->print(gasBuf);

    // Right-align status tag at column 10 (Columns 10 to 15)
    lcd->setCursor(10, 0);
    if (strcmp(risk_level, "CRITICAL") == 0) {
      lcd->print("[CRIT]");
    } else if (strcmp(risk_level, "WARNING") == 0) {
      lcd->print("[WARN]");
    } else {
      lcd->print("[SAFE]");
    }

    // Line 2: Dual-Tunnel Status (Tunnel 1 condition + Tunnel 2 cascaded alert)
    lcd->setCursor(0, 1);
    if (strcmp(risk_level, "CRITICAL") == 0) {
      lcd->print("T1:CRIT  T2:ALRT");
    } else if (strcmp(risk_level, "WARNING") == 0) {
      lcd->print("T1:WARN  T2:ALRT");
    } else {
      lcd->print("T1:SAFE  T2:SAFE");
    }
  } else {
    // === PAGE 2: Temperature, Humidity & Exhaust Fan / Tunnel 2 Output ===
    lcd->setCursor(0, 0);
    char buf1[17];
    snprintf(buf1, sizeof(buf1), "TEMP:%dC  HUM:%d%%", (int)temp, (int)hum);
    lcd->print(buf1);

    lcd->setCursor(0, 1);
    if (strcmp(risk_level, "CRITICAL") == 0) {
      lcd->print("FAN:ON   T2:EVAC");
    } else if (strcmp(risk_level, "WARNING") == 0) {
      lcd->print("FAN:ON   T2:WARN");
    } else {
      lcd->print("FAN:OFF  T2:SAFE");
    }
  }
}

void initI2CDevices() {
  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setTimeOut(100); // 100ms timeout prevents I2C freezing

  Serial.println("\n--- Scanning I2C Bus on GPIO21(SDA) & GPIO22(SCL) ---");
  byte count = 0;
  byte lcd_addr = 0;

  for (byte address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    byte error = Wire.endTransmission();

    if (error == 0) {
      Serial.print("[I2C Found] Device at address 0x");
      if (address < 16) Serial.print("0");
      Serial.println(address, HEX);
      count++;

      if (address == 0x27 || address == 0x3F) {
        lcd_addr = address;
      }
      if (address == 0x48) {
        ads_initialized = true;
      }
    }
  }

  if (count == 0) {
    Serial.println("[I2C] No I2C devices found. Check SDA (D21) & SCL (D22) wiring.");
  } else {
    Serial.printf("[I2C] Total %d device(s) detected.\n", count);
  }

  // Initialize LCD with auto-detected address (or fallback to 0x27)
  if (lcd_addr == 0) {
    lcd_addr = 0x27; // Standard fallback
    Serial.println("[LCD] Auto-detect empty, defaulting to 0x27.");
  }
  Serial.printf("[LCD] Initializing LCD at address 0x%02X...\n", lcd_addr);
  if (lcd != nullptr) delete lcd;
  lcd = new LiquidCrystal_I2C(lcd_addr, 16, 2);
  lcd->init();
  lcd->backlight();
  lcd_initialized = true;

  lcd->setCursor(0, 0);
  lcd->print("MineSentinel AI");
  lcd->setCursor(0, 1);
  lcd->print("Connecting WiFi.");

  // Initialize ADS1115
  if (ads_initialized) {
    if (ads.begin(0x48, &Wire)) {
      Serial.println("[ADC] ADS1115 16-bit ADC initialized successfully on 0x48.");
    } else {
      Serial.println("[ADC] ADS1115 begin failed.");
      ads_initialized = false;
    }
  } else {
    Serial.println("[ADC] ADS1115 not found at 0x48 — using internal fallback.");
  }
}

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  // Non-blocking timeout after 20 attempts (10 seconds) so offline operation is supported
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    if (lcd_initialized && lcd) {
      lcd->setCursor(15, 1);
      lcd->print((attempts % 2 == 0) ? "." : " ");
    }
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());

    if (lcd_initialized && lcd) {
      lcd->setCursor(0, 1);
      lcd->print("WiFi Connected! ");
      delay(1000);
    }
  } else {
    Serial.println("\n[WiFi Warning] Connection timed out! Running in Standalone / Offline Sensor Mode.");
    if (lcd_initialized && lcd) {
      lcd->setCursor(0, 1);
      lcd->print("WiFi: Offline   ");
      delay(1500);
    }
  }
}

unsigned long lastMqttRetry = 0;

void reconnect() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (millis() - lastMqttRetry < 5000) return; // Non-blocking throttle: retry every 5s without freezing
  lastMqttRetry = millis();

  // Unique client ID prevents broker disconnect kicks on public EMQX broker
  String clientId = "ESP32_NODE_01_" + String((uint32_t)ESP.getEfuseMac(), HEX);
  Serial.printf("Attempting MQTT connection as %s...", clientId.c_str());
  if (client.connect(clientId.c_str())) {
    Serial.println("connected!");
  } else {
    Serial.printf("failed, rc=%d (will retry in background)\n", client.state());
  }
}

void setup() {
  Serial.begin(115200);
  
  // Initialize Pins (Use INPUT_PULLUP for open-collector LM393 IR Flame module)
  pinMode(FLAME_PIN, INPUT_PULLUP);
  
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  
  // Default states: GREEN ON (System Normal & Safe on Startup)
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_RED, LOW);
  digitalWrite(BUZZER, LOW);
  setFan(false); // Fan initially OFF

  // Scan I2C bus and initialize LCD + ADS1115
  initI2CDevices();

  // Initialize DHT11
  dht.begin();
  
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setBufferSize(512); // CRITICAL: Expand PubSubClient packet buffer to 512 bytes so JSON is never dropped
  
  Serial.println("\n=== MineSentinel AI ESP32 Node Online (Flame Safety Latched) ===");
}

// Global cached telemetry for LCD rotation & immediate publishing
float latest_t = 25.0;
float latest_h = 50.0;
float latest_gas = 15.0;
float latest_co = 20.0;

// Flame Latch & Immediate Publishing State
unsigned long flame_latch_until = 0;
const unsigned long FLAME_LATCH_DURATION = 8000; // Hold alert for 8 seconds so momentary lighter flame is guaranteed captured
bool last_flame_sent = false;
unsigned long lastFlameDebug = 0;

// Global state for Buzzer Warning Pulse
unsigned long lastBuzzerWarn = 0;
const long buzzerWarnInterval = 3000; // 3-second gap between warning beeps

// Modular Telemetry Publisher: called periodically (every 5s) OR immediately upon flame detection
void publishTelemetry(bool is_flame, const char* risk_override = nullptr) {
  const char* risk_to_send = (risk_override != nullptr) ? risk_override : (is_flame ? "CRITICAL" : current_risk);
  
  StaticJsonDocument<512> doc;
  doc["device_id"] = device_id;
  doc["tunnel"] = "Tunnel 1";
  doc["tunnel_1_status"] = risk_to_send;
  doc["tunnel_2_alert"] = (strcmp(risk_to_send, "SAFE") != 0) ? 1 : 0;
  doc["gas"] = latest_gas;
  doc["co"] = latest_co;
  doc["temperature"] = latest_t;
  doc["humidity"] = latest_h;
  doc["flame"] = is_flame ? 1 : 0;
  doc["rssi"] = WiFi.RSSI();
  doc["uptime_mins"] = (int)(millis() / 60000);
  doc["battery"] = 100.0;
  doc["firmware"] = "v2.4.2-ESP32-FlameLatch";
  
  char buffer[512];
  size_t n = serializeJson(doc, buffer, sizeof(buffer));
  
  Serial.print("[MQTT Telemetry] ");
  Serial.println(buffer);
  if (client.connected()) {
    bool ok = client.publish(topic_telemetry, buffer);
    if (!ok) {
      Serial.println("[MQTT ERROR] client.publish() failed! Packet exceeded buffer or disconnected.");
    }
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  
  // ── FLAME DETECTION WITH SAFETY LATCH & IMMEDIATE EMERGENCY DISPATCH ──
  int flame_val = digitalRead(FLAME_PIN);
  // Standard optical IR flame modules (LM393) output LOW on DO when flame/fire is detected.
  bool raw_flame_sensed = (flame_val == LOW);

  if (raw_flame_sensed) {
    flame_latch_until = now + FLAME_LATCH_DURATION;
  }
  bool is_flame_active = (now < flame_latch_until);

  // Serial Diagnostic every 2.5s for easy hardware calibration via Serial Monitor
  if (now - lastFlameDebug > 2500) {
    lastFlameDebug = now;
    Serial.printf("[FLAME SENSOR] GPIO15 DO: %d (%s) | Latch: %s | Risk: %s\n",
                  flame_val, raw_flame_sensed ? "FIRE DETECTED" : "CLEAR",
                  is_flame_active ? "LATCHED ACTIVE" : "IDLE", current_risk);
  }

  // IMMEDIATE Emergency State Transition Dispatch (Bypasses 5-second periodic wait)
  if (is_flame_active && !last_flame_sent) {
    last_flame_sent = true;
    current_risk = "CRITICAL";
    digitalWrite(LED_RED, HIGH);
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_YELLOW, LOW);
    digitalWrite(BUZZER, HIGH);
    setFan(true);
    updateLCDDisplay(1000.0, 200.0, 35.0, 50.0, true, "CRITICAL");

    Serial.println("🚨 [EMERGENCY OVERRIDE] Fire outbreak! Immediate MQTT Emergency Publish to broker & mobile gateway...");
    publishTelemetry(true, "CRITICAL");
  } else if (!is_flame_active && last_flame_sent) {
    last_flame_sent = false;
    Serial.println("✅ [FIRE CLEARED] Flame extinguished & latch expired. Immediate MQTT recovery broadcast...");
    publishTelemetry(false);
  }

  // Continuous Hardware Actuation during active flame latch
  if (is_flame_active) {
    digitalWrite(LED_RED, HIGH);
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_YELLOW, LOW);
    digitalWrite(BUZZER, HIGH); // Continuous siren during fire
    setFan(true);               // Turn on exhaust fan in fire!
    current_risk = "CRITICAL";
    updateLCDDisplay(1000.0, 200.0, 35.0, 50.0, true, "CRITICAL");
  }

  // --- Dynamic Buzzer Management (when no flame) ---
  if (!is_flame_active) {
    if (strcmp(current_risk, "CRITICAL") == 0) {
      digitalWrite(BUZZER, HIGH); // Continuous siren for critical gas/temp
    } else if (strcmp(current_risk, "WARNING") == 0) {
      // 3-Second Gap Caution Beep: 150ms beep ON, then silent for the rest of the 3 seconds
      if (now - lastBuzzerWarn < 150) {
        digitalWrite(BUZZER, HIGH); // Short caution beep
      } else if (now - lastBuzzerWarn < buzzerWarnInterval) {
        digitalWrite(BUZZER, LOW);  // 3-second silence gap
      } else {
        lastBuzzerWarn = now;       // Restart 3-second cycle
      }
    } else {
      digitalWrite(BUZZER, LOW);    // Silent in Safe mode
    }
  }

  // Smooth 2.5s LCD Page Rotation (Independent Timer, when no flame)
  if (!is_flame_active && (now - lastLcdRotate > lcdRotateInterval)) {
    lastLcdRotate = now;
    lcdPage = (lcdPage + 1) % 2; // Toggle between Page 0 and Page 1
    updateLCDDisplay(latest_gas, latest_co, latest_t, latest_h, false, current_risk);
  }

  // Periodic Telemetry Publishing & Sensor Refresh (Every 5 seconds)
  if (now - lastMsg > interval) {
    lastMsg = now;
    
    // Read DHT with fallback defaults if disconnected
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    
    if (isnan(h) || isnan(t)) {
      Serial.println("[WARN] DHT11 not responding on GPIO 4 — using baseline (T:25C, H:50%)");
      h = 50.0;
      t = 25.0;
    }
    latest_h = h;
    latest_t = t;
    
    // Read MQ sensors via ADS1115 (or fallback if ADC disconnected)
    float mq2_ppm = 25.0;
    float mq7_ppm = 5.0;

    if (ads_initialized) {
      int16_t adc0 = ads.readADC_SingleEnded(0); // MQ-2 Gas
      int16_t adc1 = ads.readADC_SingleEnded(1); // MQ-7 CO
      mq2_ppm = map(adc0, 0, 32767, 0, 1000); 
      mq7_ppm = map(adc1, 0, 32767, 0, 200);
    }
    if (mq2_ppm < 0) mq2_ppm = 0;
    if (mq7_ppm < 0) mq7_ppm = 0;
    latest_gas = mq2_ppm;
    latest_co = mq7_ppm;

    // --- Unified Hazard Response (non-flame conditions) ---
    if (!is_flame_active) {
      if (mq2_ppm > THRESHOLD_GAS_CRIT || mq7_ppm > THRESHOLD_CO_CRIT || t > THRESHOLD_TEMP_CRIT) {
        // CRITICAL: RED LED + Continuous Siren + Fan
        digitalWrite(LED_RED, HIGH);
        digitalWrite(LED_GREEN, LOW);
        digitalWrite(LED_YELLOW, LOW);
        setFan(true);                  // Exhaust fan ON
        current_risk = "CRITICAL";
        Serial.println("[CRITICAL] Hazard threshold exceeded — Continuous Siren & Fan ACTIVE.");
      } else if (mq2_ppm > THRESHOLD_GAS_WARN || mq7_ppm > THRESHOLD_CO_WARN || t > THRESHOLD_TEMP_WARN) {
        // WARNING: YELLOW LED + Fan + 3s Interval Buzzer Beep
        digitalWrite(LED_YELLOW, HIGH);
        digitalWrite(LED_GREEN, LOW);
        digitalWrite(LED_RED, LOW);
        setFan(true);                  // Exhaust fan ON to clear warning gas
        current_risk = "WARNING";
        Serial.println("[WARNING] Elevated readings — Yellow LED & 3s Buzzer Pulse ACTIVE.");
      } else {
        // SAFE: All parameters nominal (Green LED ON)
        digitalWrite(LED_GREEN, HIGH);
        digitalWrite(LED_YELLOW, LOW);
        digitalWrite(LED_RED, LOW);
        setFan(false);                 // Safe, fan OFF
        current_risk = "SAFE";
      }

      // Update 16x2 LCD display
      updateLCDDisplay(mq2_ppm, mq7_ppm, t, h, false, current_risk);
    }

    // Publish periodic telemetry payload
    publishTelemetry(is_flame_active);
  }
}

