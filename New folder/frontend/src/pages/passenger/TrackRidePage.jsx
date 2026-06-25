// ============================================================
// PROJO GROUP — Track Ride Page
// Real-time driver tracking with Socket.io + Leaflet
// ============================================================
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import Navbar from "../../components/ui/Navbar";
import { LiveTrackingMap } from "../../components/map";
import { rideAPI } from "../../services/api";
import { RIDE_STATUS_LABELS, formatFare, CONTACT } from "../../utils/constants";

export default function TrackRidePage() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState("REQUESTED");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load ride details
    rideAPI.getRideById(rideId).then(r => {
      setRide(r.ride);
      setStatus(r.ride.status);
      setLoading(false);
    }).catch(() => { toast.error("Ride not found"); navigate("/book"); });

    // Connect Socket.io
    const token = localStorage.getItem("projo_token");
    const sock = io(process.env.REACT_APP_API_URL?.replace("/api","") || "http://localhost:5000",
      { auth: { token } });
    setSocket(sock);

    sock.on("ride:status_changed", (data) => {
      if (data.rideId !== rideId) return;
      setStatus(data.status);
      const labels = { DRIVER_ASSIGNED:"Driver found! On the way 🚗",
        ARRIVED_AT_PICKUP:"Your driver has arrived!", IN_PROGRESS:"Ride started! Enjoy your trip.",
        COMPLETED:"Ride completed. Thank you! 🌟", CANCELLED:"Ride was cancelled." };
      if (labels[data.status]) toast(labels[data.status], { icon: "🚗" });
      if (data.status === "COMPLETED") setTimeout(() => navigate("/rides"), 3000);
    });

    return () => sock.disconnect();
  }, [rideId]);

  if (loading) return <Loading />;

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a",
      fontFamily:"'DM Sans',sans-serif", paddingTop:"64px" }}>
      <Navbar />
      <div style={{ maxWidth:"900px", margin:"0 auto", padding:"2rem 1.5rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          marginBottom:"1.5rem" }}>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.5rem",
            fontWeight:"800", color:"#f0ede8" }}>Live Tracking</h1>
          <div style={{ display:"flex", gap:"8px" }}>
            {ride?.shareToken && (
              <button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/share/${ride.shareToken}`);toast.success("Share link copied!");}}
                style={{ background:"#1a1a1a", border:"1px solid rgba(232,184,75,0.2)",
                  color:"#a8a49e", borderRadius:"8px", padding:"8px 14px",
                  fontSize:"12px", fontWeight:"600", cursor:"pointer" }}>🔗 Share Ride</button>
            )}
            <button onClick={()=>window.open(`tel:10111`)}
              style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)",
                color:"#f87171", borderRadius:"8px", padding:"8px 14px",
                fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>🆘 SOS</button>
          </div>
        </div>
        <LiveTrackingMap ride={ride} socket={socket} rideStatus={status} />
        {status === "COMPLETED" && (
          <div style={{ marginTop:"1rem", background:"rgba(74,222,128,0.08)",
            border:"1px solid rgba(74,222,128,0.2)", borderRadius:"12px",
            padding:"1rem", textAlign:"center" }}>
            <div style={{ fontSize:"16px", fontWeight:"700", color:"#4ade80" }}>
              ✅ Ride Completed!
            </div>
            <div style={{ fontSize:"13px", color:"#a8a49e", marginTop:"4px" }}>
              Fare: {formatFare(ride?.totalFare || 60)} · Redirecting to history...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Loading() {
  return <div style={{ minHeight:"100vh", background:"#0a0a0a", display:"flex",
    alignItems:"center", justifyContent:"center", color:"#e8b84b",
    fontFamily:"'Syne',sans-serif", fontSize:"14px", letterSpacing:"1px" }}>
    Loading ride...</div>;
}
