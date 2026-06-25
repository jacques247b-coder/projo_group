// ============================================================
// PROJO GROUP — Live Ride Tracking Map
// Real-time driver position via Socket.io + Leaflet
// No API key required
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import { Marker, Popup, Polyline } from "react-leaflet";
import ProjoMap, { driverIcon, pickupIcon, dropoffIcon } from "./ProjoMap";
import { RIDE_STATUS_LABELS } from "../../utils/constants";

/**
 * LiveTrackingMap — shown to passenger during an active ride
 *
 * Props:
 *   ride         — ride object with pickup/dropoff coords
 *   socket       — Socket.io instance
 *   rideStatus   — current status string
 */
export default function LiveTrackingMap({ ride, socket, rideStatus }) {
  const [driverPos, setDriverPos] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const lastUpdate = useRef(null);

  useEffect(() => {
    if (!socket || !ride) return;

    // Join ride room for real-time updates
    socket.emit("passenger:join_ride", { rideId: ride.id });

    // Listen for driver location updates
    socket.on("driver:location", (data) => {
      if (data.rideId !== ride.id) return;
      setDriverPos({ lat: data.lat, lng: data.lng });
      lastUpdate.current = new Date();

      // Keep a trail of driver positions for route line
      setRoutePoints((prev) => {
        const next = [...prev, [data.lat, data.lng]];
        return next.slice(-50); // keep last 50 points
      });
    });

    return () => {
      socket.off("driver:location");
    };
  }, [socket, ride]);

  if (!ride) return null;

  const pickup = { lat: ride.pickupLat, lng: ride.pickupLng, label: ride.pickupAddress };
  const dropoff = { lat: ride.dropoffLat, lng: ride.dropoffLng, label: ride.dropoffAddress };

  // Center map on driver if we have position, else center between pickup/dropoff
  const mapCenter = driverPos || {
    lat: (pickup.lat + dropoff.lat) / 2,
    lng: (pickup.lng + dropoff.lng) / 2,
  };

  return (
    <div>
      {/* Status banner */}
      <div style={{
        background: "#1a1a1a", border: "1px solid rgba(232,184,75,0.25)",
        borderRadius: "10px", padding: "12px 16px", marginBottom: "12px",
        display: "flex", alignItems: "center", gap: "10px",
      }}>
        <div style={{
          width: "8px", height: "8px", borderRadius: "50%", background: "#e8b84b",
          animation: "pulse 1.5s infinite", flexShrink: 0,
        }} />
        <div>
          <div style={{ fontSize: "14px", fontWeight: "700", color: "#f0ede8" }}>
            {RIDE_STATUS_LABELS[rideStatus] || rideStatus}
          </div>
          {lastUpdate.current && (
            <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "2px" }}>
              Driver location updated {Math.round((Date.now() - lastUpdate.current) / 1000)}s ago
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <ProjoMap
        center={mapCenter}
        zoom={14}
        height="420px"
        driverPos={driverPos}
        routePoints={routePoints}
      >
        <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
          <Popup><strong>📍 Your Pickup</strong><br />{pickup.label}</Popup>
        </Marker>
        <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon}>
          <Popup><strong>🏁 Dropoff</strong><br />{dropoff.label}</Popup>
        </Marker>
        {driverPos && (
          <Marker position={[driverPos.lat, driverPos.lng]} icon={driverIcon}>
            <Popup><strong style={{ color: "#e8b84b" }}>🚗 Your Driver</strong><br />Live location</Popup>
          </Marker>
        )}
        {/* Gold route line */}
        {routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            pathOptions={{ color: "#e8b84b", weight: 3, opacity: 0.6, dashArray: "6 6" }}
          />
        )}
      </ProjoMap>

      {/* Fare summary */}
      <div style={{
        marginTop: "12px", background: "#1a1a1a",
        border: "1px solid rgba(232,184,75,0.15)", borderRadius: "10px",
        padding: "14px 16px", display: "flex", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "2px" }}>Total Fare</div>
          <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#e8b84b",
            fontFamily: "'Syne', sans-serif" }}>
            R{ride.totalFare?.toFixed(2) || "60.00"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "2px" }}>Distance</div>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#f0ede8" }}>
            {ride.distanceKm ? `${ride.distanceKm}km` : "Rustenburg Flat"}
          </div>
        </div>
      </div>
    </div>
  );
}
