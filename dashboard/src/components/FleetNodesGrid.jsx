import React, { useState, useEffect } from "react";

export default function FleetNodesGrid() {
  const [fleetData, setFleetData] = useState({
    total_nodes: 4,
    online_nodes: 4,
    avg_battery_pct: 88.5,
    avg_rssi_dbm: -68,
    fleet_packet_drop_pct: 0.2,
    devices: [
      {
        device_id: "ESP32_NODE_01",
        sector_name: "Level -100m Main Adit",
        level: "Level -100m",
        battery_level: 96.5,
        rssi_dbm: -58,
        firmware_ver: "v2.4.1-ADC16",
        packet_drop_pct: 0.1,
        is_active: true,
        last_seen: new Date().toISOString()
      },
      {
        device_id: "ESP32_NODE_02",
        sector_name: "Level -250m Deep Face",
        level: "Level -250m",
        battery_level: 88.0,
        rssi_dbm: -72,
        firmware_ver: "v2.4.1-ADC16",
        packet_drop_pct: 0.3,
        is_active: true,
        last_seen: new Date().toISOString()
      },
      {
        device_id: "ESP32_NODE_03",
        sector_name: "Level -400m Ventilation Trunk",
        level: "Level -400m",
        battery_level: 92.5,
        rssi_dbm: -65,
        firmware_ver: "v2.4.1-ADC16",
        packet_drop_pct: 0.2,
        is_active: true,
        last_seen: new Date().toISOString()
      },
      {
        device_id: "ESP32_NODE_04",
        sector_name: "Sub-Shaft 03 Extraction Zone",
        level: "Level -300m",
        battery_level: 79.0,
        rssi_dbm: -78,
        firmware_ver: "v2.4.1-ADC16",
        packet_drop_pct: 0.4,
        is_active: true,
        last_seen: new Date().toISOString()
      }
    ]
  });

  const [pingingId, setPingingId] = useState(null);
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());

  const fetchDevices = async () => {
    try {
      const apiBase = window.location.port === "8000" ? `${window.location.origin}/api` : `http://${window.location.hostname || "127.0.0.1"}:8000/api`;
      const res = await fetch(`${apiBase}/devices`);
      if (res.ok) {
        const data = await res.json();
        setFleetData(data);
        setLastSync(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.debug("Fleet auto-sync standby:", err);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 4000);
    return () => clearInterval(interval);
  }, []);

  const handlePing = (deviceId) => {
    setPingingId(deviceId);
    setTimeout(() => {
      setPingingId(null);
    }, 1200);
  };

  return (
    <div className="fleet-grid-react-wrapper">
      {/* Fleet KPI Overview Strip */}
      <div className="row g-3 mb-4">
        <div className="col-md-2 col-6">
          <div className="kpi-mini-card p-3 rounded" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-muted-light small d-block">Fleet Size</span>
            <h4 className="fw-bold text-white mb-0" id="fleet-total-nodes">{fleetData.total_nodes}</h4>
          </div>
        </div>
        <div className="col-md-2 col-6">
          <div className="kpi-mini-card p-3 rounded" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-muted-light small d-block">Online Status</span>
            <h4 className="fw-bold text-success mb-0" id="fleet-online-nodes">{fleetData.online_nodes} / {fleetData.total_nodes}</h4>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="kpi-mini-card p-3 rounded" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-muted-light small d-block">Fleet Avg Battery</span>
            <h4 className="fw-bold text-white mb-0" id="fleet-avg-battery">{fleetData.avg_battery_pct}%</h4>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="kpi-mini-card p-3 rounded" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-muted-light small d-block">Telemetry Signal</span>
            <h4 className="fw-bold text-info mb-0" id="fleet-avg-rssi">{fleetData.avg_rssi_dbm} dBm</h4>
          </div>
        </div>
        <div className="col-md-2 col-6">
          <div className="kpi-mini-card p-3 rounded" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-muted-light small d-block">Packet Drop</span>
            <h4 className="fw-bold text-white mb-0" id="fleet-avg-drop">{fleetData.fleet_packet_drop_pct}%</h4>
          </div>
        </div>
      </div>

      {/* Fleet Nodes Card Grid */}
      <div className="row g-3" id="fleet-nodes-container">
        {fleetData.devices &&
          fleetData.devices.map((dev) => {
            const battery = dev.battery_level || 90.0;
            let battColor = "#00e676";
            if (battery < 35) battColor = "#ea4335";
            else if (battery < 70) battColor = "#fbbc04";

            const isOnline = !!dev.is_active;
            const rssi = dev.rssi_dbm || -65;
            const activeBars = isOnline
              ? rssi > -60
                ? 4
                : rssi > -72
                ? 3
                : rssi > -85
                ? 2
                : 1
              : 0;
            const signalColorClass =
              activeBars >= 3 ? "active-signal" : activeBars === 2 ? "active-signal-fair" : "active-signal";

            return (
              <div key={dev.device_id} className="col-xl-4 col-md-6">
                <div className="fleet-node-card">
                  <div>
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <h5 className="fw-bold text-white mb-0" style={{ fontSize: "1rem" }}>
                            {dev.device_id}
                          </h5>
                          <span
                            className={`badge ${
                              isOnline
                                ? "bg-success-subtle text-success border border-success-subtle"
                                : "bg-danger-subtle text-danger border border-danger-subtle"
                            }`}
                            style={{ fontSize: "0.65rem" }}
                          >
                            {isOnline ? "ONLINE" : "OFFLINE"}
                          </span>
                        </div>
                        <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                          <i className="ph-bold ph-map-pin me-1 text-info"></i>
                          {dev.sector_name || dev.location} ({dev.level || "Shaft"})
                        </small>
                      </div>

                      {/* RSSI Signal Bars */}
                      <div className="text-end" title={`Signal Strength: ${rssi} dBm`}>
                        <div className="rssi-bars-container justify-content-end mb-1">
                          <span className={`rssi-bar bar-1 ${activeBars >= 1 ? signalColorClass : ""}`}></span>
                          <span className={`rssi-bar bar-2 ${activeBars >= 2 ? signalColorClass : ""}`}></span>
                          <span className={`rssi-bar bar-3 ${activeBars >= 3 ? signalColorClass : ""}`}></span>
                          <span className={`rssi-bar bar-4 ${activeBars >= 4 ? signalColorClass : ""}`}></span>
                        </div>
                        <small className="text-muted-light" style={{ fontSize: "0.65rem" }}>
                          {isOnline ? `${rssi} dBm` : "No Signal"}
                        </small>
                      </div>
                    </div>

                    {/* Battery Gauge */}
                    <div
                      className="mb-3 p-2 rounded"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)"
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="text-muted-light" style={{ fontSize: "0.7rem" }}>
                          <i className="ph-bold ph-battery-charging me-1" style={{ color: battColor }}></i>
                          Battery Reserve
                        </span>
                        <span className="fw-bold text-white" style={{ fontSize: "0.75rem" }}>
                          {battery.toFixed(1)}%
                        </span>
                      </div>
                      <div className="node-battery-bar">
                        <div
                          className="node-battery-fill"
                          style={{
                            width: `${Math.min(100, Math.max(5, battery))}%`,
                            background: battColor
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Specs Grid */}
                    <div className="row g-2 mb-3 text-start">
                      <div className="col-6">
                        <div
                          className="p-2 rounded"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)"
                          }}
                        >
                          <div className="text-muted-light" style={{ fontSize: "0.65rem" }}>
                            Firmware
                          </div>
                          <div
                            className="fw-semibold text-light text-truncate"
                            style={{ fontSize: "0.72rem" }}
                            title={dev.firmware_ver}
                          >
                            {dev.firmware_ver || "v2.4.1"}
                          </div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div
                          className="p-2 rounded"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)"
                          }}
                        >
                          <div className="text-muted-light" style={{ fontSize: "0.65rem" }}>
                            Packet Loss
                          </div>
                          <div className="fw-semibold text-light" style={{ fontSize: "0.72rem" }}>
                            {dev.packet_drop_pct || 0.2}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Action */}
                  <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary-subtle">
                    <small className="text-muted" style={{ fontSize: "0.68rem" }}>
                      <i className="ph-bold ph-clock me-1"></i>Heartbeat: Active
                    </small>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-info rounded-pill px-3 py-1 fw-semibold"
                      id={`btn-ping-${dev.device_id}`}
                      onClick={() => handlePing(dev.device_id)}
                      style={{ fontSize: "0.7rem" }}
                    >
                      <i className={`ph-bold ${pingingId === dev.device_id ? "ph-spinner ph-spin" : "ph-pulse"} me-1`}></i>
                      {pingingId === dev.device_id ? "Pinging..." : "Ping Node"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      <div className="text-end mt-2">
        <small className="text-muted" id="fleet-last-sync" style={{ fontSize: "0.7rem" }}>
          React Diagnostic Sync: {lastSync}
        </small>
      </div>
    </div>
  );
}
