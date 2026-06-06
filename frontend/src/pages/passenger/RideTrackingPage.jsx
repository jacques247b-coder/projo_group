// ============================================================
// PROJO GROUP — Live Ride Tracking Page
// Real-time driver location via Socket.io + Leaflet map
// SOS button, share link, fare display
// ============================================================
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { rideAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { RIDE_STATUS_LABELS, formatFare, CONTACT } from "../../utils/constants";
import { LiveTrackingMap } from "../../components/map";
import toast from "react-hot-toast";

export default function RideTrackingPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRating, setShowRating] = useState(false);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    loadRide();
    connectSocket();
    return () => socketRef.current?.disconnect();
  }, [id]);

  async function loadRide() {
    try {
      const data = await rideAPI.getRideById(id);
      setRide(data.ride);
      if (data.ride.status === "COMPLETED") setShowRating(true);
    } catch {
      toast.error("Could not load ride");
    } finally {
      setLoading(false);
    }
  }

  function connectSocket() {
    const socket = io(process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000", {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("ride:status_changed", ({ status }) => {
      setRide(prev => ({ ...prev, status }));
      toast.success(RIDE_STATUS_LABELS[status] || status);
      if (status === "COMPLETED") setShowRating(true);
    });

    socket.on("driver:location", ({ lat, lng }) => {
      setRide(prev => prev ? {
        ...prev,
        driver: { ...prev.driver, latitude: lat, longitude: lng }
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
    navigator.clipboard.writeText(url).then(() => toast.success("Share link copied!"));
  }

  function sosAlert() {
    window.open(`https://wa.me/${CONTACT.whatsapp}?text=SOS! I am in a PROJO GROUP ride. Ride ID: ${id}`, "_blank");
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex",
      alignItems: "center", justifyContent: "center", color: "#e8b84b",
      fontFamily: "'Syne', sans-serif", fontSize: "1.2rem" }}>
      Loading your ride...
    </div>
  );

  if (!ride) return null;

  const statusLabel = RIDE_STATUS_LABELS[ride.status] || ride.status;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a",
      fontFamily: "'DM Sans', sans-serif", paddingBottom: "2rem" }}>

      {/* Header */}
      <div style={{ background: "#111111", borderBottom: "1px solid rgba(232,184,75,0.15)",
        padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.1rem",
          fontWeight: "700", color: "#e8b84b" }}>PROJO GROUP</span>
        <button onClick={sosAlert} style={{
          background: "#ef4444", color: "#fff", border: "none",
          borderRadius: "8px", padding: "8px 16px", fontWeight: "700",
          fontSize: "13px", cursor: "pointer", letterSpacing: "0.5px",
        }}>🚨 SOS</button>
      </div>

      <div style={{ padding: "1.5rem", maxWidth: "600px", margin: "0 auto" }}>

        {/* Status */}
        <div style={{ background: "#111111", border: "1px solid rgba(232,184,75,0.2)",
          borderRadius: "14px", padding: "1.25rem 1.5rem", marginBottom: "1rem",
          display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%",
            background: "#e8b84b", flexShrink: 0,
            boxShadow: "0 0 0 4px rgba(232,184,75,0.2)",
            animation: "pulse 1.5s infinite" }} />
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.1rem",
              fontWeight: "700", color: "#f0ede8" }}>{statusLabel}</div>
            {ride.driver?.user?.name && (
              <div style={{ fontSize: "13px", color: "#a8a49e", marginTop: "2px" }}>
                Driver: {ride.driver.user.name}
              </div>
            )}
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.4rem",
              fontWeight: "800", color: "#e8b84b" }}>
              {formatFare(ride.totalFare)}
            </div>
          </div>
        </div>

        {/* Live map */}
        <div style={{ borderRadius: "14px", overflow: "hidden", marginBottom: "1rem" }}>
          <LiveTrackingMap ride={ride} socket={socketRef.current} rideStatus={ride.status} />
        </div>

        {/* Route info */}
        <div style={{ background: "#111111", border: "1px solid rgba(232,184,75,0.12)",
          borderRadius: "14px", padding: "1.25rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "16px", flexShrink: 0 }}>📍</span>
              <div>
                <div style={{ fontSize: "11px", color: "#6b6760", fontWeight: "700",
                  textTransform: "uppercase", letterSpacing: "0.5px" }}>Pickup</div>
                <div style={{ fontSize: "14px", color: "#f0ede8", marginTop: "2px" }}>{ride.pickupAddress}</div>
              </div>
            </div>
            <div style={{ borderLeft: "2px dashed rgba(232,184,75,0.2)", height: "16px", marginLeft: "19px" }} />
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "16px", flexShrink: 0 }}>🏁</span>
              <div>
                <div style={{ fontSize: "11px", color: "#6b6760", fontWeight: "700",
                  textTransform: "uppercase", letterSpacing: "0.5px" }}>Dropoff</div>
                <div style={{ fontSize: "14px", color: "#f0ede8", marginTop: "2px" }}>{ride.dropoffAddress}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "1rem" }}>
          <button onClick={shareRide} style={{
            background: "#1a1a1a", border: "1px solid rgba(232,184,75,0.2)",
            color: "#a8a49e", borderRadius: "10px", padding: "12px",
            fontWeight: "600", fontSize: "13px", cursor: "pointer",
          }}>📤 Share Ride</button>

          {["REQUESTED", "DRIVER_ASSIGNED"].includes(ride.status) && (
            <button onClick={cancelRide} style={{
              background: "#1a1a1a", border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444", borderRadius: "10px", padding: "12px",
              fontWeight: "600", fontSize: "13px", cursor: "pointer",
            }}>✕ Cancel Ride</button>
          )}
        </div>

        {/* Rating modal */}
        {showRating && (
          <div style={{ background: "#111111", border: "1px solid rgba(232,184,75,0.25)",
            borderRadius: "16px", padding: "1.5rem" }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", color: "#f0ede8",
              margin: "0 0 1rem", fontSize: "1.1rem" }}>Rate your ride</h3>
            <div style={{ display: "flex", gap: "8px", marginBottom: "1rem", justifyContent: "center" }}>
              {[1,2,3,4,5].map(s => (
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
            }}>Submit Rating</button>
          </div>
        )}
      </div>
    </div>
  );
}
