# MineSentinel AI - Hardware Wiring Guide (ESP32 & 16x2 I2C LCD)

## Overview
This document contains the complete, comprehensive pinout, power distribution, and component wiring guide for **ESP32 (30-Pin NodeMCU + Expansion Shield)** with the **16x2 I2C LCD**, **ADS1115 ADC**, **Sensors**, **5V/12V Relay Exhaust Fan Circuit**, and **Power Filtering Capacitors**.

---

## 1. Complete Components Bill of Materials (BOM)

| # | Component Name | Quantity | Operating Voltage | Purpose / Description |
| :--- | :--- | :---: | :---: | :--- |
| **1** | **ESP32 NodeMCU Dev Module (30-Pin)** | 1 | 5V (USB-C) / 3.3V Logic | Main microcontroller with onboard Wi-Fi + Bluetooth. |
| **2** | **ESP32 30P Expansion Shield Board** | 1 | 5V / 6.5V–16V DC | Breakout board with dedicated `Signal / VCC / GND` header rows. |
| **3** | **16x2 Character LCD (JHD 162A) + I2C Backpack (PCF8574)** | 1 | 5V (`VIN`) | Local visual screen displaying real-time telemetry & safety alerts. |
| **4** | **ADS1115 16-Bit I2C ADC Module** | 1 | 3.3V (`3V3`) | 16-bit analog-to-digital converter for MQ-2 and MQ-7 analog readings. |
| **5** | **MQ-2 Combustible Gas Sensor** | 1 | 5V (`VIN`) | Detects LPG, Propane, Hydrogen, Methane, and smoke concentrations. |
| **6** | **MQ-7 Carbon Monoxide (CO) Sensor** | 1 | 5V (`VIN`) | Detects toxic Carbon Monoxide gas levels in parts per million (ppm). |
| **7** | **DHT11 Temperature & Humidity Sensor** | 1 | 3.3V (`3V3`) | Measures tunnel ambient temperature (°C) and relative humidity (%). |
| **8** | **Infrared Optical Flame Sensor Module** | 1 | 3.3V (`3V3`) | Detects fire and flame infrared wavelengths (Active-LOW digital output). |
| **9** | **5V Active Buzzer Module** | 1 | 5V (`D18`) | High-decibel audible alarm for critical hazard and fire events. |
| **10** | **Green, Yellow, Red 5mm LEDs** | 3 (1 each) | 3.3V via 220Ω | Safe (Green/D2), Warning (Yellow/D19), Hazard (Red/D23). |
| **11** | **220Ω Resistors** (1/4 Watt) | 3 | — | Current-limiting resistors for the 3 status LEDs. |
| **12** | **1kΩ Resistor** (1/4 Watt) | 1–2 | — | Pull-up trigger resistor for the 5V relay module on GPIO 5. |
| **13** | **10kΩ Resistor (Optional)** | 1 | — | Pull-up resistor for DHT11 data line (optional if using 3-pin module). |
| **14** | **5V Single-Channel Relay Module** | 1 | 5V (`VIN`) | Electromechanical switch to safely trigger the 12V DC exhaust fan. |
| **15** | **12V Mini DC Exhaust Fan** | 1 | 12V DC (External) | Emergency mine tunnel ventilation fan driven through the relay. |
| **16** | **100µF Electrolytic Capacitors** | 2 | 16V–35V Rating | Placed across 5V rail (`VIN` to `GND`) for anti-brownout filtering. |
| **17** | **10µF Electrolytic Capacitors** | 2 | 16V–35V Rating | Placed across 3.3V rail (`3V3` to `GND`) for power stabilization. |
| **18** | **0.1µF (104) Ceramic Capacitors** | 2 | 50V Rating | High-frequency noise decoupling filter across `3V3` and `GND`. |
| **19** | **Solderless Breadboard & Jumper Wires** | 1 + Kit | — | For shared power distribution rails and neat LED/resistor mounting. |

---

## 2. Power Rails & Capacitor Filtering on Breadboard

```
+-------------------------------------------------------------------------------------------------------+
|  (+) [5V POWER RAIL]    <== Connected to ESP32 VIN (Powers: MQ-2, MQ-7, 16x2 LCD, Relay)               |
|      [100µF Capacitor]  <== Placed across 5V (+) and GND (-) (Protects against gas heater current spikes)
|  (-) [COMMON GND RAIL]  <== Connected to ESP32 GND (Ground return for ALL components)                  |
+-------------------------------------------------------------------------------------------------------+
|                                                                                                       |
|   [ ADS1115 ADC ]       [ DHT11 ]       [ FLAME ]       [ GREEN LED ]   [ YELLOW LED ]   [ RED LED ]  |
|      (Placed on         (Placed on      (Placed on       (Via 220Ω       (Via 220Ω       (Via 220Ω    |
|      breadboard)        breadboard)     breadboard)       to GND)         to GND)         to GND)     |
|                                                                                                       |
+-------------------------------------------------------------------------------------------------------+
|  (+) [3.3V POWER RAIL]  <== Connected to ESP32 3V3 (Powers: ADS1115, DHT11, Flame Sensor)             |
|      [10µF + 0.1µF Caps]<== Placed across 3.3V (+) and GND (-) (Smooths ADC and sensor signals)       |
|  (-) [COMMON GND RAIL]  <== Connected to ESP32 GND                                                     |
+-------------------------------------------------------------------------------------------------------+
```

---

## 3. Shared I2C Bus (16x2 LCD & ADS1115 ADC)

Both the **16x2 I2C LCD (Address `0x27` / `0x3F`)** and the **ADS1115 ADC (Address `0x48`)** share the hardware I2C lines on pins **D21 (SDA)** and **D22 (SCL)**.

| Component Pin | Target ESP32 / Breadboard Pin | Required Voltage | Purpose / Notes |
| :--- | :--- | :--- | :--- |
| **16x2 LCD GND** | Common `GND` Rail | Ground | Ground return |
| **16x2 LCD VCC** | **`VIN` (5V Rail)** | **5V Power** | Required for bright backlight & crisp character contrast |
| **16x2 LCD SDA** | **`GPIO 21` (D21)** | 3.3V Logic | Shared I2C Data line |
| **16x2 LCD SCL** | **`GPIO 22` (D22)** | 3.3V Logic | Shared I2C Clock line |
| **ADS1115 VDD** | **`3V3` Rail** | 3.3V Power | ADC chip power supply |
| **ADS1115 GND** | Common `GND` Rail | Ground | Ground reference |
| **ADS1115 ADDR** | Common `GND` Rail | Ground | Sets I2C Address to `0x48` |
| **ADS1115 SDA** | **`GPIO 21` (D21)** | 3.3V Logic | Shared I2C Data line |
| **ADS1115 SCL** | **`GPIO 22` (D22)** | 3.3V Logic | Shared I2C Clock line |
| **ADS1115 A0** | **MQ-2 `A0`** | Analog Signal | Reads analog combustible gas voltage |
| **ADS1115 A1** | **MQ-7 `A0`** | Analog Signal | Reads analog Carbon Monoxide voltage |

> [!TIP]
> **LCD Contrast Adjustment:** On the back of the LCD backpack, turn the blue potentiometer gently with a small screwdriver until characters are crisp and dark.

---

## 4. Sensor Connections

### A. Analog Gas Sensors (MQ-2 & MQ-7)
| Sensor Pin | Target Connection | Required Voltage | Notes |
| :--- | :--- | :--- | :--- |
| **MQ-2 VCC** | **5V Rail (`VIN`)** | **5V Power** | High current (~150mA) heater power |
| **MQ-2 GND** | Common `GND` Rail | Ground | Ground return |
| **MQ-2 A0** | **ADS1115 `A0`** | Analog Signal | Analog gas voltage output |
| **MQ-7 VCC** | **5V Rail (`VIN`)** | **5V Power** | High current (~150mA) heater power |
| **MQ-7 GND** | Common `GND` Rail | Ground | Ground return |
| **MQ-7 A0** | **ADS1115 `A1`** | Analog Signal | Analog CO voltage output |

### B. Digital Sensors (DHT11 & Flame Sensor)
| Sensor Pin | Target ESP32 Pin | Required Voltage | Notes |
| :--- | :--- | :--- | :--- |
| **DHT11 VCC** | **3.3V Rail (`3V3`)** | 3.3V Power | Sensor power |
| **DHT11 GND** | Common `GND` Rail | Ground | Ground return |
| **DHT11 DATA** | **`GPIO 4` (D4)** | Digital In | Optional 10kΩ pull-up between DATA and 3V3 |
| **Flame Sensor VCC** | **3.3V Rail (`3V3`)** | 3.3V Power | Sensor power |
| **Flame Sensor GND** | Common `GND` Rail | Ground | Ground return |
| **Flame Sensor D0** | **`GPIO 15` (D15)** | Digital In | Active LOW on fire detect |

---

## 5. Indicators, Buzzer & 12V Relay Exhaust Fan Circuit

```
 [ External 12V DC Adapter ]
      (+) Wire ──────────────────────────> [ Relay COM Screw Terminal ]
                                           [ Relay NO Screw Terminal  ] ──> (+) Red Wire [ 12V FAN ]
      (-) Wire ──────────────────────────────────────────────────────────> (-) Black Wire [ 12V FAN ]

 [ ESP32 Controller ]
      GPIO 5 (D5) ───────────────────────> [ Relay Signal IN Pin ]
      VIN (5V)    ───────────────────────> [ Relay VCC Pin ]
      GND         ───────────────────────> [ Relay GND Pin ]
```

| Component | Target ESP32 Pin / Power | Purpose & Connection Details |
| :--- | :--- | :--- |
| **Green LED (Safe)** | **`GPIO 2` (D2)** | Anode (+) to D2, Cathode (-) via 220Ω resistor to GND |
| **Yellow LED (Warning)** | **`GPIO 19` (D19)** | Anode (+) to D19, Cathode (-) via 220Ω resistor to GND |
| **Red LED (Hazard/Fire)** | **`GPIO 23` (D23)** | Anode (+) to D23, Cathode (-) via 220Ω resistor to GND |
| **Active 5V Buzzer** | **`GPIO 18` (D18)** | Positive (+) to D18, Negative (-) to Common GND |
| **5V Relay (IN)** | **`GPIO 5` (D5)** | Signal trigger to activate 12V fan |
| **5V Relay (VCC)** | **`VIN` (5V Rail)** | Powers internal relay coil |
| **5V Relay (GND)** | Common `GND` Rail | Ground return |
| **Relay `COM` Terminal** | **12V Adapter (+)** | Positive from external 12V power supply |
| **Relay `NO` Terminal** | **12V Fan Red Wire (+)**| Normally Open contact connects to Fan (+) |
| **12V Fan Black Wire (-)**| **12V Adapter (-)** | Returns ground to 12V supply |

---

## 6. Master ESP-32 30-Pin Pinout Summary

```
                          +---[ USB Type-C ]---+
                   [ EN ] |                    | [ D23 ] ---> Red LED (+) via 220Ω
          (ADC VP) [ VP ] |                    | [ D22 ] ---> I2C SCL (LCD SCL + ADS1115 SCL)
          (ADC VN) [ VN ] |                    | [ TX0 ]
                   [ D34] |                    | [ RX0 ]
                   [ D35] |                    | [ D21 ] ---> I2C SDA (LCD SDA + ADS1115 SDA)
                   [ D32] |                    | [ D19 ] ---> Yellow LED (+) via 220Ω
                   [ D33] |     ESP-32 30P     | [ D18 ] ---> Active Buzzer (+)
                   [ D25] |                    | [ D5  ] ---> Relay Fan (IN Trigger)
                   [ D26] |                    | [ D17 ]
                   [ D27] |                    | [ D16 ]
                   [ D14] |                    | [ D4  ] ---> DHT11 (Data Pin)
                   [ D12] |                    | [ D2  ] ---> Green LED (+) via 220Ω
                   [ D13] |                    | [ D15 ] ---> Flame Sensor (D0 Out)
                  [ GND ] |                    | [ GND ] ---> Common Ground Rail (GND)
                  [ VIN ] |                    | [ 3V3 ] ---> 3.3V Power Rail
                          +--------------------+
```
