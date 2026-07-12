// PROJO GROUP — Driver Dashboard (Full Featured)
// Features: Go Online/Offline, Location enforcement, Accept rides/deliveries,
// Map navigation (pickup→dropoff), Status updates, Cash/wallet payment,
// Earnings per trip, Shift earnings, Amount owed to PROJO
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import Navbar from "../../components/ui/Navbar";
import { driverAPI, rideAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const G = "#e8b84b";
const BG = "#0a0a0a";
const BG2 = "#111111";
const BG3 = "#1a1a1a";
const BORDER = "rgba(232,184,75,0.15)";

const STATUS_COLOR = {
  REQUESTED: "#60a5fa", DRIVER_ASSIGNED: "#a78bfa",
  IN_PROGRESS: "#f59e0b", COMPLETED: "#4ade80", CANCELLED: "#ef4444",
};

function fmt(n) { return `R${(n || 0).toFixed(2)}`; }
function fmtTime(dt) {
  if (!dt) return "";
  return new Date(dt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [online, setOnline] = useState(false);
  const restoredOnlineRef = useRef(false);
  const socketRef = useRef(null);

  // Restore online/offline UI state from what's actually persisted in the
  // database, instead of always starting as offline regardless of what the
  // driver last set. (Rejoining the actual socket dispatch room happens
  // separately, inside the socket's own "connect" handler below — doing it
  // there instead of here guarantees the socket connection actually exists
  // yet, which isn't guaranteed at the time this effect first runs.)
  useEffect(() => {
    if (user?.driverStatus === "ONLINE" && !restoredOnlineRef.current) {
      restoredOnlineRef.current = true;
      setOnline(true);
    }
  }, [user?.driverStatus, user?.id]);
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [driverPos, setDriverPos] = useState(null);
  const [pendingRide, setPendingRide] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);
  const [currentDelivery, setCurrentDelivery] = useState(null);
  const [tripComment, setTripComment] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [shiftEarnings, setShiftEarnings] = useState(0);
  const [shiftRides, setShiftRides] = useState(0);
  const [cashOwed, setCashOwed] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [lastTrip, setLastTrip] = useState(null);
  const [showLastTrip, setShowLastTrip] = useState(false);

  const watchRef = useRef(null);
  const posRef = useRef(null);

  // ── Location tracking ──────────────────────────────────────
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported on this device");
      return;
    }

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDriverPos(location);
        setLocationGranted(true);
        setLocationError(null);
        posRef.current = location;

        // Emit location to server via socket
        if (socketRef.current?.connected) {
          socketRef.current.emit("driver:location_update", {
            driverId: user?.id,
            lat: location.lat,
            lng: location.lng,
            rideId: currentRide?.id || null,
            deliveryId: currentDelivery?.id || null,
            passengerId: currentRide?.passengerId || null,
          });
        }
      },
      (err) => {
        setLocationGranted(false);
        if (err.code === 1) {
          setLocationError("Location permission denied. Please enable location in your device settings to go online.");
        } else {
          setLocationError("Could not get location. Make sure GPS is enabled.");
        }
        // If driver is online and loses location, force offline
        if (online) {
          setOnline(false);
          toast.error("Location lost — going offline");
          driverAPI.updateStatus("OFFLINE").catch(() => {});
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }, [user, currentRide, currentDelivery, online]);

  const stopLocationTracking = useCallback(() => {
    if (watchRef.current) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
  }, []);

  // ── Socket setup ───────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("projo_token");
    const sock = io(
      process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000",
      { auth: { token } }
    );
    socketRef.current = sock;

    sock.on("connect", () => {
      console.log("[PROJO Driver] Socket connected");
      // Rejoin the dispatch room if this driver was already online before
      // this connection (e.g. page refresh) — without this, a refreshed
      // driver would show "online" in the UI but never actually receive
      // ride requests again, since driver:online is what puts them in the
      // room and a fresh socket connection starts in no rooms at all.
      if (user?.driverStatus === "ONLINE") {
        sock.emit("driver:online", { driverId: user?.id });
      }
    });
    sock.on("disconnect", () => console.log("[PROJO Driver] Socket disconnected"));

    // New ride request
    sock.on("ride:new_request", (ride) => {
      if (online && locationGranted) {
        setPendingRide(ride);
        toast("🚗 New ride request!", { duration: 20000, icon: "🔔" });
        // Vibrate device
        if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
      }
    });

    // New delivery request
    sock.on("delivery:new_request", (delivery) => {
      if (online && locationGranted) {
        setPendingRide({ ...delivery, type: "delivery" });
        toast("📦 New delivery request!", { duration: 20000, icon: "🔔" });
        if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
      }
    });

    // Ride cancelled by passenger
    sock.on("ride:cancelled", (data) => {
      if (currentRide?.id === data.rideId) {
        setCurrentRide(null);
        toast.error("Ride cancelled by passenger");
      }
      if (pendingRide?.id === data.rideId) setPendingRide(null);
    });

    // Load today's earnings
    driverAPI.getEarnings("today").then(e => {
      setTodayEarnings(e.totalEarnings || 0);
    }).catch(() => {});

    // Start location tracking immediately
    startLocationTracking();

    return () => {
      sock.disconnect();
      stopLocationTracking();
    };
  }, []);

  // ── Go Online/Offline ──────────────────────────────────────
  async function toggleOnline() {
    if (!online) {
      // Going online — must have location
      if (!locationGranted) {
        toast.error("Enable location first to go online");
        startLocationTracking();
        return;
      }
      try {
        await driverAPI.updateStatus("ONLINE");
        setOnline(true);
        setShiftEarnings(0);
        setShiftRides(0);
        setCashOwed(0);
        toast.success("You are now ONLINE — waiting for requests");
        socketRef.current?.emit("driver:online", { driverId: user?.id });
      } catch { toast.error("Could not go online"); }
    } else {
      // Going offline — show shift summary
      try {
        await driverAPI.updateStatus("OFFLINE");
        setOnline(false);
        socketRef.current?.emit("driver:offline", { driverId: user?.id });
        toast(`Shift ended. Earned: ${fmt(shiftEarnings)} | Cash owed to PROJO: ${fmt(cashOwed)}`, {
          duration: 8000, icon: "💰"
        });
      } catch { toast.error("Could not go offline"); }
    }
  }

  // ── Accept ride ────────────────────────────────────────────
  async function acceptRide() {
    if (!pendingRide) return;
    try {
      if (pendingRide.type === "delivery") {
        await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/deliveries/${pendingRide.id}/accept`,
          { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("projo_token")}` } });
        setCurrentDelivery(pendingRide);
      } else {
        await rideAPI.acceptRide(pendingRide.id);
        setCurrentRide({ ...pendingRide, status: "DRIVER_ASSIGNED" });
      }

      // Immediately notify passenger with driver info and current location
      socketRef.current?.emit("ride:accepted", {
        rideId: pendingRide.id,
        driverId: user?.id,
        driverName: user?.name,
        driverPhone: user?.phone,
      });

      // Start broadcasting location to passenger immediately
      if (posRef.current) {
        socketRef.current?.emit("driver:location_update", {
          driverId: user?.id,
          lat: posRef.current.lat,
          lng: posRef.current.lng,
          rideId: pendingRide.id,
          passengerId: pendingRide.passengerId,
        });
      }

      setPendingRide(null);
      toast.success("✅ Ride accepted! Head to pickup");
    } catch { toast.error("Could not accept ride"); }
  }

  async function declineRide() {
    setPendingRide(null);
    toast("Ride declined", { icon: "👋" });
  }

  // ── Update ride status ─────────────────────────────────────
  async function updateRideStatus(status, comment = "") {
    const ride = currentRide;
    if (!ride) return;
    try {
      await rideAPI.updateStatus(ride.id, status);
      socketRef.current?.emit("ride:status_update", { rideId: ride.id, status, driverId: user?.id });

      if (status === "COMPLETED") {
        const driverEarning = ride.totalFare * 0.8;
        const projoShare = ride.totalFare * 0.2;
        const isCash = !ride.paidWithWallet;

        setLastTrip({
          fare: ride.totalFare,
          driverEarning,
          projoShare,
          isCash,
          paymentMethod: isCash ? "Cash" : "PROJO Wallet",
          pickup: ride.pickupAddress,
          dropoff: ride.dropoffAddress,
          comment,
        });

        setShiftEarnings(prev => prev + driverEarning);
        setShiftRides(prev => prev + 1);
        if (isCash) setCashOwed(prev => prev + projoShare);

        setCurrentRide(null);
        setShowLastTrip(true);
        setShowCommentBox(false);
        setTripComment("");
        toast.success(`Trip complete! You earned ${fmt(driverEarning)}`);
      } else {
        setCurrentRide(prev => ({ ...prev, status }));
        const labels = {
          DRIVER_ASSIGNED: "Heading to pickup",
          IN_PROGRESS: "Ride started — en route to dropoff",
        };
        toast.success(labels[status] || `Status: ${status}`);
      }
    } catch { toast.error("Could not update status"); }
  }

  // ── Open navigation ────────────────────────────────────────
  function openNavigation(lat, lng, label) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, "_blank");
  }

  // ── UI helpers ─────────────────────────────────────────────
  const card = { background: BG2, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "1.25rem", marginBottom: "1rem" };
  const btn = (bg, color = "#0a0a0a") => ({
    background: bg, color, border: "none", borderRadius: "10px",
    padding: "12px 20px", fontWeight: "700", fontSize: "14px",
    cursor: "pointer", fontFamily: "'DM Sans',sans-serif", width: "100%",
  });

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Sans',sans-serif", paddingBottom: "6rem" }}>
      <Navbar />
      <div style={{ maxWidth: "500px", margin: "0 auto", padding: "80px 1rem 2rem" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "11px", color: G, fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase" }}>PROJO GROUP</div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.5rem", fontWeight: "800", color: "#f0ede8", margin: "4px 0" }}>
            Driver Dashboard
          </h1>
          <div style={{ fontSize: "13px", color: "#6b6760" }}>Welcome, {user?.name?.split(" ")[0]}</div>
        </div>

        {/* ── Location Warning ── */}
        {locationError && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "1rem", marginBottom: "1rem" }}>
            <div style={{ color: "#f87171", fontWeight: "700", fontSize: "13px", marginBottom: "6px" }}>📍 Location Required</div>
            <div style={{ fontSize: "12px", color: "#f87171", lineHeight: 1.5 }}>{locationError}</div>
            <button onClick={startLocationTracking} style={{ ...btn("#ef4444", "#fff"), marginTop: "10px", padding: "8px 16px", fontSize: "12px", width: "auto" }}>
              Retry Location
            </button>
          </div>
        )}

        {/* ── Online/Offline Toggle ── */}
        <div style={{ ...card, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: online ? "#4ade80" : "#6b6760", boxShadow: online ? "0 0 8px #4ade80" : "none" }} />
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "18px", fontWeight: "800", color: online ? "#4ade80" : "#6b6760" }}>
              {online ? "ONLINE" : "OFFLINE"}
            </div>
            {locationGranted && driverPos && (
              <div style={{ fontSize: "11px", color: "#4ade80" }}>📍 GPS Active</div>
            )}
          </div>
          <button onClick={toggleOnline} disabled={!!currentRide || !!currentDelivery} style={{
            ...btn(online ? "#7f1d1d" : "#166534", online ? "#f87171" : "#4ade80"),
            border: `1px solid ${online ? "#ef4444" : "#4ade80"}`,
          }}>
            {online ? "Go Offline" : "Go Online"}
          </button>
          {(currentRide || currentDelivery) && (
            <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "6px" }}>Complete current trip first</div>
          )}
        </div>

        {/* ── Shift Stats ── */}
        {online && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "1rem" }}>
            {[
              { label: "Shift Earnings", value: fmt(shiftEarnings), icon: "💰", color: G },
              { label: "Trips", value: shiftRides, icon: "🚗", color: "#60a5fa" },
              { label: "Cash to PROJO", value: fmt(cashOwed), icon: "🏦", color: "#f59e0b" },
            ].map(s => (
              <div key={s.label} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "18px", marginBottom: "4px" }}>{s.icon}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", fontWeight: "800", color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "10px", color: "#6b6760", marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Pending Ride Request ── */}
        {pendingRide && !currentRide && !currentDelivery && (
          <div style={{ ...card, border: `1px solid ${G}`, background: "rgba(232,184,75,0.05)", animation: "pulse 1s infinite" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "800", color: G, marginBottom: "12px" }}>
              {pendingRide.type === "delivery" ? "📦 New Delivery Request!" : "🚗 New Ride Request!"}
            </div>
            <div style={{ fontSize: "13px", color: "#f0ede8", marginBottom: "6px" }}>
              <strong style={{ color: "#6b6760" }}>Pickup:</strong> {pendingRide.pickupAddress}
            </div>
            <div style={{ fontSize: "13px", color: "#f0ede8", marginBottom: "12px" }}>
              <strong style={{ color: "#6b6760" }}>Dropoff:</strong> {pendingRide.dropoffAddress}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: "800", color: G, fontFamily: "'Syne',sans-serif" }}>{fmt(pendingRide.totalFare)}</div>
                <div style={{ fontSize: "11px", color: "#6b6760" }}>Total Fare</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#4ade80", fontFamily: "'Syne',sans-serif" }}>{fmt((pendingRide.totalFare || 0) * 0.8)}</div>
                <div style={{ fontSize: "11px", color: "#6b6760" }}>Your Earnings</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: "700", color: pendingRide.paidWithWallet ? "#60a5fa" : "#f59e0b" }}>
                  {pendingRide.paidWithWallet ? "💳 Wallet" : "💵 Cash"}
                </div>
                <div style={{ fontSize: "11px", color: "#6b6760" }}>Payment</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button onClick={acceptRide} style={btn("#166534", "#4ade80")}>✓ Accept</button>
              <button onClick={declineRide} style={{ ...btn("#7f1d1d", "#f87171"), border: "1px solid #ef4444" }}>✗ Decline</button>
            </div>
          </div>
        )}

        {/* ── Active Ride ── */}
        {currentRide && (
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "800", color: G }}>Active Ride</div>
              <div style={{ fontSize: "12px", fontWeight: "700", padding: "4px 10px", borderRadius: "50px", background: `${STATUS_COLOR[currentRide.status]}20`, color: STATUS_COLOR[currentRide.status] }}>
                {currentRide.status?.replace(/_/g, " ")}
              </div>
            </div>

            {/* Addresses */}
            <div style={{ background: BG3, borderRadius: "10px", padding: "12px", marginBottom: "12px" }}>
              <div style={{ fontSize: "12px", marginBottom: "8px" }}>
                <div style={{ color: "#6b6760", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px" }}>Pickup</div>
                <div style={{ color: "#f0ede8" }}>{currentRide.pickupAddress}</div>
              </div>
              <div style={{ height: "1px", background: BORDER, margin: "8px 0" }} />
              <div style={{ fontSize: "12px" }}>
                <div style={{ color: "#6b6760", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px" }}>Dropoff</div>
                <div style={{ color: "#f0ede8" }}>{currentRide.dropoffAddress}</div>
              </div>
            </div>

            {/* Payment info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: G, fontFamily: "'Syne',sans-serif" }}>{fmt(currentRide.totalFare)}</div>
                <div style={{ fontSize: "11px", color: "#6b6760" }}>Your cut: {fmt((currentRide.totalFare || 0) * 0.8)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: currentRide.paidWithWallet ? "#60a5fa" : "#f59e0b" }}>
                  {currentRide.paidWithWallet ? "💳 Paid via Wallet" : "💵 Cash — Collect from passenger"}
                </div>
                {!currentRide.paidWithWallet && (
                  <div style={{ fontSize: "11px", color: "#6b6760" }}>Pay PROJO {fmt((currentRide.totalFare || 0) * 0.2)} after trip</div>
                )}
              </div>
            </div>

            {/* Navigation buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
              <button onClick={() => openNavigation(currentRide.pickupLat, currentRide.pickupLng, "Pickup")} style={{
                background: "#1a3a5c", color: "#60a5fa", border: "1px solid #60a5fa",
                borderRadius: "10px", padding: "10px", fontWeight: "700", fontSize: "12px", cursor: "pointer",
              }}>🗺️ Navigate to Pickup</button>
              <button onClick={() => openNavigation(currentRide.dropoffLat, currentRide.dropoffLng, "Dropoff")} style={{
                background: "#1a3a5c", color: "#4ade80", border: "1px solid #4ade80",
                borderRadius: "10px", padding: "10px", fontWeight: "700", fontSize: "12px", cursor: "pointer",
              }}>🗺️ Navigate to Dropoff</button>
            </div>

            {/* Status action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {currentRide.status === "DRIVER_ASSIGNED" && (
                <button onClick={() => updateRideStatus("IN_PROGRESS")} style={btn("#1a4a2e", "#4ade80")}>
                  🚗 Start Ride — Passenger On Board
                </button>
              )}
              {currentRide.status === "IN_PROGRESS" && !showCommentBox && (
                <button onClick={() => setShowCommentBox(true)} style={btn(G)}>
                  ✅ Complete Trip
                </button>
              )}
              {showCommentBox && (
                <div>
                  <textarea
                    value={tripComment}
                    onChange={e => setTripComment(e.target.value)}
                    placeholder="Add a note about this trip (optional)..."
                    style={{
                      width: "100%", background: BG3, border: `1px solid ${BORDER}`,
                      borderRadius: "8px", color: "#f0ede8", padding: "10px",
                      fontSize: "13px", fontFamily: "'DM Sans',sans-serif",
                      minHeight: "80px", resize: "vertical", boxSizing: "border-box", marginBottom: "8px",
                    }}
                  />
                  <button onClick={() => updateRideStatus("COMPLETED", tripComment)} style={btn("#4ade80")}>
                    ✅ Confirm Trip Completed
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Last Trip Summary ── */}
        {showLastTrip && lastTrip && (
          <div style={{ ...card, border: `1px solid #4ade80`, background: "rgba(74,222,128,0.05)" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "800", color: "#4ade80", marginBottom: "12px" }}>
              ✅ Trip Completed!
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
              <div style={{ background: BG3, borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: "800", color: G, fontFamily: "'Syne',sans-serif" }}>{fmt(lastTrip.driverEarning)}</div>
                <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "4px" }}>Your Earnings</div>
              </div>
              <div style={{ background: BG3, borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: "800", color: lastTrip.isCash ? "#f59e0b" : "#60a5fa", fontFamily: "'Syne',sans-serif" }}>
                  {lastTrip.isCash ? fmt(lastTrip.projoShare) : "R0.00"}
                </div>
                <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "4px" }}>
                  {lastTrip.isCash ? "Cash to PROJO" : "Wallet — Auto settled"}
                </div>
              </div>
            </div>
            {lastTrip.isCash && (
              <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "10px", padding: "12px", marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", color: "#f59e0b", fontWeight: "700" }}>
                  💵 Cash Trip — You owe PROJO {fmt(lastTrip.projoShare)}
                </div>
                <div style={{ fontSize: "11px", color: "#f59e0b", marginTop: "4px" }}>
                  Total cash owed this shift: {fmt(cashOwed)}
                </div>
              </div>
            )}
            <div style={{ fontSize: "12px", color: "#6b6760", marginBottom: "12px" }}>
              <div>{lastTrip.pickup} → {lastTrip.dropoff}</div>
              {lastTrip.comment && <div style={{ marginTop: "4px", fontStyle: "italic" }}>"{lastTrip.comment}"</div>}
            </div>
            <button onClick={() => setShowLastTrip(false)} style={btn(BG3, "#a8a49e")}>
              Done
            </button>
          </div>
        )}

        {/* ── Waiting for rides ── */}
        {online && !currentRide && !currentDelivery && !pendingRide && !showLastTrip && (
          <div style={{ ...card, textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎯</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "700", color: "#f0ede8", marginBottom: "8px" }}>
              Waiting for requests...
            </div>
            <div style={{ fontSize: "12px", color: "#6b6760" }}>
              You're online and will receive ride and delivery requests automatically
            </div>
          </div>
        )}

        {/* ── Offline state ── */}
        {!online && !currentRide && (
          <div style={{ ...card, textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>😴</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "700", color: "#6b6760", marginBottom: "8px" }}>
              You're Offline
            </div>
            <div style={{ fontSize: "12px", color: "#6b6760", marginBottom: "1rem" }}>
              Go online to start receiving ride and delivery requests
            </div>
            <button onClick={() => navigate("/driver/earnings")} style={{ ...btn(BG3, G), width: "auto", padding: "10px 20px" }}>
              📊 View Earnings
            </button>
          </div>
        )}

        {/* ── Today's Earnings Summary ── */}
        <div style={{ ...card }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#6b6760", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Today's Total Earnings</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.5rem", fontWeight: "800", color: G }}>{fmt(todayEarnings + shiftEarnings)}</div>
            </div>
            <button onClick={() => navigate("/driver/earnings")} style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 14px", color: G, fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              View All →
            </button>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(232,184,75,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(232,184,75,0); }
        }
      `}</style>
    </div>
  );
}
