// PROJO GROUP — Admin Dashboard (Comprehensive Fix)
// Fixes: Ride/Delivery cancel+view, Products split, Driver online status,
//        Service Orders tab, WhatsApp notifications, Date/Time display
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";
import { CONTACT } from "../../utils/constants";

const G = "#e8b84b";
const BG = "#0a0a0a";
const BG2 = "#111111";
const BG3 = "#1a1a1a";
const BORDER = "rgba(232,184,75,0.15)";
const card = {
  background: BG2, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "1rem",
};
const STATUS_COLOR = {
  ACTIVE: "#4ade80", PENDING_VERIFICATION: "#f59e0b", SUSPENDED: "#ef4444", BANNED: "#ef4444",
  REQUESTED: "#60a5fa", DRIVER_ASSIGNED: "#a78bfa", IN_PROGRESS: "#f59e0b",
  COMPLETED: "#4ade80", CANCELLED: "#ef4444", PENDING: "#f59e0b",
  CONFIRMED: "#4ade80", ONLINE: "#4ade80", OFFLINE: "#6b6760",
};
const { formatFare } = { formatFare: (n) => `R${(n || 0).toFixed(2)}` };

const TABS = [
  { key: "stats",      label: "📊 Stats" },
  { key: "users",      label: "👥 Users" },
  { key: "rides",      label: "🚗 Rides" },
  { key: "deliveries", label: "📦 Deliveries" },
  { key: "services",   label: "🛠️ Services" },
  { key: "products",   label: "🛍️ Products" },
  { key: "drivers",    label: "🚘 Drivers" },
  { key: "push",       label: "📣 Broadcast" },
];

const SERVICE_CATEGORIES = [
  "Cleaning","Maintenance","Painting","Pest Control","CCTV","Locksmith",
  "Runners & Deliveries","PC & Console Repair","Laundry Services",
  "Web & App Development","Digital Marketing",
];

function fmt(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("en-ZA", {
    day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit"
  });
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("stats");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [products, setProducts] = useState([]);
  const [serviceOrders, setServiceOrders] = useState([]);
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedRide, setSelectedRide] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [productModal, setProductModal] = useState(null);
  const [productForm, setProductForm] = useState({});
  const [pushForm, setPushForm] = useState({ title: "", body: "", url: "", target: "all", image: "" });
  const pushImageRef = React.useRef();
  const [pushStats, setPushStats] = useState(null);
  const [pushSending, setPushSending] = useState(false);
  const [pushResult, setPushResult] = useState(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [s, u, r, d, p, dr, so, ps] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/rides"),
        api.get("/admin/deliveries"),
        api.get("/admin/products"),
        api.get("/admin/drivers"),
        api.get("/admin/service-orders").catch(() => ({ orders: [] })),
        api.get("/admin/push/stats").catch(() => null),
      ]);
      setStats(s.stats);
      setUsers(u.users || []);
      setRides(r.rides || []);
      setDeliveries(d.deliveries || []);
      setProducts(p.products || []);
      setServiceOrders(so.orders || []);
      if (ps) setPushStats(ps);
      const drivers = dr.drivers || [];
      setPendingDrivers(drivers.filter(d => d.status === "PENDING_VERIFICATION"));
      setAllDrivers(drivers);
    } catch (err) {
      toast.error("Could not load admin data");
    } finally { setLoading(false); }
  }

  async function cancelRide(id) {
    if (!window.confirm("Cancel this ride? Wallet will be refunded if applicable.")) return;
    try {
      await api.post(`/rides/${id}/cancel`);
      toast.success("Ride cancelled");
      loadAll();
    } catch { toast.error("Could not cancel ride"); }
  }

  async function updateRideStatus(id, status) {
    try {
      await api.put(`/admin/rides/${id}/status`, { status });
      toast.success(`Status updated to ${status}`);
      loadAll();
    } catch { toast.error("Could not update status"); }
  }

  async function updateDeliveryStatus(id, status) {
    try {
      await api.put(`/admin/deliveries/${id}/status`, { status });
      toast.success(`Delivery status updated`);
      loadAll();
    } catch { toast.error("Could not update delivery"); }
  }

  async function updateUserStatus(id, status) {
    try {
      await api.put(`/admin/users/${id}/status`, { status });
      toast.success("User status updated");
      loadAll();
    } catch { toast.error("Failed"); }
  }

  async function approveDriver(id) {
    try {
      await api.post(`/admin/drivers/${id}/approve`);
      toast.success("Driver approved!");
      loadAll();
    } catch { toast.error("Could not approve"); }
  }

  async function rejectDriver(id) {
    const note = window.prompt("Reason for rejection (optional):");
    try {
      await api.post(`/admin/drivers/${id}/reject`, { note: note || "" });
      toast.success("Driver rejected");
      loadAll();
    } catch { toast.error("Could not reject"); }
  }

  async function saveProduct() {
    try {
      if (productForm.id) {
        await api.put(`/admin/products/${productForm.id}`, productForm);
      } else {
        await api.post("/admin/products", productForm);
      }
      toast.success("Product saved");
      setProductModal(null);
      loadAll();
    } catch { toast.error("Could not save product"); }
  }

  async function deleteProduct(id) {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success("Deleted");
      loadAll();
    } catch { toast.error("Could not delete"); }
  }

  async function sendBroadcast() {
    if (!pushForm.title.trim() || !pushForm.body.trim()) return toast.error("Title and message required");
    setPushSending(true);
    setPushResult(null);
    try {
      const res = await api.post("/admin/push/broadcast", pushForm);
      setPushResult(res);
      toast.success(`✅ Sent to ${res.sent} device${res.sent !== 1 ? "s" : ""}!`);
      setPushForm({ title: "", body: "", url: "", target: "all" });
    } catch { toast.error("Could not send notification"); }
    finally { setPushSending(false); }
  }

  async function updateServiceOrder(id, status) {
    try {
      await api.put(`/admin/service-orders/${id}/status`, { status });
      toast.success("Order updated");
      loadAll();
    } catch { toast.error("Could not update order"); }
  }

  const filteredServices = products.filter(p =>
    SERVICE_CATEGORIES.includes(p.category) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()) ||
     p.category.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredProducts = products.filter(p =>
    p.category === "Products" &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  const inp = {
    width: "100%", background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px",
    color: "#f0ede8", padding: "8px 12px", fontSize: "13px", outline: "none",
    fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Sans',sans-serif", paddingTop: "64px" }}>
      <Navbar />
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem 1rem" }}>

        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: G, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>PROJO GROUP</div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.5rem", fontWeight: "800", color: "#f0ede8", margin: 0 }}>Admin Dashboard</h1>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setSearch(""); }} style={{
              background: tab === t.key ? G : BG2,
              color: tab === t.key ? "#0a0a0a" : "#a8a49e",
              border: `1px solid ${tab === t.key ? G : BORDER}`,
              borderRadius: "8px", padding: "7px 14px", fontSize: "12px",
              fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
            }}>{t.label}</button>
          ))}
        </div>

        {loading && <div style={{ textAlign: "center", color: "#6b6760", padding: "3rem" }}>Loading...</div>}

        {/* ── STATS ── */}
        {!loading && tab === "stats" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
              <button onClick={() => {
                const token = localStorage.getItem("projo_token");
                const url = `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/admin/export/emails`;
                fetch(url, { headers: { Authorization: `Bearer ${token}` } })
                  .then(r => r.blob()).then(blob => {
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `PROJO_Subscribers_${new Date().toISOString().slice(0,10)}.xlsx`;
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                  }).catch(() => toast.error("Export failed"));
              }} style={{
                background: "#1a7520", color: "#fff", border: "none", borderRadius: "10px",
                padding: "10px 20px", fontSize: "13px", fontWeight: "700", cursor: "pointer",
              }}>📥 Export Emails (MailerLite)</button>
            </div>
            {stats && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                {[
                  { label: "Total Users",  value: stats.totalUsers,     icon: "👥" },
                  { label: "Total Rides",  value: stats.totalRides,     icon: "🚗" },
                  { label: "Deliveries",   value: stats.totalDeliveries,icon: "📦" },
                  { label: "Revenue",      value: `R${(parseFloat(stats.totalRevenue)||0).toFixed(0)}`, icon: "💰" },
                ].map(s => (
                  <div key={s.label} style={{ ...card, flex: "1 1 180px", textAlign: "center" }}>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>{s.icon}</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.5rem", fontWeight: "800", color: G }}>{s.value}</div>
                    <div style={{ fontSize: "12px", color: "#6b6760", marginTop: "4px" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RIDES ── */}
        {!loading && tab === "rides" && (
          <div>
            {selectedRide ? (
              <div style={{ ...card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ color: G, fontFamily: "'Syne',sans-serif", margin: 0 }}>Ride Details</h3>
                  <button onClick={() => setSelectedRide(null)} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "4px 12px", color: "#a8a49e", cursor: "pointer" }}>← Back</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                  <div><span style={{ color: "#6b6760" }}>Status:</span> <span style={{ color: STATUS_COLOR[selectedRide.status], fontWeight: "700" }}>{selectedRide.status}</span></div>
                  <div><span style={{ color: "#6b6760" }}>Date/Time:</span> <span style={{ color: "#f0ede8" }}>{fmt(selectedRide.createdAt)}</span></div>
                  <div><span style={{ color: "#6b6760" }}>Pickup:</span> <span style={{ color: "#f0ede8" }}>{selectedRide.pickupAddress}</span></div>
                  <div><span style={{ color: "#6b6760" }}>Dropoff:</span> <span style={{ color: "#f0ede8" }}>{selectedRide.dropoffAddress}</span></div>
                  <div><span style={{ color: "#6b6760" }}>Fare:</span> <span style={{ color: G, fontWeight: "700" }}>{formatFare(selectedRide.totalFare)}</span></div>
                  <div><span style={{ color: "#6b6760" }}>Zone:</span> <span style={{ color: "#f0ede8" }}>{selectedRide.zone}</span></div>
                  <div><span style={{ color: "#6b6760" }}>Payment:</span> <span style={{ color: "#f0ede8" }}>{selectedRide.paidWithWallet ? "PROJO Wallet" : "Cash"}</span></div>
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "1rem", flexWrap: "wrap" }}>
                  {["DRIVER_ASSIGNED","IN_PROGRESS","COMPLETED"].map(s => (
                    <button key={s} onClick={() => updateRideStatus(selectedRide.id, s)} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "6px 12px", color: G, fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>{s.replace(/_/g," ")}</button>
                  ))}
                  {selectedRide.status !== "CANCELLED" && selectedRide.status !== "COMPLETED" && (
                    <button onClick={() => { cancelRide(selectedRide.id); setSelectedRide(null); }} style={{ background: "#7f1d1d", border: "1px solid #ef4444", borderRadius: "6px", padding: "6px 12px", color: "#f87171", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>Cancel Ride</button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {rides.map(r => (
                  <div key={r.id} style={{ ...card, cursor: "pointer" }} onClick={() => setSelectedRide(r)}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: STATUS_COLOR[r.status] || "#a8a49e", textTransform: "uppercase" }}>{r.status}</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: "800", color: G }}>{formatFare(r.totalFare)}</div>
                    </div>
                    <div style={{ fontSize: "13px", color: "#f0ede8" }}>📍 {r.pickupAddress}</div>
                    <div style={{ fontSize: "13px", color: "#a8a49e" }}>🏁 {r.dropoffAddress}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                      <div style={{ fontSize: "11px", color: "#6b6760" }}>{fmt(r.createdAt)}</div>
                      {r.status !== "CANCELLED" && r.status !== "COMPLETED" && (
                        <button onClick={e => { e.stopPropagation(); cancelRide(r.id); }} style={{
                          background: "#7f1d1d", border: "1px solid #ef4444", borderRadius: "6px",
                          padding: "3px 10px", color: "#f87171", fontSize: "11px", fontWeight: "700", cursor: "pointer"
                        }}>Cancel</button>
                      )}
                    </div>
                  </div>
                ))}
                {rides.length === 0 && <div style={{ textAlign: "center", color: "#6b6760", padding: "3rem" }}>No rides yet</div>}
              </div>
            )}
          </div>
        )}

        {/* ── DELIVERIES ── */}
        {!loading && tab === "deliveries" && (
          <div>
            {selectedDelivery ? (
              <div style={{ ...card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ color: G, fontFamily: "'Syne',sans-serif", margin: 0 }}>Delivery Details</h3>
                  <button onClick={() => setSelectedDelivery(null)} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "4px 12px", color: "#a8a49e", cursor: "pointer" }}>← Back</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                  <div><span style={{ color: "#6b6760" }}>Tracking:</span> <span onClick={() => window.open(`/track/delivery/${selectedDelivery.trackingNumber}`, "_blank")} style={{ color: G, fontFamily: "monospace", wordBreak: "break-all", cursor: "pointer", textDecoration: "underline" }}>{selectedDelivery.trackingNumber} ↗</span></div>
                  <div><span style={{ color: "#6b6760" }}>Status:</span> <span style={{ color: STATUS_COLOR[selectedDelivery.status], fontWeight: "700" }}>{selectedDelivery.status}</span></div>
                  <div><span style={{ color: "#6b6760" }}>Date/Time:</span> <span style={{ color: "#f0ede8" }}>{fmt(selectedDelivery.createdAt)}</span></div>
                  <div><span style={{ color: "#6b6760" }}>Item:</span> <span style={{ color: "#f0ede8" }}>{selectedDelivery.description}</span></div>
                  <div><span style={{ color: "#6b6760" }}>Pickup:</span> <span style={{ color: "#f0ede8" }}>{selectedDelivery.pickupAddress}</span></div>
                  <div><span style={{ color: "#6b6760" }}>Dropoff:</span> <span style={{ color: "#f0ede8" }}>{selectedDelivery.dropoffAddress}</span></div>
                  <div><span style={{ color: "#6b6760" }}>Recipient:</span> <span style={{ color: "#f0ede8" }}>{selectedDelivery.recipientName} · {selectedDelivery.recipientPhone}</span></div>
                  <div><span style={{ color: "#6b6760" }}>Fare:</span> <span style={{ color: G, fontWeight: "700" }}>{formatFare(selectedDelivery.fare || 60)}</span></div>
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "1rem", flexWrap: "wrap" }}>
                  {["PICKED_UP","IN_TRANSIT","DELIVERED","CANCELLED"].map(s => (
                    <button key={s} onClick={() => updateDeliveryStatus(selectedDelivery.id, s)} style={{
                      background: BG3, border: `1px solid ${BORDER}`, borderRadius: "6px",
                      padding: "6px 12px", color: s === "CANCELLED" ? "#f87171" : G,
                      fontSize: "11px", fontWeight: "700", cursor: "pointer"
                    }}>{s.replace(/_/g," ")}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {deliveries.map(d => (
                  <div key={d.id} style={{ ...card, cursor: "pointer" }} onClick={() => setSelectedDelivery(d)}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <div onClick={e => { e.stopPropagation(); window.open(`/track/delivery/${d.trackingNumber}`, "_blank"); }}
                      style={{ fontFamily: "monospace", fontSize: "11px", color: G, wordBreak: "break-all", cursor: "pointer", textDecoration: "underline" }}>
                      {d.trackingNumber} ↗
                    </div>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: STATUS_COLOR[d.status] || "#a8a49e" }}>{d.status}</div>
                    </div>
                    <div style={{ fontSize: "13px", color: "#f0ede8" }}>{d.description}</div>
                    <div style={{ fontSize: "12px", color: "#a8a49e", marginTop: "4px" }}>{d.pickupAddress} → {d.dropoffAddress}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                      <div style={{ fontSize: "11px", color: "#6b6760" }}>{fmt(d.createdAt)}</div>
                      <div style={{ fontSize: "12px", color: G, fontWeight: "700" }}>{formatFare(d.fare || 60)}</div>
                    </div>
                  </div>
                ))}
                {deliveries.length === 0 && <div style={{ textAlign: "center", color: "#6b6760", padding: "3rem" }}>No deliveries yet</div>}
              </div>
            )}
          </div>
        )}

        {/* ── SERVICE ORDERS ── */}
        {!loading && tab === "services" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontSize: "13px", color: "#6b6760", marginBottom: "4px" }}>{serviceOrders.length} service order{serviceOrders.length !== 1 ? "s" : ""}</div>
            {serviceOrders.map(o => (
              <div key={o.id} style={{ ...card }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div>
                    <div style={{ fontWeight: "700", color: "#f0ede8", fontSize: "13px" }}>{o.productName}</div>
                    <div style={{ fontSize: "11px", color: "#6b6760" }}>{o.category} · {fmt(o.createdAt)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: G, fontWeight: "700", fontFamily: "'Syne',sans-serif" }}>R{o.finalPrice}</div>
                    <div style={{ fontSize: "11px", color: STATUS_COLOR[o.status] || "#a8a49e", fontWeight: "700" }}>{o.status}</div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "#a8a49e" }}>📍 {o.address} · 📞 {o.phone}</div>
                {o.scheduledFor && <div style={{ fontSize: "12px", color: "#a8a49e" }}>📅 {fmt(o.scheduledFor)}</div>}
                {o.notes && <div style={{ fontSize: "12px", color: "#a8a49e", marginTop: "4px" }}>📝 {o.notes}</div>}
                <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                  {["CONFIRMED","IN_PROGRESS","COMPLETED","CANCELLED"].map(s => (
                    <button key={s} onClick={() => updateServiceOrder(o.id, s)} style={{
                      background: o.status === s ? "rgba(232,184,75,0.15)" : BG3,
                      border: `1px solid ${o.status === s ? G : BORDER}`,
                      borderRadius: "6px", padding: "4px 10px", color: o.status === s ? G : "#a8a49e",
                      fontSize: "10px", fontWeight: "700", cursor: "pointer"
                    }}>{s}</button>
                  ))}
                </div>
              </div>
            ))}
            {serviceOrders.length === 0 && <div style={{ textAlign: "center", color: "#6b6760", padding: "3rem" }}>No service orders yet</div>}
          </div>
        )}

        {/* ── PRODUCTS (shop only) ── */}
        {!loading && tab === "products" && (
          <div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "1rem", alignItems: "center" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." style={{ ...inp, flex: 1 }} />
              <button onClick={() => navigate("/admin/product/new")} style={{
                background: G, color: "#0a0a0a", border: "none", borderRadius: "8px",
                padding: "8px 16px", fontWeight: "700", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap"
              }}>+ New Product</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredProducts.map(p => (
                <div key={p.id} style={{ ...card }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "700", color: p.isActive ? "#f0ede8" : "#6b6760", fontSize: "14px" }}>{p.name}</div>
                      <div style={{ fontSize: "11px", color: "#6b6760" }}>{p.category} · R{p.priceZar} · {p.isActive ? "Active" : "Inactive"}</div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => navigate(`/admin/product/${p.id}`)} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "4px 10px", color: G, fontSize: "11px", cursor: "pointer" }}>Edit</button>
                      <button onClick={() => deleteProduct(p.id)} style={{ background: "#7f1d1d", border: "1px solid #ef4444", borderRadius: "6px", padding: "4px 10px", color: "#f87171", fontSize: "11px", cursor: "pointer" }}>Del</button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && <div style={{ textAlign: "center", color: "#6b6760", padding: "2rem" }}>No products yet — add your first product!</div>}
            </div>
          </div>
        )}

        {/* ── DRIVERS ── */}
        {!loading && tab === "drivers" && (
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "1rem", flexWrap: "wrap" }}>
              <div style={{ ...card, flex: 1, textAlign: "center", padding: "10px" }}>
                <div style={{ color: "#4ade80", fontWeight: "700", fontSize: "18px" }}>{allDrivers.filter(d => d.driverStatus === "ONLINE").length}</div>
                <div style={{ fontSize: "11px", color: "#6b6760" }}>Online</div>
              </div>
              <div style={{ ...card, flex: 1, textAlign: "center", padding: "10px" }}>
                <div style={{ color: "#6b6760", fontWeight: "700", fontSize: "18px" }}>{allDrivers.filter(d => d.driverStatus === "OFFLINE" || !d.driverStatus).length}</div>
                <div style={{ fontSize: "11px", color: "#6b6760" }}>Offline</div>
              </div>
              <div style={{ ...card, flex: 1, textAlign: "center", padding: "10px" }}>
                <div style={{ color: G, fontWeight: "700", fontSize: "18px" }}>{pendingDrivers.length}</div>
                <div style={{ fontSize: "11px", color: "#6b6760" }}>Pending</div>
              </div>
            </div>

            {pendingDrivers.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: G, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Pending Approval</div>
                {pendingDrivers.map(d => (
                  <div key={d.id} style={{ ...card, marginBottom: "8px" }}>
                    <div style={{ fontWeight: "700", color: "#f0ede8" }}>{d.name}</div>
                    <div style={{ fontSize: "12px", color: "#6b6760" }}>{d.phone} · {d.email || "No email"}</div>
                    <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "2px" }}>Applied {fmt(d.createdAt)}</div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                      <button onClick={() => approveDriver(d.id)} style={{ background: "#166534", border: "1px solid #4ade80", borderRadius: "6px", padding: "6px 16px", color: "#4ade80", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>✓ Approve</button>
                      <button onClick={() => rejectDriver(d.id)} style={{ background: "#7f1d1d", border: "1px solid #ef4444", borderRadius: "6px", padding: "6px 16px", color: "#f87171", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>✗ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontSize: "12px", fontWeight: "700", color: "#6b6760", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>All Drivers</div>
            {allDrivers.filter(d => d.status === "ACTIVE").map(d => (
              <div key={d.id} style={{ ...card, marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "700", color: "#f0ede8" }}>{d.name}</div>
                    <div style={{ fontSize: "12px", color: "#6b6760" }}>{d.phone}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: d.driverStatus === "ONLINE" ? "#4ade80" : "#6b6760" }} />
                    <span style={{ fontSize: "12px", fontWeight: "700", color: d.driverStatus === "ONLINE" ? "#4ade80" : "#6b6760" }}>
                      {d.driverStatus === "ONLINE" ? "ONLINE" : "OFFLINE"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── BROADCAST PUSH ── */}
        {!loading && tab === "push" && (
          <div>
            {/* Stats */}
            {pushStats && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "1.5rem" }}>
                {[
                  { label: "Total Devices", value: pushStats.total, icon: "📱" },
                  { label: "Passengers", value: pushStats.passengers, icon: "👥" },
                  { label: "Drivers", value: pushStats.drivers, icon: "🚗" },
                ].map(s => (
                  <div key={s.label} style={{ ...card, textAlign: "center" }}>
                    <div style={{ fontSize: "24px", marginBottom: "4px" }}>{s.icon}</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.4rem", fontWeight: "800", color: G }}>{s.value}</div>
                    <div style={{ fontSize: "11px", color: "#6b6760" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Compose notification */}
            <div style={{ ...card }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", fontWeight: "800", color: G, marginBottom: "1rem" }}>
                📣 Send Push Notification
              </div>

              {/* Target audience */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" }}>Send To</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[["all","👥 Everyone"],["passengers","🧑 Passengers"],["drivers","🚗 Drivers"]].map(([val, lbl]) => (
                    <button key={val} onClick={() => setPushForm(f => ({ ...f, target: val }))} style={{
                      background: pushForm.target === val ? "rgba(232,184,75,0.15)" : BG3,
                      border: `1px solid ${pushForm.target === val ? G : BORDER}`,
                      borderRadius: "8px", padding: "8px 14px",
                      color: pushForm.target === val ? G : "#6b6760",
                      fontSize: "12px", fontWeight: "700", cursor: "pointer",
                    }}>{lbl}</button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "1px" }}>Title *</div>
                <input value={pushForm.title} onChange={e => setPushForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. 🎉 Special Offer — 20% off all services!"
                  maxLength={50}
                  style={{ width: "100%", background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px", color: "#f0ede8", padding: "10px 12px", fontSize: "13px", outline: "none", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box" }} />
                <div style={{ fontSize: "10px", color: "#6b6760", marginTop: "3px", textAlign: "right" }}>{pushForm.title.length}/50</div>
              </div>

              {/* Message */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "1px" }}>Message *</div>
                <textarea value={pushForm.body} onChange={e => setPushForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="e.g. Book any cleaning service this weekend and get 20% off. Tap to book now!"
                  maxLength={150}
                  style={{ width: "100%", background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px", color: "#f0ede8", padding: "10px 12px", fontSize: "13px", outline: "none", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box", minHeight: "80px", resize: "vertical" }} />
                <div style={{ fontSize: "10px", color: "#6b6760", marginTop: "3px", textAlign: "right" }}>{pushForm.body.length}/150</div>
              </div>

              {/* Image Upload */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "1px" }}>Ad Image (optional — Instagram size 1080×1080)</div>
                {pushForm.image ? (
                  <div style={{ position: "relative", marginBottom: "8px" }}>
                    <img src={pushForm.image} alt="Ad" style={{ width: "100%", maxHeight: "200px", objectFit: "cover", borderRadius: "10px", border: `1px solid ${BORDER}` }} />
                    <button onClick={() => setPushForm(f => ({ ...f, image: "" }))} style={{
                      position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.7)",
                      border: "none", color: "#fff", borderRadius: "50%", width: "28px", height: "28px",
                      cursor: "pointer", fontSize: "14px",
                    }}>✕</button>
                  </div>
                ) : (
                  <div onClick={() => pushImageRef.current?.click()} style={{
                    border: `2px dashed ${BORDER}`, borderRadius: "10px", padding: "1.5rem",
                    textAlign: "center", cursor: "pointer", background: BG3,
                  }}>
                    <div style={{ fontSize: "24px", marginBottom: "6px" }}>🖼️</div>
                    <div style={{ fontSize: "12px", color: "#6b6760" }}>
                      Click to upload ad image <span style={{ color: G }}>(PNG, JPG)</span>
                    </div>
                    <div style={{ fontSize: "10px", color: "#4a3030", marginTop: "3px" }}>Recommended: 1080×1080px (Instagram size)</div>
                  </div>
                )}
                <input ref={pushImageRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = ev => setPushForm(f => ({ ...f, image: ev.target.result }));
                    reader.readAsDataURL(file);
                  }} />
              </div>

              {/* Link */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "1px" }}>Deep Link (optional)</div>
                <select value={pushForm.url} onChange={e => setPushForm(f => ({ ...f, url: e.target.value }))}
                  style={{ width: "100%", background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px", color: "#f0ede8", padding: "10px 12px", fontSize: "13px", outline: "none", fontFamily: "'DM Sans',sans-serif" }}>
                  <option value="/home">Home</option>
                  <option value="/shop">Services / Book a Service</option>
                  <option value="/products">Products Shop</option>
                  <option value="/book">Book a Ride</option>
                  <option value="/courier">Courier / Delivery</option>
                  <option value="/wallet">Wallet & Loyalty Points</option>
                  <option value="/travel">Travel Bookings</option>
                </select>
              </div>

              {/* Preview */}
              {pushForm.title && (
                <div style={{ background: "#1a1a2e", border: "1px solid rgba(100,100,200,0.3)", borderRadius: "12px", padding: "12px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "10px", color: "#6b6760", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Preview</div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <img src="/assets/logo/PROJO_LOGO.png" style={{ width: "36px", height: "36px", borderRadius: "8px" }} alt="PROJO" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#f0ede8" }}>PROJO GROUP · {pushForm.title}</div>
                      <div style={{ fontSize: "12px", color: "#a8a49e", marginTop: "2px" }}>{pushForm.body || "Message preview"}</div>
                      {pushForm.image && <img src={pushForm.image} alt="Ad" style={{ width: "100%", borderRadius: "8px", marginTop: "8px", objectFit: "cover", maxHeight: "120px" }} />}
                    </div>
                  </div>
                </div>
              )}

              {/* Send button */}
              <button onClick={sendBroadcast} disabled={pushSending || !pushForm.title || !pushForm.body} style={{
                width: "100%", background: pushSending ? "#6b6760" : G,
                color: "#0a0a0a", border: "none", borderRadius: "10px",
                padding: "14px", fontWeight: "800", fontSize: "15px",
                cursor: pushSending ? "not-allowed" : "pointer",
              }}>
                {pushSending ? "⏳ Sending..." : `📣 Send to ${pushForm.target === "all" ? "All Users" : pushForm.target === "passengers" ? "Passengers" : "Drivers"}`}
              </button>

              {/* Result */}
              {pushResult && (
                <div style={{ marginTop: "12px", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                  <div style={{ color: "#4ade80", fontWeight: "700" }}>✅ Notification sent to {pushResult.sent} device{pushResult.sent !== 1 ? "s" : ""}</div>
                  {pushResult.failed > 0 && <div style={{ color: "#f59e0b", fontSize: "12px", marginTop: "4px" }}>{pushResult.failed} expired subscriptions removed</div>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Product Modal */}
        {productModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0" }}>
            <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "20px 20px 0 0", padding: "1.5rem", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", color: G, margin: "0 0 1.25rem" }}>{productModal === "new" ? "➕ Add Product" : "✏️ Edit Product"}</h3>

              {/* Name */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>Product Name *</div>
                <input value={productForm.name || ""} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} style={inp} placeholder="e.g. Nike Air Max" />
              </div>

              {/* Category */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>Category</div>
                <input value={productForm.category || "Products"} onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))} style={inp} placeholder="Products" />
              </div>

              {/* Price + Original Price */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>Price (R) *</div>
                  <input type="number" value={productForm.priceZar || ""} onChange={e => setProductForm(f => ({ ...f, priceZar: parseFloat(e.target.value) || 0 }))} style={inp} placeholder="0" />
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>Original Price (R)</div>
                  <input type="number" value={productForm.originalPrice || ""} onChange={e => setProductForm(f => ({ ...f, originalPrice: parseFloat(e.target.value) || 0 }))} style={inp} placeholder="0" />
                </div>
              </div>

              {/* SKU + Stock */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>SKU</div>
                  <input value={productForm.sku || ""} onChange={e => setProductForm(f => ({ ...f, sku: e.target.value }))} style={inp} placeholder="e.g. SKU-001" />
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>Stock Qty</div>
                  <input type="number" value={productForm.stockQty ?? 999} onChange={e => setProductForm(f => ({ ...f, stockQty: parseInt(e.target.value) || 999 }))} style={inp} placeholder="999" />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>Description</div>
                <textarea value={productForm.description || ""} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} style={{ ...inp, minHeight: "80px", resize: "vertical" }} placeholder="Describe this product..." />
              </div>

              {/* Image URL */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>Image URL</div>
                <input value={productForm.imageUrl || ""} onChange={e => setProductForm(f => ({ ...f, imageUrl: e.target.value }))} style={inp} placeholder="https://..." />
                {productForm.imageUrl && <img src={productForm.imageUrl} alt="preview" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", marginTop: "8px", border: `1px solid ${BORDER}` }} onError={e => e.target.style.display="none"} />}
              </div>

              {/* Availability toggle */}
              <div onClick={() => setProductForm(f => ({ ...f, isActive: !f.isActive }))} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: BG3, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "12px 14px", marginBottom: "1.25rem", cursor: "pointer" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#f0ede8" }}>Visible / Active</div>
                  <div style={{ fontSize: "11px", color: "#6b6760" }}>Show this product in the shop</div>
                </div>
                <div style={{ width: "44px", height: "24px", borderRadius: "12px", background: productForm.isActive !== false ? G : BG3, border: `1px solid ${BORDER}`, position: "relative", transition: "background .2s" }}>
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#0a0a0a", position: "absolute", top: "3px", left: productForm.isActive !== false ? "22px" : "3px", transition: "left .2s" }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={saveProduct} style={{ flex: 1, background: G, color: "#0a0a0a", border: "none", borderRadius: "10px", padding: "12px", fontWeight: "800", fontSize: "14px", cursor: "pointer" }}>Save Product</button>
                <button onClick={() => setProductModal(null)} style={{ flex: 1, background: BG3, color: "#a8a49e", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "12px", cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
