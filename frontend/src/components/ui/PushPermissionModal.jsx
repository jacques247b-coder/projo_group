// PROJO GROUP — Push Notification Permission Modal
// Shows on every login until user accepts
// Explains benefits before triggering the browser prompt
import React, { useState, useEffect } from "react";
import { subscribeToPush } from "../../services/pushNotifications";
import toast from "react-hot-toast";

const G = "#e8b84b";
const BG = "#0d0505";
const BG2 = "#120808";
const BORDER = "rgba(232,184,75,0.15)";

const BENEFITS = [
  { icon: "🚗", title: "Ride Updates",       desc: "Know instantly when your driver is assigned, on the way, or arrived" },
  { icon: "📦", title: "Delivery Tracking",  desc: "Real-time updates on your package status from pickup to door" },
  { icon: "🎁", title: "Special Offers",     desc: "Be first to know about exclusive deals and discounts" },
  { icon: "⭐", title: "Loyalty Rewards",    desc: "Get notified when you unlock a new tier or earn bonus points" },
  { icon: "🛠️", title: "Service Updates",    desc: "Updates on your booked services and technician arrival times" },
  { icon: "💰", title: "Wallet Alerts",      desc: "Instant alerts when your wallet is topped up or used" },
];

export default function PushPermissionModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("prompt"); // prompt | denied | success

  async function handleAllow() {
    setLoading(true);
    try {
      const result = await subscribeToPush();
      if (result) {
        setStep("success");
        localStorage.setItem("projo_push_accepted", "true");
        localStorage.removeItem("projo_push_dismissed_at");
        setTimeout(() => onClose(), 2000);
      } else {
        // Browser denied
        setStep("denied");
      }
    } catch {
      setStep("denied");
    } finally {
      setLoading(false);
    }
  }

  function handleLater() {
    // Record dismissal time — remind again next login
    localStorage.setItem("projo_push_dismissed_at", Date.now().toString());
    onClose();
  }

  function handleNever() {
    // Record permanent dismissal — still remind every 7 days
    localStorage.setItem("projo_push_dismissed_at", Date.now().toString());
    localStorage.setItem("projo_push_remind_days", "7");
    onClose();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      padding: "0",
    }}>
      <div style={{
        background: BG2, borderRadius: "24px 24px 0 0",
        border: `1px solid ${BORDER}`, borderBottom: "none",
        width: "100%", maxWidth: "500px",
        padding: "1.5rem 1.5rem 2.5rem",
        animation: "slideUp 0.3s ease",
      }}>

        {step === "success" && (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "20px", fontWeight: "800", color: "#4ade80", marginBottom: "8px" }}>
              You're all set!
            </div>
            <div style={{ fontSize: "13px", color: "#6b6760" }}>
              You'll now receive real-time updates from PROJO GROUP
            </div>
          </div>
        )}

        {step === "denied" && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>😔</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "18px", fontWeight: "800", color: G, marginBottom: "8px" }}>
              Notifications Blocked
            </div>
            <div style={{ fontSize: "13px", color: "#b8a09a", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              To enable notifications, go to your browser settings → Site Settings → Notifications → Allow for app.projogroup.co.za
            </div>
            <button onClick={onClose} style={{
              width: "100%", background: BG, border: `1px solid ${BORDER}`,
              borderRadius: "12px", padding: "14px", color: "#a8a49e",
              fontWeight: "700", fontSize: "14px", cursor: "pointer",
            }}>Close</button>
          </div>
        )}

        {step === "prompt" && (
          <>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "48px", marginBottom: "10px" }}>🔔</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "20px", fontWeight: "800", color: G, marginBottom: "6px" }}>
                Stay in the Loop!
              </div>
              <div style={{ fontSize: "13px", color: "#b8a09a", lineHeight: 1.5 }}>
                Enable notifications to get the most out of PROJO GROUP. Here's what you'll receive:
              </div>
            </div>

            {/* Benefits list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "1.5rem" }}>
              {BENEFITS.map(b => (
                <div key={b.title} style={{
                  display: "flex", gap: "12px", alignItems: "flex-start",
                  background: "rgba(232,184,75,0.05)", border: `1px solid ${BORDER}`,
                  borderRadius: "12px", padding: "10px 12px",
                }}>
                  <span style={{ fontSize: "22px", flexShrink: 0 }}>{b.icon}</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#f0ede8", marginBottom: "2px" }}>{b.title}</div>
                    <div style={{ fontSize: "11px", color: "#6b6760", lineHeight: 1.4 }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <button onClick={handleAllow} disabled={loading} style={{
              width: "100%", background: G, color: "#0a0a0a",
              border: "none", borderRadius: "12px", padding: "16px",
              fontWeight: "800", fontSize: "15px", cursor: "pointer",
              marginBottom: "10px", opacity: loading ? 0.7 : 1,
              fontFamily: "'DM Sans',sans-serif",
            }}>
              {loading ? "⏳ Enabling..." : "🔔 Enable Notifications"}
            </button>

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleLater} style={{
                flex: 1, background: "transparent",
                border: `1px solid ${BORDER}`, borderRadius: "10px",
                padding: "12px", color: "#6b6760", fontWeight: "600",
                fontSize: "13px", cursor: "pointer",
              }}>Remind Me Later</button>
              <button onClick={handleNever} style={{
                flex: 1, background: "transparent",
                border: `1px solid ${BORDER}`, borderRadius: "10px",
                padding: "12px", color: "#4a3030", fontWeight: "600",
                fontSize: "13px", cursor: "pointer",
              }}>Not Now</button>
            </div>

            <div style={{ textAlign: "center", marginTop: "12px", fontSize: "10px", color: "#3a2020" }}>
              You can change this anytime in your device settings
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
