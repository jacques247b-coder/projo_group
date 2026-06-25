// ============================================================
// PROJO GROUP — Live Ride Tracking Page (FIXED)
// FIX 1: Socket connects after ride loads (not before)
// FIX 2: Handles shared=true prop for public share links
// FIX 3: Graceful fallback when no driver location yet
// ============================================================
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { rideAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { RIDE_STATUS_LABELS, formatFare, CONTACT } from "../../utils/constants";
import { LiveTrackingMap } from "../../components/map";
import toast from "react-hot-toast";

export default function RideTrackingPage({ shared = false }) {
  const { id, token: shareToken } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [ride, setRide]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showRating, setShowRating] = useState(false);
  const [stars, setStars]         = useState(5);
  const [comment, setComment]     = useState("");

  // Load ride first, then connect socket
  useEffect(() => {
    loadRide();
    return () => socketRef.current?.disconnect();
  }, [id, shareToken]);

  async function loadRide() {
    try {
      let data;
      if (shared && shareToken) {
        data = await rideAPI.getSharedRide(shareToken);
      } else {
        data = await rideAPI.getRideById(id);
      }
      setRide(data.ride);
      if (data.ride.status === "COMPLETED") setShowRating(true);

      // Connect socket only after we have the ride
      connectSocket(data.ride.id);
    } catch {
      toast.error("Could not load ride");
    } finally {
      setLoading(false);
    }
  }

  function connectSocket(rideId) {
    if (socketRef.current) socketRef.current.disconnect();

    const socket = io(
      process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000",
      { auth: { token } }
    );
    socketRef.current = socket;

    socket.emit("ride:join", { rideId });

    socket.on("ride:status_changed", ({ status }) => {
      setRide(prev => ({ ...prev, status }));
      toast.success(RIDE_STATUS_LABELS[status] || status);
      if (status === "COMPLETED") setShowRating(true);
    });

    socket.on("driver:location", ({ lat, lng }) => {
      setRide(prev => prev ? {
        ...prev,
        driver: { ...prev.driver, latitude: lat, longitude: lng },
      } : prev);
    });
  }

  async function cancelRide() {
    if (!window.confirm("Cancel this ride?")) return;
    try {
      await rideAPI.cancelRide(id, "Cancelled by passenger");
      toast.success("Ride cancelled");
      navigate("/book");
    } catch (err) {
      toast.error(err?.error || "Cannot cancel at this stage");
    }
  }

  async function submitRating() {
    try {
      await rideAPI.rateRide(id, stars, comment);
      toast.success("Thank you for your rating!");
      setShowRating(false);
      navigate("/book");
    } catch {
      toast.error("Could not submit rating");
    }
  }

  function shareRide() {
    const url = `${window.location.origin}/track/${ride.shareToken}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => toast.success("Share link copied!"));
    } else {
      toast.success(`Share link: ${url}`);
    }
  }

  function sosAlert() {
    window.open(
      `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
        `🚨 SOS! I am in a PROJO GROUP ride.\nRide ID: ${id || shareToken}\nPlease help!`
      )}`,
      "_blank"
    );
  }

  // ── Loading ──
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Syne', sans-serif", color: "#e8b84b", fontSize: "1.1rem",
      letterSpacing: "1px" }}>
      Loading your ride...
    </div>
  );

  if (!ride) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex",
      alignItems: "center", justifyContent: "center", flexDirection: "column",
      fontFamily: "'DM Sans', sans-serif", color: "#6b6760", gap: "1rem" }}>
      <div style={{ fontSize: "48px" }}>🚗</div>
      <div>Ride not found</div>
      {!shared && (
        <button onClick={() => navigate("/book")} style={{
          background: "#e8b84b", color: "#0a0a0a", border: "none",
          borderRadius: "10px", padding: "12px 24px", fontWeight: "700", cursor: "pointer",
        }}>Book a Ride</button>
      )}
    </div>
  );

  const statusLabel = RIDE_STATUS_LABELS[ride.status] || ride.status;
  const isActive = !["COMPLETED", "CANCELLED"].includes(ride.status);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a",
      fontFamily: "'DM Sans', sans-serif", paddingBottom: "2rem" }}>

      {/* Header */}
      <div style={{ background: "#111111", borderBottom: "1px solid rgba(232,184,75,0.15)",
        padding: "1rem 1.5rem", display: "flex",
        alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {!shared && (
            <button onClick={() => navigate(-1)} style={{
              background: "none", border: "none", color: "#a8a49e",
              cursor: "pointer", fontSize: "18px",
            }}>←</button>
          )}
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.1rem",
            fontWeight: "700", color: "#e8b84b" }}>
            {shared ? "PROJO GROUP · Live Ride" : "Track Ride"}
          </span>
        </div>
        <button onClick={sosAlert} style={{
          background: "#ef4444", color: "#fff", border: "none",
          borderRadius: "8px", padding: "8px 16px", fontWeight: "700",
          fontSize: "13px", cursor: "pointer", letterSpacing: "0.5px",
        }}>🚨 SOS</button>
      </div>

      <div style={{ padding: "1.5rem", maxWidth: "600px", margin: "0 auto" }}>

        {/* Status bar */}
        <div style={{ background: "#111111", border: "1px solid rgba(232,184,75,0.2)",
          borderRadius: "14px", padding: "1.25rem 1.5rem", marginBottom: "1rem",
          display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Pulse dot */}
          <div style={{
            width: "10px", height: "10px", borderRadius: "50%",
            background: isActive ? "#e8b84b" : ride.status === "COMPLETED" ? "#4ade80" : "#ef4444",
            flexShrink: 0,
            boxShadow: isActive ? "0 0 0 4px rgba(232,184,75,0.2)" : "none",
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1rem",
              fontWeight: "700", color: "#f0ede8" }}>{statusLabel}</div>
            {ride.driver?.user?.name && (
              <div style={{ fontSize: "12px", color: "#a8a49e", marginTop: "2px" }}>
                Driver: {ride.driver.user.name}
              </div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.4rem",
              fontWeight: "800", color: "#e8b84b" }}>
              {formatFare(ride.totalFare)}
            </div>
            <div style={{ fontSize: "11px", color: "#6b6760" }}>
              {ride.zone === "ZONE_1_FLAT" ? "Flat rate" : `${ride.distanceKm || ""}km`}
            </div>
          </div>
        </div>

        {/* Live map */}
        <div style={{ marginBottom: "1rem" }}>
          <LiveTrackingMap
            ride={ride}
            socket={socketRef.current}
            rideStatus={ride.status}
          />
        </div>

        {/* Route info */}
        <div style={{ background: "#111111", border: "1px solid rgba(232,184,75,0.12)",
          borderRadius: "14px", padding: "1.25rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "16px", flexShrink: 0, marginTop: "2px" }}>📍</span>
              <div>
                <div style={{ fontSize: "10px", color: "#6b6760", fontWeight: "700",
                  textTransform: "uppercase", letterSpacing: "0.5px" }}>Pickup</div>
                <div style={{ fontSize: "13px", color: "#f0ede8", marginTop: "2px" }}>
                  {ride.pickupAddress}
                </div>
              </div>
            </div>
            <div style={{ borderLeft: "2px dashed rgba(232,184,75,0.2)",
              height: "14px", marginLeft: "19px" }} />
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "16px", flexShrink: 0, marginTop: "2px" }}>🏁</span>
              <div>
                <div style={{ fontSize: "10px", color: "#6b6760", fontWeight: "700",
                  textTransform: "uppercase", letterSpacing: "0.5px" }}>Dropoff</div>
                <div style={{ fontSize: "13px", color: "#f0ede8", marginTop: "2px" }}>
                  {ride.dropoffAddress}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: "10px", marginBottom: "1rem" }}>
          {ride.shareToken && !shared && (
            <button onClick={shareRide} style={{
              background: "#1a1a1a", border: "1px solid rgba(232,184,75,0.2)",
              color: "#a8a49e", borderRadius: "10px", padding: "12px",
              fontWeight: "600", fontSize: "13px", cursor: "pointer",
            }}>📤 Share Ride</button>
          )}
          {["REQUESTED", "DRIVER_ASSIGNED"].includes(ride.status) && !shared && (
            <button onClick={cancelRide} style={{
              background: "#1a1a1a", border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444", borderRadius: "10px", padding: "12px",
              fontWeight: "600", fontSize: "13px", cursor: "pointer",
            }}>✕ Cancel Ride</button>
          )}
        </div>

        {/* Rating */}
        {showRating && !shared && (
          <div style={{ background: "#111111", border: "1px solid rgba(232,184,75,0.25)",
            borderRadius: "16px", padding: "1.5rem" }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", color: "#f0ede8",
              margin: "0 0 0.25rem", fontSize: "1.1rem" }}>Rate your ride</h3>
            <p style={{ color: "#6b6760", fontSize: "12px", margin: "0 0 1rem" }}>
              How was your experience?
            </p>
            <div style={{ display: "flex", gap: "8px",
              marginBottom: "1rem", justifyContent: "center" }}>
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setStars(s)} style={{
                  background: "none", border: "none", fontSize: "28px",
                  cursor: "pointer", opacity: s <= stars ? 1 : 0.3,
                  transition: "opacity .15s",
                }}>⭐</button>
              ))}
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Any comments? (optional)"
              style={{ width: "100%", background: "#1a1a1a",
                border: "1px solid rgba(232,184,75,0.2)", borderRadius: "10px",
                color: "#f0ede8", padding: "12px", fontSize: "14px",
                outline: "none", resize: "vertical", minHeight: "80px",
                fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                marginBottom: "1rem" }} />
            <button onClick={submitRating} style={{
              width: "100%", background: "#e8b84b", color: "#0a0a0a",
              border: "none", borderRadius: "10px", padding: "13px",
              fontWeight: "700", fontSize: "14px", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}>Submit Rating</button>
          </div>
        )}

        {/* Shared view footer */}
        {shared && (
          <div style={{ textAlign: "center", padding: "1rem",
            color: "#6b6760", fontSize: "12px" }}>
            Tracking shared by PROJO GROUP · Rustenburg's Own<br />
            <a href="https://www.projogroup.co.za" style={{ color: "#e8b84b" }}>
              www.projogroup.co.za
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
