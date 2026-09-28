from pydantic import BaseModel, ConfigDict, field_serializer
from datetime import datetime, timezone
from typing import Optional

def format_utc_iso(dt: Optional[datetime]) -> Optional[str]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()

class SensorDataCreate(BaseModel):
    device_id: str
    gas: float
    co: float
    temperature: float
    humidity: float
    flame: int

class SensorReadingResponse(BaseModel):
    id: int
    device_id: str
    timestamp: datetime
    gas: float
    co: float
    temperature: float
    humidity: float
    flame: int
    risk_level: int
    risk_label: str

    model_config = ConfigDict(from_attributes=True)

    @field_serializer('timestamp')
    def serialize_timestamp(self, dt: datetime, _info):
        return format_utc_iso(dt)

class AlertResponse(BaseModel):
    id: int
    device_id: str
    timestamp: datetime
    alert_type: str
    message: str
    is_resolved: bool

    model_config = ConfigDict(from_attributes=True)

    @field_serializer('timestamp')
    def serialize_timestamp(self, dt: datetime, _info):
        return format_utc_iso(dt)

class DashboardSummary(BaseModel):
    latest_reading: Optional[SensorReadingResponse] = None
    active_alerts: int
    status: str


class DeviceResponse(BaseModel):
    id: int
    device_id: str
    location: str
    sector_id: str
    sector_name: str
    level: str
    battery_level: float
    rssi_dbm: int
    firmware_ver: str
    packet_drop_pct: float
    uptime_mins: int
    is_active: bool
    last_seen: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @field_serializer('last_seen')
    def serialize_last_seen(self, dt: Optional[datetime], _info):
        return format_utc_iso(dt)

class SectorStatusResponse(BaseModel):
    sector_id: str
    sector_name: str
    level: str
    device_id: str
    status: str            # "Safe" | "Warning" | "Critical"
    risk_level: int        # 0 | 1 | 2
    gas: float
    co: float
    temperature: float
    humidity: float
    flame: int
    active_workers: int
    ventilation_status: str # "Nominal (100%)" | "Exhaust Boost (150%)" | "Reduced"
    evacuation_status: str  # "Clear" | "Standby" | "Immediate Evacuate"
    last_updated: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @field_serializer('last_updated')
    def serialize_last_updated(self, dt: Optional[datetime], _info):
        return format_utc_iso(dt)

class FleetStatusSummary(BaseModel):
    total_nodes: int
    online_nodes: int
    avg_battery_pct: float
    avg_rssi_dbm: int
    fleet_packet_drop_pct: float
    devices: list[DeviceResponse]

class NtfyConfigUpdate(BaseModel):
    server_url: Optional[str] = "https://ntfy.sh"
    topic: Optional[str] = None
    enabled: Optional[bool] = True
    cooldown_seconds: Optional[int] = 45
    notify_on_warning: Optional[bool] = True
    notify_on_critical: Optional[bool] = True
    notify_on_recovery: Optional[bool] = True

class NtfyTestRequest(BaseModel):
    topic: Optional[str] = None
    priority: Optional[str] = "high"
    message: Optional[str] = None

class ChatMessage(BaseModel):
    role: str   # "user" | "assistant" | "system"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[list[ChatMessage]] = []
    api_key: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    tool_used: Optional[str] = None
    risk_level: Optional[str] = None
    timestamp: str
    model: str

class AssistantConfigResponse(BaseModel):
    has_api_key: bool
    masked_key: Optional[str] = None
    model: str
    status: str
    tools_available: list[str]

class AssistantConfigUpdate(BaseModel):
    gemini_api_key: Optional[str] = None

