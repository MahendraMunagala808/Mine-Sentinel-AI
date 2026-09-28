# Mine Sentinel AI: Intelligent IoT-Based Coal Mine Safety Monitoring and Predictive Alert System Using ESP32

**Batch No:** WI 12  
**Domain:** EDGE IOT + INDUSTRIAL IOT (IIOT) + MACHINE LEARNING + PREDICTIVE ANALYTICS  

## Team Members
| Roll Number | Name of the student |
| :--- | :--- |
| 2373A35158 | MUNAGALA MAHENDRA |
| 2373A35150 | SHAIK HAMEED |
| 2373A35193 | SHAIK GAFFAR |
| 2373A35194 | THALAMANCHI MANIDEEP |

---

## Abstract
Mine Sentinel AI is an AI-powered Edge IoT system designed to continuously monitor underground coal mine environments and provide intelligent early warning against hazardous conditions. A high-performance ESP32 Dev Module is integrated with MQ-2 Gas, MQ-7 Carbon Monoxide, DHT11 Temperature & Humidity, and Flame sensors to collect real-time environmental data. The physical node features a **16x2 Character I2C LCD display** as a local visual monitoring interface for on-site personnel, rendering live telemetry, connectivity status, and prominent warning/emergency alerts. Sensor readings are simultaneously transmitted over Wi-Fi to a cloud server, where they are stored in a database and visualized through a primary web-based monitoring dashboard.

Unlike conventional IoT systems that rely only on fixed threshold values, Mine Sentinel AI incorporates a Machine Learning model (Random Forest) to analyze historical and live sensor data, identify abnormal patterns, and predict hazardous situations before they become critical.

The system transforms traditional mine monitoring into an intelligent predictive safety platform capable of classifying mine conditions as Safe, Warning, or Critical while generating instant local (16x2 LCD, LEDs, Buzzer, Exhaust Fan) and remote alerts for supervisors and emergency response teams. It provides continuous environmental monitoring, AI-driven risk prediction, historical data analysis, and remote access through an interactive dashboard, making it suitable for underground coal mines, mineral extraction sites, industrial tunnels, and other hazardous work environments. 

## Objectives
1. To continuously monitor environmental parameters such as gas concentration, carbon monoxide (CO), temperature, humidity, and fire conditions using IoT sensors.
2. To provide an immediate on-site visual display via a 16x2 I2C LCD screen showing real-time sensor metrics, connection status (Wi-Fi/MQTT), and highlighted safety risk levels.
3. To collect and transmit real-time sensor data from the ESP32 to a cloud platform for remote monitoring, storage, and analysis.
4. To develop an AI-based hazard prediction model using Machine Learning to analyze sensor data and classify mine conditions as Safe, Warning, or Critical.
5. To generate instant alerts through the local 16x2 LCD display, web dashboard, buzzer, and LED indicators whenever hazardous conditions are detected or predicted.
6. To maintain historical sensor data for trend analysis, AI model improvement, and predictive safety management.
7. To enhance worker safety and reduce mining accidents by providing an intelligent, low-cost, scalable, and real-time monitoring system.

## System Architecture

| Layer | Component | Function |
| :--- | :--- | :--- |
| **1. Sensing Layer** | MQ-2, MQ-7, DHT11, Flame Sensor | Detects gas, CO, temperature, humidity, and fire. |
| **2. Edge Processing Layer** | ESP32 Dev Module / Breakout Shield | Collects, processes, displays local data, and transmits telemetry. |
| **3. Communication Layer** | Wi-Fi, MQTT/HTTP | Transfers data to the cloud. |
| **4. Cloud & Backend Layer** | Python (FastAPI) | Processes and manages sensor data. |
| **5. AI Prediction Layer** | Random Forest (Scikit-learn) | Predicts hazards and classifies risk levels. |
| **6. Database Layer** | SQLite | Stores sensor data and AI results. |
| **7. Presentation Layer** | Web Dashboard (HTML, CSS, JS) & **16x2 LCD** | Primary remote control room dashboard & local edge LCD display. |
| **8. Alert & Response Layer**| 16x2 LCD Screen, Buzzer, LEDs, Dashboard Alerts, Relay (Fan) | Generates instant local/remote safety alerts & ventilation actuation. |

### Note on Cloud Backend (ThingSpeak vs FastAPI)
*While traditional implementations often rely on platforms like ThingSpeak, this project utilizes a custom **Python FastAPI Backend**.* 
*Why? FastAPI provides superior control over the Machine Learning (Random Forest) integration. Instead of merely logging data, our custom backend dynamically intercepts every incoming MQTT sensor reading, feeds it directly into our Scikit-learn Random Forest model, calculates the predictive risk (Safe/Warning/Critical) in real-time, stores it in SQLite, and serves it instantly to our custom Web Dashboard via REST APIs.*

## Project Structure
- `firmware/esp32`: C++ firmware for the **ESP32** (includes 16x2 I2C LCD driver, ADS1115 ADC, and Exhaust Fan logic).
- `backend/`: FastAPI backend and MQTT client.
- `ml/`: Machine Learning model training scripts and synthetic dataset.
- `dashboard/`: Web dashboard files.
- `simulator/`: Python script to simulate hardware data.
- `database/`: SQLite database storage.
- `docs/`: Hardware wiring schematics and evaluation reports.

## Hardware Requirements
- **ESP32 Dev Module (30-Pin) + Breakout Expansion Shield**
- **16x2 Character LCD (JHD 162A) with I2C Backpack (PCF8574)**
- MQ-2 Gas Sensor
- MQ-7 Carbon Monoxide Sensor
- DHT11 Temperature & Humidity Sensor
- Flame Sensor Module
- ADS1115 I2C ADC Module (Required for multiple analog inputs)
- Active Buzzer
- LEDs (Red, Yellow, Green) + 220Ω Resistors
- Relay Module & Mini DC Exhaust Fan

## Setup & Run Guide
Please refer to [`INSTRUCTIONS.md`](./INSTRUCTIONS.md) for the complete, step-by-step guide on how to start the FastAPI backend, launch the web dashboard, download sensor data, and run the system using the built-in software simulator or physical ESP32 hardware. For complete pin connections, see [`docs/hardware_wiring.md`](./docs/hardware_wiring.md).
