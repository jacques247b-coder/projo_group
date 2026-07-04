// PROJO GROUP — Travel Booking Page (Powered by Travelstart)
// Fully branded PROJO travel page with iFrame embedding
// Includes: Flights, Hotels, Bus, Car Hire, Packages
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/ui/Navbar";

const G = "#e8b84b";
const BG = "#0d0505";
const BG2 = "#120808";
const BG3 = "#1c0f0f";
const BORDER = "rgba(232,184,75,0.15)";

// ── REPLACE THIS WITH YOUR ACTUAL TRAVELSTART AFFILIATE ID ──
const AFFILIATE_ID = "YOUR_AFFILIATE_ID";

// Travelstart deep links with affiliate ID
const TRAVEL_TABS = [
  {
    key: "flights",
    label: "✈️ Flights",
    icon: "✈️",
    url: `https://www.travelstart.co.za/lp/affiliate-landing?affiliateId=${AFFILIATE_ID}`,
    description: "Search & book cheap flights on 500+ airlines",
  },
  {
    key: "hotels",
    label: "🏨 Hotels",
    icon: "🏨",
    url: `https://www.travelstart.co.za/hotels?affiliateId=${AFFILIATE_ID}`,
    description: "Find the best hotel deals worldwide",
  },
  {
    key: "buses",
    label: "🚌 Buses",
    icon: "🚌",
    url: `https://www.travelstart.co.za/lp/bus-tickets?affiliateId=${AFFILIATE_ID}`,
    description: "Book intercity bus tickets across South Africa",
  },
  {
    key: "cars",
    label: "🚗 Car Hire",
    icon: "🚗",
    url: `https://www.travelstart.co.za/car-hire?affiliateId=${AFFILIATE_ID}`,
    description: "Rent a car at the best rates",
  },
  {
    key: "packages",
    label: "🌴 Packages",
    icon: "🌴",
    url: `https://www.travelstart.co.za/packages?affiliateId=${AFFILIATE_ID}`,
    description: "All-inclusive holiday packages",
  },
];

export default function TravelPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("flights");
  const [iframeLoading, setIframeLoading] = useState(true);

  const currentTab = TRAVEL_TABS.find(t => t.key === activeTab);

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Sans',sans-serif" }}>
      <Navbar />

      {/* Header */}
      <div style={{ background: BG2, borderBottom: `1px solid ${BORDER}`, padding: "80px 1rem 0" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ paddingBottom: "1rem" }}>
            <div style={{ fontSize: "11px", color: G, fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>
              PROJO GROUP × TRAVELSTART
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.8rem", fontWeight: "800", color: "#f0ede8", margin: "0 0 4px" }}>
              Book Your Travel
            </h1>
            <p style={{ fontSize: "13px", color: "#6b6760", margin: 0 }}>
              Africa's best flight deals, hotels, buses & more — all in one place
            </p>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: "0", overflowX: "auto", paddingBottom: "0" }}>
            {TRAVEL_TABS.map(tab => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setIframeLoading(true); }} style={{
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.key ? `3px solid ${G}` : "3px solid transparent",
                color: activeTab === tab.key ? G : "#6b6760",
                padding: "12px 20px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
                whiteSpace: "nowrap",
                transition: "all .2s",
              }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* iFrame container */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0" }}>

        {/* Tab description */}
        <div style={{ padding: "12px 1rem", background: BG2, borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: "12px", color: "#6b6760" }}>
            <span style={{ fontSize: "16px", marginRight: "8px" }}>{currentTab?.icon}</span>
            {currentTab?.description}
          </div>
        </div>

        {/* Loading state */}
        {iframeLoading && (
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center", color: "#6b6760", zIndex: 1,
          }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>✈️</div>
            <div>Loading travel options...</div>
          </div>
        )}

        {/* iFrame */}
        <iframe
          key={activeTab}
          src={currentTab?.url}
          title={`PROJO Travel — ${currentTab?.label}`}
          onLoad={() => setIframeLoading(false)}
          style={{
            width: "100%",
            height: "calc(100vh - 200px)",
            minHeight: "600px",
            border: "none",
            display: "block",
            opacity: iframeLoading ? 0 : 1,
            transition: "opacity 0.3s",
          }}
          allow="payment"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
        />
      </div>

      {/* Powered by footer */}
      <div style={{
        textAlign: "center", padding: "1rem",
        borderTop: `1px solid ${BORDER}`,
        background: BG2, fontSize: "11px", color: "#4a3030",
      }}>
        Powered by Travelstart · Africa's Leading Online Travel Agency · Bookings earn PROJO Group affiliate commission
      </div>
    </div>
  );
}
