# PROJECT DOCUMENTATION

## 1. Project Title
**MineSentinel AI: Intelligent IoT-Based Coal Mine Safety Monitoring, Predictive Hazard Classification, and Autonomous Emergency Response System Using ESP32 and Machine Learning**

---

## 2. Research Domain
- **Primary Domain:** Industrial Internet of Things (IIoT), Edge Computing, and Embedded Sensor Networks
- **Secondary Domain:** Applied Machine Learning, Predictive Hazard Analytics, and Autonomous Cyber-Physical Safety Systems

---

## 3. Project Category
- **Category:** Hybrid System (Software and Hardware Integration)
- **Software Sub-Category:** Machine Learning (Supervised Multi-Class Random Forest Classification), Predictive Safety Analytics, Asynchronous Telemetry Processing, Distributed Web Services (Python FastAPI Asynchronous Backend, SQLite Relational Historical Storage, and Real-Time Web Supervisory Control Dashboard), and Automated Statutory Regulatory Compliance & Form IV Shift Safety Audit Generation (ReportLab 2D Vector PDF Engine adhering to DGMS CMR 2017 Reg. 153/154 & MSHA 30 CFR § 75.360 standards).
- **Hardware Sub-Category:** 32-bit Embedded Edge Microcontroller (ESP32 NodeMCU 30-Pin), Multi-Gas Metal-Oxide Semiconductor Sensors (MQ-2 Combustible Gas & Smoke, MQ-7 Carbon Monoxide), Optical Infrared Flame Sensor, Calibrated Climate Module (DHT11 Temperature & Relative Humidity), High-Precision 16-Bit Analog-to-Digital Converter (ADS1115 I2C Delta-Sigma ADC), Local Human-Machine Visual Interface (16x2 Character I2C LCD Display), Multi-Tier Visual-Acoustic Alarms (Tri-Color LEDs, 5V Active Buzzer), and Galvanically Isolated Electromechanical Actuation (5V Optocoupled Relay Module & 12V Industrial DC Ventilation Exhaust Fan).

---

## 4. Base Paper Title
**"IOT-BASED COAL MINE SAFETY MONITORING AND ALERTING SYSTEM"**  
*(Authored by Harivardhagini Subhadra and Sreelatha Reddy Vakiti — Published in 2024 International Conference on Social and Sustainable Innovations in Technology and Engineering [SASI-ITE], IEEE Xplore, 2024 | DOI: 10.1109/SASI-ITE58663.2024.00051)*

---

## 5. Problem Statement
Underground coal mining remains one of the most hazardous industrial environments globally, characterized by volatile atmospheres, catastrophic structural risks, and extreme confinement. Subterranean miners constantly face life-threatening perils, including explosive methane (CH4) gas accumulation, asphyxiating carbon monoxide (CO) emissions from coal seams, spontaneous combustion fires, severe thermal stress, and acute oxygen displacement. These invisible threats can rapidly escalate into massive underground explosions or fatal asphyxiation crises within seconds, jeopardizing dozens of lives and destroying vital mining infrastructure.

Conventional safety monitoring practices deployed in underground mines depend predominantly on manual handheld gas meters, periodic human patrols, or legacy hardwired analog sensors configured with rudimentary, hardcoded single-variable threshold cutoffs. In complex, dynamic underground ventilation shafts, hazardous events rarely emerge as isolated single-sensor spikes; instead, disasters manifest as compound multi-parameter interactions—such as a moderate rise in carbon monoxide coinciding with elevated ambient heat and reduced relative humidity. Conventional threshold systems completely fail to recognize these correlated micro-climatic patterns, resulting in either frequent false alarms that cause operational paralysis or late-stage alarms that trigger only after atmospheric toxicity has reached lethal, irreversible thresholds.

Furthermore, traditional industrial IoT monitoring setups suffer from severe physical and architectural isolation. The internal analog-to-digital converters (ADCs) of standard microcontrollers exhibit non-linear transfer curves, extreme quantization errors, and thermal drift caused by internal Wi-Fi radio transmissions, corrupting delicate analog gas readings. Compounding this issue, legacy IoT systems depend on third-party cloud aggregators (e.g., ThingSpeak) that incur several seconds of network latency and function as passive, one-way data silos. These systems lack an immediate on-site visual feedback interface for frontline miners working hundreds of meters underground. Crucially, they lack closed-loop edge actuation mechanisms capable of autonomously engaging emergency exhaust fans or sounding directional evacuation alarms when a critical hazard or explosive atmosphere develops.

Finally, mining safety regulations (such as the Directorate General of Mines Safety DGMS Coal Mines Regulations 2017 in India and MSHA 30 CFR in the USA) legally mandate that mine overmen log and sign official Form IV atmospheric examination reports every 8 hours. In conventional mines, this process is entirely manual, paper-bound, and prone to retrospective human fabrication or clerical omission, leading to severe regulatory non-compliance, unverified audit trails, and zero accountability during mine inspections.

To overcome these critical physical, telemetric, analytical, and statutory deficiencies, there is an urgent necessity to design and implement an end-to-end cyber-physical architecture named **MineSentinel AI**. This platform unifies multi-sensor edge signal conditioning, high-precision 16-bit analog digitization, an on-site 16x2 I2C LCD visual display, an asynchronous FastAPI cloud pipeline, machine learning-driven multi-class hazard prediction, automated closed-loop electromechanical ventilation actuation, and one-click statutory shift safety audit certification.

---

## 6. Limitations of Existing System
The limitations of conventional coal mine monitoring frameworks, particularly threshold-dependent industrial nodes and standard IoT telemetry loggers, can be categorized into six critical areas:

### 6.1 Rigid Single-Variable Thresholding and Inability to Detect Compound Hazards
Traditional mine monitoring systems evaluate environmental metrics through isolated, static threshold comparators (e.g., triggering an alarm only when gas crosses a fixed millivolt level). Under dynamic subterranean conditions, hazardous phenomena are non-linear and interdependent; an otherwise sub-critical level of carbon monoxide coupled with elevated ambient temperature and low humidity indicates active coal smoldering and impending fire. Conventional static systems cannot model these multidimensional parameter cross-correlations, causing delayed emergency responses or chronic false alarms that diminish worker compliance.

### 6.2 Severe ADC Non-Linearity, Signal Noise, and Thermal Drift in Edge Microcontrollers
Standard edge microcontrollers (such as the default ESP32 internal 12-bit SAR ADC) exhibit documented non-linear response curves, especially below 0.1V and above 2.8V, coupled with severe radio-frequency (RF) switching noise induced by onboard Wi-Fi bursts. Because metal-oxide semiconductor gas sensors (MQ-2 and MQ-7) rely on delicate analog surface-resistance changes, reading them directly through unconditioned microcontroller pins produces erratic voltage fluctuations, false hazard spikes, and inaccurate gas parts-per-million (ppm) derivations.

### 6.3 Total Absence of Instantaneous On-Site Visual Interface for Subterranean Personnel
Most IoT-based mining prototypes operate as headless sensor nodes that stream raw telemetry outward to remote supervisor offices while leaving the miners at the face entirely unaware of ambient atmospheric toxicity. In the event of an underground communication cable severed by a rockfall or an external Wi-Fi transceiver failure, miners have no local display to inspect current gas levels, environmental stability, or device connectivity status, leaving them completely vulnerable to silent, odorless gas buildup.

### 6.4 High Latency, Cloud Dependency, and Data Bottlenecks of Legacy Platforms
Existing IoT implementations frequently rely on generic third-party cloud telemetry platforms (such as ThingSpeak or Adafruit IO) with rate-limited ingestion cycles (typically 15-second update intervals). These cloud services act as passive loggers devoid of embedded machine learning inference pipelines. They cannot execute dynamic multi-feature classification, prevent customized data transformation, or feed real-time analytics to operational command rooms without unacceptable multi-second delays.

### 6.5 Absence of Closed-Loop Autonomous Physical Edge Actuation and Mitigation
Conventional monitoring setups are strictly passive and diagnostic: they sound an alarm but cannot actively intervene to neutralize the detected danger. When toxic or combustible gas concentrations surpass safe thresholds, standard systems require manual human intervention to locate and activate industrial ventilation dampers or exhaust blowers. This manual delay allows explosive gas pockets to expand throughout the tunnel adit before ventilation can be initiated.

### 6.6 Absence of Automated Statutory Regulatory Auditing and Form IV Shift Reporting
Current mining telemetry tools operate merely as passive loggers or visual graphs without any legal compliance pipeline. Safety officers must manually transcribe readings from disparate logs onto physical paper books. This introduces human transcription errors, retrospective falsification risks during safety directorate audits, and no cryptographic verification of peak toxic gas exposure or exhaust fan actuations during an 8-hour shift.

---

## 7. Research Gap Identified
A systematic synthesis of the underlying base paper alongside recent industrial IoT and mine safety engineering literature exposes four fundamental research gaps that this project directly addresses:

### 7.1 Research Gap 1: Inadequate Fusion of Multi-Sensor Environmental Metrics with Machine Learning Predictive Classifiers
While published research has demonstrated basic micro-climate logging in mine shafts, existing frameworks rarely embed supervised machine learning classification directly into the telemetry ingestion pipeline. Most systems treat gas concentration, thermal index, and optical flame signals as disjoint scalar numbers rather than an integrated environmental state vector. There is a prominent research gap in utilizing multi-class ensemble algorithms (such as Random Forest) to evaluate simultaneous multivariate sensor vectors and output real-time predictive hazard classifications (*Safe*, *Warning*, *Critical*) that preempt catastrophic incidents.

### 7.2 Research Gap 2: Disconnect Between Local Real-Time Edge Display and Cloud-Scale Supervisory Telemetry Pipelines
Contemporary research architectures typically pursue one of two extremes: either a standalone embedded device with simple local buzzer alarms that lacks historical cloud analytics, or an internet-dependent node that streams data to a remote dashboard while offering zero local visual interaction. A critical engineering gap exists in establishing a resilient, dual-tier telemetry topology where an embedded 16x2 I2C LCD human-machine interface delivers instantaneous, zero-latency situational awareness to on-site subterranean personnel while simultaneously publishing low-overhead MQTT telemetry packets to an asynchronous cloud microservice.

### 7.3 Research Gap 3: Absence of Low-Latency Closed-Loop Autonomous Actuation Directly Coupled to Hazard Classification States
Existing academic literature focuses heavily on alerting paradigms (such as sending SMS notifications or dashboard push messages) while neglecting autonomous physical cyber-physical mitigation. In explosive or oxygen-depleted atmospheres, the latency incurred by human supervisor response often exceeds the safe evacuation window. An integrated actuation pipeline that seamlessly couples machine learning classification and physical edge relay logic to actuate heavy industrial ventilation fans and multi-stage directional alarms within milliseconds remains an unaddressed research domain.

### 7.4 Research Gap 4: Disconnect Between Real-Time Edge Telemetry and Government-Mandated Statutory Compliance Certification
A critical operational disconnect exists between high-frequency IoT telemetry and government-mandated mine safety governance (such as DGMS Form IV under CMR 2017 Reg. 153/154 and MSHA 30 CFR § 75.360). Existing academic systems produce raw CSV dumps but completely fail to automate legal shift compliance certificates with mathematical exposure audits, ventilation actuation logs, and supervisory digital sign-offs.

---

## 8. Statement of Proposed System
The proposed system, titled **MineSentinel AI**, is an integrated cyber-physical software-hardware platform engineered to deliver continuous, high-precision environmental surveillance, real-time machine learning-driven hazard classification, local edge situational awareness, autonomous closed-loop industrial mitigation, and one-click statutory safety audit generation.

The architectural workflow of MineSentinel AI operates across six synchronized execution layers:

### 8.1 Stage 1: High-Precision Multi-Parameter Edge Sensing and 16-Bit Signal Conditioning
The subterranean physical sensing array deploys four specialized sensors to capture the complete atmospheric profile: an MQ-2 sensor for combustible gases (methane, LPG, smoke), an MQ-7 sensor for toxic carbon monoxide, a DHT11 module for temperature and humidity, and an optical infrared detector for immediate flame wavelength recognition. To eliminate microcontroller ADC distortion, analog gas voltages are digitized through an external **ADS1115 16-bit Delta-Sigma ADC** running over a 400 kHz I2C bus (`0x48`), configured with an internal Programmable Gain Amplifier (PGA range of ±4.096V, providing a sensitivity of 0.125 millivolts per Least Significant Bit). The node features an isolated dual-rail power topology decoupled with electrolytic (100µF, 10µF) and ceramic (0.1µF) capacitor networks to suppress heater inductive switching spikes and RF transmission ripples.

### 8.2 Stage 2: Local Edge Display Rendering and Fault-Tolerant Telemetry Ingestion
Sensor telemetry is processed continuously by the dual-core 32-bit ESP32 processor. Telemetry is immediately rendered onto a local **16x2 Character I2C LCD (JHD 162A via PCF8574 backpack at `0x27`)**, providing miners on the tunnel face with instant visual feedback of live gas levels, thermal conditions, Wi-Fi connectivity, and overall safety status. Simultaneously, the ESP32 packages sensor metrics into compact JSON payloads and broadcasts them via Wi-Fi 802.11 b/g/n using the lightweight MQTT protocol (`broker.emqx.io:1883`) on topic `minesentinel/telemetry`. If network disconnection occurs, the edge firmware switches seamlessly into an autonomous offline fail-safe mode, maintaining local LCD updates and threshold-based hardware alarms without interruption.

### 8.3 Stage 3: Asynchronous Backend Telemetry Pipeline and Random Forest Predictive Classification
Incoming MQTT telemetry is ingested by a high-throughput **Python FastAPI** backend microservice. Instead of relying on static rules, the backend routes the multi-sensor input feature vector (comprising Gas, Carbon Monoxide, Temperature, Humidity, and Flame detector values) into an optimized **Scikit-Learn Random Forest Classifier** featuring 100 decision trees. The ensemble model models complex non-linear boundary interactions across sensor modalities to classify the current environment into one of three operational states: **Safe (0)**, **Warning (1)**, or **Critical (2)**. Deterministic fail-safe guardrails guarantee that any positive optical flame reading or acute gas surge instantly forces a Critical classification, eliminating any possibility of model false-negatives during emergency events. Every record and classification decision is persisted to an ACID-compliant SQLite historical relational database.

### 8.4 Stage 4: Closed-Loop Physical Edge Actuation and Real-Time Interactive Web Supervisory Control
Once a hazardous atmospheric condition (Warning or Critical) is classified, the system immediately initiates automated physical mitigation and supervisory alerting. The ESP32 asserts GPIO 5 to energize an optocoupled 5V relay module, immediately powering a high-velocity 12V DC industrial ventilation exhaust fan to extract toxic fumes, disperse combustible gas pockets, and force fresh airflow into the tunnel adit. Simultaneously, GPIO 18 sounds an active 5V high-decibel audible alarm, while GPIO pins 2, 19, and 23 actuate dedicated Tri-Color visual status indicators (Green for nominal, Yellow for warning, and Red for emergency strobe). Concurrently, the centralized Web Supervisory Dashboard dynamically updates interactive telemetry charts, real-time sector risk cards, historical audit logs, and automated emergency dispatch protocols for surface command personnel within milliseconds.

### 8.5 Stage 5: Historical Telemetry Persistence, Trend Analytics, and Continuous Model Retraining
Telemetry records, incident timestamps, and AI classification outputs are permanently archived into an ACID-compliant SQLite relational database. Surface engineers and safety inspectors can query historical environmental trends across 24-hour mining shifts, analyze cumulative gas exposure rates, and export historical datasets to CSV format. Furthermore, newly captured live hardware telemetry from deep mine operations is fed back into the training pipeline via an automated retraining module, allowing the Random Forest model to periodically update its decision boundaries and adapt to evolving subterranean seasonal conditions.

### 8.6 Stage 6: Automated Statutory Shift Safety Audit and Regulatory Compliance Generation
To comply with legal mining mandates (including the Directorate General of Mines Safety DGMS Coal Mines Regulations 2017 Reg. 153/154 in India and MSHA 30 CFR § 75.360 in the USA), mine overmen and safety officers are legally obligated to record and certify an atmospheric examination log every 8 hours. MineSentinel AI automates this statutory workflow by embedding an optimized ReportLab 2D vector PDF compilation service within the FastAPI backend. With a single click or upon shift handover, the system compiles historical SQLite sensor telemetry over 8-hour, 24-hour, or custom intervals to calculate min/max/mean concentrations for Combustible Gas ($CH_4$), Carbon Monoxide ($CO$), and Temperature, audit electromechanical fan relay actuations (GPIO 5), evaluate regulatory threshold compliance, and generate an official, tamper-evident 2-page statutory Form IV PDF report with supervisory legal sign-off signature blocks and colliery stamp placeholders.

---

## 9. Novelty and Innovation in the Proposed System

### Hybrid Edge-Cloud Machine Learning Predictive Architecture:
Unlike conventional threshold systems that react only after toxic gases exceed dangerous limits, MineSentinel AI integrates a pre-trained Random Forest ensemble model directly into the live telemetry loop. By correlating micro-shifts in carbon monoxide, explosive gas traces, thermal elevation, and relative humidity, the system predicts compound hazard conditions well before they reach catastrophic, explosive levels.

### High-Precision 16-Bit Analog Subsystem with Dual-Rail Decoupled Power Isolation:
To overcome the pervasive issue of ADC non-linearity and radio-frequency noise that plagues conventional ESP32 designs, MineSentinel AI incorporates an external ADS1115 16-bit Delta-Sigma ADC module paired with a dual-rail power decoupling network (100µF, 10µF, and 0.1µF capacitors). This architecture isolates delicate analog gas sensor voltages from the high-current switching spikes of the sensor heaters and Wi-Fi transceivers, delivering laboratory-grade measurement precision (0.125 mV resolution).

### Synchronized Dual-Tier Telemetry (Local 16x2 LCD & Supervisory Web Dashboard):
The architecture uniquely bridges subterranean personnel and remote surface supervisors. On-site miners receive instant, local visual telemetry via a ruggedized 16x2 I2C LCD screen directly at the coal face, ensuring complete situational awareness even during total underground network severed-cable events. Simultaneously, surface personnel monitor full spatial sector telemetry, historical trends, and system health metrics over a modern web dashboard.

### Closed-Loop Autonomous Electromechanical Actuation:
In contrast to conventional open-loop monitoring architectures that function solely as passive telemetry loggers and advisory alert systems, MineSentinel AI operates as an integrated closed-loop cyber-physical system (CPS). Upon algorithmic identification of anomalous gas concentrations, thermal escalation, or optical flame signatures, the edge controller executes deterministic, hardware-level mitigation protocols without requiring human-in-the-loop intervention. Specifically, an optoisolated electromechanical relay driver is energized within sub-second latencies to actuate an industrial-grade auxiliary ventilation fan, rapidly exhausting hazardous volatiles and diluting combustible atmospheric mixtures below lower explosive limits (LEL). Concurrently, the node drives an active acoustic transducer array and synchronized multi-state optical beacons to initiate immediate on-site worker evacuation, effectively eliminating operational response delays and mitigating disaster escalation.

### One-Click Statutory Regulatory Compliance and Form IV Audit Engine:
Unlike conventional academic prototypes that only log sensor numbers, MineSentinel AI bridges the operational gap between edge IoT telemetry and legal mining compliance. The system automatically converts continuous sensor data streams into an official, authenticated 2-page statutory Shift Safety Audit (PDF) adhering directly to DGMS (India) and MSHA (USA) mining safety regulations, eliminating clerical paper falsification and ensuring non-repudiable audit trails for government safety inspectors.

---

## 10. Expected Improvements over Existing System

### Predictive Multi-Parameter Hazard Classification:
Traditional mine systems rely on rigid single-sensor thresholds that fail to detect compound atmospheric hazards. MineSentinel AI integrates a Scikit-Learn Random Forest model that simultaneously evaluates readings from the MQ-2, MQ-7, DHT11, and optical flame sensors to classify mine conditions into Safe, Warning, or Critical states. Deterministic physical guardrails provide immediate fail-safe overrides during flame or severe gas spikes, ensuring reliable early warning without false alarms.

### Uncompromised Local Situational Awareness via On-Site 16x2 I2C LCD Display:
Most IoT mining devices operate as headless units that send telemetry only to distant offices, leaving underground workers unaware of toxic gas buildup. MineSentinel AI embeds a dedicated 16x2 Character I2C LCD directly on the physical ESP32 node to render live gas, CO, temperature, humidity, and connectivity metrics. This provides subterranean miners with instantaneous on-site visual feedback and prominent emergency alerts even during underground communication outages.

### Autonomous Closed-Loop Hazard Mitigation via Relay Exhaust Fan, Buzzer, and LEDs:
Conventional systems are purely passive and require manual human intervention to locate and activate emergency ventilation blowers. When an elevated risk or fire state is detected, the ESP32 automatically energizes a 5V optocoupled relay to power a 12V DC industrial exhaust fan and restore fresh airflow. Simultaneously, an active 5V buzzer and tri-color status LEDs activate immediately to guide worker evacuation without relying on delayed remote human response.

### High-Throughput FastAPI Backend and Web Dashboard Replacing Legacy Cloud Loggers:
Legacy mining solutions frequently depend on generic cloud platforms like ThingSpeak, which suffer from rate limits and high transmission delays. MineSentinel AI utilizes a custom Python FastAPI backend and lightweight MQTT broker to intercept and evaluate sensor telemetry in real time. Telemetry is permanently stored in an ACID-compliant SQLite database and served instantly to a responsive Web Supervisory Dashboard for live monitoring and operator dispatch.

### Elimination of Error-Prone Manual Shift Logbooks and Regulatory Falsification:
Traditional underground coal mines rely on manual handheld check-sheets that are susceptible to human error, delayed transcription, and retrospective falsification. MineSentinel AI automates shift atmospheric examinations directly from timestamped edge sensor packets, certifying compliance with statutory ventilation standards, documenting fan relay actuations, and providing an indisputable legal audit trail for regulatory bodies.
