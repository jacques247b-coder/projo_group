// PROJO GROUP — Business Growth & Analytics Dashboard
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G = "#e8b84b";
const BG = "#0a0a0a";
const BG2 = "#111111";
const BG3 = "#1a1a1a";
const BORDER = "rgba(232,184,75,0.15)";
const COLORS = [G, "#60a5fa", "#4ade80", "#f59e0b", "#a78bfa", "#f87171", "#34d399"];

const PERIODS = [
  { label: "7 Days",  value: "7"  },
  { label: "30 Days", value: "30" },
  { label: "90 Days", value: "90" },
  { label: "365 Days",value: "365"},
];

function fmt(n) { return `R${(parseFloat(n) || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function pct(n) { return `${n > 0 ? "+" : ""}${n}%`; }

function StatCard({ icon, label, value, sub, growth, color = G }) {
  return (
    <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1.25rem", flex: "1 1 160px" }}>
      <div style={{ fontSize: "24px", marginBottom: "8px" }}>{icon}</div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.5rem", fontWeight: "800", color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "12px", color: "#6b6760", marginTop: "6px" }}>{label}</div>
      {sub && <div style={{ fontSize: "11px", color: "#4a3030", marginTop: "2px" }}>{sub}</div>}
      {growth !== undefined && (
        <div style={{ fontSize: "11px", marginTop: "6px", color: growth >= 0 ? "#4ade80" : "#f87171", fontWeight: "700" }}>
          {growth >= 0 ? "▲" : "▼"} {Math.abs(growth)}% vs prev period
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "10px 14px" }}>
      <div style={{ fontSize: "12px", color: G, fontWeight: "700", marginBottom: "6px" }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: "12px", color: p.color, marginBottom: "2px" }}>
          {p.name}: R{(p.value || 0).toFixed(2)}
        </div>
      ))}
    </div>
  );
};

export default function AdminAnalyticsPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("30");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/analytics?period=${period}`);
      setData(res);
    } catch { toast.error("Could not load analytics"); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  async function exportReport() {
    setExporting(true);
    try {
      const token = localStorage.getItem("projo_token");
      const url = `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/admin/analytics/export?period=${period}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `PROJO_Analytics_${period}days_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast.success("Report downloaded!");
    } catch { toast.error("Could not export report"); }
    finally { setExporting(false); }
  }

  const s = data?.summary || {};
  const categoryData = Object.entries(data?.categoryRevenue || {}).map(([name, value]) => ({ name, value }));
  const paymentData = [
    { name: "Wallet", value: s.walletRides || 0, color: "#60a5fa" },
    { name: "Cash", value: s.cashRides || 0, color: G },
  ];

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Sans',sans-serif", paddingBottom: "4rem" }}>
      <Navbar />
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "80px 1rem 2rem" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <button onClick={() => navigate("/admin")} style={{ background: "none", border: "none", color: "#6b6760", cursor: "pointer", fontSize: "13px", marginBottom: "6px", padding: 0 }}>← Back to Admin</button>
            <div style={{ fontSize: "11px", color: G, fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase" }}>PROJO GROUP</div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.8rem", fontWeight: "800", color: "#f0ede8", margin: "4px 0" }}>Business Growth</h1>
            <div style={{ fontSize: "13px", color: "#6b6760" }}>Revenue, profits, stats and performance</div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {/* Period selector */}
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)} style={{
                background: period === p.value ? "rgba(232,184,75,0.15)" : BG2,
                border: `1px solid ${period === p.value ? G : BORDER}`,
                borderRadius: "8px", padding: "8px 14px",
                color: period === p.value ? G : "#6b6760",
                fontSize: "12px", fontWeight: "700", cursor: "pointer",
              }}>{p.label}</button>
            ))}
            <button onClick={exportReport} disabled={exporting} style={{
              background: "#166534", border: "1px solid #4ade80", borderRadius: "8px",
              padding: "8px 16px", color: "#4ade80", fontSize: "12px",
              fontWeight: "700", cursor: "pointer",
            }}>
              {exporting ? "⏳..." : "📥 Export Excel"}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#6b6760" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📊</div>
            <div>Loading analytics...</div>
          </div>
        ) : (
          <>
            {/* ── Key Metrics ── */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "1.5rem" }}>
              <StatCard icon="💰" label="Total Revenue" value={fmt(s.totalRevenue)} growth={s.revenueGrowth} />
              <StatCard icon="🏦" label="PROJO Profit" value={fmt(s.projoRevenue)} sub="After driver payouts" color="#4ade80" />
              <StatCard icon="🚗" label="Rides Revenue" value={fmt(s.rideRevenue)} sub={`${s.totalRides} completed rides`} color="#60a5fa" />
              <StatCard icon="📦" label="Delivery Revenue" value={fmt(s.deliveryRevenue)} sub={`${s.totalDeliveries} deliveries`} color="#a78bfa" />
              <StatCard icon="🛠️" label="Services Revenue" value={fmt(s.serviceRevenue)} sub={`${s.totalServices} orders`} color="#f59e0b" />
              <StatCard icon="👥" label="New Customers" value={s.newUsers} sub={`${s.totalUsers} total`} color="#4ade80" />
              <StatCard icon="💸" label="Avg Ride Fare" value={fmt(s.avgFare)} />
              <StatCard icon="✅" label="Completion Rate" value={`${s.completionRate}%`} sub={`${s.cancelledRides} cancelled`} color={s.completionRate >= 80 ? "#4ade80" : "#f59e0b"} />
              <StatCard icon="🛍️" label="Product Orders" value={s.productOrders || 0} sub={`${s.totalProducts} active products`} color="#34d399" />
              <StatCard icon="💎" label="Product Revenue" value={fmt(s.productRevenue)} color="#34d399" />
            </div>

            {/* ── Revenue Over Time ── */}
            <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", fontWeight: "800", color: G, marginBottom: "1rem" }}>
                📈 Revenue Over Time
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data?.dailyData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,184,75,0.08)" />
                  <XAxis dataKey="date" tick={{ fill: "#6b6760", fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: "#6b6760", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `R${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px", color: "#6b6760" }} />
                  <Line type="monotone" dataKey="total" stroke={G} strokeWidth={2.5} dot={false} name="Total" />
                  <Line type="monotone" dataKey="rides" stroke="#60a5fa" strokeWidth={1.5} dot={false} name="Rides" />
                  <Line type="monotone" dataKey="deliveries" stroke="#a78bfa" strokeWidth={1.5} dot={false} name="Deliveries" />
                  <Line type="monotone" dataKey="services" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Services" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* ── Daily Bar Chart ── */}
            <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", fontWeight: "800", color: G, marginBottom: "1rem" }}>
                📊 Daily Revenue Breakdown
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.dailyData || []} barSize={period === "7" ? 40 : period === "30" ? 16 : 8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,184,75,0.08)" />
                  <XAxis dataKey="date" tick={{ fill: "#6b6760", fontSize: 10 }} tickLine={false} interval={period === "365" ? 30 : period === "90" ? 6 : 0} />
                  <YAxis tick={{ fill: "#6b6760", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `R${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px", color: "#6b6760" }} />
                  <Bar dataKey="rides" fill="#60a5fa" name="Rides" radius={[2,2,0,0]} />
                  <Bar dataKey="deliveries" fill="#a78bfa" name="Deliveries" radius={[2,2,0,0]} />
                  <Bar dataKey="services" fill="#f59e0b" name="Services" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ── Pie Charts Row ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "1.5rem" }}>

              {/* Payment Methods */}
              <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1.25rem" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", fontWeight: "800", color: G, marginBottom: "1rem" }}>
                  💳 Payment Methods
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={paymentData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      {paymentData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} rides`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
                  <div style={{ fontSize: "12px", color: "#60a5fa" }}>💳 Wallet: {s.walletRides}</div>
                  <div style={{ fontSize: "12px", color: G }}>💵 Cash: {s.cashRides}</div>
                </div>
              </div>

              {/* Revenue Split */}
              <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1.25rem" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", fontWeight: "800", color: G, marginBottom: "1rem" }}>
                  🥧 Revenue Split
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={[
                      { name: "Rides", value: s.rideRevenue || 0 },
                      { name: "Deliveries", value: s.deliveryRevenue || 0 },
                      { name: "Services", value: s.serviceRevenue || 0 },
                    ]} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent*100).toFixed(0)}%` : ""} labelLine={false}>
                      {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [fmt(v), ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Category Revenue ── */}
            {categoryData.length > 0 && (
              <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1.25rem", marginBottom: "1.5rem" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", fontWeight: "800", color: G, marginBottom: "1rem" }}>
                  🛠️ Revenue by Service Category
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={categoryData} layout="vertical" barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,184,75,0.08)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#6b6760", fontSize: 10 }} tickFormatter={v => `R${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#a8a49e", fontSize: 11 }} width={140} />
                    <Tooltip formatter={(v) => [fmt(v), "Revenue"]} />
                    <Bar dataKey="value" fill={G} radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ── Top Products ── */}
            {data?.topProducts?.length > 0 && (
              <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1.25rem", marginBottom: "1.5rem" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", fontWeight: "800", color: G, marginBottom: "1rem" }}>
                  🛍️ Top Selling Products
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {data.topProducts.map((p, i) => (
                    <div key={p.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: BG3, borderRadius: "10px", padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", fontWeight: "800", color: i === 0 ? G : "#6b6760", width: "24px" }}>#{i+1}</div>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: "700", color: "#f0ede8" }}>{p.name}</div>
                          <div style={{ fontSize: "11px", color: "#6b6760" }}>{p.orders} order{p.orders !== 1 ? "s" : ""}</div>
                        </div>
                      </div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", fontWeight: "800", color: "#34d399" }}>{fmt(p.revenue)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Low Stock Alert ── */}
            {data?.lowStockProducts?.length > 0 && (
              <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "16px", padding: "1.25rem", marginBottom: "1.5rem" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", fontWeight: "800", color: "#f59e0b", marginBottom: "1rem" }}>
                  ⚠️ Low Stock Alert
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {data.lowStockProducts.map(p => (
                    <div key={p.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: BG3, borderRadius: "10px", padding: "10px 14px" }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#f0ede8" }}>{p.name}</div>
                        <div style={{ fontSize: "11px", color: "#6b6760" }}>{p.category}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "13px", fontWeight: "800", color: p.stockQty === 0 ? "#ef4444" : "#f59e0b" }}>{p.stockQty} left</div>
                        <div style={{ fontSize: "11px", color: "#6b6760" }}>{fmt(p.priceZar)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Profit Summary ── */}
            <div style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "16px", padding: "1.25rem" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", fontWeight: "800", color: "#4ade80", marginBottom: "1rem" }}>
                🏦 PROJO GROUP Profit Summary
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { label: "Ride Commission (20%)", value: fmt((s.rideRevenue || 0) * 0.2), color: "#60a5fa" },
                  { label: "Delivery Commission (20%)", value: fmt((s.deliveryRevenue || 0) * 0.2), color: "#a78bfa" },
                  { label: "Service Revenue (30%)", value: fmt((s.serviceRevenue || 0) * 0.3), color: "#f59e0b" },
                  { label: "Product Revenue", value: fmt(s.productRevenue || 0), color: "#34d399" },
                ].map(item => (
                  <div key={item.label} style={{ background: BG3, borderRadius: "12px", padding: "14px", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "18px", fontWeight: "800", color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "4px" }}>{item.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "12px", padding: "14px", background: "rgba(74,222,128,0.1)", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>Total PROJO Profit</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "2rem", fontWeight: "800", color: "#4ade80" }}>{fmt(s.projoRevenue)}</div>
                <div style={{ fontSize: "12px", color: "#6b6760", marginTop: "4px" }}>Last {period} days</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
