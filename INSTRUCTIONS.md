# MineSentinel AI — Complete Master Guide & Step-by-Step Walkthrough

Welcome to **MineSentinel AI**, an intelligent IoT & Machine Learning safety monitoring system designed for underground mining and hazardous industrial environments.

This guide provides a crystal-clear, step-by-step walkthrough covering the entire system:
1. **Understanding the System** (What it does & how data travels)
2. **Phase 1: Software Setup & Backend** (Python, FastAPI, SQLite, ML)
3. **Phase 2: Web Dashboard** (Real-time monitoring interface)
4. **Phase 3: Software-Only Test (Simulator)** (No hardware needed)
5. **Phase 4: Physical Hardware & Wiring** (Sensors, 16x2 LCD, Relay Fan, LEDs, Buzzer on ESP32)
6. **Phase 5: ESP32 Firmware & Flashing** (Arduino IDE setup & code upload)
7. **Phase 6: Full Live Testing & Emergency Scenarios**
8. **Phase 7: Data Export & ML Retraining**
9. **Phase 8: Troubleshooting & FAQ**

---

## 1. System Architecture & Data Flow

Here is how data flows through the entire system from the physical mine shaft to your browser screen:

```
[ PHYSICAL SENSORS ]
  ├── MQ-2 Gas (Analog)     ──> [ ADS1115 ADC ] (I2C: 0x48) ──┐
  ├── MQ-7 CO (Analog)      ──> [   (16-Bit)  ]               │
  ├── DHT11 Temp/Hum (Digital) ───────────────────────────────┼──> [ ESP32 DevKit / Shield ]
  └── Flame Sensor (Digital)  ────────────────────────────────┘           │
                                                                           ├──> [ 16x2 I2C LCD Display ] (I2C: 0x27)
                                                                           ├──> [ LEDs: Green / Yellow / Red ]
                                                                           ├──> [ Active Buzzer & Relay Fan ]
                                                                           │
                                                                           └──> [ WiFi / MQTT Broker ]
                                                                                       │ (broker.emqx.io:1883)
                                                                                       v
                                                                           [ FastAPI Backend Server ]
                                                                                       │
                                                                                       ├──> [ Scikit-Learn ML Model ] (Risk Scoring)
                                                                                       ├──> [ SQLite Database ] (Telemetry History)
                                                                                       └──> [ REST API ] (Port 8000)
                                                                                                   │
                                                                                                   v
                                                                                       [ Web Dashboard UI ] (Port 8000 / FastAPI)
```

---

## 2. Prerequisites & Equipment

### A. Software Required
- **Python 3.9 to 3.12** (Installed with `pip` added to system PATH)
- **Arduino IDE 2.x** (For flashing the physical ESP32)
- **Web Browser** (Chrome, Edge, Firefox, Brave)
- **Windows PowerShell** or Terminal

### B. Hardware Components (For Physical Node)
- **ESP32 NodeMCU / Dev Module (30-Pin)** + **30P Expansion Shield**
- **16x2 Character LCD (JHD 162A) with I2C Backpack (PCF8574)**
- **ADS1115 16-bit I2C ADC Module** (Required for dual analog sensors)
- **MQ-2 Gas Sensor** (LPG / Smoke / Combustible gas)
- **MQ-7 Carbon Monoxide (CO) Sensor** (Toxic gas)
- **DHT11 Sensor** (Temperature & Humidity)
- **Flame Sensor Module** (Infrared optical flame detector)
- **3x LEDs + 3x 220Ω Resistors** (Green = Safe, Yellow = Warning, Red = Hazard)
- **1kΩ Resistor** (Relay trigger pull-up on GPIO 5) & **10kΩ Resistor** (Optional pull-up for DHT11 data line)
- **Capacitors:** 2x 100µF (5V power filter), 2x 10µF (3.3V filter), 2x 0.1µF (ADC decoupling)
- **5V Active Buzzer** (Audible alarm)
- **5V Single-Channel Relay Module**
- **12V Mini DC Exhaust Fan** (With external 12V power supply)
- **Solderless Breadboard, Jumper Wires, and USB Type-C Cable**

---

## 3. Phase 1: Software & Backend Setup (Step-by-Step)

Follow these steps to set up the software environment and start the backend server.

### Step 1.1 — Open Terminal in the Project Folder
Open **PowerShell** and navigate to your project directory:
```powershell
cd "c:\Users\munag\OneDrive\Desktop\Mine sentinel ai"
```

### Step 1.2 — Create & Activate Python Virtual Environment
Creating a virtual environment ensures clean, isolated package installations:
```powershell
# 1. Create the virtual environment folder
python -m venv venv

# 2. Activate it (You will see '(venv)' appear in your terminal prompt)
.\venv\Scripts\activate
```

### Step 1.3 — Install Backend Dependencies
Install all required Python libraries (FastAPI, Scikit-learn, Paho-MQTT, SQLAlchemy, etc.):
```powershell
pip install -r backend\requirements.txt
```

### Step 1.4 — Initialize Environment Configuration
Copy the configuration template to create your active `.env` file:
```powershell
copy .env.example .env
```

### Step 1.5 — Launch the Backend Server
Start the FastAPI server:
```powershell
cd backend
python main.py
```
*You should see:*
```
INFO: Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
Connected to MQTT Broker: broker.emqx.io:1883
Subscribed to topic: minesentinel/device/+/telemetry
```
> **Leave this terminal running in the background.**

---

## 4. Phase 2: Open the Web Dashboard

> [!TIP]
> **Built-in Frontend Server:** The FastAPI Backend server you started in Phase 1 (Terminal 1) **already hosts and serves both the Home Landing Page and the Live Operations Dashboard** on Port 8000! You do NOT need to launch a separate web server.

Simply open your web browser and navigate to:
- **Home / Landing Page:** [**http://127.0.0.1:8000**](http://127.0.0.1:8000) (or [http://localhost:8000](http://localhost:8000))
- **Live Operations Dashboard:** [**http://127.0.0.1:8000/dashboard.html**](http://127.0.0.1:8000/dashboard.html)
- **Interactive REST API Docs:** [**http://127.0.0.1:8000/docs**](http://127.0.0.1:8000/docs)

*(Note: We recommend using `http://127.0.0.1:8000` directly in Windows to avoid browser IPv6 localhost resolution delays).*

You will see the **MineSentinel AI** command center dashboard with live gauges, telemetry charts, and AI risk scoring.

---

### Optional: Standalone Frontend Server
If you ever wish to run the dashboard on an isolated standalone HTTP port for frontend design:
Open a **new, separate PowerShell window** (Terminal 2):
```powershell
cd "c:\Users\munag\OneDrive\Desktop\Mine sentinel ai"
.\venv\Scripts\python.exe -m http.server 3000 --directory dashboard
```
Then visit [**http://localhost:3000**](http://localhost:3000) or [**http://localhost:3000/dashboard.html**](http://localhost:3000/dashboard.html).

---

## 5. Phase 3: Software-Only Test (Simulator)

If you want to test the entire system before wiring physical hardware, run the built-in simulator in a **third terminal** (Terminal 3):
```powershell
cd "c:\Users\munag\OneDrive\Desktop\Mine sentinel ai"
.\venv\Scripts\activate
python simulator\simulator.py
```

The simulator generates live telemetry (Safe $\rightarrow$ Warning $\rightarrow$ Critical $\rightarrow$ Fire Emergency) and publishes it via MQTT. You will immediately see gauges, charts, and alert logs updating live on the Web Dashboard!

Press `Ctrl + C` in Terminal 3 to stop the simulator when finished.

---

## 6. Phase 4: Physical Hardware Assembly & Wiring (ESP32)

This section explains how to connect every sensor and actuator to your **ESP32**.

### Crucial Power Rule
> [!CAUTION]
> **MQ-2 and MQ-7 sensors draw high current (~150mA each) for their internal heaters.**
> - Connect their **VCC to `VIN` / `5V`** (5V power from USB / power supply).
> - **DO NOT** connect MQ-2 or MQ-7 VCC to the `3V3` pin (this causes brownouts and board reboots).
> - Connect all Ground (`GND`) pins together on a common ground rail.

---

### Step-by-Step ESP32 Wiring Breakdown

#### 1. Shared I2C Bus (ADS1115 ADC & 16x2 I2C LCD)
The ESP32 uses **GPIO 21 (SDA)** and **GPIO 22 (SCL)** to communicate with both the ADC and the LCD simultaneously:
- **ESP32 GPIO 22 (D22)** $\rightarrow$ Connects to **ADS1115 SCL** AND **16x2 LCD SCL**
- **ESP32 GPIO 21 (D21)** $\rightarrow$ Connects to **ADS1115 SDA** AND **16x2 LCD SDA**
- **ADS1115 ADDR Pin** $\rightarrow$ Connects to **GND** (Sets I2C address to `0x48`)
- **ADS1115 VDD Pin** $\rightarrow$ Connects to **3V3**
- **16x2 LCD VCC Pin** $\rightarrow$ Connects to **VIN (5V)** (Essential for bright backlight and sharp text contrast)

#### 2. Analog Gas Sensors (MQ-2 and MQ-7 to ADS1115)
- **MQ-2 Gas Sensor:**
  - `VCC` $\rightarrow$ **VIN (5V)**
  - `GND` $\rightarrow$ **GND**
  - `A0` (Analog Out) $\rightarrow$ **ADS1115 Channel A0**
- **MQ-7 CO Sensor:**
  - `VCC` $\rightarrow$ **VIN (5V)**
  - `GND` $\rightarrow$ **GND**
  - `A0` (Analog Out) $\rightarrow$ **ADS1115 Channel A1**

#### 3. Digital Sensors (DHT11 & Flame Sensor)
- **DHT11 (Temp & Humidity):**
  - `VCC` $\rightarrow$ **3V3**
  - `GND` $\rightarrow$ **GND**
  - `DATA` $\rightarrow$ **ESP32 GPIO 4 (D4)**
- **Flame Sensor:**
  - `VCC` $\rightarrow$ **3V3**
  - `GND` $\rightarrow$ **GND**
  - `D0` (Digital Out) $\rightarrow$ **ESP32 GPIO 15 (D15)**

#### 4. Status LEDs, Buzzer & Relay Fan
- **Green LED (Safe):** Anode (+) $\rightarrow$ **GPIO 2 (D2)** $\rightarrow$ 220Ω resistor $\rightarrow$ GND
- **Yellow LED (Warning):** Anode (+) $\rightarrow$ **GPIO 19 (D19)** $\rightarrow$ 220Ω resistor $\rightarrow$ GND
- **Red LED (Critical/Fire):** Anode (+) $\rightarrow$ **GPIO 23 (D23)** $\rightarrow$ 220Ω resistor $\rightarrow$ GND
- **Active Buzzer:** Positive (+) $\rightarrow$ **GPIO 18 (D18)**, Negative (-) $\rightarrow$ GND
- **Relay Fan Module:** Signal/IN $\rightarrow$ **GPIO 5 (D5)**, VCC $\rightarrow$ **VIN (5V)**, GND $\rightarrow$ **GND**

---

### ESP32 Master Connection Summary Table

| Hardware Component | Component Pin | Target ESP32 Pin | Voltage / Type | Purpose |
|:---|:---|:---|:---|:---|
| **MQ-2 Gas Sensor** | VCC | `VIN` | 5V Power | Heater Coil Power |
| | GND | Common GND | Ground | Power Return |
| | A0 (Analog) | **ADS1115 Pin A0** | Analog Signal | Combustible Gas Reading |
| **MQ-7 CO Sensor** | VCC | `VIN` | 5V Power | Heater Coil Power |
| | GND | Common GND | Ground | Power Return |
| | A0 (Analog) | **ADS1115 Pin A1** | Analog Signal | Carbon Monoxide Reading |
| **DHT11 Sensor** | VCC | `3V3` | 3.3V Power | Sensor Power |
| | GND | Common GND | Ground | Power Return |
| | DATA | **GPIO 4 (D4)** | Digital Input | Temp & Humidity Data |
| **Flame Sensor** | VCC | `3V3` | 3.3V Power | Sensor Power |
| | GND | Common GND | Ground | Power Return |
| | D0 (Digital) | **GPIO 15 (D15)** | Digital Input | Optical Fire Detection |
| **ADS1115 ADC** | VDD | `3V3` | 3.3V Power | ADC Chip Power |
| | GND & ADDR | Common GND | Ground | Sets Address to `0x48` |
| | SCL | **GPIO 22 (D22)** | I2C Clock | Shared I2C Bus |
| | SDA | **GPIO 21 (D21)** | I2C Data | Shared I2C Bus |
| **16x2 I2C LCD** | VCC | `VIN` (5V) | 5V Power | Display & Backlight Power |
| | GND | Common GND | Ground | Power Return |
| | SCL | **GPIO 22 (D22)** | I2C Clock | Shared I2C Bus |
| | SDA | **GPIO 21 (D21)** | I2C Data | Shared I2C Bus (`0x27` / `0x3F`) |
| **Green LED** | Anode (+) | **GPIO 2 (D2)** | Digital Output | Safe Status Indicator |
| **Yellow LED** | Anode (+) | **GPIO 19 (D19)** | Digital Output | Warning Status Indicator |
| **Red LED** | Anode (+) | **GPIO 23 (D23)** | Digital Output | Hazard Status Indicator |
| **Active Buzzer** | Positive (+) | **GPIO 18 (D18)** | Digital Output | Emergency Audible Alarm |
| **Relay Fan** | Signal / IN | **GPIO 5 (D5)** | Digital Output | Automated Exhaust Fan |

---

## 7. Phase 5: ESP32 Firmware & Flashing (Arduino IDE)

### Step 5.1 — Configure Arduino IDE for ESP32
1. Open **Arduino IDE 2.x**.
2. Go to **File > Preferences** and add this URL to **Additional Boards Manager URLs**:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Go to **Tools > Board > Boards Manager...**, search for `esp32` (by Espressif Systems), and install the package.

### Step 5.2 — Install Arduino Libraries
Go to **Tools > Manage Libraries...** and install these libraries:
1. `PubSubClient` (by Nick O'Leary)
2. `ArduinoJson` (by Benoît Blanchon)
3. `DHT sensor library` (by Adafruit) — *Select "Install All" to include Adafruit Unified Sensor*
4. `Adafruit ADS1X15` (by Adafruit)
5. `LiquidCrystal I2C` (by Frank de Brabander or Marco Schwartz)

### Step 5.3 — Update Firmware with Your WiFi
Open [`firmware/esp32/esp32.ino`](file:///c:/Users/munag/OneDrive/Desktop/Mine%20sentinel%20ai/firmware/esp32/esp32.ino) in Arduino IDE and update your WiFi credentials:
```cpp
const char* ssid = "YOUR_WIFI_SSID";        // Note: Must be a 2.4 GHz network
const char* password = "YOUR_WIFI_PASSWORD";
```

*(Optional: If running MQTT locally on your PC instead of EMQX cloud broker, set `mqtt_server` to your computer's local IP address).*

### Step 5.4 — Flash the ESP32 Board
1. Connect your ESP32 to your computer using a USB Type-C data cable.
2. In **Tools**:
   - **Board:** `ESP32 Dev Module` (or `DOIT ESP32 DEVKIT V1`)
   - **Upload Speed:** `921600` (or `115200`)
   - **Port:** Select your active COM Port (e.g., `COM3`, `COM4`, `COM5`)
3. Click the **Upload** (Arrow) button.
   *(Note: On some ESP32 boards, if it displays "Connecting...", press and hold the **BOOT** button on the ESP32 for 2 seconds until uploading begins).*

### Step 5.5 — Verify Serial & 16x2 LCD Screen
1. Open **Tools > Serial Monitor** (Set to `115200 baud`).
2. Press the **EN / RST** button on the ESP32. You will see:
   ```
   Connecting to WiFi... connected.
   IP address: 192.168.1.xxx
   ADS1115 16-bit ADC initialized successfully.
   Attempting MQTT connection... connected.
   Publishing: {"device_id":"ESP32_NODE_01","gas":145.2,"co":12.1,"temperature":24.5,"humidity":55.0,"flame":0}
   ```
3. **Check the Physical 16x2 LCD Screen:**
   - **Line 1:** `G:145 C:12 [SAFE]` (Gas ppm, CO ppm, Risk Level)
   - **Line 2:** `T:24C H:55% ALL OK` (Temperature, Humidity, Status)
   - *(If the screen is lit but blank, gently turn the blue potentiometer on the back of the LCD with a small screwdriver until the text is crisp).*

---

## 8. Phase 6: Full Live Testing & Emergency Scenarios

| Test Case | How to Test | Physical Hardware Response | 16x2 LCD Screen Response | Web Dashboard & ntfy Response |
|:---|:---|:---|:---|:---|
| **1. Normal (Safe)** | Ambient room air, no gas/flame | **Green LED: ON**<br>Yellow/Red: OFF<br>Buzzer: OFF<br>Fan: OFF | Line 1: `G:145 C:12 [SAFE]`<br>Line 2: `T1:SAFE  T2:SAFE ` | AI Ring: **GREEN (Nominal)**<br>Tunnel 1 & Tunnel 2: **SAFE**<br>ntfy: Standby Armed |
| **2. Gas Warning** | Hold unlit gas lighter 5cm away (MQ-2 > 450 ppm) | Green: OFF<br>**Yellow LED: ON**<br>Buzzer: 3s Pulse<br>**Relay Fan: ON** (Exhaust) | Line 1: `G:480 C:55 [WARN]`<br>Line 2: `T1:WARN  T2:ALRT ` | AI Ring: **YELLOW (Warning)**<br>Tunnel 2: **ADVISORY ALERT (LCD + ntfy)**<br>ntfy: Warning Push Dispatched |
| **3. Critical Hazard** | Dense gas / high CO (MQ-2 > 850 ppm or MQ-7 > 120 ppm) | Green/Yellow: OFF<br>**Red LED: ON**<br>**Buzzer: ON (Loud Siren)**<br>**Relay Fan: ON (Max Exhaust)** | Line 1: `G:920 C:135[CRIT]`<br>Line 2: `T1:CRIT  T2:ALRT ` | AI Ring: **RED PULSE (Critical)**<br>Tunnel 2: **EVACUATION ALERT (LCD + ntfy)**<br>ntfy: Urgent Evac Push Dispatched |
| **4. Flame Emergency** | Hold lighter flame near Flame Sensor | Green/Yellow: OFF<br>**Red LED: ON**<br>**Buzzer: ON (Emergency)**<br>**Relay Fan: ON** | Line 1: `! T1 FIRE ALERT !`<br>Line 2: `T1:EVAC  T2:ALRT ` | AI Ring: **RED FLASH (Fire)**<br>Tunnel 2: **EVACUATION ALERT (LCD + ntfy)**<br>ntfy: Critical Fire Push Dispatched |

---

## 9. Phase 7: Sensor Data Export & ML Retraining

### Exporting Sensor Data
All sensor readings are continuously stored in the SQLite database.
- **From Dashboard:** Click **"Download All Data"** in the Live Hardware Feed section.
- **Direct Link:** Open [http://localhost:8000/api/export/csv](http://localhost:8000/api/export/csv) in your browser.

The downloaded CSV contains 10 columns:
`ID, Device ID, Timestamp, Gas (ppm), CO (ppm), Temperature (C), Humidity (%), Flame Detected, Risk Level, Risk Label`

### Retraining the Random Forest Model
To retrain the AI model with new sensor data:
```powershell
.\venv\Scripts\activate
python ml\training\train_model.py
```
The new model is automatically saved to `ml/models/random_forest_model.joblib`.

---

## 10. Phase 8: Troubleshooting & FAQ

- **Q: Dashboard shows `--` for all sensor values.**
  - *Fix:* Ensure Terminal 1 (Backend) is running. If you don't have hardware connected yet, run the simulator in Terminal 3 (`python simulator\simulator.py`).
- **Q: ESP32 will not connect to WiFi.**
  - *Fix:* The ESP32 2.4 GHz radio requires a **2.4 GHz WiFi network**. Make sure your home router or mobile hotspot is set to 2.4 GHz (not 5 GHz only).
- **Q: 16x2 LCD display is blank or shows solid blue/white blocks.**
  - *Fix 1:* Gently turn the **blue contrast potentiometer** on the back of the LCD backpack with a screwdriver.
  - *Fix 2:* Ensure `SCL` is on **GPIO 22** and `SDA` is on **GPIO 21**, and `VCC` is on **VIN / 5V**.
  - *Fix 3:* Some LCD backpacks use address `0x3F` instead of `0x27`. If needed, change `#define LCD_ADDRESS 0x3F` in [`firmware/esp32/esp32.ino`](file:///c:/Users/munag/OneDrive/Desktop/Mine%20sentinel%20ai/firmware/esp32/esp32.ino).
- **Q: ESP32 fails to upload / "A fatal error occurred: Failed to connect to ESP32".**
  - *Fix:* When the Arduino IDE shows `Connecting........_____.....`, press and hold the **BOOT** (or **IO0**) button on the ESP32 board for 2-3 seconds until uploading starts.
- **Q: ESP32 reboots repeatedly or gives brownout detector resets.**
  - *Fix:* The MQ-2 and MQ-7 sensors are drawing too much current from 3.3V. Move their `VCC` wires to `VIN` / `5V` (USB power pin).

---

## 11. Quick Command Cheat Sheet

```powershell
# Terminal 1 — Start Backend API & Dashboard (Port 8000)
.\venv\Scripts\activate
cd backend
python main.py
# -> Open in Browser: http://127.0.0.1:8000 or http://127.0.0.1:8000/dashboard.html

# Terminal 2 — Run Simulator (Optional, software test)
.\venv\Scripts\activate
python simulator\simulator.py

# Optional: Run Standalone Static Server (Port 3000)
python -m http.server 3000 --directory dashboard
```
