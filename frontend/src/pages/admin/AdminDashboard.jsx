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

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [s, u, r, d, p, dr, so] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/rides"),
        api.get("/admin/deliveries"),
        api.get("/admin/products"),
        api.get("/admin/drivers"),
        api.get("/admin/service-orders").catch(() => ({ orders: [] })),
      ]);
      setStats(s.stats);
      setUsers(u.users || []);
      setRides(r.rides || []);
      setDeliveries(d.deliveries || []);
      setProducts(p.products || []);
      setServiceOrders(so.orders || []);
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
                  { label: "Revenue",      value: `R${(stats.totalRevenue||0).toFixed(0)}`, icon: "💰" },
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
                  <div><span style={{ color: "#6b6760" }}>Tracking:</span> <span style={{ color: G, fontFamily: "monospace", wordBreak: "break-all" }}>{selectedDelivery.trackingNumber}</span></div>
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
                      <div style={{ fontFamily: "monospace", fontSize: "11px", color: G, wordBreak: "break-all" }}>{d.trackingNumber}</div>
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
                  <button onClick={() => sendWhatsApp(
                    `🛠️ PROJO Service Order\n${o.productName}\nStatus: ${o.status}\nAddress: ${o.address}\nPhone: ${o.phone}\nDate: ${fmt(o.scheduledFor || o.createdAt)}\nFare: R${o.finalPrice}`
                  )} style={{
                    background: "#25D366", border: "none", borderRadius: "6px",
                    padding: "4px 10px", color: "#fff", fontSize: "10px", fontWeight: "700", cursor: "pointer"
                  }}>💬 WA</button>
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
              <button onClick={() => { setProductForm({ category: "Products", priceZar: 0, isActive: true }); setProductModal("new"); }} style={{
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
                      <button onClick={() => { setProductForm({ ...p }); setProductModal("edit"); }} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "4px 10px", color: G, fontSize: "11px", cursor: "pointer" }}>Edit</button>
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

        {/* Product Modal */}
        {productModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1.5rem", width: "100%", maxWidth: "480px" }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", color: G, margin: "0 0 1rem" }}>{productModal === "new" ? "Add Product" : "Edit Product"}</h3>
              {[["Name","name","text"],["Description","description","text"],["Price (R)","priceZar","number"]].map(([label, key, type]) => (
                <div key={key} style={{ marginBottom: "10px" }}>
                  <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>{label}</div>
                  <input type={type} value={productForm[key] || ""} onChange={e => setProductForm(f => ({ ...f, [key]: type === "number" ? parseFloat(e.target.value) : e.target.value }))} style={inp} />
                </div>
              ))}
              <div style={{ marginBottom: "10px" }}>
                <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "4px", textTransform: "uppercase" }}>Category</div>
                <input value={productForm.category || "Products"} onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))} style={inp} placeholder="Products" />
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "1rem" }}>
                <button onClick={saveProduct} style={{ flex: 1, background: G, color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "10px", fontWeight: "700", cursor: "pointer" }}>Save</button>
                <button onClick={() => setProductModal(null)} style={{ flex: 1, background: BG3, color: "#a8a49e", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "10px", cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
