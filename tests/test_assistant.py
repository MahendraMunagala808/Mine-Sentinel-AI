import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import app
from app.database import Base, get_db
from app.models.domain import SensorReading, Device, Alert
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def setup_module():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Seed a device and reading if empty
    if not db.query(Device).filter(Device.device_id == "ESP32_NODE_01").first():
        dev = Device(
            device_id="ESP32_NODE_01",
            location="Level -100m Main Extraction Face",
            sector_id="SEC-01",
            sector_name="Level -100m Main Extraction Face",
            level="Level -100m",
            battery_level=100.0,
            rssi_dbm=-58,
            firmware_ver="v2.4.1-ESP32-Hardware",
            packet_drop_pct=0.05,
            uptime_mins=1840,
            is_active=True,
            last_seen=datetime.now()
        )
        db.add(dev)
    if not db.query(SensorReading).first():
        reading = SensorReading(
            device_id="ESP32_NODE_01",
            gas=25.0,
            co=12.0,
            temperature=24.5,
            humidity=55.0,
            flame=0,
            risk_level=0,
            risk_label="Safe"
        )
        db.add(reading)
    db.commit()
    db.close()

def test_assistant_config():
    response = client.get("/api/assistant/config")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "tools_available" in data
    assert "get_live_telemetry" in data["tools_available"]

def test_assistant_chat_status_query():
    response = client.post(
        "/api/assistant/chat",
        json={"message": "What is the current safety status of the mine?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "model" in data
    assert len(data["reply"]) > 20
    assert "Status" in data["reply"]

def test_assistant_chat_shift_report():
    response = client.post(
        "/api/assistant/chat",
        json={"message": "Generate shift safety handover report for today"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "tool_used" in data
    assert "DGMS" in data["reply"] or "Report" in data["reply"]

def test_assistant_chat_emergency_sop():
    response = client.post(
        "/api/assistant/chat",
        json={"message": "What is the emergency SOP for Carbon Monoxide leak?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "Carbon Monoxide" in data["reply"] or "ppm" in data["reply"]
