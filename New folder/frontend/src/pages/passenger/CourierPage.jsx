// ============================================================
// PROJO GROUP — Courier Booking Page (Step 7)
// Book parcel pickup, track with tracking number
// Rustenburg + North West Province
// ============================================================
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/ui/Navbar";
import { deliveryAPI } from "../../services/api";
import { RUSTENBURG_AREAS } from "../../services/maps";
import { formatFare, CONTACT } from "../../utils/constants";
import toast from "react-hot-toast";

const G = "#e8b84b";

export default function CourierPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("book"); // book | track | history
  const [form, setForm] = useState({
    description: "", weight: "", isFragile: false,
    pickupAddress: "", pickupLat: "", pickupLng: "",
    recipientName: "", recipientPhone: "",
    dropoffAddress: "", dropoffLat: "", dropoffLng: "",
  });
  const [trackingNo, setTrackingNo] = useState("");
  const [trackResult, setTrackResult] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(null);

  useEffect(() => {
    if (tab === "history") {
      deliveryAPI.getDeliveries()
        .then(d => setDeliveries(d.deliveries || [])).catch(() => {});
    }
  }, [tab]);

  const setArea = (field, area) => {
    setForm(f => ({
      ...f,
      [`${field}Address`]: area.name,
      [`${field}Lat`]: area.lat,
      [`${field}Lng`]: area.lng,
    }));
  };

  async function handleBook(e) {
    e.preventDefault();
    if (!form.pickupAddress || !form.dropoffAddress)
      return toast.error("Select pickup and dropoff areas");
    if (!form.recipientName || !form.recipientPhone)
      return toast.error("Enter recipient name and phone");
    setLoading(true);
    try {
      const res = await deliveryAPI.bookDelivery(form);
      setBooked(res);
      toast.success("Courier booked!");
    } catch (err) {
      toast.error(err?.error || "Booking failed");
    } finally { setLoading(false); }
  }

  async function handleTrack(e) {
    e.preventDefault();
    if (!trackingNo.trim()) return toast.error("Enter a tracking number");
    setLoading(true);
    try {
      const res = await deliveryAPI.trackDelivery(trackingNo.trim());
      setTrackResult(res.delivery);
    } catch {
      toast.error("Tracking number not found");
      setTrackResult(null);
    } finally { setLoading(false); }
  }

  const STATUS_COLOR = {
    PENDING: "#f59e0b", ASSIGNED: "#60a5fa", PICKED_UP: "#a78bfa",
    IN_TRANSIT: "#e8b84b", DELIVERED: "#4ade80", FAILED: "#ef4444",
  };

  const inp = {
    width: "100%", background: "#1a1a1a", border: "1px solid rgba(232,184,75,0.2)",
    borderRadius: "10px", color: "#f0ede8", padding: "12px 14px", fontSize: "14px",
    outline: "none", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a",
      fontFamily: "'DM Sans',sans-serif", paddingTop: "64px" }}>
      <Navbar />
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.5rem",
          fontWeight: "800", color: "#f0ede8", marginBottom: "1.5rem" }}>
          Courier & Delivery
        </h1>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }}>
          {[{ key:"book", label:"📦 Book Courier" },
            { key:"track", label:"🔍 Track Parcel" },
            { key:"history", label:"📋 My Deliveries" }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: "9px 18px", borderRadius: "50px", fontSize: "13px",
                fontWeight: "700", cursor: "pointer", transition: "all .15s",
                background: tab === t.key ? G : "#1a1a1a",
                color: tab === t.key ? "#0a0a0a" : "#a8a49e",
                border: tab === t.key ? "none" : "1px solid rgba(232,184,75,0.2)" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* BOOK */}
        {tab === "book" && !booked && (
          <form onSubmit={handleBook} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Package info */}
            <div style={{ background: "#111", border: "1px solid rgba(232,184,75,0.12)",
              borderRadius: "14px", padding: "1.25rem" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: "700",
                color: "#f0ede8", marginBottom: "12px", fontSize: "13px" }}>Package Details</div>
              <input style={inp} placeholder="What are you sending? (e.g. Documents, Clothes)" required
                value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
                <input style={inp} placeholder="Weight (kg)" type="number" step="0.1"
                  value={form.weight} onChange={e => setForm(f => ({...f, weight: e.target.value}))} />
                <div style={{ display: "flex", alignItems: "center", gap: "8px",
                  background: "#1a1a1a", border: "1px solid rgba(232,184,75,0.2)",
                  borderRadius: "10px", padding: "12px 14px", cursor: "pointer" }}
                  onClick={() => setForm(f => ({...f, isFragile: !f.isFragile}))}>
                  <div style={{ width: "18px", height: "18px", borderRadius: "4px",
                    border: "2px solid rgba(232,184,75,0.4)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    background: form.isFragile ? G : "transparent" }}>
                    {form.isFragile && <span style={{ fontSize: "11px", color: "#0a0a0a", fontWeight: "800" }}>✓</span>}
                  </div>
                  <span style={{ fontSize: "13px", color: "#a8a49e" }}>Fragile</span>
                </div>
              </div>
            </div>

            {/* Pickup area */}
            <div style={{ background: "#111", border: "1px solid rgba(232,184,75,0.12)",
              borderRadius: "14px", padding: "1.25rem" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: "700",
                color: "#f0ede8", marginBottom: "10px", fontSize: "13px" }}>📍 Pickup Area</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {RUSTENBURG_AREAS.filter(a => a.zone === 1).map(area => (
                  <button key={area.name} type="button" onClick={() => setArea("pickup", area)}
                    style={{ padding: "6px 14px", borderRadius: "50px", fontSize: "12px",
                      fontWeight: "600", cursor: "pointer", transition: "all .15s",
                      background: form.pickupAddress === area.name ? G : "#1a1a1a",
                      color: form.pickupAddress === area.name ? "#0a0a0a" : "#a8a49e",
                      border: form.pickupAddress === area.name ? "none" : "1px solid rgba(232,184,75,0.2)" }}>
                    {area.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient */}
            <div style={{ background: "#111", border: "1px solid rgba(232,184,75,0.12)",
              borderRadius: "14px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: "700",
                color: "#f0ede8", marginBottom: "2px", fontSize: "13px" }}>🏁 Recipient & Dropoff</div>
              <input style={inp} placeholder="Recipient's full name" required
                value={form.recipientName} onChange={e => setForm(f => ({...f, recipientName: e.target.value}))} />
              <div style={{ display: "flex", gap: "8px", alignItems: "center",
                background: "#1a1a1a", border: "1px solid rgba(232,184,75,0.2)",
                borderRadius: "10px", padding: "0 14px" }}>
                <span style={{ color: G, fontWeight: "700", flexShrink: 0 }}>+27</span>
                <input placeholder="Recipient phone" type="tel"
                  style={{ background: "transparent", border: "none", color: "#f0ede8",
                    padding: "12px 0", fontSize: "14px", outline: "none", flex: 1 }}
                  value={form.recipientPhone}
                  onChange={e => setForm(f => ({...f, recipientPhone: "+27" + e.target.value.replace(/\D/g,"").replace(/^27/,"") }))} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {RUSTENBURG_AREAS.map(area => (
                  <button key={area.name} type="button" onClick={() => setArea("dropoff", area)}
                    style={{ padding: "6px 14px", borderRadius: "50px", fontSize: "12px",
                      fontWeight: "600", cursor: "pointer", transition: "all .15s",
                      background: form.dropoffAddress === area.name ? G : "#1a1a1a",
                      color: form.dropoffAddress === area.name ? "#0a0a0a" : "#a8a49e",
                      border: form.dropoffAddress === area.name ? "none" : "1px solid rgba(232,184,75,0.2)" }}>
                    {area.name}{area.zone === 2 ? " →" : ""}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ background: G, color: "#0a0a0a", border: "none", borderRadius: "12px",
                padding: "15px", fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1 }}>
              {loading ? "Booking..." : "Book Courier Pickup"}
            </button>

            <div style={{ textAlign: "center", fontSize: "12px", color: "#3d3d3d" }}>
              Questions? WhatsApp us at <a href={CONTACT.whatsappLink} target="_blank" rel="noreferrer"
                style={{ color: G, textDecoration: "none" }}>{CONTACT.phone}</a>
            </div>
          </form>
        )}

        {/* BOOKED CONFIRMATION */}
        {tab === "book" && booked && (
          <div style={{ background: "#111", border: "2px solid rgba(74,222,128,0.3)",
            borderRadius: "16px", padding: "2rem", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "1rem" }}>📦</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.3rem",
              fontWeight: "800", color: "#f0ede8", marginBottom: "0.5rem" }}>Courier Booked!</div>
            <div style={{ fontSize: "13px", color: "#a8a49e", marginBottom: "1.5rem" }}>
              A driver will be assigned shortly
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: "10px", padding: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "4px" }}>Tracking Number</div>
              <div style={{ fontFamily: "monospace", fontSize: "1.1rem", fontWeight: "700",
                color: G, letterSpacing: "2px" }}>{booked.trackingNumber}</div>
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: "800", color: G,
              fontFamily: "'Syne',sans-serif", marginBottom: "1.5rem" }}>
              {formatFare(booked.fare)}
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button onClick={() => { setTab("track"); setTrackingNo(booked.trackingNumber); }}
                style={{ background: G, color: "#0a0a0a", border: "none", borderRadius: "10px",
                  padding: "10px 20px", fontWeight: "700", cursor: "pointer" }}>Track Parcel</button>
              <button onClick={() => setBooked(null)}
                style={{ background: "#1a1a1a", color: "#a8a49e", border: "1px solid rgba(232,184,75,0.2)",
                  borderRadius: "10px", padding: "10px 20px", fontWeight: "600", cursor: "pointer" }}>
                Book Another
              </button>
            </div>
          </div>
        )}

        {/* TRACK */}
        {tab === "track" && (
          <div>
            <form onSubmit={handleTrack} style={{ display: "flex", gap: "10px", marginBottom: "1.5rem" }}>
              <input style={{ ...inp, flex: 1 }} placeholder="Enter tracking number"
                value={trackingNo} onChange={e => setTrackingNo(e.target.value)} />
              <button type="submit" disabled={loading}
                style={{ background: G, color: "#0a0a0a", border: "none", borderRadius: "10px",
                  padding: "12px 20px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}>
                {loading ? "..." : "Track"}
              </button>
            </form>
            {trackResult && (
              <div style={{ background: "#111", border: "1px solid rgba(232,184,75,0.2)",
                borderRadius: "14px", padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: "1rem" }}>
                  <div style={{ fontFamily: "monospace", color: G, fontWeight: "700",
                    fontSize: "13px" }}>{trackResult.trackingNumber}</div>
                  <div style={{ fontSize: "12px", fontWeight: "700", padding: "4px 12px",
                    borderRadius: "50px", background: `${STATUS_COLOR[trackResult.status]}22`,
                    color: STATUS_COLOR[trackResult.status] }}>
                    {trackResult.status}
                  </div>
                </div>
                <div style={{ fontSize: "13px", color: "#a8a49e", marginBottom: "8px" }}>
                  📍 {trackResult.pickupAddress} → 🏁 {trackResult.dropoffAddress}
                </div>
                <div style={{ fontSize: "13px", color: "#f0ede8" }}>{trackResult.description}</div>
                {trackResult.driver?.user?.name && (
                  <div style={{ marginTop: "10px", fontSize: "12px", color: "#6b6760" }}>
                    Driver: {trackResult.driver.user.name}
                  </div>
                )}
                {trackResult.deliveredAt && (
                  <div style={{ marginTop: "10px", fontSize: "12px", color: "#4ade80", fontWeight: "600" }}>
                    ✅ Delivered: {new Date(trackResult.deliveredAt).toLocaleString("en-ZA")}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {tab === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {deliveries.length === 0 ? (
              <div style={{ color: "#6b6760", textAlign: "center", padding: "3rem", fontSize: "14px" }}>
                No deliveries yet.
              </div>
            ) : deliveries.map(d => (
              <div key={d.id} style={{ background: "#111",
                border: "1px solid rgba(232,184,75,0.1)", borderRadius: "12px", padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div style={{ fontFamily: "monospace", fontSize: "12px", color: G }}>
                    {d.trackingNumber}
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: "700", padding: "2px 10px",
                    borderRadius: "50px", background: `${STATUS_COLOR[d.status]}22`,
                    color: STATUS_COLOR[d.status] }}>{d.status}</div>
                </div>
                <div style={{ fontSize: "13px", color: "#f0ede8", marginBottom: "4px" }}>{d.description}</div>
                <div style={{ fontSize: "12px", color: "#6b6760" }}>
                  {d.pickupAddress} → {d.dropoffAddress} · {formatFare(d.fare)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
