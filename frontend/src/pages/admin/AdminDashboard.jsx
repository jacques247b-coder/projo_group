// ============================================================
// PROJO GROUP — Admin Dashboard
// Live ride monitoring, driver management, surge zones
// ============================================================
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Navbar from "../../components/ui/Navbar";
import { AdminLiveMap } from "../../components/map";
import { adminAPI } from "../../services/api";
import toast from "react-hot-toast";

const G = "#e8b84b";

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background:"#111", border:"1px solid rgba(232,184,75,0.12)",
      borderRadius:"14px", padding:"1.25rem" }}>
      <div style={{ fontSize:"11px", fontWeight:"700", color:"#6b6760",
        letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:"6px" }}>{label}</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"2rem",
        fontWeight:"800", color: color||G }}>{value}</div>
      {sub && <div style={{ fontSize:"12px", color:"#6b6760", marginTop:"4px" }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [surgeZones, setSurgeZones] = useState([]);
  const [socket, setSocket] = useState(null);
  const [tab, setTab] = useState("map");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("projo_token");
    const sock = io(process.env.REACT_APP_API_URL?.replace("/api","") || "http://localhost:5000",
      { auth: { token } });
    setSocket(sock);

    adminAPI.getDashboardStats().then(s => { setStats(s); setLoading(false); }).catch(()=>setLoading(false));
    adminAPI.getAllDrivers().then(d => setDrivers(d.drivers||[])).catch(()=>{});
    adminAPI.getSurgeZones().then(z => setSurgeZones(z.zones||[])).catch(()=>{});

    return () => sock.disconnect();
  }, []);

  async function approveDriver(id) {
    try {
      await adminAPI.approveDriver(id);
      setDrivers(ds => ds.map(d => d.id===id ? {...d, approvalStatus:"APPROVED"} : d));
      toast.success("Driver approved!");
    } catch { toast.error("Failed to approve"); }
  }

  async function toggleSurge(zone) {
    try {
      await adminAPI.updateSurgeZone(zone.id, { isActive:!zone.isActive });
      setSurgeZones(zs => zs.map(z => z.id===zone.id ? {...z, isActive:!z.isActive} : z));
      toast.success(`Surge ${zone.isActive?"disabled":"enabled"} for ${zone.name}`);
    } catch { toast.error("Failed to update surge"); }
  }

  const tabs = ["map","drivers","surge","stats"];

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a",
      fontFamily:"'DM Sans',sans-serif", paddingTop:"64px" }}>
      <Navbar />
      <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"2rem 1.5rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          marginBottom:"1.5rem" }}>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.6rem",
            fontWeight:"800", color:"#f0ede8" }}>Admin Dashboard</h1>
          <div style={{ display:"flex", gap:"6px" }}>
            {tabs.map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{
                background: tab===t ? "rgba(232,184,75,0.15)" : "#111",
                border:`1px solid ${tab===t ? G : "rgba(232,184,75,0.12)"}`,
                color: tab===t ? G : "#a8a49e",
                borderRadius:"8px", padding:"7px 16px", fontSize:"12px",
                fontWeight:"700", cursor:"pointer", textTransform:"capitalize" }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        {stats && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)",
            gap:"12px", marginBottom:"1.5rem" }}>
            <StatCard label="Active Rides" value={stats.activeRides||0} />
            <StatCard label="Online Drivers" value={stats.onlineDrivers||0} color="#4ade80" />
            <StatCard label="Today Revenue" value={`R${(stats.todayRevenue||0).toFixed(0)}`} />
            <StatCard label="Total Users" value={stats.totalUsers||0} color="#60a5fa" />
          </div>
        )}

        {/* Live Map tab */}
        {tab==="map" && <AdminLiveMap socket={socket} />}

        {/* Drivers tab */}
        {tab==="drivers" && (
          <div style={{ background:"#111", border:"1px solid rgba(232,184,75,0.12)",
            borderRadius:"16px", overflow:"hidden" }}>
            <div style={{ padding:"1rem 1.5rem", borderBottom:"1px solid rgba(232,184,75,0.08)",
              fontSize:"14px", fontWeight:"700", color:"#f0ede8" }}>All Drivers</div>
            {drivers.map(d=>(
              <div key={d.id} style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", padding:"1rem 1.5rem",
                borderBottom:"1px solid rgba(232,184,75,0.06)" }}>
                <div>
                  <div style={{ fontSize:"14px", fontWeight:"600", color:"#f0ede8" }}>
                    {d.user?.name}</div>
                  <div style={{ fontSize:"12px", color:"#6b6760" }}>
                    {d.user?.phone} · {d.status}
                  </div>
                  <div style={{ fontSize:"11px", marginTop:"2px", fontWeight:"700",
                    color: d.approvalStatus==="APPROVED" ? "#4ade80" :
                           d.approvalStatus==="PENDING" ? G : "#f87171" }}>
                    {d.approvalStatus}
                  </div>
                </div>
                <div style={{ display:"flex", gap:"8px" }}>
                  {d.approvalStatus==="PENDING" && (
                    <>
                      <button onClick={()=>approveDriver(d.id)} style={{
                        background:"rgba(74,222,128,0.1)", color:"#4ade80",
                        border:"1px solid rgba(74,222,128,0.3)", borderRadius:"8px",
                        padding:"6px 14px", fontSize:"12px", fontWeight:"700",
                        cursor:"pointer" }}>Approve</button>
                      <button style={{
                        background:"rgba(248,113,113,0.1)", color:"#f87171",
                        border:"1px solid rgba(248,113,113,0.3)", borderRadius:"8px",
                        padding:"6px 14px", fontSize:"12px", fontWeight:"700",
                        cursor:"pointer" }}>Reject</button>
                    </>
                  )}
                  <div style={{ fontSize:"13px", fontWeight:"700", color:G }}>
                    R{(d.totalEarnings||0).toFixed(0)} earned
                  </div>
                </div>
              </div>
            ))}
            {drivers.length===0 && (
              <div style={{ padding:"3rem", textAlign:"center", fontSize:"13px",
                color:"#6b6760" }}>No drivers registered yet.</div>
            )}
          </div>
        )}

        {/* Surge zones tab */}
        {tab==="surge" && (
          <div>
            <div style={{ fontSize:"13px", color:"#a8a49e", marginBottom:"1rem" }}>
              Control surge pricing per Rustenburg suburb. Active zones apply 15% increase (R60→R70).
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"10px" }}>
              {surgeZones.map(zone=>(
                <div key={zone.id} style={{ background:"#111",
                  border:`1px solid ${zone.isActive ? "rgba(232,184,75,0.4)" : "rgba(232,184,75,0.12)"}`,
                  borderRadius:"12px", padding:"1rem",
                  display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:"14px", fontWeight:"700", color:"#f0ede8" }}>
                      {zone.name}</div>
                    <div style={{ fontSize:"12px", color: zone.isActive ? G : "#6b6760",
                      fontWeight:"600" }}>
                      {zone.isActive ? `SURGE ACTIVE — ×${zone.multiplier}` : "No surge"}
                    </div>
                  </div>
                  <div onClick={()=>toggleSurge(zone)} style={{
                    width:"44px", height:"24px", borderRadius:"12px",
                    background: zone.isActive ? G : "#333",
                    cursor:"pointer", position:"relative", transition:"background .2s" }}>
                    <div style={{ position:"absolute", top:"3px",
                      left: zone.isActive ? "22px" : "3px",
                      width:"18px", height:"18px", borderRadius:"50%",
                      background:"#fff", transition:"left .2s" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats tab */}
        {tab==="stats" && stats && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
            {[
              ["Total Rides", stats.totalRides||0],
              ["Completed Rides", stats.completedRides||0],
              ["Cancelled Rides", stats.cancelledRides||0],
              ["Total Drivers", stats.totalDrivers||0],
              ["Pending Approvals", stats.pendingApprovals||0],
              ["Total Revenue (ZAR)", `R${(stats.totalRevenue||0).toFixed(2)}`],
            ].map(([l,v])=>(
              <StatCard key={l} label={l} value={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
