// PROJO GROUP — Public Delivery Tracking Page
// Accessible without login: /track/delivery/:trackingNumber
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const G = "#e8b84b";
const BG = "#0d0505";
const BG2 = "#120808";
const BORDER = "rgba(232,184,75,0.15)";

const STATUS_STEPS = [
  { key: "PENDING",    label: "Booked",       icon: "📦" },
  { key: "CONFIRMED",  label: "Confirmed",    icon: "✅" },
  { key: "PICKED_UP",  label: "Picked Up",    icon: "🚗" },
  { key: "IN_TRANSIT", label: "In Transit",   icon: "🛣️" },
  { key: "DELIVERED",  label: "Delivered",    icon: "🏠" },
];

const STATUS_COLOR = {
  PENDING: "#f59e0b", CONFIRMED: "#60a5fa", PICKED_UP: "#a78bfa",
  IN_TRANSIT: "#f59e0b", DELIVERED: "#4ade80", CANCELLED: "#ef4444",
};

function fmt(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("en-ZA", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function DeliveryTrackingPage() {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manualInput, setManualInput] = useState("");

  useEffect(() => {
    if (trackingNumber) fetchDelivery(trackingNumber);
    else setLoading(false);
  }, [trackingNumber]);

  async function fetchDelivery(tn) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/deliveries/track/${tn}`
      );
      const data = await res.json();
      if (res.ok) setDelivery(data.delivery);
      else setError("Tracking number not found");
    } catch {
      setError("Could not connect — please try again");
    } finally { setLoading(false); }
  }

  const currentStepIdx = delivery
    ? STATUS_STEPS.findIndex(s => s.key === delivery.status)
    : -1;

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Sans',sans-serif", padding: "0" }}>
      {/* Header */}
      <div style={{ background: BG2, borderBottom: `1px solid ${BORDER}`, padding: "16px 1rem" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}>←</button>
          <div>
            <div style={{ fontSize: "11px", color: G, fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase" }}>PROJO GROUP</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "800", color: "#f0ede8" }}>Delivery Tracking</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "1.5rem 1rem" }}>

        {/* Search box */}
        <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "1.25rem", marginBottom: "1rem" }}>
          <div style={{ fontSize: "12px", color: "#6b6760", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Enter Tracking Number</div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && manualInput.trim() && navigate(`/track/delivery/${manualInput.trim()}`)}
              placeholder={trackingNumber || "e.g. PRJ-ABC12345"}
              style={{
                flex: 1, background: "#1a0a0a", border: `1px solid ${BORDER}`, borderRadius: "8px",
                color: "#f0ede8", padding: "10px 12px", fontSize: "13px", outline: "none",
                fontFamily: "monospace",
              }}
            />
            <button
              onClick={() => manualInput.trim() && navigate(`/track/delivery/${manualInput.trim()}`)}
              style={{ background: G, color: "#0d0505", border: "none", borderRadius: "8px", padding: "10px 20px", fontWeight: "700", cursor: "pointer" }}>
              Track
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "3rem", color: "#6b6760" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>📦</div>
            <div>Fetching delivery status...</div>
          </div>
        )}

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "14px", padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>❌</div>
            <div style={{ color: "#f87171", fontWeight: "700" }}>{error}</div>
            <div style={{ fontSize: "12px", color: "#6b6760", marginTop: "6px" }}>Check your tracking number and try again</div>
          </div>
        )}

        {delivery && (
          <>
            {/* Status Banner */}
            <div style={{
              background: `${STATUS_COLOR[delivery.status] || G}15`,
              border: `1px solid ${STATUS_COLOR[delivery.status] || G}40`,
              borderRadius: "14px", padding: "1.25rem", marginBottom: "1rem",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>Current Status</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.4rem", fontWeight: "800", color: STATUS_COLOR[delivery.status] || G }}>
                  {delivery.status?.replace(/_/g, " ")}
                </div>
                <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "4px" }}>Updated: {fmt(delivery.updatedAt)}</div>
              </div>
              <div style={{ fontSize: "48px" }}>
                {STATUS_STEPS.find(s => s.key === delivery.status)?.icon || "📦"}
              </div>
            </div>

            {/* Progress Steps */}
            {delivery.status !== "CANCELLED" && (
              <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "1.25rem", marginBottom: "1rem" }}>
                <div style={{ fontSize: "12px", color: "#6b6760", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "1px" }}>Delivery Progress</div>
                {STATUS_STEPS.map((step, idx) => {
                  const done = idx <= currentStepIdx;
                  const active = idx === currentStepIdx;
                  return (
                    <div key={step.key} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: idx < STATUS_STEPS.length - 1 ? "0" : "0" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "50%",
                          background: done ? G : BG,
                          border: `2px solid ${done ? G : BORDER}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "16px", flexShrink: 0,
                          boxShadow: active ? `0 0 12px ${G}60` : "none",
                        }}>
                          {done ? (active ? step.icon : "✓") : "○"}
                        </div>
                        {idx < STATUS_STEPS.length - 1 && (
                          <div style={{ width: "2px", height: "24px", background: idx < currentStepIdx ? G : BORDER }} />
                        )}
                      </div>
                      <div style={{ paddingBottom: idx < STATUS_STEPS.length - 1 ? "24px" : "0" }}>
                        <div style={{ fontSize: "13px", fontWeight: active ? "700" : "500", color: done ? "#f0ede8" : "#6b6760" }}>{step.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Delivery Details */}
            <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "1.25rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: "12px", color: "#6b6760", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "1px" }}>Delivery Details</div>
              {[
                ["Tracking Number", delivery.trackingNumber, true],
                ["Item", delivery.description, false],
                ["Pickup", delivery.pickupAddress, false],
                ["Dropoff", delivery.dropoffAddress, false],
                ["Recipient", delivery.recipientName, false],
                ["Booked", fmt(delivery.createdAt), false],
              ].map(([lbl, val, mono]) => val ? (
                <div key={lbl} style={{ marginBottom: "10px" }}>
                  <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "2px" }}>{lbl}</div>
                  <div style={{ fontSize: "13px", color: "#f0ede8", fontFamily: mono ? "monospace" : "inherit", wordBreak: "break-all" }}>{val}</div>
                </div>
              ) : null)}
            </div>

            {/* Contact */}
            <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: "13px", color: "#6b6760", marginBottom: "10px" }}>Questions about your delivery?</div>
              <a href="https://wa.me/27766147986" target="_blank" rel="noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "#25D366", color: "#fff", textDecoration: "none",
                borderRadius: "10px", padding: "10px 20px", fontWeight: "700", fontSize: "13px",
              }}>💬 Contact PROJO on WhatsApp</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
