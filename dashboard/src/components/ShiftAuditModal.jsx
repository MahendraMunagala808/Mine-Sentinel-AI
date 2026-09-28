import React, { useState } from "react";

export default function ShiftAuditModal({ isOpen, onClose }) {
  const [selectedMetric, setSelectedMetric] = useState("all");
  const [selectedTime, setSelectedTime] = useState("8h");
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const metrics = [
    { id: "all", label: "All 5 Sensors", sub: "Full environmental profile", icon: "ph-chart-line-up text-info" },
    { id: "gas", label: "Methane (CH4)", sub: "Limit: < 0.75% (7500 ppm)", icon: "ph-wind text-danger" },
    { id: "co", label: "Carbon Monoxide", sub: "Spontaneous heating trace", icon: "ph-warning text-warning" },
    { id: "temp", label: "Temperature (°C)", sub: "Ventilation ceiling 38°C", icon: "ph-thermometer-simple text-primary" },
    { id: "hum", label: "Relative Humidity", sub: "Optimal range: 40-70% RH", icon: "ph-drop text-info" },
    { id: "flame", label: "Optical Flame IR", sub: "Instant trigger cutoff", icon: "ph-fire text-danger" }
  ];

  const timeSlices = [
    { id: "1h", label: "Last 1 Hour", sub: "Immediate shift trend" },
    { id: "8h", label: "Active 8-Hour Shift", sub: "Standard DGMS Form IV" },
    { id: "24h", label: "24-Hour Cycle", sub: "Full diurnal profile" },
    { id: "all", label: "Full Database", sub: "Entire logging history" }
  ];

  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      const apiBase =
        window.location.port === "8000"
          ? `${window.location.origin}/api`
          : `http://${window.location.hostname || "127.0.0.1"}:8000/api`;

      if (format === "csv") {
        window.location.href = `${apiBase}/export/csv?metric=${selectedMetric}&time=${selectedTime}`;
      } else if (format === "pdf") {
        window.open(`${apiBase}/export/pdf?time=${selectedTime}`, "_blank");
      }
    } catch (e) {
      console.error("Export error:", e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
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
            <div className="d-flex align-items-center gap-3">
              <div
                className="p-2 rounded-3"
                style={{
                  background: "rgba(0, 242, 254, 0.12)",
                  color: "#00f2fe",
                  border: "1px solid rgba(0, 242, 254, 0.3)"
                }}
              >
                <i className="ph-bold ph-file-pdf fs-4"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0 text-white">
                  Telemetry Export &amp; Safety Audit Studio
                </h5>
                <small className="text-muted">
                  Statutory Reports &bull; Specific Sensor Curves &bull; Custom Time Slicing
                </small>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body px-4 py-3">
            {/* Step 1: Metric Selection */}
            <div className="mb-4">
              <label className="form-label text-muted small fw-bold text-uppercase d-flex align-items-center gap-2 mb-2">
                <span
                  className="badge rounded-circle bg-info text-dark"
                  style={{ width: "20px", height: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem" }}
                >
                  1
                </span>
                <span>Select Target Sensor / Metric</span>
              </label>
              <div className="row g-2">
                {metrics.map((m) => (
                  <div key={m.id} className="col-md-4 col-6">
                    <div
                      className={`studio-metric-card ${selectedMetric === m.id ? "selected" : ""}`}
                      onClick={() => setSelectedMetric(m.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <i className={`ph-bold ${m.icon} fs-5`}></i>
                        <span className="fw-bold text-white small">{m.label}</span>
                      </div>
                      <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                        {m.sub}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Time Slice */}
            <div className="mb-4">
              <label className="form-label text-muted small fw-bold text-uppercase d-flex align-items-center gap-2 mb-2">
                <span
                  className="badge rounded-circle bg-info text-dark"
                  style={{ width: "20px", height: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem" }}
                >
                  2
                </span>
                <span>Select Time Slice Window</span>
              </label>
              <div className="row g-2">
                {timeSlices.map((t) => (
                  <div key={t.id} className="col-md-3 col-6">
                    <div
                      className={`studio-time-card ${selectedTime === t.id ? "selected" : ""}`}
                      onClick={() => setSelectedTime(t.id)}
                      style={{
                        padding: "10px",
                        borderRadius: "10px",
                        border: selectedTime === t.id ? "1px solid #00f2fe" : "1px solid rgba(255,255,255,0.08)",
                        background: selectedTime === t.id ? "rgba(0, 242, 254, 0.08)" : "rgba(255,255,255,0.02)",
                        cursor: "pointer"
                      }}
                    >
                      <div className="fw-semibold text-white small">{t.label}</div>
                      <small className="text-muted" style={{ fontSize: "0.68rem" }}>
                        {t.sub}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Statutory Summary */}
            <div
              className="p-3 rounded mb-2"
              style={{
                background: "rgba(0, 242, 254, 0.04)",
                border: "1px solid rgba(0, 242, 254, 0.15)"
              }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small d-block">Statutory Compliance Standard:</span>
                  <span className="fw-semibold text-white small">
                    DGMS Coal Mines Reg. 153/154 &bull; MSHA 30 CFR &sect; 75.360
                  </span>
                </div>
                <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                  OFFICIAL FORM IV READY
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer border-top border-secondary border-opacity-25 px-4 py-3 justify-content-between">
            <button type="button" className="btn btn-dark-pill btn-sm px-4" onClick={onClose}>
              Cancel
            </button>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-success btn-sm rounded-pill px-3"
                onClick={() => handleExport("csv")}
                disabled={isExporting}
              >
                <i className="ph-bold ph-file-csv text-success me-1"></i> Export CSV
              </button>
              <button
                type="button"
                className="btn btn-primary-gradient btn-sm rounded-pill px-4 fw-bold"
                onClick={() => handleExport("pdf")}
                disabled={isExporting}
              >
                <i className="ph-bold ph-file-pdf me-1"></i> Generate Shift Audit PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
