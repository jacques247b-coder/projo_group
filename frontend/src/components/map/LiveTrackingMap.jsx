// PROJO GROUP — Live Tracking Map (IMPROVED)
// NEW: ETA calculation, driver speed, rotating car icon by heading
import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { RUSTENBURG_CENTER, DEFAULT_MAP_ZOOM } from "../../utils/constants";

function makeIcon(emoji, size = 36, rotation = 0) {
  return L.divIcon({
    className: "",
    html: `<div style="font-size:${size}px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));transform:rotate(${rotation}deg);transition:transform .3s ease;">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

const ICONS = { pickup: makeIcon("📍", 36), dropoff: makeIcon("🏁", 36) };

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function bearing(lat1, lng1, lat2, lng2) {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

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

export default function LiveTrackingMap({ ride, socket, rideStatus }) {
  const [driverPos, setDriverPos] = useState(
    ride?.driver?.latitude && ride?.driver?.longitude
      ? [ride.driver.latitude, ride.driver.longitude] : null
  );
  const [heading, setHeading] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [eta, setEta] = useState(null);
  const lastUpdateRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    const handler = ({ lat, lng, heading: incomingHeading }) => {
      const now = Date.now();
      const newPos = [lat, lng];
      if (lastUpdateRef.current) {
        const [prevLat, prevLng] = lastUpdateRef.current.pos;
        const dtSeconds = (now - lastUpdateRef.current.timestamp) / 1000;
        if (dtSeconds > 0) {
          const distKm = distanceKm(prevLat, prevLng, lat, lng);
          const speedCalc = (distKm / dtSeconds) * 3600;
          if (speedCalc < 150) setSpeedKmh(Math.round(speedCalc));
        }
        if (incomingHeading !== undefined) setHeading(incomingHeading);
        else if (distanceKm(prevLat, prevLng, lat, lng) > 0.005) setHeading(bearing(prevLat, prevLng, lat, lng));
      }
      lastUpdateRef.current = { pos: newPos, timestamp: now };
      setDriverPos(newPos);
    };
    socket.on("driver:location", handler);
    return () => socket.off("driver:location", handler);
  }, [socket]);

  const pickupPos  = ride?.pickupLat  && ride?.pickupLng  ? [ride.pickupLat,  ride.pickupLng]  : null;
  const dropoffPos = ride?.dropoffLat && ride?.dropoffLng ? [ride.dropoffLat, ride.dropoffLng] : null;

  useEffect(() => {
    if (!driverPos) { setEta(null); return; }
    const targetPos = ["DRIVER_EN_ROUTE", "DRIVER_ASSIGNED"].includes(rideStatus) ? pickupPos
      : ["IN_PROGRESS", "ARRIVED_AT_PICKUP"].includes(rideStatus) ? dropoffPos : null;
    if (!targetPos) { setEta(null); return; }
    const distKm = distanceKm(driverPos[0], driverPos[1], targetPos[0], targetPos[1]);
    const effectiveSpeed = speedKmh > 5 ? speedKmh : 35;
    const etaMinutes = Math.max(1, Math.round((distKm / effectiveSpeed) * 60));
    setEta({ minutes: etaMinutes, distanceKm: distKm.toFixed(1) });
  }, [driverPos, pickupPos, dropoffPos, rideStatus, speedKmh]);

  const allPositions = [pickupPos, dropoffPos, driverPos].filter(Boolean);
  const routeLine = (() => {
    if (driverPos && pickupPos && ["DRIVER_EN_ROUTE", "DRIVER_ASSIGNED"].includes(rideStatus)) return [driverPos, pickupPos];
    if (pickupPos && dropoffPos && ["IN_PROGRESS", "ARRIVED_AT_PICKUP"].includes(rideStatus)) return [pickupPos, dropoffPos];
    if (pickupPos && dropoffPos) return [pickupPos, dropoffPos];
    return null;
  })();

  const center = pickupPos || [RUSTENBURG_CENTER.lat, RUSTENBURG_CENTER.lng];
  const driverIcon = makeIcon("🚗", 32, heading);

  return (
    <div>
      {eta && (
        <div style={{ background: "rgba(232,184,75,0.1)", border: "1px solid rgba(232,184,75,0.3)",
          borderRadius: "12px", padding: "10px 16px", marginBottom: "10px",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "10px", color: "#6b6760", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Estimated Arrival</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.3rem", fontWeight: "800", color: "#e8b84b" }}>{eta.minutes} min</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", color: "#6b6760", fontWeight: "700", textTransform: "uppercase" }}>Distance</div>
            <div style={{ fontSize: "13px", color: "#f0ede8", fontWeight: "600" }}>{eta.distanceKm} km</div>
            {speedKmh > 0 && <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "2px" }}>{speedKmh} km/h</div>}
          </div>
        </div>
      )}
      <div style={{ height: "280px", width: "100%", borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(232,184,75,0.2)" }}>
        <MapContainer center={center} zoom={DEFAULT_MAP_ZOOM} style={{ height: "100%", width: "100%" }} zoomControl={true} scrollWheelZoom={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
          {allPositions.length > 0 && <FitBounds positions={allPositions} />}
          {pickupPos && <Marker position={pickupPos} icon={ICONS.pickup}><Popup><strong>📍 Pickup</strong><br />{ride?.pickupAddress}</Popup></Marker>}
          {dropoffPos && <Marker position={dropoffPos} icon={ICONS.dropoff}><Popup><strong>🏁 Dropoff</strong><br />{ride?.dropoffAddress}</Popup></Marker>}
          {driverPos && <Marker position={driverPos} icon={driverIcon}><Popup><strong>🚗 Driver</strong>{ride?.driver?.user?.name && <><br />{ride.driver.user.name}</>}{speedKmh > 0 && <><br />Speed: {speedKmh} km/h</>}</Popup></Marker>}
          {routeLine && <Polyline positions={routeLine} pathOptions={{ color: "#e8b84b", weight: 3, opacity: 0.7, dashArray: "8 4" }} />}
        </MapContainer>
      </div>
    </div>
  );
}
