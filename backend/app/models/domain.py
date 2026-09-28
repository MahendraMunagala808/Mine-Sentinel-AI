from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.database import Base

class Device(Base):
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, index=True)
    location = Column(String, default="Zone 1")
    sector_id = Column(String, default="SEC-01")
    sector_name = Column(String, default="Level -100m Main Adit")
    level = Column(String, default="Level -100m")
    battery_level = Column(Float, default=94.0) # percentage 0-100
    rssi_dbm = Column(Integer, default=-62)     # signal strength in dBm (-30 to -95)
    firmware_ver = Column(String, default="v2.4.1-ESP32-ADC16")
    packet_drop_pct = Column(Float, default=0.2) # percentage packet drop
    uptime_mins = Column(Integer, default=1420)
    is_active = Column(Boolean, default=True)
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    gas = Column(Float)
    co = Column(Float)
    temperature = Column(Float)
    humidity = Column(Float)
    flame = Column(Integer) # 0 or 1
    
    risk_level = Column(Integer) # 0: Safe, 1: Warning, 2: Critical
    risk_label = Column(String)  # "Safe", "Warning", "Critical"

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    alert_type = Column(String) # "Warning", "Critical"
    message = Column(String)
    is_resolved = Column(Boolean, default=False)
