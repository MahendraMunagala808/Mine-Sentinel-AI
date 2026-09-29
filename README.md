# Mine Sentinel AI: Intelligent IoT-Based Coal Mine Safety Monitoring and Predictive Alert System Using ESP32

**Batch No:** WI 12  
**Domain:** EDGE IOT + INDUSTRIAL IOT (IIOT) + MACHINE LEARNING + PREDICTIVE ANALYTICS  

---

## Abstract
Mine Sentinel AI is an AI-powered Edge IoT system designed to continuously monitor underground coal mine environments and provide intelligent early warning against hazardous conditions. A high-performance ESP32 Dev Module is integrated with MQ-2 Gas, MQ-7 Carbon Monoxide, DHT11 Temperature & Humidity, and Flame sensors to collect real-time environmental data. The physical node features a **16x2 Character I2C LCD display** as a local visual monitoring interface for on-site personnel, rendering live telemetry, connectivity status, and prominent warning/emergency alerts. Sensor readings are simultaneously transmitted over Wi-Fi/MQTT to a cloud server, where they are stored in a database and visualized through both an embedded SCADA dashboard and a modern **React 18 + Vite** modular web application.

Unlike conventional IoT systems that rely only on fixed threshold values, Mine Sentinel AI incorporates a Machine Learning model (Random Forest) to analyze historical and live sensor data, identify abnormal multi-gas patterns, and predict hazardous situations before they become critical.

The system transforms traditional mine monitoring into an intelligent predictive safety platform capable of classifying mine conditions as Safe, Warning, or Critical while generating instant local (16x2 LCD, LEDs, Buzzer, Exhaust Fan relay) and remote multi-channel alerts (Web Dashboard, **Ntfy Real-Time Mobile Push Alerts**, **AI Mine Safety Copilot**, and **Automated Shift Safety PDF Reports**).

---

## Technology Stack

| Layer / Domain | Technologies & Libraries |
| :--- | :--- |
| **Edge Hardware & Firmware** | ESP32 Dev Module (30-Pin), ADS1115 (16-bit I2C ADC), 16x2 I2C LCD, C++, Arduino IDE |
| **Sensors & Actuators** | MQ-2 (Combustible Gas/LPG), MQ-7 (CO), DHT11 (Temp/Hum), IR Optical Flame Sensor, Active Buzzer, Relay Fan, Tri-Color LEDs |
| **Edge Communication** | Wi-Fi (802.11 b/g/n), MQTT (PubSubClient / EMQX Broker), HTTP REST |
| **Cloud & Backend Engine** | Python 3.10+, FastAPI, Uvicorn, SQLAlchemy ORM, SQLite, Paho-MQTT |
| **AI Prediction Pipeline** | Random Forest Classifier (Scikit-learn), Pandas, NumPy, Joblib |
| **Modern Frontend (React)** | React 18, Vite 5, JavaScript (ES6+), Component Architecture |
| **SCADA Frontend (FastAPI)** | High-Speed Canvas/SVG Real-Time Dashboard (FastAPI served) |
| **Intelligent Services** | AI Safety Copilot Assistant (`assistant_service.py`), Ntfy Mobile Push Alerts (`ntfy_service.py`), Automated Shift Safety PDF Generator (`pdf_report_service.py` / ReportLab) |

---

## Key Features

1. **Multi-Hazard Sensor Array**: Continuous real-time detection of methane/smoke (MQ-2), carbon monoxide (MQ-7), thermal variations (DHT11), and open flames.
2. **Dual Presentation Architecture**:
   - **Modern React 18 + Vite Dashboard**: Component-based UI with interactive Copilot chat, fleet node status, alert center, and shift audit export modals.
   - **Embedded SCADA Dashboard**: Direct port-8000 real-time monitoring interface with live SVG gauges, dynamic risk rings, and audio alarms.
   - **On-Site 16x2 I2C LCD Display**: Instant edge visibility for underground miners without requiring computers or mobile phones.
3. **Machine Learning Hazard Classification**: Random Forest model trained on balanced historical telemetry to categorize risk as **Safe**, **Warning**, or **Critical**.
4. **Autonomous Edge Actuation**: Automatically triggers the 12V exhaust ventilation fan via 5V relay and sounds the active buzzer siren when hazard thresholds are crossed.
5. **Interactive AI Safety Copilot**: Conversational assistant embedded in the dashboard to answer operator queries, suggest emergency ventilation protocols, and provide regulatory safety advice.
6. **Instant Mobile Alerts via Ntfy**: Dispatches instant push notifications directly to supervisors' smartphones via Ntfy (`ntfy.sh/minesentinel-safety-alerts`).
7. **Automated Shift Safety PDF Audits**: One-click generation of comprehensive safety audit PDF reports with sensor averages, peak levels, and incident summaries for regulatory compliance.

---

## 8-Layer System Architecture

| Layer | Component | Function |
| :--- | :--- | :--- |
| **1. Sensing Layer** | MQ-2, MQ-7, DHT11, Flame Sensor, ADS1115 ADC | Detects combustible gas, toxic CO, ambient temperature, humidity, and fire with 16-bit analog precision. |
| **2. Edge Processing Layer** | ESP32 Dev Module / Breakout Expansion Shield | Samples sensors, executes local safety logic, controls actuators, and drives the 16x2 LCD. |
| **3. Communication Layer** | Wi-Fi, MQTT Broker (EMQX), HTTP REST | Publishes sensor telemetry topics (`minesentinel/device/+/telemetry`) to cloud backend. |
| **4. Cloud & Backend Layer** | Python (FastAPI, Uvicorn, SQLAlchemy) | Ingests MQTT streams, evaluates thresholds, manages database persistence, and serves REST APIs. |
| **5. AI Prediction Layer** | Random Forest (Scikit-learn) | Predicts environmental risk level (Safe, Warning, Critical) based on multi-variate sensor patterns. |
| **6. Database Layer** | SQLite Database | Stores historical sensor telemetry, incident logs, node status, and device metadata. |
| **7. Presentation Layer** | **React 18 + Vite App** & **SCADA Dashboard** & **16x2 LCD** | Triple interface: modern modular web app (Port 3000), embedded SCADA (Port 8000), and local mine LCD. |
| **8. Alert & Response Layer**| 16x2 LCD, LEDs, Buzzer, Relay Fan, **Ntfy Push**, **Shift PDF Audits** | Local physical alarms + autonomous exhaust fan + remote smartphone push alerts + compliance PDF reports. |

---

## Project Structure

```text
Mine Sentinel AI/
├── backend/                               # FastAPI Backend & Services
│   ├── main.py                            # FastAPI application entry point
│   ├── requirements.txt                   # Python dependencies
│   ├── database/                          # Ntfy and database configs
│   └── app/
│       ├── database.py                    # SQLite engine and session factory
│       ├── models/domain.py               # SQLAlchemy database models
│       ├── schemas/domain.py              # Pydantic request/response schemas
│       ├── routes/api.py                  # REST API endpoints (telemetry, reports, chat, alerts)
│       └── services/
│           ├── assistant_service.py       # AI Safety Copilot chat reasoning service
│           ├── ml_service.py              # Random Forest ML model inference
│           ├── mqtt_service.py            # Paho-MQTT subscriber and dispatcher
│           ├── ntfy_service.py            # Ntfy smartphone push alert service
│           └── pdf_report_service.py      # Automated shift safety PDF generator
│
├── dashboard/                             # Frontend Dashboards
│   ├── package.json                       # React 18 & Vite build dependencies
│   ├── vite.config.js                     # Vite build configuration (Port 3000)
│   ├── index.html                         # SCADA Landing & Dashboard template
│   ├── dashboard.html                     # Embedded SCADA operations view
│   ├── main.js & styles.css               # Vanilla SCADA scripts & styles
│   └── src/                               # Modular React Application
│       ├── main.jsx & App.jsx             # React entry point & root component
│       └── components/
│           ├── AlertCenter.jsx            # Real-time audible/visual hazard alerts
│           ├── FleetNodesGrid.jsx         # Multi-sector mine telemetry visualizer
│           ├── CopilotChat.jsx            # Interactive AI safety assistant chat
│           ├── TelemetryCards.jsx         # Gas, CO, Temp/Humidity, & Flame live cards
│           ├── ShiftAuditModal.jsx        # Date-range shift safety PDF export modal
│           ├── NtfyModal.jsx              # Smartphone alert subscription modal
│           ├── HeroHeader.jsx             # Status badge, clock, and primary controls
│           └── AuthModal.jsx              # Operator login & authentication modal
│
├── firmware/esp32/                        # ESP32 C++ Firmware
│   ├── esp32.ino                          # Main firmware (ADS1115, LCD, Sensors, Relay, MQTT)
│   └── lcd_test/lcd_test.ino              # 16x2 I2C LCD hardware diagnostic tool
│
├── ml/                                    # Machine Learning Pipeline
│   ├── training/train_model.py            # Random Forest training script
│   ├── training/export_live_dataset.py    # Live telemetry extraction tool
│   ├── dataset/generate_dataset.py        # Synthetic dataset generator
│   ├── dataset/*.csv                      # Training datasets (synthetic, live, combined)
│   └── evaluation/evaluation_metrics.json # Accuracy, precision, recall & F1 benchmarks
│
├── simulator/                             # Software-Only Hardware Simulator
│   └── simulator.py                       # Virtual mine node generating realistic MQTT telemetry
│
├── tests/                                 # Automated Test Suite
│   ├── test_api.py                        # REST API endpoint tests
│   ├── test_ml.py                         # ML risk prediction tests
│   └── test_assistant.py                  # AI Copilot chat tests
│
├── docs/                                  # Documentation & Architecture Diagrams
│   ├── project_report.md                  # Comprehensive technical report
│   ├── hardware_wiring.md                 # Detailed pinout & connection tables
│   ├── hardware_evaluation_walkthrough.md # Physical hardware validation guide
│   ├── software_and_interface_walkthrough.md # Full software walkthrough
│   └── *.png / *.jpg                      # High-resolution blueprints & architecture diagrams
│
├── INSTRUCTIONS.md                        # Master setup, run, and testing guide
└── README.md                              # Project overview & specifications
```

---

## Hardware Requirements
- **ESP32 Dev Module (30-Pin) + Breakout Expansion Shield**
- **16x2 Character LCD (JHD 162A) with I2C Backpack (PCF8574)**
- **ADS1115 16-Bit I2C ADC Module** (Required for dual analog sensors)
- MQ-2 Combustible Gas & Smoke Sensor
- MQ-7 Carbon Monoxide (CO) Sensor
- DHT11 Temperature & Humidity Sensor
- Infrared Optical Flame Sensor Module
- 5V Active Buzzer Module
- 3x 5mm LEDs (Green, Yellow, Red) + 3x 220Ω Resistors
- 5V Single-Channel Relay Module + 12V DC Exhaust Fan
- External 12V Power Supply, Breadboard, Jumper Wires, and USB Type-C Cable

---

## Quick Start
Please refer to [`INSTRUCTIONS.md`](./INSTRUCTIONS.md) for the complete, step-by-step setup guide:
1. **Start Backend**: `cd backend && python main.py` (Runs on `http://127.0.0.1:8000`)
2. **Start React Frontend**: `cd dashboard && npm run dev` (Runs on `http://localhost:3000`)
3. **Run Simulator**: `python simulator/simulator.py` (Tests full pipeline without hardware)
4. **Detailed Wiring**: See [`docs/hardware_wiring.md`](./docs/hardware_wiring.md)

