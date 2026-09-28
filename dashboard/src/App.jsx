import React, { useState } from "react";
import HeroHeader from "./components/HeroHeader";
import TelemetryCards from "./components/TelemetryCards";
import FleetNodesGrid from "./components/FleetNodesGrid";
import ShiftAuditModal from "./components/ShiftAuditModal";
import CopilotChat from "./components/CopilotChat";

export default function App() {
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  return (
    <div className="minesentinel-react-suite">
      {/* 1. Command Header & Alert Center Ribbon */}
      <HeroHeader onOpenShiftAudit={() => setIsAuditModalOpen(true)} />

      <main className="container-fluid px-4 py-3">
        {/* 2. Real-Time Telemetry Gauges Matrix */}
        <section className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h6 className="text-uppercase text-muted-light fw-bold small mb-0">
              Live Sensor Telemetry Matrix
            </h6>
            <span className="badge bg-secondary-subtle text-muted" style={{ fontSize: "0.68rem" }}>
              FastAPI + ML Interception
            </span>
          </div>
          <TelemetryCards />
        </section>

        {/* 3. Multi-Node Subterranean Fleet Diagnostic Grid */}
        <section className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h6 className="text-uppercase text-muted-light fw-bold small mb-0">
              Underground Fleet Diagnostics &amp; Spatial Nodes
            </h6>
            <span className="badge bg-info-subtle text-info border border-info-subtle" style={{ fontSize: "0.68rem" }}>
              React 18 State
            </span>
          </div>
          <FleetNodesGrid />
        </section>
      </main>

      {/* 4. Statutory Shift Safety Audit Modal */}
      <ShiftAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      {/* 5. Real-Time AI Safety Copilot Assistant */}
      <CopilotChat />
    </div>
  );
}
