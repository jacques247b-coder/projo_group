// ============================================================
// PROJO GROUP — Admin Dashboard
// Stats, users, rides, deliveries, products management
// ============================================================
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import Navbar from "../../components/ui/Navbar";

const G = "#e8b84b";
const BG = "#0d0505";
const BG2 = "#120808";
const BG3 = "#1c0f0f";
const BORDER = "rgba(232,184,75,0.18)";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function authFetch(path, options = {}) {
  const token = localStorage.getItem("projo_token");
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  }).then(res => res.json());
}

const TABS = [
  { id: "overview",   label: "📊 Overview" },
  { id: "users",      label: "👥 Users" },
  { id: "drivers",    label: "🚗 Drivers" },
  { id: "rides",      label: "🛣️ Rides" },
  { id: "deliveries", label: "📦 Deliveries" },
  { id: "products",   label: "🛍️ Products" },
];

const STATUS_COLORS = {
  ACTIVE: "#4ade80", PENDING_VERIFICATION: "#fbbf24", SUSPENDED: "#f87171", BANNED: "#dc2626",
  REQUESTED: "#fbbf24", DRIVER_ASSIGNED: "#60a5fa", IN_PROGRESS: "#60a5fa",
  COMPLETED: "#4ade80", CANCELLED: "#f87171",
  PENDING: "#fbbf24", PICKED_UP: "#60a5fa", DELIVERED: "#4ade80", FAILED: "#f87171",
};

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || "#7a5a55";
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: "50px",
      fontSize: "11px", fontWeight: "700", color,
      background: `${color}15`, border: `1px solid ${color}30`,
    }}>{status}</span>
  );
}

function StatCard({ icon, label, value, sub, color = G }) {
  return (
    <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1.25rem" }}>
      <div style={{ fontSize: "24px", marginBottom: "8px" }}>{icon}</div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.6rem", fontWeight: "800", color }}>
        {value}
      </div>
      <div style={{ fontSize: "12px", color: "#b8a09a", fontWeight: "600", marginTop: "2px" }}>{label}</div>
      {sub && <div style={{ fontSize: "11px", color: "#7a5a55", marginTop: "4px" }}>{sub}</div>}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────
function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/admin/stats").then(data => { setStats(data.stats); setLoading(false); });
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: "3rem", color: "#7a5a55" }}>Loading stats...</div>;
  if (!stats) return null;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px", marginBottom: "12px" }}>
        <StatCard icon="👥" label="Total Passengers" value={stats.totalUsers} />
        <StatCard icon="🚗" label="Total Drivers" value={stats.totalDrivers} />
        <StatCard icon="🛣️" label="Total Rides" value={stats.totalRides} sub={`${stats.completedRides} completed`} />
        <StatCard icon="📦" label="Total Deliveries" value={stats.totalDeliveries} sub={`${stats.pendingDeliveries} pending`} />
      </div>
      <div style={{ background: "rgba(232,184,75,0.06)", border: `1px solid ${BORDER}`,
        borderRadius: "16px", padding: "1.5rem", marginTop: "12px" }}>
        <div style={{ fontSize: "11px", fontWeight: "700", color: G, letterSpacing: "1px",
          textTransform: "uppercase", marginBottom: "1rem" }}>💰 Revenue Breakdown</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#7a5a55" }}>Total Revenue</div>
            <div style={{ fontSize: "1.6rem", fontWeight: "800", color: G, fontFamily: "'Syne',sans-serif" }}>
              R{stats.totalRevenue}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#7a5a55" }}>Driver Earnings (80%)</div>
            <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#4ade80", fontFamily: "'Syne',sans-serif" }}>
              R{stats.driverEarnings}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#7a5a55" }}>PROJO Commission (20%)</div>
            <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#60a5fa", fontFamily: "'Syne',sans-serif" }}>
              R{stats.projoCommission}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  function load() {
    authFetch("/admin/users").then(data => { setUsers(data.users || []); setLoading(false); });
  }

  async function changeStatus(id, status) {
    await authFetch(`/admin/users/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
    toast.success("Status updated");
    load();
  }

  if (loading) return <div style={{ textAlign: "center", padding: "2rem", color: "#7a5a55" }}>Loading...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {users.map(u => (
        <div key={u.id} style={{ background: BG2, border: `1px solid ${BORDER}`,
          borderRadius: "12px", padding: "1rem", display: "flex",
          justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ fontWeight: "700", color: "#f5ede8", fontSize: "14px" }}>
              {u.name} <span style={{ fontSize: "10px", color: "#7a5a55", fontWeight: "600" }}>({u.role})</span>
            </div>
            <div style={{ fontSize: "12px", color: "#7a5a55", marginTop: "2px" }}>
              {u.phone} {u.email && `· ${u.email}`}
            </div>
            <div style={{ fontSize: "11px", color: G, marginTop: "2px" }}>
              Wallet: R{(u.wallet?.balanceZar || 0).toFixed(2)}
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <StatusBadge status={u.status} />
            <select value={u.status} onChange={e => changeStatus(u.id, e.target.value)} style={{
              background: BG3, border: `1px solid ${BORDER}`, color: "#f5ede8",
              borderRadius: "6px", padding: "4px 8px", fontSize: "11px",
            }}>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BANNED">Banned</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Drivers Tab ───────────────────────────────────────────
function DriversTab() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/admin/drivers").then(data => { setDrivers(data.drivers || []); setLoading(false); });
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: "2rem", color: "#7a5a55" }}>Loading...</div>;
  if (drivers.length === 0) return (
    <div style={{ textAlign: "center", padding: "3rem", color: "#7a5a55" }}>
      No drivers registered yet
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {drivers.map(d => (
        <div key={d.id} style={{ background: BG2, border: `1px solid ${BORDER}`,
          borderRadius: "12px", padding: "1rem" }}>
          <div style={{ fontWeight: "700", color: "#f5ede8", fontSize: "14px" }}>{d.name}</div>
          <div style={{ fontSize: "12px", color: "#7a5a55", marginTop: "2px" }}>{d.phone}</div>
          <StatusBadge status={d.status} />
        </div>
      ))}
    </div>
  );
}

// ── Rides Tab ─────────────────────────────────────────────
function RidesTab() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/admin/rides").then(data => { setRides(data.rides || []); setLoading(false); });
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: "2rem", color: "#7a5a55" }}>Loading...</div>;
  if (rides.length === 0) return (
    <div style={{ textAlign: "center", padding: "3rem", color: "#7a5a55" }}>No rides yet</div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {rides.map(r => (
        <div key={r.id} style={{ background: BG2, border: `1px solid ${BORDER}`,
          borderRadius: "12px", padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "13px", color: "#f5ede8", fontWeight: "600" }}>
                {r.pickupAddress} → {r.dropoffAddress}
              </div>
              <div style={{ fontSize: "11px", color: "#7a5a55", marginTop: "4px" }}>
                {new Date(r.createdAt).toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "16px", fontWeight: "800", color: G }}>R{r.totalFare?.toFixed(2)}</div>
              <StatusBadge status={r.status} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Deliveries Tab ────────────────────────────────────────
function DeliveriesTab() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  function load() {
    authFetch("/admin/deliveries").then(data => { setDeliveries(data.deliveries || []); setLoading(false); });
  }

  async function changeStatus(id, status) {
    await authFetch(`/admin/deliveries/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
    toast.success("Status updated");
    load();
  }

  if (loading) return <div style={{ textAlign: "center", padding: "2rem", color: "#7a5a55" }}>Loading...</div>;
  if (deliveries.length === 0) return (
    <div style={{ textAlign: "center", padding: "3rem", color: "#7a5a55" }}>No deliveries yet</div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {deliveries.map(d => (
        <div key={d.id} style={{ background: BG2, border: `1px solid ${BORDER}`,
          borderRadius: "12px", padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <div>
              <div style={{ fontSize: "13px", color: "#f5ede8", fontWeight: "600" }}>
                {d.pickupAddress} → {d.dropoffAddress}
              </div>
              <div style={{ fontSize: "11px", color: "#7a5a55", marginTop: "2px" }}>
                To: {d.recipientName} ({d.recipientPhone})
              </div>
              <div style={{ fontSize: "10px", color: "#7a5a55", marginTop: "2px" }}>
                #{d.trackingNumber}
              </div>
            </div>
            <div style={{ fontSize: "16px", fontWeight: "800", color: G }}>R{d.fare?.toFixed(2)}</div>
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <StatusBadge status={d.status} />
            <select value={d.status} onChange={e => changeStatus(d.id, e.target.value)} style={{
              background: BG3, border: `1px solid ${BORDER}`, color: "#f5ede8",
              borderRadius: "6px", padding: "4px 8px", fontSize: "11px",
            }}>
              <option value="PENDING">Pending</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Products Tab ──────────────────────────────────────────
function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "", priceZar: "" });

  useEffect(() => { load(); }, []);
  function load() {
    authFetch("/admin/products").then(data => { setProducts(data.products || []); setLoading(false); });
  }

  async function createProduct() {
    if (!form.name || !form.category) return toast.error("Name and category required");
    await authFetch("/admin/products", { method: "POST", body: JSON.stringify(form) });
    toast.success("Product created!");
    setForm({ name: "", description: "", category: "", priceZar: "" });
    setShowForm(false);
    load();
  }

  async function toggleActive(p) {
    await authFetch(`/admin/products/${p.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...p, isActive: !p.isActive }),
    });
    load();
  }

  async function deleteProduct(id) {
    if (!window.confirm("Delete this product?")) return;
    await authFetch(`/admin/products/${id}`, { method: "DELETE" });
    toast.success("Product deleted");
    load();
  }

  const inp = {
    width: "100%", background: BG3, border: `1px solid ${BORDER}`,
    color: "#f5ede8", borderRadius: "8px", padding: "10px 12px",
    fontSize: "13px", outline: "none", boxSizing: "border-box", marginTop: "4px",
  };

  if (loading) return <div style={{ textAlign: "center", padding: "2rem", color: "#7a5a55" }}>Loading...</div>;

  return (
    <div>
      <button onClick={() => setShowForm(!showForm)} style={{
        background: G, color: "#1a0808", border: "none", borderRadius: "10px",
        padding: "10px 18px", fontSize: "13px", fontWeight: "800", cursor: "pointer", marginBottom: "12px",
      }}>{showForm ? "✕ Cancel" : "+ Add Product"}</button>

      {showForm && (
        <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "12px",
          padding: "1rem", marginBottom: "12px" }}>
          <input style={inp} placeholder="Product name" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
          <input style={inp} placeholder="Category" value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })} />
          <input style={inp} placeholder="Price (ZAR, 0 for quote)" type="number" value={form.priceZar}
            onChange={e => setForm({ ...form, priceZar: e.target.value })} />
          <textarea style={{ ...inp, resize: "vertical" }} placeholder="Description" rows={3}
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <button onClick={createProduct} style={{
            background: G, color: "#1a0808", border: "none", borderRadius: "8px",
            padding: "10px 20px", fontSize: "13px", fontWeight: "800", cursor: "pointer", marginTop: "8px",
          }}>Create Product</button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {products.map(p => (
          <div key={p.id} style={{ background: BG2, border: `1px solid ${BORDER}`,
            borderRadius: "12px", padding: "1rem", opacity: p.isActive ? 1 : 0.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "10px", color: G, fontWeight: "700" }}>{p.category}</div>
                <div style={{ fontSize: "14px", color: "#f5ede8", fontWeight: "700", marginTop: "2px" }}>{p.name}</div>
                <div style={{ fontSize: "12px", color: "#7a5a55", marginTop: "4px", maxWidth: "400px" }}>
                  {p.description?.slice(0, 100)}{p.description?.length > 100 ? "..." : ""}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "16px", fontWeight: "800", color: G }}>
                  {p.priceZar > 0 ? `R${p.priceZar}` : "Quote"}
                </div>
                <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                  <button onClick={() => toggleActive(p)} style={{
                    background: "transparent", border: `1px solid ${BORDER}`, color: "#b8a09a",
                    borderRadius: "6px", padding: "4px 10px", fontSize: "10px", cursor: "pointer",
                  }}>{p.isActive ? "Hide" : "Show"}</button>
                  <button onClick={() => deleteProduct(p.id)} style={{
                    background: "transparent", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171",
                    borderRadius: "6px", padding: "4px 10px", fontSize: "10px", cursor: "pointer",
                  }}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (user && user.role !== "ADMIN") navigate("/book");
  }, [user, navigate]);

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "84px 1rem 2rem" }}>

        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: G,
            letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>
            Admin Panel
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.8rem",
            fontWeight: "800", color: "#f5ede8" }}>
            PROJO GROUP Dashboard
          </h1>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "6px", overflowX: "auto",
          marginBottom: "1.5rem", paddingBottom: "4px" }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: activeTab === tab.id ? G : BG2,
              color: activeTab === tab.id ? "#1a0808" : "#b8a09a",
              border: `1px solid ${activeTab === tab.id ? G : BORDER}`,
              borderRadius: "50px", padding: "8px 16px", fontSize: "12px",
              fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            }}>{tab.label}</button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview"   && <OverviewTab />}
        {activeTab === "users"      && <UsersTab />}
        {activeTab === "drivers"    && <DriversTab />}
        {activeTab === "rides"      && <RidesTab />}
        {activeTab === "deliveries" && <DeliveriesTab />}
        {activeTab === "products"   && <ProductsTab />}
      </div>
    </div>
  );
}
