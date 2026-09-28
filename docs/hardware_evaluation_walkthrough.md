# MineSentinel AI — Complete Hardware Pinout & Evaluation Walkthrough

## 1. Executive Summary & Hardware Topology

**MineSentinel AI** utilizes an industrial edge-sensing node built upon the **ESP32 Dev Module (30-Pin NodeMCU)** paired with an **Expansion Breakout Shield**, high-precision **ADS1115 16-Bit ADC**, **16x2 I2C Character LCD**, multi-gas and climate sensors, an optical infrared flame detector, an active alarm array, and a **galvanically isolated 12V DC emergency ventilation system**.

```
 +-------------------------------------------------------------------------------------------------------+
 |                                       ESP32 CONTROLLER NODE                                           |
 |                                                                                                       |
 |    [3.3V SENSORS]                [I2C BUS (GPIO 21/22)]               [5V SENSORS & ACTUATORS]        |
 |    - DHT11 (GPIO 4)              - 16x2 LCD Display (0x27/0x3F)       - MQ-2 Gas Sensor (5V VIN)      |
 |    - Flame Sensor (GPIO 15)      - ADS1115 16-Bit ADC (0x48)          - MQ-7 CO Sensor (5V VIN)       |
 |                                         │       │                     - 5V Relay Fan Trigger (GPIO 5) |
 |                                         │       │                     - 5V Active Buzzer (GPIO 18)    |
 |                                      (AIN0)   (AIN1)                  - Status LEDs (GPIO 2, 19, 23)  |
 |                                         ▲       ▲                                                     |
 |                                         │       │                                                     |
 |                                    [MQ-2 A0] [MQ-7 A0]                                                |
 +-------------------------------------------------------------------------------------------------------+
```

---

## 2. Complete ESP32 30-Pin Master Pinout Matrix

| Pin Label | GPIO / Function | Signal Type | Target Component | Component Pin | Operating Voltage | Engineering Purpose & Electrical Characteristics |
| :--- | :---: | :---: | :--- | :---: | :---: | :--- |
| **`3V3`** | `3.3V OUT` | Power | 3.3V Power Bus Rail | `VCC / VDD` | **3.3V DC** | Powers ADS1115, DHT11, Flame sensor; decoupled with 10µF + 0.1µF caps. |
| **`VIN`** | `5V IN/OUT` | Power | 5V Power Bus Rail | `VCC` | **5.0V DC** | High-current power for MQ-2/MQ-7 heaters, 16x2 LCD backlight, and relay coil. |
| **`GND`** | `0V REF` | Ground | Common Ground Rail | `GND` | **0V** | Shared reference ground return for all logic, sensors, and power supplies. |
| **`D21`** | `GPIO 21` | Bi-Dir (I2C) | LCD + ADS1115 ADC | `SDA` | **3.3V Logic** | Shared I2C Data bus running at 400 kHz Fast Mode. |
| **`D22`** | `GPIO 22` | Output (I2C) | LCD + ADS1115 ADC | `SCL` | **3.3V Logic** | Shared I2C Clock bus with hardware pull-ups on modules. |
| **`D4`** | `GPIO 4` | Bi-Dir (Single-Bus) | DHT11 Climate Sensor | `DATA` | **3.3V Logic** | Reads ambient tunnel temperature (°C) and relative humidity (%). |
| **`D15`** | `GPIO 15` | Digital Input | Optical IR Flame Sensor | `D0` | **3.3V Logic** | Active-LOW digital interrupt line; trips immediately upon fire detection. |
| **`D2`** | `GPIO 2` | Digital Output | Green LED Indicator | `Anode (+)` | **3.3V via 220Ω** | Indicates **SAFE / NOMINAL** status across monitored tunnel sectors. |
| **`D19`** | `GPIO 19` | Digital Output | Yellow LED Indicator | `Anode (+)` | **3.3V via 220Ω** | Indicates **WARNING** status (Elevated gas/CO/temperature). |
| **`D23`** | `GPIO 23` | Digital Output | Red LED Indicator | `Anode (+)` | **3.3V via 220Ω** | Indicates **CRITICAL / FIRE HAZARD** status (Emergency strobe). |
| **`D18`** | `GPIO 18` | Digital Output | 5V Active Buzzer | `Positive (+)` | **3.3V / 5V** | High-decibel audible pulsing alarm for worker evacuation. |
| **`D5`** | `GPIO 5` | Digital Output | 5V Relay Module | `IN` | **3.3V Logic** | Optocoupler trigger to actuate the 12V emergency exhaust fan. |

---

## 3. Subsystem Circuit Design & Schematics

### 3.1. Power Architecture & Decoupling Filter Network
The node uses a dual-rail power topology to isolate sensitive low-voltage analog measurements from high-current inductive and thermal loads.

```
 +5V Rail (from ESP32 VIN / USB 5V)
    ├── [100µF 25V Electrolytic] ── GND  (Filters MQ heater switching spikes & relay current draw)
    ├── MQ-2 Gas Sensor VCC
    ├── MQ-7 Gas Sensor VCC
    ├── 16x2 LCD VCC (Required for crisp contrast & backlight brightness)
    └── 5V Relay VCC

 +3.3V Rail (from ESP32 3V3 Regulator)
    ├── [10µF 16V Electrolytic]  ── GND  (Low-frequency stabilization)
    ├── [0.1µF (104) Ceramic]    ── GND  (High-frequency RF Wi-Fi burst noise rejection)
    ├── ADS1115 ADC VDD
    ├── DHT11 Sensor VCC
    └── Flame Sensor VCC
```

---

### 3.2. I2C Bus & Precision 16-Bit Analog Subsystem

```
                          +-------------------------+
                          |   ESP32 Microcontroller |
                          | GPIO 21 (SDA)  GPIO 22  |
                          +───────┬────────────┬────+
                                  │            │
             ┌────────────────────┼────────────┼────────────────────┐
             │ SDA                │ SCL        │ SDA                │ SCL
     +───────┴───────+            │    +───────┴───────+            │
     |  16x2 LCD     |            │    | ADS1115 ADC   |            │
     |  PCF8574      |            │    | 16-Bit Delta- |            │
     |  (Addr: 0x27) |            │    | Sigma (0x48)  |            │
     +---------------+            │    +───┬───────┬───+            │
                                  │        │ AIN0  │ AIN1           │
                                  └────────┼───────┼────────────────┘
                                           │       │
                                      [MQ-2 A0] [MQ-7 A0]
                                      (Analog)  (Analog)
```

* **ADS1115 Configuration:**
  * I2C Address: `0x48` (`ADDR` pin tied directly to `GND`).
  * Gain Setting: `GAIN_ONE` (Range: $\pm 4.096\text{V}$, $1\text{ LSB} = 0.125\text{mV}$).
  * `AIN0`: Reads raw analog voltage of **MQ-2** (LPG/Methane/Smoke).
  * `AIN1`: Reads raw analog voltage of **MQ-7** (Carbon Monoxide).

---

### 3.3. 12V Industrial Exhaust Fan Relay Circuit

```
  [ 12V DC External Adapter ]
       (+) Positive Wire ───────────────────────────> [ Relay COM Screw Terminal ]
                                                      [ Relay NO  Screw Terminal ] ───> (+) Fan Red Wire
       (-) Ground   Wire ─────────────────────────────────────────────────────────────> (-) Fan Black Wire

  [ ESP32 Controller ]
       GPIO 5 (D5)       ───────────────────────────> [ Relay IN Signal Pin ]
       VIN (5V)          ───────────────────────────> [ Relay VCC Pin ]
       GND               ───────────────────────────> [ Relay GND Pin ]
```

* **Relay Protection:** An optocoupler isolates the ESP32 GPIO from the coil, and a flyback diode on the relay board suppresses inductive back-EMF spikes when switching the 12V DC motor.

---

## 4. Live Technical Evaluation & Testing Walkthrough

Follow this interactive testing protocol step-by-step for evaluators and technical juries:

```
  ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
  │  Step 1: Visual │     │  Step 2: Boot &  │     │  Step 3: SAFE   │     │  Step 4: Gas /   │     │  Step 5: Flame  │
  │  Rail Check     │ ──> │  I2C Discovery   │ ──> │  Nominal State  │ ──> │  Smoke Trigger   │ ──> │  Optical Trip   │
  └─────────────────┘     └──────────────────┘     └─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Step 1: Pre-Flight Hardware Inspection
1. Confirm common ground wire links the ESP32 breakout shield, breadboard rails, and all sub-modules.
2. Verify that 5V components (`MQ-2`, `MQ-7`, `LCD`, `Relay`) connect to `VIN` (5V), while 3.3V components (`ADS1115`, `DHT11`, `Flame`) connect to `3V3`.
3. Connect the ESP32 via USB Type-C and the 12V DC power adapter to the relay fan terminal.

---

### Step 2: System Boot & Automatic I2C Bus Discovery
1. Launch the Serial Monitor at **115200 baud**.
2. Press the `EN` button on the ESP32 to restart.
3. Observe the automated I2C scan and peripheral initialization:
   ```text
   --- Scanning I2C Bus on GPIO21(SDA) & GPIO22(SCL) ---
   [I2C Found] Device at address 0x27  <-- 16x2 LCD Initialized
   [I2C Found] Device at address 0x48  <-- ADS1115 ADC Initialized
   [ADS1115] Initialized successfully.
   [DHT11] Sensor active on GPIO 4.
   [WiFi] Connected to network: realme P3 Ultra 5G
   [MQTT] Connected to broker.emqx.io:1883
   ```
4. Confirm the 16x2 LCD powers on and displays the animated splash screen.

---

### Step 3: Nominal Operating State Demonstration (`SAFE`)
* **Physical Hardware Outputs:**
  * **Green LED (GPIO 2)**: **ON (Solid)**.
  * **Yellow LED (GPIO 19)**: OFF.
  * **Red LED (GPIO 23)**: OFF.
  * **Buzzer (GPIO 18)**: SILENT.
  * **Exhaust Fan (GPIO 5)**: OFF (Relay contact open).
* **16x2 LCD Display (Cycling every 2.5 seconds):**
  * **Page 1 (Gas & Sector Status):**
    ```text
    G:145 C:12 [SAFE]
    T1:SAFE  T2:SAFE
    ```
  * **Page 2 (Climate & Fan State):**
    ```text
    TEMP:27C  HUM:52%
    FAN:OFF  T2:SAFE
    ```
* **Dashboard / Backend:** Live telemetry packets are published via MQTT (`minesentinel/device/ESP32_NODE_01/telemetry`) and verified in real-time.

---

### Step 4: Toxic Gas & Smoke Challenge (`WARNING` & `CRITICAL`)
1. Introduce a small amount of test butane/gas or smoke near the **MQ-2 / MQ-7** sensors.
2. **Elevated Warning Trigger ($> 450\text{ ppm Gas}$ or $> 50\text{ ppm CO}$):**
   * **Yellow LED (GPIO 19)** lights up.
   * **Relay (GPIO 5)** closes with a mechanical click; **12V Exhaust Fan starts spinning**.
   * **LCD Updates:** `[WARN]` on line 1; `T1:WARN  T2:ALRT` on line 2.
3. **Critical Toxicity Trigger ($> 850\text{ ppm Gas}$ or $> 120\text{ ppm CO}$):**
   * **Red LED (GPIO 23)** strobes.
   * **Active Buzzer (GPIO 18)** emits loud pulsed alarms.
   * **Cloud Dispatch:** Edge risk is broadcast, triggering automated incident dispatching on the web dashboard.

---

### Step 5: Optical Flame & Fire Emergency Trip (`CRITICAL FIRE`)
1. Present an infrared light source (lighter/flame) within 1 meter of the **Flame Sensor**.
2. **Instant Edge Response (< 50ms):**
   * `GPIO 15` detects Active-LOW logic transition.
   * **Red LED (GPIO 23)** + **Buzzer (GPIO 18)** lock into continuous emergency alarm mode.
   * **Exhaust Fan** operates at maximum forced extraction.
   * **LCD Immediate Override Screen:**
     ```text
     ! T1 FIRE ALERT !
     T1:EVAC  T2:ALRT
     ```
   * Evacuation directives are dispatched across both Tunnel 1 and adjacent Tunnel 2.

---

## 5. Technical Defense Points for Evaluators

| Engineering Challenge | MineSentinel AI Solution | Evaluator Defense Argument |
| :--- | :--- | :--- |
| **ESP32 Internal ADC Inaccuracy** | Added dedicated **ADS1115 16-Bit I2C ADC**. | ESP32's internal SAR ADC has severe non-linearity near $0\text{V}$ and $3.3\text{V}$, and is sensitive to Wi-Fi RF noise. ADS1115 guarantees $0.125\text{mV}$ precision and true linear gas quantization. |
| **Sensor Power Starvation** | Split 5V (`VIN`) and 3.3V power rails with electrolytic tank capacitors. | MQ heaters pull ~300mA total. Running them on 3.3V causes sensor drift and brownouts; running on 5V with a 100µF reservoir capacitor maintains thermal equilibrium without voltage drops. |
| **High Inductive Back-EMF** | Optoisolated Relay Module with flyback diode. | Switching a 12V DC motor directly or without isolation injects voltage spikes back into the microcontroller. Optocoupling ensures complete galvanic isolation. |
| **Cascaded Disaster Prevention** | Dual-Tunnel safety state logic in firmware and AI backend. | Toxic gas and smoke propagate through connected shafts. An emergency in Tunnel 1 immediately initiates safety alerts and preemptive ventilation in Tunnel 2. |
