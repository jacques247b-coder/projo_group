// ============================================================
// PROJO GROUP — ProjoMap (Driver Dashboard Map)
// Leaflet + OpenStreetMap — shows driver pos, pickup, dropoff
// ============================================================
import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { RUSTENBURG_CENTER, DEFAULT_MAP_ZOOM } from "../../utils/constants";

// Custom icons
function makeIcon(emoji, size = 36) {
  return L.divIcon({
    className: "",
    html: `<div style="font-size:${size}px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

const ICONS = {
  driver:  makeIcon("🚗", 36),
  pickup:  makeIcon("📍", 34),
  dropoff: makeIcon("🏁", 34),
};

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(L.latLngBounds(positions), { padding: [48, 48] });
    } else if (positions.length === 1) {
      map.setView(positions[0], DEFAULT_MAP_ZOOM);
    }
  }, [positions.map(p => p.join(",")).join("|")]);
  return null;
}

export default function ProjoMap({ height = "400px", driverPos, pickup, dropoff }) {
  const center = driverPos
    ? [driverPos.lat, driverPos.lng]
    : [RUSTENBURG_CENTER.lat, RUSTENBURG_CENTER.lng];

  const allPositions = [
    driverPos  ? [driverPos.lat,  driverPos.lng]  : null,
    pickup     ? [pickup.lat,     pickup.lng]      : null,
    dropoff    ? [dropoff.lat,    dropoff.lng]     : null,
  ].filter(Boolean);

  // Route line: driver → pickup, or pickup → dropoff
  const routeLine = driverPos && pickup
    ? [[driverPos.lat, driverPos.lng], [pickup.lat, pickup.lng]]
    : pickup && dropoff
    ? [[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]
    : null;

  return (
    <div style={{
      height, width: "100%", borderRadius: "16px", overflow: "hidden",
      border: "1px solid rgba(232,184,75,0.2)",
    }}>
      <MapContainer
        center={center}
        zoom={DEFAULT_MAP_ZOOM}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        zoomControl={true}>

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {allPositions.length > 0 && <FitBounds positions={allPositions} />}

        {/* Driver pin */}
        {driverPos && (
          <Marker position={[driverPos.lat, driverPos.lng]} icon={ICONS.driver}>
            <Popup><strong>🚗 You</strong></Popup>
          </Marker>
        )}

        {/* Pickup pin */}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={ICONS.pickup}>
            <Popup><strong>📍 Pickup point</strong></Popup>
          </Marker>
        )}

        {/* Dropoff pin */}
        {dropoff && (
          <Marker position={[dropoff.lat, dropoff.lng]} icon={ICONS.dropoff}>
            <Popup><strong>🏁 Dropoff point</strong></Popup>
          </Marker>
        )}

        {/* Route line */}
        {routeLine && (
          <Polyline
            positions={routeLine}
            pathOptions={{ color: "#e8b84b", weight: 3, opacity: 0.7, dashArray: "8 4" }}
          />
        )}
      </MapContainer>
    </div>
  );
}
