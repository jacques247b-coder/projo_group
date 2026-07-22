import React from "react";
import Navbar from "../../components/ui/Navbar";

const G = "#e8b84b";
const BG = "#0a0a0a";
const BG2 = "#111111";
const BORDER = "rgba(232,184,75,0.15)";

export default function GoalsPage() {
  return (
    <div style={{ background: BG, minHeight: "100vh", color: "#f0ede8", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "88px 1rem 2rem" }}>
        <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎯</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "24px", fontWeight: "800", color: G, marginBottom: "8px" }}>Goals & Habits</div>
          <div style={{ fontSize: "14px", color: "#6b6760", marginBottom: "2rem", lineHeight: 1.6 }}>Track your goals and daily habits</div>
          <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1.5rem" }}>
            <div style={{ fontSize: "13px", color: G, fontWeight: "700", marginBottom: "8px" }}>🚧 Coming Soon</div>
            <div style={{ fontSize: "12px", color: "#4a3030", lineHeight: 1.6 }}>
              This feature is ready in the database and routing. Full UI will be connected in the next build session.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
