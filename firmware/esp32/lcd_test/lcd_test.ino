/*
 * ============================================================================
 * MineSentinel AI - Plug & Play 16x2 I2C LCD Test Sketch
 * 
 * WIRING:
 *   HW-61 GND  -> ESP32 GND
 *   HW-61 VCC  -> ESP32 VIN (5V)   <-- MUST BE 5V, NOT 3.3V!
 *   HW-61 SDA  -> ESP32 GPIO 21 (D21)
 *   HW-61 SCL  -> ESP32 GPIO 22 (D22)
 * ============================================================================
 */

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// Supports both standard addresses (0x27 and 0x3F) automatically!
LiquidCrystal_I2C lcd27(0x27, 16, 2);
LiquidCrystal_I2C lcd3F(0x3F, 16, 2);

int count = 0;
byte activeAddress = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n--- MineSentinel AI: 16x2 LCD Test Starting ---");

  // 1. Initialize I2C Bus on ESP32 Pins
  Wire.begin(21, 22); // SDA = GPIO 21, SCL = GPIO 22
  Wire.setTimeOut(100);

  // 2. Scan I2C to see which address responds
  Wire.beginTransmission(0x27);
  if (Wire.endTransmission() == 0) {
    activeAddress = 0x27;
    Serial.println("[I2C Found] LCD detected at address 0x27 (PCF8574)!");
  } else {
    Wire.beginTransmission(0x3F);
    if (Wire.endTransmission() == 0) {
      activeAddress = 0x3F;
      Serial.println("[I2C Found] LCD detected at address 0x3F (PCF8574A)!");
    } else {
      Serial.println("[I2C Warning] Neither 0x27 nor 0x3F answered. Checking wiring...");
    }
  }

  // 3. Initialize BOTH addresses to guarantee whichever is connected wakes up!
  lcd27.init();
  lcd27.backlight();
  lcd27.clear();
  lcd27.setCursor(0, 0);
  lcd27.print("MineSentinel AI");
  lcd27.setCursor(0, 1);
  lcd27.print("LCD 0x27: ONLINE");

  lcd3F.init();
  lcd3F.backlight();
  lcd3F.clear();
  lcd3F.setCursor(0, 0);
  lcd3F.print("MineSentinel AI");
  lcd3F.setCursor(0, 1);
  lcd3F.print("LCD 0x3F: ONLINE");

  Serial.println("--- Initialization Sent to Screen ---");
  Serial.println("If screen is still showing solid boxes, SLOWLY turn the blue contrast potentiometer on the back!");
}

void loop() {
  count++;

  // Update line 2 with running count on both addresses
  char buf[17];
  snprintf(buf, sizeof(buf), "Test Count: %-4d", count);

  lcd27.setCursor(0, 1);
  lcd27.print(buf);

  lcd3F.setCursor(0, 1);
  lcd3F.print(buf);

  Serial.printf("Screen Heartbeat Count: %d\n", count);
  delay(1000);
}
