// ============================================================
// PROJO GROUP — Book Ride Page
// Full booking flow with Leaflet map + OSRM fare calculation
// Rustenburg Zone 1: R60 flat | Zone 2: R7.50/km
// ============================================================
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { rideAPI } from "../../services/api";
import { RUSTENBURG_AREAS } from "../../services/maps";
import { VEHICLE_INFO, PRICING, formatFare } from "../../utils/constants";
import toast from "react-hot-toast";

// Leaflet CSS must be imported globally — add to index.js
// import "leaflet/dist/leaflet.css";

const VEHICLE_TYPES = ["ECONOMY", "COMFORT", "XL", "LUXURY"];

export default function BookRidePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [vehicleType, setVehicleType] = useState("ECONOMY");
  const [fareResult, setFareResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [payWithWallet, setPayWithWallet] = useState(false);
  const [step, setStep] = useState("SELECT"); // SELECT | CONFIRM | TRACKING

  // Get fare estimate when pickup/dropoff/vehicle changes
  useEffect(() => {
    if (!pickup || !dropoff) return;
    estimateFare();
  }, [pickup, dropoff, vehicleType]);

  async function estimateFare() {
    setEstimating(true);
    try {
      const result = await rideAPI.estimateFare({
        pickupLat: pickup.lat, pickupLng: pickup.lng,
        dropoffLat: dropoff.lat, dropoffLng: dropoff.lng,
        vehicleType,
      });
      setFareResult(result);
    } catch {
      toast.error("Could not calculate fare");
    } finally {
      setEstimating(false);
    }
  }

  async function handleBookRide() {
    if (!pickup || !dropoff) return toast.error("Select pickup and dropoff");
    if (!fareResult) return toast.error("Fare not calculated yet");

    // Check wallet balance
    if (payWithWallet && user?.wallet?.balanceZar < fareResult.totalFare) {
      return toast.error(`Insufficient wallet balance. You have R${user?.wallet?.balanceZar?.toFixed(2)}`);
    }

    setLoading(true);
    try {
      const data = await rideAPI.bookRide({
        pickupAddress: pickup.name,
        pickupLat: pickup.lat, pickupLng: pickup.lng,
        dropoffAddress: dropoff.name,
        dropoffLat: dropoff.lat, dropoffLng: dropoff.lng,
        vehicleType,
        scheduledFor: scheduledFor || undefined,
        paidWithWallet: payWithWallet,
      });
      toast.success("Ride booked! Finding your driver...");
      navigate(`/ride/${data.ride.id}`);
    } catch (err) {
      toast.error(err?.error || "Could not book ride. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const s = {
    page: { minHeight: "100vh", background: "#0a0a0a", fontFamily: "'DM Sans', sans-serif", paddingBottom: "2rem" },
    header: { background: "#111111", borderBottom: "1px solid rgba(232,184,75,0.15)",
      padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" },
    title: { fontFamily: "'Syne', sans-serif", fontSize: "1.1rem", fontWeight: "700", color: "#e8b84b" },
    section: { padding: "1.5rem", maxWidth: "600px", margin: "0 auto" },
    label: { fontSize: "11px", fontWeight: "700", color: "#6b6760",
      letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "8px", display: "block" },
    areaGrid: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "8px", marginBottom: "1.25rem" },
    areaBtn: (selected) => ({
      padding: "10px 12px", borderRadius: "10px", border: "none", cursor: "pointer",
      textAlign: "left", fontSize: "13px", fontWeight: "600", transition: "all .15s",
      background: selected ? "#e8b84b" : "#1a1a1a",
      color: selected ? "#0a0a0a" : "#a8a49e",
      borderLeft: selected ? "none" : "2px solid transparent",
    }),
    vehicleGrid: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "10px", marginBottom: "1.5rem" },
    vehicleCard: (selected) => ({
      background: selected ? "rgba(232,184,75,0.1)" : "#1a1a1a",
      border: selected ? "2px solid #e8b84b" : "1px solid rgba(232,184,75,0.15)",
      borderRadius: "12px", padding: "14px", cursor: "pointer", transition: "all .2s",
    }),
    fareBox: { background: "linear-gradient(135deg,rgba(232,184,75,0.08),rgba(232,184,75,0.03))",
      border: "1px solid rgba(232,184,75,0.25)", borderRadius: "14px",
      padding: "1.25rem 1.5rem", marginBottom: "1.25rem" },
    bookBtn: { width: "100%", background: "#e8b84b", color: "#0a0a0a",
      border: "none", borderRadius: "12px", padding: "16px",
      fontSize: "16px", fontWeight: "700", cursor: "pointer",
      fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.3px" },
  };

  const zone1Areas = RUSTENBURG_AREAS.filter(a => a.zone === 1);
  const zone2Areas = RUSTENBURG_AREAS.filter(a => a.zone === 2);

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <span style={s.title}>PROJO GROUP</span>
        <span style={{ fontSize: "13px", color: "#6b6760" }}>Book a Ride</span>
      </div>

      <div style={s.section}>
        {/* Pickup */}
        <label style={s.label}>📍 Pickup Location</label>
        <div style={s.areaGrid}>
          {zone1Areas.map(area => (
            <button key={area.name} style={s.areaBtn(pickup?.name === area.name)}
              onClick={() => setPickup(area)}>
              {area.name}
            </button>
          ))}
        </div>

        {/* Dropoff */}
        <label style={s.label}>🏁 Dropoff Location</label>
        <div style={{ ...s.areaGrid, marginBottom: "0.5rem" }}>
          {zone1Areas.map(area => (
            <button key={area.name} style={s.areaBtn(dropoff?.name === area.name)}
              onClick={() => setDropoff(area)}>
              {area.name}
            </button>
          ))}
        </div>
        {/* Zone 2 outside Rustenburg */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "11px", color: "#6b6760", fontWeight: "700",
            letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "6px" }}>
            Outside Rustenburg (R7.50/km)
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {zone2Areas.map(area => (
              <button key={area.name}
                onClick={() => setDropoff(area)}
                style={{
                  padding: "7px 14px", borderRadius: "50px", fontSize: "12px",
                  fontWeight: "600", cursor: "pointer", transition: "all .15s",
                  background: dropoff?.name === area.name ? "#e8b84b" : "#1a1a1a",
                  color: dropoff?.name === area.name ? "#0a0a0a" : "#a8a49e",
                  border: dropoff?.name === area.name ? "none" : "1px solid rgba(232,184,75,0.2)",
                }}>
                {area.name}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle type */}
        <label style={s.label}>🚗 Vehicle Type</label>
        <div style={s.vehicleGrid}>
          {VEHICLE_TYPES.map(type => {
            const info = VEHICLE_INFO[type];
            return (
              <div key={type} style={s.vehicleCard(vehicleType === type)}
                onClick={() => setVehicleType(type)}>
                <div style={{ fontSize: "24px", marginBottom: "6px" }}>{info.emoji}</div>
                <div style={{ fontSize: "13px", fontWeight: "700",
                  color: vehicleType === type ? "#e8b84b" : "#f0ede8" }}>{info.label}</div>
                <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "2px" }}>{info.description}</div>
                <div style={{ fontSize: "12px", color: "#e8b84b", fontWeight: "700", marginTop: "6px" }}>
                  {info.multiplier === 1.0 ? "Base fare" : `×${info.multiplier}`}
                </div>
              </div>
            );
          })}
        </div>

        {/* Fare display */}
        {(fareResult || estimating) && (
          <div style={s.fareBox}>
            {estimating ? (
              <div style={{ color: "#a8a49e", fontSize: "14px" }}>Calculating fare via OpenStreetMap...</div>
            ) : fareResult && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#6b6760", fontWeight: "700",
                      letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "4px" }}>
                      Estimated Fare
                    </div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "2.2rem",
                      fontWeight: "800", color: "#e8b84b", lineHeight: "1" }}>
                      {fareResult.displayString}
                    </div>
                    <div style={{ fontSize: "12px", color: "#a8a49e", marginTop: "6px" }}>
                      {fareResult.fareLabel}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", color: "#6b6760" }}>Zone {fareResult.zone === "ZONE_1_FLAT" ? 1 : 2}</div>
                    {fareResult.durationMin && (
                      <div style={{ fontSize: "13px", color: "#a8a49e", marginTop: "4px" }}>
                        ~{fareResult.durationMin} min
                      </div>
                    )}
                  </div>
                </div>
                {fareResult.surge && (
                  <div style={{ marginTop: "10px", background: "rgba(232,184,75,0.1)",
                    borderRadius: "6px", padding: "6px 10px",
                    fontSize: "12px", color: "#e8b84b", fontWeight: "600" }}>
                    ⚡ Peak hour pricing applied (+15%)
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Schedule option */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={s.label}>📅 Schedule for later (optional)</label>
          <input type="datetime-local" value={scheduledFor}
            onChange={e => setScheduledFor(e.target.value)}
            style={{ width: "100%", background: "#1a1a1a",
              border: "1px solid rgba(232,184,75,0.2)", borderRadius: "10px",
              color: "#f0ede8", padding: "12px 14px", fontSize: "14px",
              outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
        </div>

        {/* Wallet payment toggle */}
        {user?.wallet?.balanceZar > 0 && (
          <div style={{ background: "#1a1a1a", border: "1px solid rgba(232,184,75,0.15)",
            borderRadius: "12px", padding: "14px 16px", marginBottom: "1.25rem",
            display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#f0ede8" }}>
                Pay with PROJO Wallet
              </div>
              <div style={{ fontSize: "12px", color: "#6b6760", marginTop: "2px" }}>
                Balance: <strong style={{ color: "#e8b84b" }}>R{user.wallet.balanceZar.toFixed(2)}</strong>
              </div>
            </div>
            <div onClick={() => setPayWithWallet(p => !p)} style={{
              width: "44px", height: "24px", borderRadius: "12px", cursor: "pointer",
              background: payWithWallet ? "#e8b84b" : "#252535", position: "relative",
              transition: "background .2s",
            }}>
              <div style={{
                width: "18px", height: "18px", borderRadius: "50%", background: "#0a0a0a",
                position: "absolute", top: "3px", transition: "left .2s",
                left: payWithWallet ? "23px" : "3px",
              }} />
            </div>
          </div>
        )}

        {/* Book button */}
        <button style={{
          ...s.bookBtn,
          opacity: (!pickup || !dropoff || loading) ? 0.5 : 1,
          cursor: (!pickup || !dropoff || loading) ? "not-allowed" : "pointer",
        }}
          disabled={!pickup || !dropoff || loading}
          onClick={handleBookRide}>
          {loading ? "Booking your ride..." : fareResult
            ? `Book Now — ${fareResult.displayString}`
            : "Select pickup & dropoff"}
        </button>

        {/* Info strip */}
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem",
          justifyContent: "center", flexWrap: "wrap" }}>
          {["No hidden fees", "Driver earns 80%", "Powered by OpenStreetMap"].map(t => (
            <span key={t} style={{ fontSize: "11px", color: "#3d3d3d", fontWeight: "600" }}>
              ✓ {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
