import React, { useState, useEffect } from "react";

export default function NtfyModal({ isOpen, onClose }) {
  const [topic, setTopic] = useState("minesentinel-alerts-2026");
  const [serverUrl, setServerUrl] = useState("https://ntfy.sh");
  const [cooldown, setCooldown] = useState(30);
  const [enabled, setEnabled] = useState(true);
  const [notifyCrit, setNotifyCrit] = useState(true);
  const [notifyWarn, setNotifyWarn] = useState(true);
  const [notifyRecov, setNotifyRecov] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchConfig = async () => {
      try {
        const apiBase =
          window.location.port === "8000"
            ? `${window.location.origin}/api`
            : `http://${window.location.hostname || "127.0.0.1"}:8000/api`;
        const res = await fetch(`${apiBase}/ntfy/config`);
        if (res.ok) {
          const data = await res.json();
          if (data.topic) setTopic(data.topic);
          if (data.server_url) setServerUrl(data.server_url);
          if (typeof data.cooldown_seconds === "number") setCooldown(data.cooldown_seconds);
          if (typeof data.enabled === "boolean") setEnabled(data.enabled);
          if (typeof data.notify_on_critical === "boolean") setNotifyCrit(data.notify_on_critical);
          if (typeof data.notify_on_warning === "boolean") setNotifyWarn(data.notify_on_warning);
          if (typeof data.notify_on_recovery === "boolean") setNotifyRecov(data.notify_on_recovery);
        }
      } catch (err) {
        console.debug("Ntfy config load standby:", err);
      }
    };

    fetchConfig();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const apiBase =
        window.location.port === "8000"
          ? `${window.location.origin}/api`
          : `http://${window.location.hostname || "127.0.0.1"}:8000/api`;

      await fetch(`${apiBase}/ntfy/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          server_url: serverUrl,
          cooldown_seconds: parseInt(cooldown, 10),
          enabled,
          notify_on_critical: notifyCrit,
          notify_on_warning: notifyWarn,
          notify_on_recovery: notifyRecov
        })
      });
      onClose();
    } catch (err) {
      console.error("Save ntfy error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestAlert = async () => {
    setTestSent(true);
    try {
      const apiBase =
        window.location.port === "8000"
          ? `${window.location.origin}/api`
          : `http://${window.location.hostname || "127.0.0.1"}:8000/api`;
      await fetch(`${apiBase}/ntfy/test`, { method: "POST" });
    } catch (e) {}
    setTimeout(() => setTestSent(false), 2000);
  };

  const subscribeUrl = `${serverUrl.replace(/\/+$/, "")}/${topic}`;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.75)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div
          className="modal-content text-light border-0"
          style={{
            background: "rgba(13, 19, 34, 0.98)",
            border: "1px solid rgba(0, 242, 254, 0.25)",
            borderRadius: "18px",
            backdropFilter: "blur(24px)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.7)"
          }}
        >
          {/* Header */}
          <div className="modal-header border-bottom border-secondary border-opacity-25 px-4 py-3">
            <div className="d-flex align-items-center gap-2">
              <div
                className="p-2 rounded-3"
                style={{
                  background: "rgba(0, 242, 254, 0.12)",
                  color: "#00f2fe",
                  border: "1px solid rgba(0, 242, 254, 0.3)"
                }}
              >
                <i className="ph-bold ph-device-mobile fs-4"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0 text-white">Mobile Emergency Push Gateway</h5>
                <small className="text-muted">Sub-Second Dispatch to Field Supervisors (ntfy.sh)</small>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSave}>
            <div className="modal-body px-4 py-3">
              {/* Subscribe Notice */}
              <div
                className="p-3 mb-3 rounded"
                style={{ background: "rgba(0, 242, 254, 0.05)", border: "1px solid rgba(0, 242, 254, 0.15)" }}
              >
                <div className="d-flex align-items-center gap-2 mb-1">
                  <i className="ph-fill ph-broadcast text-info"></i>
                  <span className="fw-semibold text-white small">Zero-Configuration Mobile Sync</span>
                </div>
                <p className="text-muted small mb-2" style={{ fontSize: "0.74rem" }}>
                  Install the free <strong>ntfy app</strong> on iOS or Android, or open in any mobile browser to receive instant high-priority hazard push alerts.
                </p>
                <a
                  href={subscribeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-outline-info rounded-pill px-3 py-1"
                  style={{ fontSize: "0.72rem" }}
                >
                  <i className="ph-bold ph-arrow-square-out me-1"></i> Open Channel: {topic}
                </a>
              </div>

              {/* Topic Config */}
              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold text-uppercase mb-1">
                  Alert Channel Topic
                </label>
                <input
                  type="text"
                  className="form-control bg-dark text-white border-secondary"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="minesentinel-alerts-2026"
                  required
                />
              </div>

              {/* Notification Toggles */}
              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold text-uppercase mb-2">
                  Dispatch Triggers
                </label>
                <div className="d-flex flex-column gap-2">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="critSwitch"
                      checked={notifyCrit}
                      onChange={(e) => setNotifyCrit(e.target.checked)}
                    />
                    <label className="form-check-label text-light small" htmlFor="critSwitch">
                      Critical Hazards &amp; Fire Alerts (High Priority Alarm)
                    </label>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="warnSwitch"
                      checked={notifyWarn}
                      onChange={(e) => setNotifyWarn(e.target.checked)}
                    />
                    <label className="form-check-label text-light small" htmlFor="warnSwitch">
                      Warning Drifts (Elevated Gas / Climate Deviation)
                    </label>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="recovSwitch"
                      checked={notifyRecov}
                      onChange={(e) => setNotifyRecov(e.target.checked)}
                    />
                    <label className="form-check-label text-light small" htmlFor="recovSwitch">
                      Recovery Notices (Atmosphere Restored to Nominal)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer border-top border-secondary border-opacity-25 px-4 py-3 justify-content-between">
              <button
                type="button"
                className="btn btn-outline-warning btn-sm rounded-pill px-3"
                onClick={handleTestAlert}
                disabled={testSent}
              >
                <i className={`ph-bold ${testSent ? "ph-check text-success" : "ph-paper-plane-right"} me-1`}></i>
                {testSent ? "Dispatched!" : "Send Test Push"}
              </button>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-dark-pill btn-sm px-3" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary-gradient btn-sm px-4 fw-bold"
                  disabled={isSaving}
                >
                  <i className="ph-bold ph-floppy-disk me-1"></i>
                  {isSaving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
