// ============================================================
// PROJO GROUP — Live Tracking Map
// Leaflet + OpenStreetMap (FREE — no API key needed)
// Shows: pickup pin, dropoff pin, driver location (live)
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { RUSTENBURG_CENTER, DEFAULT_MAP_ZOOM } from "../../utils/constants";

// ─── Custom map icons ─────────────────────────────────────────
function makeIcon(emoji, size = 36) {
  return L.divIcon({
    className: "",
    html: `<div style="
      font-size:${size}px;
      line-height:1;
      filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));
    ">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

const ICONS = {
  pickup:  makeIcon("📍", 36),
  dropoff: makeIcon("🏁", 36),
  driver:  makeIcon("🚗", 32),
};

// ─── Auto-fit map bounds to all visible pins ──────────────────
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [48, 48] });
    } else if (positions.length === 1) {
      map.setView(positions[0], DEFAULT_MAP_ZOOM);
    }
  }, [positions.map(p => p.join(",")).join("|")]);
  return null;
}

// ─── Main component ───────────────────────────────────────────
export default function LiveTrackingMap({ ride, socket, rideStatus }) {
  const [driverPos, setDriverPos] = useState(
    ride?.driver?.latitude && ride?.driver?.longitude
      ? [ride.driver.latitude, ride.driver.longitude]
      : null
  );

  // Listen for live driver location updates from socket
  useEffect(() => {
    if (!socket) return;
    const handler = ({ lat, lng }) => {
      setDriverPos([lat, lng]);
    };
    socket.on("driver:location", handler);
    return () => socket.off("driver:location", handler);
  }, [socket]);

  const pickupPos  = ride?.pickupLat  && ride?.pickupLng
    ? [ride.pickupLat,  ride.pickupLng]  : null;
  const dropoffPos = ride?.dropoffLat && ride?.dropoffLng
    ? [ride.dropoffLat, ride.dropoffLng] : null;

  // All valid positions for FitBounds
  const allPositions = [pickupPos, dropoffPos, driverPos].filter(Boolean);

  // Route line: driver → pickup (before ride starts) or pickup → dropoff (in progress)
  const routeLine = (() => {
    if (driverPos && pickupPos && ["DRIVER_EN_ROUTE", "DRIVER_ASSIGNED"].includes(rideStatus)) {
      return [driverPos, pickupPos];
    }
    if (pickupPos && dropoffPos && ["IN_PROGRESS", "ARRIVED_AT_PICKUP"].includes(rideStatus)) {
      return [pickupPos, dropoffPos];
    }
    if (pickupPos && dropoffPos) return [pickupPos, dropoffPos];
    return null;
  })();

  const center = pickupPos || [RUSTENBURG_CENTER.lat, RUSTENBURG_CENTER.lng];

  return (
    <div style={{ height: "280px", width: "100%", borderRadius: "14px", overflow: "hidden",
      border: "1px solid rgba(232,184,75,0.2)" }}>
      <MapContainer
        center={center}
        zoom={DEFAULT_MAP_ZOOM}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        scrollWheelZoom={false}>

        {/* Dark-ish OSM tile layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Auto-fit bounds */}
        {allPositions.length > 0 && <FitBounds positions={allPositions} />}

        {/* Pickup pin */}
        {pickupPos && (
          <Marker position={pickupPos} icon={ICONS.pickup}>
            <Popup>
              <strong>📍 Pickup</strong><br />{ride?.pickupAddress}
            </Popup>
          </Marker>
        )}

        {/* Dropoff pin */}
        {dropoffPos && (
          <Marker position={dropoffPos} icon={ICONS.dropoff}>
            <Popup>
              <strong>🏁 Dropoff</strong><br />{ride?.dropoffAddress}
            </Popup>
          </Marker>
        )}

        {/* Live driver pin */}
        {driverPos && (
          <Marker position={driverPos} icon={ICONS.driver}>
            <Popup>
              <strong>🚗 Driver</strong>
              {ride?.driver?.user?.name && <><br />{ride.driver.user.name}</>}
            </Popup>
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
