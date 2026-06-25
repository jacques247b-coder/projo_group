// ============================================================
// PROJO GROUP — Driver Dashboard
// Go online/offline, accept rides, live earnings
// ============================================================
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import Navbar from "../../components/ui/Navbar";
import ProjoMap from "../../components/map/ProjoMap";
import { driverAPI, rideAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { formatFare } from "../../utils/constants";

const G = "#e8b84b";

export default function DriverDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [online, setOnline] = useState(false);
  const [currentRide, setCurrentRide] = useState(null);
  const [pendingRide, setPendingRide] = useState(null);
  const [driverPos, setDriverPos] = useState(null);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [ridesCount, setRidesCount] = useState(0);
  const socketRef = useRef(null);
  const watchRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("projo_token");
    const sock = io(process.env.REACT_APP_API_URL?.replace("/api","") || "http://localhost:5000",
      { auth: { token } });
    socketRef.current = sock;

    sock.on("connect", () => console.log("[PROJO Driver] Socket connected"));

    // New ride request comes in
    sock.on("ride:new_request", (ride) => {
      setPendingRide(ride);
      toast("🚗 New ride request!", { duration:15000, icon:"🔔" });
    });

    // Earnings update
    driverAPI.getEarnings("today").then(e => {
      setTodayEarnings(e.totalEarnings || 0);
      setRidesCount(e.ridesCompleted || 0);
    }).catch(()=>{});

    return () => { sock.disconnect(); stopLocationTracking(); };
  }, []);

  function startLocationTracking() {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, heading } = pos.coords;
        setDriverPos({ lat, lng });
        socketRef.current?.emit("driver:location_update", { lat, lng, heading });
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy:true, timeout:10000, maximumAge:5000 }
    );
  }

  function stopLocationTracking() {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
  }

  async function toggleOnline() {
    const newStatus = online ? "OFFLINE" : "ONLINE";
    try {
      await driverAPI.updateStatus(newStatus);
      socketRef.current?.emit("driver:toggle_status", { status: newStatus });
      setOnline(!online);
      if (!online) { startLocationTracking(); toast.success("You are now ONLINE 🟢"); }
      else { stopLocationTracking(); toast("You are now OFFLINE ⚫"); }
    } catch { toast.error("Failed to update status"); }
  }

  async function acceptRide() {
    if (!pendingRide) return;
    try {
      await rideAPI.acceptRide(pendingRide.id);
      setCurrentRide(pendingRide);
      setPendingRide(null);
      toast.success("Ride accepted! Head to pickup.");
    } catch { toast.error("Failed to accept ride"); }
  }

  async function updateStatus(status) {
    if (!currentRide) return;
    try {
      await rideAPI.updateStatus(currentRide.id, status);
      if (status === "COMPLETED") {
        setTodayEarnings(e => e + (currentRide.driverPayout || 48));
        setRidesCount(c => c+1);
        setCurrentRide(null);
        toast.success("Ride completed! Great work 🌟");
      } else {
        setCurrentRide(r => ({ ...r, status }));
        toast.success(`Status updated: ${status.replace("_"," ")}`);
      }
    } catch { toast.error("Failed to update status"); }
  }

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a",
      fontFamily:"'DM Sans',sans-serif", paddingTop:"64px" }}>
      <Navbar />
      <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"2rem 1.5rem",
        display:"grid", gridTemplateColumns:"1fr 360px", gap:"2rem" }}>

        {/* Map */}
        <div>
          <ProjoMap height="500px" driverPos={driverPos}
            pickup={currentRide ? { lat:currentRide.pickupLat, lng:currentRide.pickupLng } : null}
            dropoff={currentRide ? { lat:currentRide.dropoffLat, lng:currentRide.dropoffLng } : null} />
        </div>

        {/* Controls */}
        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>

          {/* Online toggle */}
          <div style={{ background:"#111", border:`1px solid ${online ? "rgba(74,222,128,0.3)" : "rgba(232,184,75,0.12)"}`,
            borderRadius:"16px", padding:"1.5rem", textAlign:"center" }}>
            <div style={{ fontSize:"12px", fontWeight:"700", color:"#6b6760",
              letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:"12px" }}>
              Driver Status
            </div>
            <div onClick={toggleOnline} style={{
              width:"80px", height:"80px", borderRadius:"50%", margin:"0 auto 12px",
              background: online ? "rgba(74,222,128,0.15)" : "#1a1a1a",
              border:`3px solid ${online ? "#4ade80" : "#333"}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"28px", cursor:"pointer", transition:"all .3s",
              boxShadow: online ? "0 0 24px rgba(74,222,128,0.3)" : "none",
            }}>{online ? "🟢" : "⚫"}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.2rem",
              fontWeight:"800", color: online ? "#4ade80" : "#6b6760" }}>
              {online ? "ONLINE" : "OFFLINE"}
            </div>
            <div style={{ fontSize:"12px", color:"#6b6760", marginTop:"4px" }}>
              {online ? "Accepting ride requests" : "Tap to go online"}
            </div>
          </div>

          {/* Today's earnings */}
          <div style={{ background:"linear-gradient(135deg,rgba(232,184,75,0.1),rgba(232,184,75,0.03))",
            border:"1px solid rgba(232,184,75,0.25)", borderRadius:"16px", padding:"1.25rem" }}>
            <div style={{ fontSize:"11px", fontWeight:"700", color:"#6b6760",
              letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:"6px" }}>
              Today's Earnings
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"2.2rem",
              fontWeight:"800", color:G }}>{formatFare(todayEarnings)}</div>
            <div style={{ fontSize:"12px", color:"#a8a49e", marginTop:"4px" }}>
              {ridesCount} ride{ridesCount!==1?"s":""} completed today
            </div>
          </div>

          {/* Pending ride request */}
          {pendingRide && (
            <div style={{ background:"rgba(232,184,75,0.08)",
              border:"2px solid #e8b84b", borderRadius:"16px", padding:"1.25rem",
              animation:"pulse 1s infinite" }}>
              <div style={{ fontSize:"13px", fontWeight:"800", color:G,
                marginBottom:"8px" }}>🔔 NEW RIDE REQUEST</div>
              <div style={{ fontSize:"12px", color:"#f0ede8", marginBottom:"4px" }}>
                📍 {pendingRide.pickupAddress}
              </div>
              <div style={{ fontSize:"12px", color:"#a8a49e", marginBottom:"12px" }}>
                🏁 {pendingRide.dropoffAddress}
              </div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.5rem",
                fontWeight:"800", color:G, marginBottom:"12px" }}>
                {formatFare(pendingRide.totalFare)}
                <span style={{ fontSize:"13px", color:"#a8a49e", fontWeight:"400" }}>
                  {" "}→ you earn {formatFare(pendingRide.driverPayout)}
                </span>
              </div>
              <div style={{ display:"flex", gap:"8px" }}>
                <button onClick={acceptRide} style={{ flex:1, background:G, color:"#0a0a0a",
                  border:"none", borderRadius:"10px", padding:"12px",
                  fontSize:"14px", fontWeight:"800", cursor:"pointer" }}>✓ Accept</button>
                <button onClick={()=>setPendingRide(null)} style={{ flex:1,
                  background:"#1a1a1a", color:"#f87171",
                  border:"1px solid rgba(248,113,113,0.3)", borderRadius:"10px",
                  padding:"12px", fontSize:"14px", fontWeight:"700", cursor:"pointer" }}>✗ Decline</button>
              </div>
            </div>
          )}

          {/* Active ride controls */}
          {currentRide && (
            <div style={{ background:"#111", border:"1px solid rgba(232,184,75,0.2)",
              borderRadius:"16px", padding:"1.25rem" }}>
              <div style={{ fontSize:"13px", fontWeight:"700", color:G,
                marginBottom:"12px" }}>🚗 Active Ride</div>
              <div style={{ fontSize:"12px", color:"#a8a49e", marginBottom:"12px" }}>
                <div>📍 {currentRide.pickupAddress}</div>
                <div style={{ marginTop:"4px" }}>🏁 {currentRide.dropoffAddress}</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {[
                  { s:"ARRIVED_AT_PICKUP", label:"✅ Arrived at Pickup" },
                  { s:"IN_PROGRESS", label:"🚗 Start Ride" },
                  { s:"COMPLETED", label:"🏁 Complete Ride" },
                ].map(b=>(
                  <button key={b.s} onClick={()=>updateStatus(b.s)} style={{
                    background:"rgba(232,184,75,0.1)", color:G,
                    border:"1px solid rgba(232,184,75,0.25)", borderRadius:"10px",
                    padding:"10px", fontSize:"13px", fontWeight:"700", cursor:"pointer" }}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <button onClick={()=>navigate("/driver/earnings")} style={{
            background:"#111", color:"#a8a49e",
            border:"1px solid rgba(232,184,75,0.12)", borderRadius:"12px",
            padding:"12px", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>
            📊 View Full Earnings
          </button>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(232,184,75,0.4)}50%{box-shadow:0 0 0 10px rgba(232,184,75,0)}}`}</style>
    </div>
  );
}
