// PROJO GROUP — Live Ride Tracking Page (Full ETA + Live Location from Acceptance)
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { rideAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { RIDE_STATUS_LABELS, formatFare, CONTACT } from "../../utils/constants";
import { LiveTrackingMap } from "../../components/map";
import toast from "react-hot-toast";

const G = "#e8b84b";
const BG = "#0d0505";
const BG2 = "#120808";
const BG3 = "#1c0f0f";
const BORDER = "rgba(232,184,75,0.15)";

const STATUS_CONFIG = {
  REQUESTED:       { label: "Finding your driver...", icon: "🔍", color: "#60a5fa", step: 0 },
  DRIVER_ASSIGNED: { label: "Driver is on the way",   icon: "🚗", color: "#a78bfa", step: 1 },
  IN_PROGRESS:     { label: "Ride in progress",        icon: "🛣️", color: "#f59e0b", step: 2 },
  COMPLETED:       { label: "Ride completed",          icon: "✅", color: "#4ade80", step: 3 },
  CANCELLED:       { label: "Ride cancelled",          icon: "❌", color: "#ef4444", step: -1 },
};

const STEPS = [
  { key: "REQUESTED",       label: "Requested" },
  { key: "DRIVER_ASSIGNED", label: "Driver On Way" },
  { key: "IN_PROGRESS",     label: "In Progress" },
  { key: "COMPLETED",       label: "Completed" },
];

// Calculate ETA in minutes given two lat/lng points (Haversine)
function calcETA(driverLat, driverLng, destLat, destLng, avgKmh = 40) {
  if (!driverLat || !driverLng || !destLat || !destLng) return null;
  const R = 6371;
  const dLat = (destLat - driverLat) * Math.PI / 180;
  const dLng = (destLng - driverLng) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(driverLat*Math.PI/180) * Math.cos(destLat*Math.PI/180) * Math.sin(dLng/2)**2;
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const minutes = Math.ceil((dist / avgKmh) * 60);
  return Math.max(1, minutes);
}

export default function RideTrackingPage({ shared = false }) {
  const { id, token: shareToken } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const etaIntervalRef = useRef(null);

  const [ride, setRide]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [driverPos, setDriverPos]     = useState(null);
  const [eta, setEta]                 = useState(null);
  const [showRating, setShowRating]   = useState(false);
  const [stars, setStars]             = useState(5);
  const [comment, setComment]         = useState("");
  const [driverInfo, setDriverInfo]   = useState(null);

  useEffect(() => {
    loadRide();
    return () => {
      socketRef.current?.disconnect();
      if (etaIntervalRef.current) clearInterval(etaIntervalRef.current);
    };
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
      if (data.ride.driverInfo) setDriverInfo(data.ride.driverInfo);
      if (data.ride.status === "COMPLETED") setShowRating(true);
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

    // Join the ride room
    socket.emit("ride:join", { rideId });
    // Also join as passenger for direct notifications
    if (user?.id) socket.emit("passenger:join", { passengerId: user.id });

    // Driver assigned — show driver info immediately
    socket.on("ride:driver_assigned", (data) => {
      setRide(prev => ({ ...prev, status: "DRIVER_ASSIGNED", driverId: data.driverId }));
      setDriverInfo({ name: data.driverName, phone: data.driverPhone });
      toast.success("🚗 Driver found and on the way!");
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    });

    // Live driver location — update map and recalculate ETA
    socket.on("driver:location", ({ lat, lng }) => {
      const pos = { lat, lng };
      setDriverPos(pos);
      setRide(prev => {
        if (!prev) return prev;
        // Calculate ETA based on current status
        const destLat = prev.status === "DRIVER_ASSIGNED" ? prev.pickupLat : prev.dropoffLat;
        const destLng = prev.status === "DRIVER_ASSIGNED" ? prev.pickupLng : prev.dropoffLng;
        const etaMinutes = calcETA(lat, lng, destLat, destLng);
        setEta(etaMinutes);
        return { ...prev, driver: { ...prev.driver, latitude: lat, longitude: lng } };
      });
    });

    // Status updates
    socket.on("ride:status_changed", ({ status, driverComment }) => {
      setRide(prev => ({ ...prev, status }));
      const cfg = STATUS_CONFIG[status];
      if (cfg) toast.success(`${cfg.icon} ${cfg.label}`);
      if (status === "IN_PROGRESS") {
        setEta(null); // Reset ETA — now tracking to dropoff
        toast("🛣️ Ride started! Heading to your destination", { icon: "🚀", duration: 5000 });
      }
      if (status === "COMPLETED") {
        setShowRating(true);
        setEta(null);
        if (driverComment) toast(`Driver note: "${driverComment}"`, { duration: 8000 });
      }
      if (status === "CANCELLED") {
        toast.error("Ride was cancelled");
        setTimeout(() => navigate("/book"), 3000);
      }
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
    } catch { toast.error("Could not submit rating"); }
  }

  function shareRide() {
    const url = `${window.location.origin}/track/${ride?.shareToken}`;
    navigator.clipboard?.writeText(url).then(() => toast.success("Share link copied!"))
      .catch(() => toast.success(`Share: ${url}`));
  }

  function callDriver() {
    if (driverInfo?.phone) window.open(`tel:${driverInfo.phone}`);
  }

  function sosAlert() {
    window.open(
      `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
        `🚨 SOS! I am in a PROJO GROUP ride.\nRide ID: ${id || shareToken}\nPlease help!`
      )}`, "_blank"
    );
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b6760" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚗</div>
        <div>Loading ride details...</div>
      </div>
    </div>
  );

  if (!ride) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b6760" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
        <div>Ride not found</div>
        <button onClick={() => navigate("/book")} style={{ marginTop: "16px", background: G, color: "#0d0505", border: "none", borderRadius: "10px", padding: "12px 24px", fontWeight: "700", cursor: "pointer" }}>Go Back</button>
      </div>
    </div>
  );

  const cfg = STATUS_CONFIG[ride.status] || STATUS_CONFIG.REQUESTED;
  const currentStepIdx = STEPS.findIndex(s => s.key === ride.status);
  const canCancel = ["REQUESTED", "DRIVER_ASSIGNED"].includes(ride.status);

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Sans',sans-serif" }}>

      {/* Map — full width at top */}
      <div style={{ height: "40vh", position: "relative" }}>
        <LiveTrackingMap
          ride={ride}
          driverLocation={driverPos || (ride.driver ? { lat: ride.driver.latitude, lng: ride.driver.longitude } : null)}
          showDriver={!!driverPos || !!ride.driver}
        />

        {/* ETA overlay */}
        {eta && ride.status !== "COMPLETED" && ride.status !== "CANCELLED" && (
          <div style={{
            position: "absolute", top: "12px", left: "50%", transform: "translateX(-50%)",
            background: "rgba(10,10,10,0.9)", border: `1px solid ${G}`,
            borderRadius: "50px", padding: "8px 20px",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span style={{ fontSize: "16px" }}>⏱️</span>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: "800", color: G, fontSize: "16px" }}>
              {eta} min
            </span>
            <span style={{ fontSize: "12px", color: "#a8a49e" }}>
              {ride.status === "DRIVER_ASSIGNED" ? "to pickup" : "to dropoff"}
            </span>
          </div>
        )}

        {/* Status pill */}
        <div style={{
          position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)",
          background: "rgba(10,10,10,0.9)", border: `1px solid ${cfg.color}40`,
          borderRadius: "50px", padding: "8px 20px",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <span style={{ fontSize: "16px" }}>{cfg.icon}</span>
          <span style={{ fontWeight: "700", color: cfg.color, fontSize: "13px" }}>{cfg.label}</span>
        </div>
      </div>

      {/* Bottom sheet */}
      <div style={{ background: BG2, borderRadius: "20px 20px 0 0", marginTop: "-16px", padding: "1.25rem", minHeight: "60vh" }}>

        {/* Progress steps */}
        {ride.status !== "CANCELLED" && (
          <div style={{ display: "flex", alignItems: "center", marginBottom: "1.25rem" }}>
            {STEPS.map((step, idx) => (
              <React.Fragment key={step.key}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: idx <= currentStepIdx ? G : BG3,
                    border: `2px solid ${idx <= currentStepIdx ? G : BORDER}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "12px", fontWeight: "700",
                    color: idx <= currentStepIdx ? "#0a0a0a" : "#6b6760",
                  }}>
                    {idx < currentStepIdx ? "✓" : idx + 1}
                  </div>
                  <div style={{ fontSize: "9px", color: idx <= currentStepIdx ? G : "#6b6760", marginTop: "4px", textAlign: "center", lineHeight: 1.2 }}>{step.label}</div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: "2px", background: idx < currentStepIdx ? G : BORDER, marginBottom: "16px" }} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Driver info card */}
        {driverInfo && ride.status !== "COMPLETED" && ride.status !== "CANCELLED" && (
          <div style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "1rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#6b6760", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Your Driver</div>
              <div style={{ fontWeight: "700", color: "#f0ede8", fontSize: "15px" }}>{driverInfo.name}</div>
              {driverInfo.vehicle && <div style={{ fontSize: "12px", color: "#6b6760" }}>{driverInfo.vehicle}</div>}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {driverInfo.phone && (
                <button onClick={callDriver} style={{ background: "#166534", border: "1px solid #4ade80", borderRadius: "10px", padding: "10px 16px", color: "#4ade80", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                  📞 Call
                </button>
              )}
              <button onClick={sosAlert} style={{ background: "#7f1d1d", border: "1px solid #ef4444", borderRadius: "10px", padding: "10px 16px", color: "#f87171", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                🚨 SOS
              </button>
            </div>
          </div>
        )}

        {/* Ride details */}
        <div style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "1rem", marginBottom: "1rem" }}>
          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontSize: "10px", color: "#6b6760", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>Pickup</div>
            <div style={{ fontSize: "13px", color: "#f0ede8" }}>{ride.pickupAddress}</div>
          </div>
          <div style={{ height: "1px", background: BORDER, margin: "8px 0" }} />
          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontSize: "10px", color: "#6b6760", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>Dropoff</div>
            <div style={{ fontSize: "13px", color: "#f0ede8" }}>{ride.dropoffAddress}</div>
          </div>
          <div style={{ height: "1px", background: BORDER, margin: "8px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "10px", color: "#6b6760", textTransform: "uppercase", letterSpacing: "1px" }}>Fare</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "20px", fontWeight: "800", color: G }}>{formatFare(ride.totalFare)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "10px", color: "#6b6760", textTransform: "uppercase", letterSpacing: "1px" }}>Payment</div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: ride.paidWithWallet ? "#60a5fa" : "#f59e0b" }}>
                {ride.paidWithWallet ? "💳 Wallet" : "💵 Cash"}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "1rem" }}>
          <button onClick={shareRide} style={{ flex: 1, background: BG3, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "12px", color: G, fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
            📤 Share Trip
          </button>
          {canCancel && (
            <button onClick={cancelRide} style={{ flex: 1, background: "#7f1d1d", border: "1px solid #ef4444", borderRadius: "10px", padding: "12px", color: "#f87171", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
              Cancel Ride
            </button>
          )}
        </div>

        {/* No driver yet */}
        {ride.status === "REQUESTED" && !driverPos && (
          <div style={{ textAlign: "center", padding: "1rem", color: "#6b6760", fontSize: "13px" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px", animation: "spin 2s linear infinite", display: "inline-block" }}>🔍</div>
            <div>Finding the nearest available driver...</div>
          </div>
        )}

        {/* Rating modal */}
        {showRating && (
          <div style={{ background: BG3, border: `1px solid ${G}`, borderRadius: "16px", padding: "1.25rem" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "18px", fontWeight: "800", color: G, marginBottom: "12px", textAlign: "center" }}>
              ⭐ Rate Your Ride
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "16px" }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setStars(s)} style={{ background: "none", border: "none", fontSize: "32px", cursor: "pointer", filter: s <= stars ? "none" : "grayscale(100%)" }}>
                  ⭐
                </button>
              ))}
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Leave a comment (optional)..."
              style={{ width: "100%", background: BG2, border: `1px solid ${BORDER}`, borderRadius: "8px", color: "#f0ede8", padding: "10px", fontSize: "13px", fontFamily: "'DM Sans',sans-serif", minHeight: "80px", resize: "none", boxSizing: "border-box", marginBottom: "12px" }}
            />
            <button onClick={submitRating} style={{ width: "100%", background: G, color: "#0a0a0a", border: "none", borderRadius: "10px", padding: "14px", fontWeight: "800", fontSize: "15px", cursor: "pointer" }}>
              Submit Rating
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
