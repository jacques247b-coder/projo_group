// ============================================================
// PROJO GROUP — Base Map Component
// Leaflet + OpenStreetMap dark theme, centered on Rustenburg
// No API key required
// ============================================================

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RUSTENBURG, DARK_TILE_URL, DARK_ATTRIBUTION } from "../../services/maps";

// Fix Leaflet default icon paths (broken in Webpack/CRA by default)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Custom gold marker for PROJO GROUP ──────────────────────
export const goldIcon = new L.DivIcon({
  html: `<div style="
    width:20px;height:20px;
    background:radial-gradient(circle at 35% 35%,#f5d078,#e8b84b,#c49a2f);
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    border:2px solid #c49a2f;
    box-shadow:0 2px 8px rgba(232,184,75,0.5);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 20],
  popupAnchor: [0, -20],
  className: "",
});

export const pickupIcon = new L.DivIcon({
  html: `<div style="
    width:16px;height:16px;
    background:#4ade80;
    border-radius:50%;
    border:3px solid #166534;
    box-shadow:0 0 0 4px rgba(74,222,128,0.2);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  className: "",
});

export const dropoffIcon = new L.DivIcon({
  html: `<div style="
    width:16px;height:16px;
    background:#f87171;
    border-radius:50%;
    border:3px solid #991b1b;
    box-shadow:0 0 0 4px rgba(248,113,113,0.2);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  className: "",
});

export const driverIcon = new L.DivIcon({
  html: `<div style="
    background:#e8b84b;
    border-radius:50%;
    width:36px;height:36px;
    display:flex;align-items:center;justify-content:center;
    font-size:18px;
    border:3px solid #c49a2f;
    box-shadow:0 0 12px rgba(232,184,75,0.6);
  ">🚗</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  className: "",
});

// ── Re-center map helper ─────────────────────────────────────
function SetView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom || map.getZoom());
  }, [center, zoom, map]);
  return null;
}

/**
 * ProjoMap — main reusable map component
 *
 * Props:
 *   center       {lat, lng}   — defaults to Rustenburg
 *   zoom         number       — default 13
 *   height       string       — CSS height, default "400px"
 *   pickup       {lat, lng, label}
 *   dropoff      {lat, lng, label}
 *   driverPos    {lat, lng}
 *   routePoints  [[lat,lng]]  — array for drawing route line
 *   markers      [{lat, lng, label, icon}]
 *   onClick      fn(lat, lng) — called when map clicked
 */
export default function ProjoMap({
  center,
  zoom = RUSTENBURG.zoom,
  height = "400px",
  pickup,
  dropoff,
  driverPos,
  routePoints,
  markers = [],
  onClick,
  children,
}) {
  const mapCenter = center
    ? [center.lat, center.lng]
    : [RUSTENBURG.lat, RUSTENBURG.lng];

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      style={{ height, width: "100%", borderRadius: "12px", zIndex: 1 }}
      onClick={onClick ? (e) => onClick(e.latlng.lat, e.latlng.lng) : undefined}
    >
      {/* Dark premium tile layer — fits PROJO GROUP dark theme */}
      <TileLayer url={DARK_TILE_URL} attribution={DARK_ATTRIBUTION} />

      {center && <SetView center={mapCenter} zoom={zoom} />}

      {/* Pickup marker */}
      {pickup && (
        <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
          <Popup>
            <strong style={{ color: "#166534" }}>📍 Pickup</strong>
            <br />{pickup.label || "Pickup location"}
          </Popup>
        </Marker>
      )}

      {/* Dropoff marker */}
      {dropoff && (
        <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon}>
          <Popup>
            <strong style={{ color: "#991b1b" }}>🏁 Dropoff</strong>
            <br />{dropoff.label || "Dropoff location"}
          </Popup>
        </Marker>
      )}

      {/* Driver marker */}
      {driverPos && (
        <Marker position={[driverPos.lat, driverPos.lng]} icon={driverIcon}>
          <Popup>
            <strong style={{ color: "#e8b84b" }}>🚗 Your Driver</strong>
            <br />On the way to you
          </Popup>
        </Marker>
      )}

      {/* Route line (gold) */}
      {routePoints && routePoints.length > 1 && (
        <Polyline
          positions={routePoints}
          pathOptions={{ color: "#e8b84b", weight: 4, opacity: 0.8 }}
        />
      )}

      {/* Extra markers */}
      {markers.map((m, i) => (
        <Marker
          key={i}
          position={[m.lat, m.lng]}
          icon={m.icon || goldIcon}
        >
          {m.label && (
            <Popup>{m.label}</Popup>
          )}
        </Marker>
      ))}

      {children}
    </MapContainer>
  );
}
