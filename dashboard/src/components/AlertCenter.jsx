import React, { useState, useEffect } from "react";

export default function AlertCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAlerts = async () => {
    try {
      const apiBase =
        window.location.port === "8000"
          ? `${window.location.origin}/api`
          : `http://${window.location.hostname || "127.0.0.1"}:8000/api`;

      const res = await fetch(`${apiBase}/alerts`);
      if (res.ok) {
        const data = await res.json();
        const active = (Array.isArray(data) ? data : data.alerts || []).filter((a) => !a.is_resolved);
        setAlerts(active);
        setUnreadCount(active.length);
      }
    } catch (err) {
      console.debug("Alerts sync standby:", err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (alertId, e) => {
    if (e) e.stopPropagation();
    try {
      const apiBase =
        window.location.port === "8000"
          ? `${window.location.origin}/api`
          : `http://${window.location.hostname || "127.0.0.1"}:8000/api`;

      const res = await fetch(`${apiBase}/alerts/${alertId}/resolve`, { method: "POST" });
      if (res.ok) {
        fetchAlerts();
      }
    } catch (err) {
      console.error("Failed to resolve alert:", err);
    }
  };

  const handleResolveAll = async () => {
    for (const a of alerts) {
      try {
        const apiBase =
          window.location.port === "8000"
            ? `${window.location.origin}/api`
            : `http://${window.location.hostname || "127.0.0.1"}:8000/api`;
        await fetch(`${apiBase}/alerts/${a.id}/resolve`, { method: "POST" });
      } catch (e) {}
    }
    fetchAlerts();
  };

  return (
    <div className="alert-center-wrapper position-relative" id="alertCenterWrapper">
      {/* Bell Action Icon */}
      <div
        className="action-icon position-relative"
        title="Hazard Alert Center"
        id="alert-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: "pointer" }}
      >
        <i className="ph-fill ph-bell fs-5"></i>
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            id="alert-bell-badge"
            style={{ fontSize: "0.65rem", padding: "0.25em 0.45em" }}
          >
            {unreadCount}
          </span>
        )}
      </div>

      {/* Alert Center Dropdown Panel */}
      <div className={`alert-center-panel ${isOpen ? "open" : ""}`} id="alertCenterPanel">
        {/* Header */}
        <div className="ac-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <i className="ph-fill ph-warning-octagon text-danger fs-5"></i>
            <span className="fw-bold text-white" style={{ fontSize: "0.88rem" }}>
              Hazard Alert Center
            </span>
          </div>
          <span
            className={`badge ${
              unreadCount > 0
                ? "bg-danger-subtle text-danger border border-danger-subtle"
                : "bg-success-subtle text-success border border-success-subtle"
            }`}
            id="ac-count-badge"
            style={{ fontSize: "0.68rem" }}
          >
            {unreadCount > 0 ? `${unreadCount} Active` : "0 Active"}
          </span>
        </div>

        {/* Body */}
        <div className="ac-body" id="ac-alerts-list">
          {alerts.length === 0 ? (
            <div className="text-center py-4 text-muted small">
              <i className="ph-fill ph-shield-check text-success fs-2 d-block mb-1"></i>
              All systems nominal. No active alerts.
            </div>
          ) : (
            alerts.map((alert) => {
              const isCrit = alert.alert_type === "Critical" || (alert.message && alert.message.includes("Fire"));
              const itemClass = isCrit ? "ac-item critical" : "ac-item warning";
              const iconClass = isCrit ? "ph-fill ph-fire text-danger" : "ph-fill ph-warning text-warning";
              const timeStr = alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent";

              return (
                <div key={alert.id} className={itemClass}>
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <div className="d-flex align-items-center gap-1">
                      <i className={iconClass}></i>
                      <span className="fw-bold text-light" style={{ fontSize: "0.78rem" }}>
                        {alert.alert_type || "Hazard Alert"}
                      </span>
                    </div>
                    <span className="text-muted" style={{ fontSize: "0.65rem" }}>
                      {timeStr}
                    </span>
                  </div>
                  <div className="text-light small mb-2" style={{ fontSize: "0.73rem", lineHeight: 1.3 }}>
                    {alert.message}
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted-light" style={{ fontSize: "0.65rem" }}>
                      <i className="ph-bold ph-cpu me-1"></i>
                      {alert.device_id}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light py-0 px-2 rounded-pill"
                      style={{ fontSize: "0.65rem" }}
                      onClick={(e) => handleResolve(alert.id, e)}
                    >
                      <i className="ph-bold ph-check me-1"></i>Resolve
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="ac-footer d-flex justify-content-between align-items-center">
          <button
            type="button"
            className="btn btn-sm btn-link text-muted-light p-0 text-decoration-none"
            style={{ fontSize: "0.75rem" }}
            onClick={() => window.openSensorEventsModal && window.openSensorEventsModal("all")}
          >
            <i className="ph-bold ph-list me-1"></i>View Full Logs
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger py-0 px-2 rounded-pill"
              style={{ fontSize: "0.7rem" }}
              onClick={handleResolveAll}
            >
              Acknowledge All
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
