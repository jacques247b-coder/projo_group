// ============================================================
// PROJO GROUP — Admin Live Driver Map
// See all online drivers on Rustenburg map in real time
// Leaflet + Socket.io — no API key required
// ============================================================

import React, { useEffect, useState } from "react";
import { Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import ProjoMap from "./ProjoMap";
import { RUSTENBURG, RUSTENBURG_AREAS } from "../../services/maps";

// Driver status colours
const STATUS_COLORS = {
  ONLINE: "#4ade80",
  ON_RIDE: "#e8b84b",
  ON_DELIVERY: "#60a5fa",
  OFFLINE: "#6b6760",
};

function makeDriverIcon(status) {
  const color = STATUS_COLORS[status] || "#6b6760";
  return new L.DivIcon({
    html: `<div style="
      background:${color};border-radius:50%;
      width:32px;height:32px;
      display:flex;align-items:center;justify-content:center;
      font-size:15px;border:3px solid #0a0a0a;
      box-shadow:0 0 8px ${color}88;
    ">🚗</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    className: "",
  });
}

/**
 * AdminLiveMap — admin dashboard live driver overview
 * Props:
 *   socket — Socket.io instance (admin must be authenticated)
 */
export default function AdminLiveMap({ socket }) {
  const [drivers, setDrivers] = useState([]);
  const [stats, setStats] = useState({ online: 0, onRide: 0, offline: 0 });

  useEffect(() => {
    if (!socket) return;

    // Join admin live map room
    socket.emit("admin:join_live_map");

    // Receive all current driver positions
    socket.on("admin:all_drivers", ({ drivers: d }) => {
      setDrivers(d);
      updateStats(d);
    });

    // Live location updates
    socket.on("driver:location", ({ driverId, lat, lng }) => {
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === driverId
            ? { ...d, latitude: lat, longitude: lng }
            : d
        )
      );
    });

    return () => {
      socket.off("admin:all_drivers");
      socket.off("driver:location");
    };
  }, [socket]);

  function updateStats(driverList) {
    setStats({
      online: driverList.filter((d) => d.status === "ONLINE").length,
      onRide: driverList.filter((d) => d.status === "ON_RIDE").length,
      offline: driverList.filter((d) => d.status === "OFFLINE").length,
    });
  }

  return (
    <div>
      {/* Stats strip */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px",
        marginBottom: "12px",
      }}>
        {[
          { label: "Online", count: stats.online, color: "#4ade80" },
          { label: "On Ride", count: stats.onRide, color: "#e8b84b" },
          { label: "Offline", count: stats.offline, color: "#6b6760" },
        ].map((s) => (
          <div key={s.label} style={{
            background: "#1a1a1a", border: `1px solid ${s.color}33`,
            borderRadius: "10px", padding: "12px", textAlign: "center",
          }}>
            <div style={{ fontSize: "1.5rem", fontWeight: "800", color: s.color,
              fontFamily: "'Syne', sans-serif" }}>{s.count}</div>
            <div style={{ fontSize: "11px", color: "#6b6760", fontWeight: "700",
              textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Map */}
      <ProjoMap
        center={{ lat: RUSTENBURG.lat, lng: RUSTENBURG.lng }}
        zoom={12}
        height="500px"
      >
        {/* Rustenburg service zone circle */}
        <Circle
          center={[RUSTENBURG.lat, RUSTENBURG.lng]}
          radius={8000}
          pathOptions={{
            color: "#e8b84b", fillColor: "#e8b84b",
            fillOpacity: 0.04, weight: 1, dashArray: "6 6",
          }}
        />

        {/* Area labels */}
        {RUSTENBURG_AREAS.filter(a => a.zone === 1).map((area) => (
          <Marker
            key={area.name}
            position={[area.lat, area.lng]}
            icon={new L.DivIcon({
              html: `<div style="
                background:rgba(26,26,26,0.85);
                border:1px solid rgba(232,184,75,0.2);
                color:#a8a49e;font-size:9px;font-weight:700;
                padding:2px 6px;border-radius:4px;
                white-space:nowrap;letter-spacing:0.3px;
              ">${area.name}</div>`,
              className: "",
              iconAnchor: [40, 10],
            })}
          >
            <Popup>{area.name} — Zone 1 (R60 flat)</Popup>
          </Marker>
        ))}

        {/* Live driver markers */}
        {drivers
          .filter((d) => d.latitude && d.longitude)
          .map((driver) => (
            <Marker
              key={driver.id}
              position={[driver.latitude, driver.longitude]}
              icon={makeDriverIcon(driver.status)}
            >
              <Popup>
                <strong style={{ color: "#e8b84b" }}>{driver.user?.name}</strong>
                <br />
                Status: <span style={{ color: STATUS_COLORS[driver.status] }}>
                  {driver.status}
                </span>
                <br />
                {driver.latitude?.toFixed(4)}, {driver.longitude?.toFixed(4)}
              </Popup>
            </Marker>
          ))}
      </ProjoMap>

      {/* Legend */}
      <div style={{
        marginTop: "10px", display: "flex", gap: "16px", flexWrap: "wrap",
      }}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }} />
            <span style={{ fontSize: "11px", color: "#a8a49e", fontWeight: "600" }}>
              {status.replace("_", " ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
