import React, { useState, useEffect } from "react";
import AlertCenter from "./AlertCenter";

export default function HeroHeader({ onOpenShiftAudit }) {
  const [stationRisk, setStationRisk] = useState("Safe");
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const fetchLatestRisk = async () => {
      try {
        const apiBase =
          window.location.port === "8000"
            ? `${window.location.origin}/api`
            : `http://${window.location.hostname || "127.0.0.1"}:8000/api`;
        const res = await fetch(`${apiBase}/telemetry/latest`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.risk_label) setStationRisk(data.risk_label);
        }
      } catch (e) {}
    };

    fetchLatestRisk();
    const interval = setInterval(fetchLatestRisk, 3000);
    return () => clearInterval(interval);
  }, []);

  const isCrit = stationRisk === "Critical";
  const isWarn = stationRisk === "Warning";

  return (
    <header className="navbar navbar-expand-lg border-bottom border-secondary border-opacity-25 px-4 py-2">
      <div className="container-fluid px-0 d-flex justify-content-between align-items-center">
        {/* Brand & Sector Breadcrumb */}
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <i className="ph-fill ph-shield-check text-info fs-3"></i>
            <div>
              <h5 className="fw-bold text-white mb-0" style={{ letterSpacing: "-0.5px" }}>
                MineSentinel <span className="text-info">AI</span>
              </h5>
              <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                Underground Command Hub &bull; Sector: Level -100m Main Adit
              </small>
            </div>
          </div>

          <span
            className={`badge px-3 py-1 rounded-pill ${
              isCrit
                ? "bg-danger text-white animate-pulse"
                : isWarn
                ? "bg-warning text-dark"
                : "bg-success-subtle text-success border border-success-subtle"
            }`}
            style={{ fontSize: "0.7rem", fontWeight: 700 }}
          >
            {isCrit ? "CRITICAL HAZARD" : isWarn ? "WARNING DRIFT" : "SYSTEM NOMINAL"}
          </span>
        </div>

        {/* Action Controls */}
        <div className="d-flex align-items-center gap-2">
          {/* React Alert Center */}
          <AlertCenter />

          {/* Shift Audit Modal Trigger */}
          <button
            className="btn btn-outline-warning btn-sm rounded-pill fw-semibold px-3 d-flex align-items-center"
            onClick={onOpenShiftAudit}
            title="Export DGMS / MSHA Statutory Shift Safety Audit PDF"
          >
            <i className="ph-bold ph-file-pdf me-1 text-warning"></i> Shift Audit (PDF)
          </button>

          {/* Audio Siren Mute Toggle */}
          <button
            className={`btn btn-sm rounded-pill fw-bold px-3 d-flex align-items-center ${
              isMuted ? "btn-secondary" : "btn-outline-danger"
            }`}
            onClick={() => setIsMuted(!isMuted)}
            title="Toggle Alarm Siren Audio"
          >
            <i className={`ph-bold ${isMuted ? "ph-speaker-slash" : "ph-speaker-high"} me-1`}></i>
            {isMuted ? "Muted" : "Mute"}
          </button>
        </div>
      </div>
    </header>
  );
}
