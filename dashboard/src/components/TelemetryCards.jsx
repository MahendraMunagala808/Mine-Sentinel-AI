import React, { useState, useEffect } from "react";

export default function TelemetryCards() {
  const [telemetry, setTelemetry] = useState({
    gas: 12.4,
    co: 4.2,
    temperature: 24.5,
    humidity: 58.0,
    flame: 0,
    risk_label: "Safe",
    risk_code: 0,
    timestamp: new Date().toISOString()
  });

  const fetchTelemetry = async () => {
    try {
      const apiBase = window.location.port === "8000" ? `${window.location.origin}/api` : `http://${window.location.hostname || "127.0.0.1"}:8000/api`;
      const res = await fetch(`${apiBase}/telemetry/latest`);
      if (res.ok) {
        const data = await res.json();
        if (data) setTelemetry(data);
      }
    } catch (err) {
      console.debug("Telemetry sync standby:", err);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 2500);
    return () => clearInterval(interval);
  }, []);

  const isWarning = telemetry.risk_label === "Warning";
  const isCritical = telemetry.risk_label === "Critical" || telemetry.flame === 1;

  const riskBadgeClass = isCritical
    ? "bg-danger-subtle text-danger border border-danger-subtle"
    : isWarning
    ? "bg-warning-subtle text-warning border border-warning-subtle"
    : "bg-success-subtle text-success border border-success-subtle";

  return (
    <div className="telemetry-cards-react">
      <div className="row g-3">
        {/* MQ-2 Gas */}
        <div className="col-lg-3 col-6">
          <div className="metric-box p-3 rounded" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted-light small">Combustible Gas (MQ-2)</span>
              <i className="ph-fill ph-wind text-warning"></i>
            </div>
            <div className="d-flex align-items-baseline gap-1">
              <h3 className="fw-bold text-white mb-0">{(telemetry.gas || 0).toFixed(1)}</h3>
              <small className="text-muted">ppm</small>
            </div>
          </div>
        </div>

        {/* MQ-7 Carbon Monoxide */}
        <div className="col-lg-3 col-6">
          <div className="metric-box p-3 rounded" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted-light small">Carbon Monoxide (MQ-7)</span>
              <i className="ph-fill ph-skull text-danger"></i>
            </div>
            <div className="d-flex align-items-baseline gap-1">
              <h3 className="fw-bold text-white mb-0">{(telemetry.co || 0).toFixed(1)}</h3>
              <small className="text-muted">ppm</small>
            </div>
          </div>
        </div>

        {/* Climate (Temp & Humidity) */}
        <div className="col-lg-3 col-6">
          <div className="metric-box p-3 rounded" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted-light small">Climate (DHT11)</span>
              <i className="ph-fill ph-thermometer-simple text-info"></i>
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <h3 className="fw-bold text-white mb-0">{(telemetry.temperature || 0).toFixed(1)}°C</h3>
              <span className="text-muted small">| {(telemetry.humidity || 0).toFixed(0)}% RH</span>
            </div>
          </div>
        </div>

        {/* Optical Flame IR */}
        <div className="col-lg-3 col-6">
          <div className="metric-box p-3 rounded" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted-light small">Fire Detection</span>
              <i className="ph-fill ph-fire text-danger"></i>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className={`badge ${telemetry.flame === 1 ? "bg-danger text-white" : "bg-success-subtle text-success"}`}>
                {telemetry.flame === 1 ? "FLAME DETECTED" : "NORMAL"}
              </span>
              <span className={`badge ${riskBadgeClass}`} style={{ fontSize: "0.7rem" }}>
                AI: {telemetry.risk_label || "Safe"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
