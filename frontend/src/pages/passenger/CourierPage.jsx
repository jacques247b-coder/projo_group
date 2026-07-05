// PROJO GROUP — Courier Booking Page (FIXED)
// FIX 1: RUSTENBURG_AREAS from services/maps.js (was missing)
// FIX 2: Booking reads res.delivery not res directly
// FIX 3: Zone 1/2 areas split with labels in dropoff section
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/ui/Navbar";
import { deliveryAPI } from "../../services/api";
import { RUSTENBURG_AREAS } from "../../services/maps";
import { formatFare, CONTACT } from "../../utils/constants";
import toast from "react-hot-toast";

const G = "#e8b84b";
const BG = "#0a0a0a";
const BG2 = "#111111";
const BG3 = "#1a1a1a";
const BORDER = "rgba(232,184,75,0.2)";
const STATUS_COLOR = {
  PENDING: "#f59e0b", ASSIGNED: "#60a5fa", PICKED_UP: "#a78bfa",
  IN_TRANSIT: "#e8b84b", DELIVERED: "#4ade80", FAILED: "#ef4444",
};

export default function CourierPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("book");
  const [form, setForm] = useState({
    description: "", isFragile: false,
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
        .then(d => setDeliveries(d.deliveries || []))
        .catch(() => {});
    }
  }, [tab]);

  function setArea(field, area) {
    setForm(f => ({
      ...f,
      [`${field}Address`]: area.name,
      [`${field}Lat`]: area.lat,
      [`${field}Lng`]: area.lng,
    }));
  }

  function clearArea(field) {
    setForm(f => ({ ...f, [`${field}Address`]: "", [`${field}Lat`]: "", [`${field}Lng`]: "" }));
  }

  async function handleBook(e) {
    e.preventDefault();
    if (!form.pickupAddress || !form.dropoffAddress) return toast.error("Select pickup and dropoff areas");
    if (!form.recipientName || !form.recipientPhone) return toast.error("Enter recipient name and phone");
    setLoading(true);
    try {
      const res = await deliveryAPI.bookDelivery(form);
      setBooked(res.delivery || res);
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
      setTrackResult(res.delivery || res);
    } catch {
      toast.error("Tracking number not found");
      setTrackResult(null);
    } finally { setLoading(false); }
  }

  const inp = {
    width: "100%", background: BG3, border: `1px solid ${BORDER}`,
    borderRadius: "10px", color: "#f0ede8", padding: "12px 14px",
    fontSize: "14px", outline: "none", fontFamily: "'DM Sans',sans-serif",
    boxSizing: "border-box",
  };
  const card = {
    background: BG2, border: "1px solid rgba(232,184,75,0.12)",
    borderRadius: "14px", padding: "1.25rem",
  };
  const areaBtn = (selected) => ({
    padding: "6px 14px", borderRadius: "50px", fontSize: "12px",
    fontWeight: "600", cursor: "pointer", transition: "all .15s",
    background: selected ? G : BG3,
    color: selected ? "#0a0a0a" : "#a8a49e",
    border: selected ? "none" : `1px solid ${BORDER}`,
  });

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Sans',sans-serif", paddingTop: "64px" }}>
      <Navbar />
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem 1.5rem" }}>

        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: G, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>PROJO GROUP</div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.5rem", fontWeight: "800", color: "#f0ede8", margin: 0 }}>Courier & Delivery</h1>
          <p style={{ fontSize: "13px", color: "#6b6760", marginTop: "4px" }}>R60 flat within Rustenburg · Same-day delivery</p>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }}>
          {[{ key: "track", label: "🔍 Track" }, { key: "history", label: "📋 History" }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "9px 18px", borderRadius: "50px", fontSize: "13px", fontWeight: "700", cursor: "pointer",
              background: tab === t.key ? G : BG3, color: tab === t.key ? "#0a0a0a" : "#a8a49e",
              border: tab === t.key ? "none" : `1px solid ${BORDER}`,
            }}>{t.label}</button>
          ))}
        </div>

        {/* BOOK */}
        {tab === "book" && !booked && (
          <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>📦</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "18px", fontWeight: "800", color: G, marginBottom: "8px" }}>Book a Delivery</div>
              <div style={{ fontSize: "13px", color: "#6b6760", marginBottom: "1.5rem", lineHeight: 1.6 }}>
                Book your delivery on the main Booking page alongside rides and services.
              </div>
              <button onClick={() => navigate("/book-ride?tab=delivery")} style={{
                background: G, color: "#0a0a0a", border: "none", borderRadius: "12px",
                padding: "14px 32px", fontWeight: "800", fontSize: "15px", cursor: "pointer",
                width: "100%",
              }}>📦 Book a Delivery</button>
              <div style={{ fontSize: "12px", color: "#4a3030", marginTop: "12px" }}>
                Flat rate R60 within Rustenburg · Door to door service
              </div>
            </div>
        )}

        {/* CONFIRMATION */}
        {tab === "book" && booked && (
          <div style={{ ...card, border: "2px solid rgba(74,222,128,0.3)", textAlign: "center", padding: "2rem" }}>
            <div style={{ fontSize: "48px", marginBottom: "1rem" }}>📦</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.3rem", fontWeight: "800", color: "#f0ede8", marginBottom: "0.5rem" }}>Courier Booked!</div>
            <div style={{ fontSize: "13px", color: "#a8a49e", marginBottom: "1.5rem" }}>A driver will be assigned shortly</div>
            {booked.trackingNumber && (
              <div style={{ background: BG3, borderRadius: "10px", padding: "1rem", marginBottom: "1rem" }}>
                <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "4px" }}>Tracking Number</div>
                <div style={{ fontFamily: "monospace", fontSize: "0.95rem", fontWeight: "700", color: G, letterSpacing: "1px", wordBreak: "break-all", overflowWrap: "anywhere" }}>{booked.trackingNumber}</div>
              </div>
            )}
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.5rem", fontWeight: "800", color: G, marginBottom: "1.5rem" }}>{formatFare(booked.fare || 60)}</div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                <button onClick={() => { setTab("track"); if (booked.trackingNumber) setTrackingNo(booked.trackingNumber); }} style={{ background: G, color: "#0a0a0a", border: "none", borderRadius: "10px", padding: "10px 20px", fontWeight: "700", cursor: "pointer" }}>Track Parcel</button>
                <button onClick={() => {
                  const url = `${window.location.origin}/track/delivery/${booked.trackingNumber}`;
                  navigator.clipboard?.writeText(url).then(() => toast.success("Tracking link copied!")).catch(() => toast.success("Share: " + url));
                }} style={{ background: "transparent", color: G, border: `1px solid ${G}`, borderRadius: "10px", padding: "10px 20px", fontWeight: "700", cursor: "pointer" }}>📋 Copy Tracking Link</button>
              </div>
              <button onClick={() => { setBooked(null); setForm({ description: "", isFragile: false, pickupAddress: "", pickupLat: "", pickupLng: "", recipientName: "", recipientPhone: "", dropoffAddress: "", dropoffLat: "", dropoffLng: "" }); }} style={{ background: BG3, color: "#a8a49e", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "10px 20px", fontWeight: "600", cursor: "pointer" }}>Book Another</button>
            </div>
          </div>
        )}

        {/* TRACK */}
        {tab === "track" && (
          <div>
            <form onSubmit={handleTrack} style={{ display: "flex", gap: "10px", marginBottom: "1.5rem" }}>
              <input style={{ ...inp, flex: 1 }} placeholder="Enter tracking number" value={trackingNo} onChange={e => setTrackingNo(e.target.value)} />
              <button type="submit" disabled={loading} style={{ background: G, color: "#0a0a0a", border: "none", borderRadius: "10px", padding: "12px 20px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}>{loading ? "..." : "Track"}</button>
            </form>
            {trackResult && (
              <div style={{ ...card, border: `1px solid ${BORDER}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div style={{ fontFamily: "monospace", color: G, fontWeight: "700", fontSize: "13px", wordBreak: "break-all", overflowWrap: "anywhere" }}>{trackResult.trackingNumber}</div>
                  <div style={{ fontSize: "12px", fontWeight: "700", padding: "4px 12px", borderRadius: "50px", background: `${STATUS_COLOR[trackResult.status]}22`, color: STATUS_COLOR[trackResult.status] }}>{trackResult.status}</div>
                </div>
                <div style={{ fontSize: "13px", color: "#a8a49e", marginBottom: "8px" }}>📍 {trackResult.pickupAddress} → 🏁 {trackResult.dropoffAddress}</div>
                <div style={{ fontSize: "13px", color: "#f0ede8", marginBottom: "8px" }}>{trackResult.description}</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: G }}>{formatFare(trackResult.fare || 60)}</div>
                {trackResult.deliveredAt && <div style={{ marginTop: "10px", fontSize: "12px", color: "#4ade80", fontWeight: "600" }}>✅ Delivered: {new Date(trackResult.deliveredAt).toLocaleString("en-ZA")}</div>}
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {tab === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {deliveries.length === 0 ? (
              <div style={{ color: "#6b6760", textAlign: "center", padding: "3rem" }}>
                <div style={{ fontSize: "40px", marginBottom: "1rem" }}>📦</div>
                No deliveries yet.
              </div>
            ) : deliveries.map(d => (
              <div key={d.id} style={{ ...card, border: "1px solid rgba(232,184,75,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div style={{ fontFamily: "monospace", fontSize: "12px", color: G, wordBreak: "break-all", overflowWrap: "anywhere" }}>{d.trackingNumber}</div>
                  <div style={{ fontSize: "12px", fontWeight: "700", padding: "2px 10px", borderRadius: "50px", background: `${STATUS_COLOR[d.status]}22`, color: STATUS_COLOR[d.status] }}>{d.status}</div>
                </div>
                <div style={{ fontSize: "13px", color: "#f0ede8", marginBottom: "4px" }}>{d.description}</div>
                <div style={{ fontSize: "12px", color: "#6b6760" }}>{d.pickupAddress} → {d.dropoffAddress} · {formatFare(d.fare || 60)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
