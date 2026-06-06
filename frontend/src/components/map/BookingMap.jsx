// ============================================================
// PROJO GROUP — Booking Map with Live Fare Calculator
// Leaflet + OSRM — no API key required
// Click map to set pickup/dropoff, auto-calculates fare
// ============================================================

import React, { useState, useCallback } from "react";
import { useMapEvents } from "react-leaflet";
import ProjoMap, { pickupIcon, dropoffIcon } from "./ProjoMap";
import { Marker, Popup } from "react-leaflet";
import { getRouteDistance, isInsideRustenburg, RUSTENBURG_AREAS } from "../../services/maps";
import { PRICING, VEHICLE_MULTIPLIERS, formatFare } from "../../utils/constants";

// Click handler component (must be inside MapContainer)
function MapClickHandler({ onPickup, onDropoff, pickingUp }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (pickingUp) onPickup(lat, lng);
      else onDropoff(lat, lng);
    },
  });
  return null;
}

export default function BookingMap({ vehicleType = "ECONOMY", onFareCalculated }) {
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [pickingUp, setPickingUp] = useState(true); // true = next click sets pickup
  const [fare, setFare] = useState(null);
  const [loading, setLoading] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);

  const multiplier = VEHICLE_MULTIPLIERS[vehicleType] || 1.0;

  const handlePickup = useCallback(async (lat, lng) => {
    const p = { lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
    setPickup(p);
    setPickingUp(false); // next click = dropoff
    setFare(null);
    setRoutePoints([]);
  }, []);

  const handleDropoff = useCallback(async (lat, lng) => {
    if (!pickup) return;
    const d = { lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
    setDropoff(d);
    setLoading(true);

    try {
      const { distanceKm, durationMin, geometry } = await getRouteDistance(
        pickup.lat, pickup.lng, lat, lng
      );

      // Draw route on map if geometry returned
      if (geometry?.coordinates) {
        setRoutePoints(geometry.coordinates.map(([lng, lat]) => [lat, lng]));
      }

      // Calculate fare
      const zone1 = isInsideRustenburg(pickup.lat, pickup.lng) &&
                    isInsideRustenburg(lat, lng);

      let baseFare, fareLabel, fareType;
      if (zone1) {
        baseFare = PRICING.FLAT_RATE * multiplier;
        fareType = "FLAT";
        fareLabel = `Rustenburg Area — Flat Rate`;
      } else {
        const km = Math.max(PRICING.MIN_FARE / PRICING.PER_KM_RATE, distanceKm);
        baseFare = Math.max(PRICING.MIN_FARE, km * PRICING.PER_KM_RATE) * multiplier;
        fareType = "PER_KM";
        fareLabel = `${distanceKm}km × R7.50/km`;
      }

      const result = {
        fare: baseFare,
        fareType,
        fareLabel,
        distanceKm,
        durationMin,
        zone: zone1 ? 1 : 2,
        driverEarns: parseFloat((baseFare * 0.8).toFixed(2)),
      };
      setFare(result);
      onFareCalculated?.(result);
    } catch (err) {
      console.error("Fare calculation error:", err);
    } finally {
      setLoading(false);
    }
  }, [pickup, multiplier, onFareCalculated]);

  const reset = () => {
    setPickup(null);
    setDropoff(null);
    setPickingUp(true);
    setFare(null);
    setRoutePoints([]);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Instructions */}
      <div style={{
        background: "#1a1a1a", border: "1px solid rgba(232,184,75,0.2)",
        borderRadius: "10px", padding: "12px 16px", marginBottom: "12px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "8px",
      }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <span style={{
            fontSize: "12px", fontWeight: "700", letterSpacing: "0.5px",
            color: pickingUp ? "#4ade80" : "#6b6760",
          }}>
            {pickingUp ? "🟢 Click map to set PICKUP" : pickup ? "✅ Pickup set" : ""}
          </span>
          <span style={{
            fontSize: "12px", fontWeight: "700", letterSpacing: "0.5px",
            color: !pickingUp ? "#f87171" : "#6b6760",
          }}>
            {!pickingUp ? "🔴 Click map to set DROPOFF" : dropoff ? "✅ Dropoff set" : ""}
          </span>
        </div>
        <button onClick={reset} style={{
          background: "transparent", border: "1px solid rgba(232,184,75,0.3)",
          color: "#a8a49e", borderRadius: "6px", padding: "4px 12px",
          fontSize: "12px", cursor: "pointer",
        }}>Reset</button>
      </div>

      {/* Map */}
      <ProjoMap height="350px" routePoints={routePoints}>
        <MapClickHandler
          onPickup={handlePickup}
          onDropoff={handleDropoff}
          pickingUp={pickingUp}
        />
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup><strong>📍 Pickup</strong></Popup>
          </Marker>
        )}
        {dropoff && (
          <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon}>
            <Popup><strong>🏁 Dropoff</strong></Popup>
          </Marker>
        )}
      </ProjoMap>

      {/* Fare display */}
      {loading && (
        <div style={{
          marginTop: "12px", background: "#1a1a1a",
          border: "1px solid rgba(232,184,75,0.2)", borderRadius: "10px",
          padding: "16px", textAlign: "center", color: "#a8a49e", fontSize: "14px",
        }}>
          Calculating route via OpenStreetMap...
        </div>
      )}

      {fare && !loading && (
        <div style={{
          marginTop: "12px",
          background: "linear-gradient(135deg,rgba(232,184,75,0.08),rgba(232,184,75,0.03))",
          border: "1px solid rgba(232,184,75,0.3)", borderRadius: "10px",
          padding: "16px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#a8a49e", fontWeight: "700",
                letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "4px" }}>
                Estimated Fare
              </div>
              <div style={{ fontSize: "2rem", fontWeight: "800", color: "#e8b84b",
                fontFamily: "'Syne', sans-serif" }}>
                {formatFare(fare.fare)}
              </div>
              <div style={{ fontSize: "12px", color: "#a8a49e", marginTop: "4px" }}>
                {fare.fareLabel}
                {fare.distanceKm && ` · ${fare.distanceKm}km · ~${fare.durationMin} min`}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "4px" }}>
                Zone {fare.zone} · {vehicleType}
              </div>
              <div style={{ fontSize: "12px", color: "#a8a49e" }}>
                Driver earns: <strong style={{ color: "#e8b84b" }}>{formatFare(fare.driverEarns)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick area selector */}
      <div style={{ marginTop: "12px" }}>
        <div style={{ fontSize: "11px", color: "#6b6760", fontWeight: "700",
          letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "8px" }}>
          Or select a known area
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {RUSTENBURG_AREAS.filter(a => a.zone === 1).map((area) => (
            <button
              key={area.name}
              onClick={() => {
                if (pickingUp) handlePickup(area.lat, area.lng).then(() =>
                  setPickup({ ...area, label: area.name }));
                else handleDropoff(area.lat, area.lng).then(() =>
                  setDropoff({ ...area, label: area.name }));
              }}
              style={{
                background: "#1a1a1a", border: "1px solid rgba(232,184,75,0.2)",
                borderRadius: "50px", padding: "4px 12px", fontSize: "11px",
                color: "#a8a49e", cursor: "pointer", fontWeight: "600",
                transition: "all .15s",
              }}
              onMouseOver={e => e.target.style.borderColor = "#e8b84b"}
              onMouseOut={e => e.target.style.borderColor = "rgba(232,184,75,0.2)"}
            >
              {area.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
