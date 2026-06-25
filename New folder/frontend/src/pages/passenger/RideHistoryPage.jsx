// ============================================================
// PROJO GROUP — Ride History Page
// All past rides with fare, status, rating
// ============================================================
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { rideAPI } from "../../services/api";
import { formatFare, RIDE_STATUS_LABELS } from "../../utils/constants";
import toast from "react-hot-toast";

export default function RideHistoryPage() {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { loadRides(); }, [page]);

  async function loadRides() {
    setLoading(true);
    try {
      const data = await rideAPI.getRideHistory(page);
      setRides(data.rides);
      setTotalPages(data.pages);
    } catch { toast.error("Could not load ride history"); }
    finally { setLoading(false); }
  }

  const statusColor = { COMPLETED: "#4ade80", CANCELLED: "#ef4444" };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a",
      fontFamily: "'DM Sans', sans-serif", paddingBottom: "2rem" }}>

      <div style={{ background: "#111111", borderBottom: "1px solid rgba(232,184,75,0.15)",
        padding: "1rem 1.5rem", display: "flex", alignItems: "center", gap: "12px" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none",
          color: "#a8a49e", cursor: "pointer", fontSize: "18px" }}>←</button>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: "700",
          color: "#e8b84b", fontSize: "1.1rem" }}>Ride History</span>
      </div>

      <div style={{ padding: "1.5rem", maxWidth: "600px", margin: "0 auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "#6b6760", padding: "3rem" }}>Loading...</div>
        ) : rides.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{ fontSize: "48px", marginBottom: "1rem" }}>🚗</div>
            <div style={{ color: "#6b6760", fontSize: "14px" }}>No rides yet. Book your first ride!</div>
            <button onClick={() => navigate("/book")} style={{
              marginTop: "1rem", background: "#e8b84b", color: "#0a0a0a",
              border: "none", borderRadius: "10px", padding: "12px 24px",
              fontWeight: "700", cursor: "pointer",
            }}>Book a Ride</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {rides.map(ride => (
              <div key={ride.id} onClick={() => navigate(`/ride/${ride.id}`)}
                style={{ background: "#111111", border: "1px solid rgba(232,184,75,0.12)",
                  borderRadius: "14px", padding: "1.25rem", cursor: "pointer",
                  transition: "border-color .2s" }}>
                <div style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", marginBottom: "10px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700",
                    color: statusColor[ride.status] || "#a8a49e",
                    letterSpacing: "0.5px", textTransform: "uppercase" }}>
                    {RIDE_STATUS_LABELS[ride.status] || ride.status}
                  </div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.2rem",
                    fontWeight: "800", color: "#e8b84b" }}>
                    {formatFare(ride.totalFare)}
                  </div>
                </div>
                <div style={{ fontSize: "13px", color: "#f0ede8", marginBottom: "4px" }}>
                  📍 {ride.pickupAddress}
                </div>
                <div style={{ fontSize: "13px", color: "#a8a49e", marginBottom: "10px" }}>
                  🏁 {ride.dropoffAddress}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between",
                  fontSize: "12px", color: "#6b6760" }}>
                  <span>{new Date(ride.createdAt).toLocaleDateString("en-ZA", {
                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  {ride.rating && <span>{"⭐".repeat(ride.rating.stars)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "1.5rem" }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{
              background: "#1a1a1a", border: "1px solid rgba(232,184,75,0.2)",
              color: "#a8a49e", borderRadius: "8px", padding: "8px 16px",
              cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1,
            }}>← Prev</button>
            <span style={{ color: "#6b6760", fontSize: "13px", alignSelf: "center" }}>
              {page} / {totalPages}
            </span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{
              background: "#1a1a1a", border: "1px solid rgba(232,184,75,0.2)",
              color: "#a8a49e", borderRadius: "8px", padding: "8px 16px",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              opacity: page === totalPages ? 0.4 : 1,
            }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
