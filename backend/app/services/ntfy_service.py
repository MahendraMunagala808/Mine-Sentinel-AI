import os
import json
import time
import urllib.request
import urllib.error
import threading
from typing import Optional, Dict, Any

_project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
CONFIG_FILE = os.path.join(_project_root, "database", "ntfy_config.json")
_LEGACY_CONFIG_FILE = os.path.join(_project_root, "backend", "database", "ntfy_config.json")

DEFAULT_CONFIG = {
    "server_url": "https://ntfy.sh",
    "topic": "minesentinel-alerts-2026",
    "enabled": True,
    "cooldown_seconds": 45,
    "notify_on_warning": True,
    "notify_on_critical": True,
    "notify_on_recovery": True
}

class NtfyService:
    def __init__(self):
        self.config = self._load_config()
        self.last_sent_time = 0
        self.last_state = "Safe"
        self.last_hazard_summary = ""
        self.last_dispatch_log = []

    def _load_config(self) -> dict:
        try:
            target_file = CONFIG_FILE if os.path.exists(CONFIG_FILE) else (_LEGACY_CONFIG_FILE if os.path.exists(_LEGACY_CONFIG_FILE) else None)
            if target_file and os.path.exists(target_file):
                with open(target_file, "r", encoding="utf-8") as f:
                    saved = json.load(f)
                    cfg = {**DEFAULT_CONFIG, **saved}
                    # Ensure canonical file exists
                    if target_file != CONFIG_FILE:
                        os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
                        with open(CONFIG_FILE, "w", encoding="utf-8") as wf:
                            json.dump(cfg, wf, indent=2)
                    return cfg
        except Exception as e:
            print(f"[ntfy] Warning loading config: {e}")
        return DEFAULT_CONFIG.copy()

    def save_config(self, new_config: dict) -> dict:
        self.config.update(new_config)
        try:
            os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
            with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(self.config, f, indent=2)
            print(f"[ntfy] Configuration saved successfully: topic={self.config.get('topic')}")
        except Exception as e:
            print(f"[ntfy] Error saving config: {e}")
        return self.config

    def get_config(self) -> dict:
        return {
            **self.config,
            "last_state": self.last_state,
            "last_sent_time": self.last_sent_time,
            "recent_dispatches": self.last_dispatch_log[-5:]
        }

    def send_notification(
        self,
        title: str,
        message: str,
        topic: Optional[str] = None,
        priority: str = "high",
        tags: Optional[str] = None,
        click_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send an HTTP POST push notification to ntfy.sh server.
        Executes synchronously or inside a thread.
        """
        active_topic = (topic or self.config.get("topic") or "minesentinel-alerts-2026").strip()
        server = self.config.get("server_url", "https://ntfy.sh").rstrip("/")
        endpoint = f"{server}/{active_topic}"

        # Build HTTP headers for ntfy
        # Priority mapping: 5 = urgent, 4 = high, 3 = default, 2 = low, 1 = min
        priority_map = {
            "urgent": "5",
            "critical": "5",
            "5": "5",
            "high": "4",
            "warning": "4",
            "4": "4",
            "default": "3",
            "3": "3",
            "low": "2",
            "2": "2",
            "min": "1",
            "1": "1"
        }
        p_val = priority_map.get(str(priority).lower(), "4")

        headers = {
            "Title": title.encode("utf-8"),
            "Priority": p_val,
            "User-Agent": "MineSentinel-AI-Backend/2.4"
        }

        if tags:
            headers["Tags"] = tags

        if click_url:
            headers["Click"] = click_url

        data_bytes = message.encode("utf-8")
        req = urllib.request.Request(endpoint, data=data_bytes, headers=headers, method="POST")

        result = {
            "success": False,
            "topic": active_topic,
            "endpoint": endpoint,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "title": title,
            "priority": p_val,
            "tags": tags
        }

        try:
            with urllib.request.urlopen(req, timeout=8) as response:
                status_code = response.getcode()
                if status_code in [200, 201, 202]:
                    result["success"] = True
                    result["status_code"] = status_code
                    self.last_sent_time = time.time()
                    print(f"[ntfy] Push notification dispatched successfully to {endpoint} (Priority: {p_val})")
                else:
                    result["error"] = f"Unexpected status {status_code}"
        except urllib.error.HTTPError as he:
            result["error"] = f"HTTP Error {he.code}: {he.reason}"
            print(f"[ntfy] HTTP Error: {result['error']}")
        except urllib.error.URLError as ue:
            result["error"] = f"Network/URL Error: {ue.reason}"
            print(f"[ntfy] Network Error: {result['error']}")
        except Exception as ex:
            result["error"] = str(ex)
            print(f"[ntfy] Exception dispatching push: {ex}")

        # Keep rolling audit log of dispatches
        self.last_dispatch_log.append(result)
        if len(self.last_dispatch_log) > 20:
            self.last_dispatch_log.pop(0)

        return result

    def send_notification_async(self, *args, **kwargs):
        """Dispatches notification in a background daemon thread so it doesn't block telemetry pipeline."""
        thread = threading.Thread(target=self.send_notification, args=args, kwargs=kwargs, daemon=True)
        thread.start()

    def dispatch_hazard_telemetry(self, device_id: str, risk_label: str, telemetry: dict):
        """
        Evaluate real-time telemetry against alert criteria and dispatch ntfy push notifications
        with anti-flood debounce and escalation override.
        """
        if not self.config.get("enabled", True):
            return

        now = time.time()
        cooldown = self.config.get("cooldown_seconds", 45)
        flame = telemetry.get("flame", 0)
        gas = telemetry.get("gas", 0)
        co = telemetry.get("co", 0)
        temp = telemetry.get("temperature", 0)
        hum = telemetry.get("humidity", 0)

        is_critical = (risk_label == "Critical") or (flame == 1) or (gas > 850) or (co > 120) or (temp > 50)
        is_warning = (risk_label == "Warning") or (gas > 450) or (co > 50) or (temp > 40)

        # ── 1. Recovery Notification (Alert Resolved) ──
        if risk_label == "Safe" and self.last_state in ["Warning", "Critical"]:
            if self.config.get("notify_on_recovery", True):
                self.send_notification_async(
                    title="✅ Mine Condition Normal — Tunnel 1 & Tunnel 2 All Clear",
                    message=(
                        f"All environmental parameters for [Tunnel 1 ({device_id})] returned to nominal safe levels.\n"
                        f"Cascading alert for [Tunnel 2] cleared to Standby Safe.\n"
                        f"Gas: {gas:.1f} ppm | Temp: {temp:.1f}°C | LCD: T1:SAFE T2:SAFE."
                    ),
                    priority="default",
                    tags="white_check_mark,shield,mine",
                    click_url="http://127.0.0.1:8000/dashboard.html"
                )
            self.last_state = "Safe"
            return

        # ── 2. Critical Alert (Tunnel 1 Emergency -> Tunnel 2 Evacuation Warning) ──
        if is_critical and self.config.get("notify_on_critical", True):
            # Check cooldown unless escalating from Safe/Warning to Critical
            escalating = (self.last_state != "Critical")
            time_since_last = now - self.last_sent_time

            if escalating or time_since_last >= cooldown:
                hazard_reasons = []
                tags_list = ["rotating_light", "skull"]
                if flame == 1:
                    hazard_reasons.append("🔥 Optical Flame / Fire Detected in Tunnel 1")
                    tags_list.append("fire")
                if gas > 850:
                    hazard_reasons.append(f"☣️ Combustible Gas Hazard ({gas:.1f} ppm) in Tunnel 1")
                    tags_list.append("biohazard")
                if co > 120:
                    hazard_reasons.append(f"💨 Toxic Carbon Monoxide Spike ({co:.1f} ppm) in Tunnel 1")
                    tags_list.append("mask")
                if temp > 50:
                    hazard_reasons.append(f"🌡️ Extreme Underground Heat ({temp:.1f}°C) in Tunnel 1")
                    tags_list.append("hotsprings")

                if not hazard_reasons:
                    hazard_reasons.append(f"AI Risk Index: Critical Emergency ({gas:.1f} ppm gas, {temp:.1f}°C)")

                reason_text = "\n• " + "\n• ".join(hazard_reasons)
                msg = (
                    f"🚨 CRITICAL EMERGENCY IN TUNNEL 1 [{device_id}]!{reason_text}\n\n"
                    f"⚠️ CASCADING ALERT DISPATCHED TO TUNNEL 2:\n"
                    f"• Tunnel 1: Siren & Exhaust Fan ACTIVE | RED LED ON\n"
                    f"• Tunnel 2: LCD Alert Dispatched (T1:CRIT T2:ALRT) | Mobile Push Advisory Active\n"
                    f"Tunnel 1 personnel evacuate immediately; Tunnel 2 personnel suspend operations."
                )

                self.send_notification_async(
                    title="🚨 CRITICAL MINE ALERT: Tunnel 1 -> Tunnel 2 Evacuate",
                    message=msg,
                    priority="urgent",
                    tags=",".join(tags_list),
                    click_url="http://127.0.0.1:8000/dashboard.html"
                )
                self.last_state = "Critical"
            return

        # ── 3. Warning Alert (Tunnel 1 Elevated -> Tunnel 2 Advisory) ──
        if is_warning and self.config.get("notify_on_warning", True):
            escalating = (self.last_state == "Safe")
            time_since_last = now - self.last_sent_time

            if escalating or time_since_last >= cooldown:
                warn_reasons = []
                if gas > 450:
                    warn_reasons.append(f"Elevated Gas ({gas:.1f} ppm)")
                if co > 50:
                    warn_reasons.append(f"Elevated CO ({co:.1f} ppm)")
                if temp > 40:
                    warn_reasons.append(f"High Temp ({temp:.1f}°C)")

                if not warn_reasons:
                    warn_reasons.append(f"AI Risk Index: Warning ({gas:.1f} ppm gas)")

                msg = (
                    f"⚠️ Caution: Elevated Hazard in Tunnel 1 [{device_id}].\n"
                    f"• " + ", ".join(warn_reasons) + "\n\n"
                    f"📢 Cascading Alert Dispatched to Tunnel 2:\n"
                    f"• Tunnel 1: Ventilation Fan ON | Yellow LED ON\n"
                    f"• Tunnel 2: LCD Alert Dispatched (T1:WARN T2:ALRT) | Mobile Push Advisory"
                )

                self.send_notification_async(
                    title="⚠️ WARNING: Tunnel 1 Hazard -> Tunnel 2 Alert",
                    message=msg,
                    priority="high",
                    tags="warning,exclamation,tunnel",
                    click_url="http://127.0.0.1:8000/dashboard.html"
                )
                self.last_state = "Warning"
            return

        if risk_label == "Safe":
            self.last_state = "Safe"


ntfy_service = NtfyService()
