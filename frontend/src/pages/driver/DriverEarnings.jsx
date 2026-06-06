// ============================================================
// PROJO GROUP — Driver Earnings Page
// Daily/weekly/monthly ZAR earnings breakdown
// Driver keeps 80% · PROJO GROUP 20%
// ============================================================
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/ui/Navbar";
import { driverAPI } from "../../services/api";
import { formatFare } from "../../utils/constants";
import toast from "react-hot-toast";

const G = "#e8b84b";
const PERIODS = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

export default function DriverEarnings() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("week");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadEarnings(); }, [period]);

  async function loadEarnings() {
    setLoading(true);
    try {
      const res = await driverAPI.getEarnings(period);
      setData(res);
    } catch { toast.error("Could not load earnings"); }
    finally { setLoading(false); }
  }

  const totalEarned = data?.totalEarned || 0;
  const totalRides = data?.totalRides || 0;
  const avgPerRide = data?.avgPerRide || 0;
  const rides = data?.rides || [];

  const zone1Count = rides.filter(r => r.zone === "ZONE_1_FLAT").length;
  const zone2Count = rides.filter(r => r.zone === "ZONE_2_PER_KM").length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a",
      fontFamily: "'DM Sans',sans-serif", paddingTop: "64px" }}>
      <Navbar />
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
          <button onClick={() => navigate("/driver")} style={{ background: "none",
            border: "none", color: "#a8a49e", cursor: "pointer", fontSize: "20px" }}>←</button>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.5rem",
            fontWeight: "800", color: "#f0ede8" }}>Earnings</h1>
        </div>

        {/* Period tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }}>
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              style={{ padding: "8px 20px", borderRadius: "50px", fontSize: "13px",
                fontWeight: "700", cursor: "pointer", transition: "all .15s",
                background: period === p.key ? G : "#1a1a1a",
                color: period === p.key ? "#0a0a0a" : "#a8a49e",
                border: period === p.key ? "none" : "1px solid rgba(232,184,75,0.2)" }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "1.5rem" }}>
          {[
            { label: "Total Earned", value: formatFare(totalEarned), color: G },
            { label: "Rides Done", value: totalRides, color: "#f0ede8" },
            { label: "Avg Per Ride", value: formatFare(avgPerRide), color: G },
          ].map(card => (
            <div key={card.label} style={{ background: "#111",
              border: "1px solid rgba(232,184,75,0.15)", borderRadius: "14px", padding: "1.25rem" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#6b6760",
                letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "6px" }}>{card.label}</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.6rem",
                fontWeight: "800", color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* Zone breakdown */}
        <div style={{ background: "#111", border: "1px solid rgba(232,184,75,0.12)",
          borderRadius: "14px", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "13px",
            fontWeight: "700", color: "#f0ede8", marginBottom: "1rem" }}>Zone Breakdown</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ background: "rgba(232,184,75,0.06)", borderRadius: "10px",
              padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "800", color: G,
                fontFamily: "'Syne',sans-serif" }}>{zone1Count}</div>
              <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "4px" }}>
                Zone 1 (R48/ride)
              </div>
            </div>
            <div style={{ background: "rgba(232,184,75,0.04)", borderRadius: "10px",
              padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "800", color: G,
                fontFamily: "'Syne',sans-serif" }}>{zone2Count}</div>
              <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "4px" }}>
                Zone 2 (R7.50/km)
              </div>
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "#3d3d3d", marginTop: "12px", textAlign: "center" }}>
            You keep 80% · PROJO GROUP commission 20%
          </div>
        </div>

        {/* Ride list */}
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "13px",
          fontWeight: "700", color: "#f0ede8", marginBottom: "10px" }}>Recent Rides</div>
        {loading ? (
          <div style={{ color: "#6b6760", textAlign: "center", padding: "2rem" }}>Loading...</div>
        ) : rides.length === 0 ? (
          <div style={{ color: "#6b6760", textAlign: "center", padding: "2rem", fontSize: "14px" }}>
            No completed rides in this period.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {rides.map((ride, i) => (
              <div key={i} style={{ background: "#111",
                border: "1px solid rgba(232,184,75,0.1)", borderRadius: "12px",
                padding: "12px 16px", display: "flex",
                justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "13px", color: "#a8a49e", marginBottom: "2px" }}>
                    {ride.zone === "ZONE_1_FLAT" ? "🏙️ Rustenburg Area" : "🗺️ Outside Rustenburg"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#6b6760" }}>
                    {new Date(ride.rideCompletedAt).toLocaleDateString("en-ZA", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.1rem",
                    fontWeight: "800", color: "#4ade80" }}>+{formatFare(ride.driverPayout)}</div>
                  <div style={{ fontSize: "11px", color: "#3d3d3d" }}>
                    fare {formatFare(ride.totalFare)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
