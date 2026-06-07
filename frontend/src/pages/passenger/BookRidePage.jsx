// ============================================================
// PROJO GROUP — Book Ride / Delivery Page (Fixed)
// - Quick area chips as primary selection
// - Free text as fallback
// - Ride OR Package Delivery toggle
// - Shop link alongside booking
// - Loyalty points: 1 point per R10 spent
// ============================================================
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { rideAPI } from "../../services/api";
import { VEHICLE_INFO, formatFare, CONTACT } from "../../utils/constants";
import toast from "react-hot-toast";
import Navbar from "../../components/ui/Navbar";

const G = "#e8b84b";
const BG = "#0d0505";
const BG2 = "#120808";
const BG3 = "#1c0f0f";
const BORDER = "rgba(232,184,75,0.18)";

const VEHICLE_TYPES = ["ECONOMY", "COMFORT", "XL", "LUXURY"];

const ALL_AREAS = [
  { name: "Rustenburg CBD",        lat: -25.6694, lng: 27.2424, zone: 1 },
  { name: "Waterfall East",        lat: -25.6520, lng: 27.2630, zone: 1 },
  { name: "Boitekong",             lat: -25.6900, lng: 27.2100, zone: 1 },
  { name: "Tlhabane",              lat: -25.6970, lng: 27.2700, zone: 1 },
  { name: "Cashan",                lat: -25.6550, lng: 27.2200, zone: 1 },
  { name: "Protea Park",           lat: -25.6400, lng: 27.2350, zone: 1 },
  { name: "Rustenburg Industrial", lat: -25.6800, lng: 27.2500, zone: 1 },
  { name: "Phokeng",               lat: -25.7100, lng: 27.1900, zone: 1 },
  { name: "Swartruggens",          lat: -25.6600, lng: 26.6900, zone: 2 },
  { name: "Brits",                 lat: -25.6310, lng: 27.7800, zone: 2 },
  { name: "Sun City",              lat: -25.3381, lng: 27.0937, zone: 2 },
  { name: "Johannesburg",          lat: -26.2041, lng: 28.0473, zone: 2 },
  { name: "Pretoria",              lat: -25.7479, lng: 28.2293, zone: 2 },
];

function calcLoyaltyPoints(fare) {
  return Math.floor((fare || 0) / 10);
}

function LocationPicker({ label, icon, value, onChange }) {
  const [customText, setCustomText] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  function selectArea(area) {
    onChange(area);
    setShowCustom(false);
    setCustomText("");
  }

  function useCustomAddress() {
    if (!customText.trim()) return;
    // Use Rustenburg CBD coordinates as fallback for custom addresses
    onChange({
      name: customText.trim(),
      lat: -25.6694 + (Math.random() - 0.5) * 0.02,
      lng: 27.2424 + (Math.random() - 0.5) * 0.02,
      zone: 1,
      custom: true,
    });
    setShowCustom(false);
  }

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ fontSize: "11px", fontWeight: "700", color: "#7a5a55",
        letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "8px" }}>
        {icon} {label}
      </div>

      {/* Selected value display */}
      {value && (
        <div style={{ background: "rgba(232,184,75,0.1)", border: `1px solid ${G}`,
          borderRadius: "8px", padding: "8px 12px", marginBottom: "8px",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: G }}>
            ✅ {value.name}
          </span>
          <button onClick={() => onChange(null)} style={{
            background: "transparent", border: "none", color: "#7a5a55",
            cursor: "pointer", fontSize: "16px",
          }}>✕</button>
        </div>
      )}

      {/* Zone 1 quick chips */}
      {!value && (
        <>
          <div style={{ fontSize: "10px", color: "#7a5a55", fontWeight: "700",
            textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
            Rustenburg Area (R60 flat)
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
            {ALL_AREAS.filter(a => a.zone === 1).map(area => (
              <button key={area.name} onClick={() => selectArea(area)} style={{
                background: BG3, border: `1px solid rgba(232,184,75,0.2)`,
                borderRadius: "50px", padding: "6px 12px", fontSize: "12px",
                fontWeight: "600", color: "#b8a09a", cursor: "pointer",
                transition: "all .15s",
              }}
              onMouseOver={e => { e.target.style.borderColor = G; e.target.style.color = G; }}
              onMouseOut={e => { e.target.style.borderColor = "rgba(232,184,75,0.2)"; e.target.style.color = "#b8a09a"; }}>
                {area.name}
              </button>
            ))}
          </div>

          <div style={{ fontSize: "10px", color: "#7a5a55", fontWeight: "700",
            textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
            Outside Rustenburg (R7.50/km)
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
            {ALL_AREAS.filter(a => a.zone === 2).map(area => (
              <button key={area.name} onClick={() => selectArea(area)} style={{
                background: BG3, border: `1px solid rgba(139,26,26,0.3)`,
                borderRadius: "50px", padding: "6px 12px", fontSize: "12px",
                fontWeight: "600", color: "#7a5a55", cursor: "pointer",
              }}
              onMouseOver={e => { e.target.style.borderColor = G; e.target.style.color = G; }}
              onMouseOut={e => { e.target.style.borderColor = "rgba(139,26,26,0.3)"; e.target.style.color = "#7a5a55"; }}>
                {area.name}
              </button>
            ))}
          </div>

          {/* Custom address toggle */}
          {!showCustom ? (
            <button onClick={() => setShowCustom(true)} style={{
              background: "transparent", border: `1px dashed rgba(232,184,75,0.2)`,
              borderRadius: "8px", padding: "8px 16px", fontSize: "12px",
              color: "#7a5a55", cursor: "pointer", width: "100%",
            }}>
              + Enter a custom address
            </button>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                autoFocus
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && useCustomAddress()}
                placeholder="Type your address..."
                style={{ flex: 1, background: BG3, border: `1px solid ${BORDER}`,
                  color: "#f5ede8", borderRadius: "8px", padding: "10px 12px",
                  fontSize: "13px", fontFamily: "'DM Sans',sans-serif", outline: "none" }}
              />
              <button onClick={useCustomAddress} style={{
                background: G, color: "#1a0808", border: "none",
                borderRadius: "8px", padding: "10px 16px", fontSize: "13px",
                fontWeight: "700", cursor: "pointer",
              }}>Use</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function BookRidePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookingType, setBookingType] = useState("ride");
  const [pickup,  setPickup]  = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [vehicleType, setVehicleType] = useState("ECONOMY");
  const [fareResult, setFareResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [payWithWallet, setPayWithWallet] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [packageDesc, setPackageDesc] = useState("");

  const estimateFare = useCallback(async () => {
    if (!pickup || !dropoff) return;
    try {
      const result = await rideAPI.estimateFare({
        pickupLat: pickup.lat, pickupLng: pickup.lng,
        dropoffLat: dropoff.lat, dropoffLng: dropoff.lng,
        vehicleType,
      });
      setFareResult(result);
    } catch { toast.error("Could not calculate fare"); }
  }, [pickup, dropoff, vehicleType]);

  useEffect(() => { estimateFare(); }, [estimateFare]);

  async function handleBook() {
    if (!pickup || !dropoff) return toast.error("Please select pickup and dropoff");
    if (bookingType === "delivery" && !recipientName) return toast.error("Please enter recipient name");
    setLoading(true);
    try {
      await rideAPI.bookRide({
        pickupAddress: pickup.name, pickupLat: pickup.lat, pickupLng: pickup.lng,
        dropoffAddress: dropoff.name, dropoffLat: dropoff.lat, dropoffLng: dropoff.lng,
        vehicleType, scheduledFor: scheduledFor || null,
        paidWithWallet: payWithWallet, bookingType,
        recipientName, recipientPhone, packageDesc,
      });
      const points = calcLoyaltyPoints(fareResult?.totalFare || 60);
      toast.success(`🎉 Booked! You earned ${points} loyalty point${points !== 1 ? "s" : ""}!`);
      navigate("/rides");
    } catch (err) {
      toast.error(err?.error || "Could not book. Please try again.");
    } finally { setLoading(false); }
  }

  const inp = {
    width: "100%", background: BG3, border: `1px solid ${BORDER}`,
    color: "#f5ede8", borderRadius: "10px", padding: "11px 14px",
    fontSize: "14px", fontFamily: "'DM Sans',sans-serif", outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "84px 1rem 2rem" }}>

        {/* Top cards — Ride Booking OR Shop */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          <div style={{ background: BG2, border: `2px solid ${G}`, borderRadius: "16px",
            padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: "28px", marginBottom: "6px" }}>🚗</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: "800", color: G, fontSize: "14px" }}>Book a Ride</div>
            <div style={{ fontSize: "11px", color: "#7a5a55", marginTop: "3px" }}>R60 flat · Rustenburg</div>
          </div>
          <div onClick={() => window.open(CONTACT.shopLink, "_blank")} style={{
            background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px",
            padding: "1.25rem", textAlign: "center", cursor: "pointer", transition: "all .2s" }}
            onMouseOver={e => e.currentTarget.style.borderColor = G}
            onMouseOut={e => e.currentTarget.style.borderColor = BORDER}>
            <div style={{ fontSize: "28px", marginBottom: "6px" }}>🛍️</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: "800", color: "#f5ede8", fontSize: "14px" }}>Online Shop</div>
            <div style={{ fontSize: "11px", color: "#7a5a55", marginTop: "3px" }}>Browse & order</div>
          </div>
        </div>

        {/* Booking card */}
        <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "20px", padding: "1.5rem" }}>

          {/* Ride / Delivery toggle */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }}>
            {[["ride","🚗","Request a Ride"],["delivery","📦","Package Delivery"]].map(([t,icon,label]) => (
              <button key={t} onClick={() => setBookingType(t)} style={{
                flex: 1, padding: "10px", borderRadius: "10px", cursor: "pointer",
                border: `1px solid ${bookingType === t ? G : BORDER}`,
                background: bookingType === t ? "rgba(232,184,75,0.1)" : BG3,
                color: bookingType === t ? G : "#b8a09a",
                fontWeight: "700", fontSize: "13px", fontFamily: "'DM Sans',sans-serif",
              }}>{icon} {label}</button>
            ))}
          </div>

          {/* Location pickers */}
          <LocationPicker label="Pickup Location" icon="📍" value={pickup} onChange={setPickup} />
          <LocationPicker label="Dropoff Location" icon="🏁" value={dropoff} onChange={setDropoff} />

          {/* Delivery extras */}
          {bookingType === "delivery" && (
            <div style={{ background: BG3, border: `1px solid ${BORDER}`,
              borderRadius: "12px", padding: "1rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: G, marginBottom: "10px" }}>📦 Package Details</div>
              <div style={{ marginBottom: "10px" }}>
                <div style={{ fontSize: "11px", color: "#7a5a55", fontWeight: "700",
                  textTransform: "uppercase", marginBottom: "5px" }}>Recipient Name *</div>
                <input style={inp} value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Who receives the package?" />
              </div>
              <div style={{ marginBottom: "10px" }}>
                <div style={{ fontSize: "11px", color: "#7a5a55", fontWeight: "700",
                  textTransform: "uppercase", marginBottom: "5px" }}>Recipient Phone</div>
                <input style={inp} value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} placeholder="+27 83 123 4567" type="tel" />
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "#7a5a55", fontWeight: "700",
                  textTransform: "uppercase", marginBottom: "5px" }}>Package Description</div>
                <input style={inp} value={packageDesc} onChange={e => setPackageDesc(e.target.value)} placeholder="e.g. Documents, small parcel" />
              </div>
            </div>
          )}

          {/* Vehicle type (rides only) */}
          {bookingType === "ride" && (
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#7a5a55",
                letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "10px" }}>Select Vehicle</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "8px" }}>
                {VEHICLE_TYPES.map(type => {
                  const info = VEHICLE_INFO[type];
                  const selected = vehicleType === type;
                  return (
                    <div key={type} onClick={() => setVehicleType(type)} style={{
                      background: selected ? "rgba(232,184,75,0.1)" : BG3,
                      border: `1px solid ${selected ? G : BORDER}`,
                      borderRadius: "12px", padding: "12px", cursor: "pointer",
                    }}>
                      <div style={{ fontSize: "20px", marginBottom: "4px" }}>{info.emoji}</div>
                      <div style={{ fontSize: "12px", fontWeight: "700", color: selected ? G : "#f5ede8" }}>{info.label}</div>
                      <div style={{ fontSize: "10px", color: "#7a5a55", marginTop: "2px" }}>
                        {info.multiplier === 1 ? "Base fare" : `×${info.multiplier}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fare display */}
          {fareResult && pickup && dropoff && (
            <div style={{ background: "rgba(232,184,75,0.06)", border: `1px solid ${BORDER}`,
              borderRadius: "12px", padding: "14px 16px", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#7a5a55", fontWeight: "700",
                    textTransform: "uppercase", marginBottom: "2px" }}>
                    {bookingType === "delivery" ? "Delivery Fee" : "Estimated Fare"}
                  </div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "2rem", fontWeight: "800", color: G }}>
                    {formatFare(fareResult.totalFare || fareResult.fare || 60)}
                  </div>
                  <div style={{ fontSize: "12px", color: "#b8a09a", marginTop: "2px" }}>
                    {fareResult.zone === "ZONE_1_FLAT" ? "Flat Rate — Rustenburg Area" :
                      `${fareResult.distanceKm || ""}km × R7.50/km`}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "#7a5a55" }}>Loyalty Points</div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: G }}>
                    +{calcLoyaltyPoints(fareResult.totalFare || fareResult.fare || 60)}
                  </div>
                  <div style={{ fontSize: "10px", color: "#7a5a55" }}>1pt per R10</div>
                </div>
              </div>
            </div>
          )}

          {/* Schedule */}
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#7a5a55",
              letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "6px" }}>
              📅 Schedule for later (optional)
            </div>
            <input type="datetime-local" value={scheduledFor}
              onChange={e => setScheduledFor(e.target.value)} style={inp} />
          </div>

          {/* Wallet toggle */}
          {(user?.wallet?.balanceZar || 0) > 0 && (
            <div onClick={() => setPayWithWallet(p => !p)} style={{
              background: BG3, border: `1px solid ${BORDER}`, borderRadius: "12px",
              padding: "12px 16px", marginBottom: "1rem", display: "flex",
              alignItems: "center", justifyContent: "space-between", cursor: "pointer",
            }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#f5ede8" }}>💳 Pay with PROJO Wallet</div>
                <div style={{ fontSize: "12px", color: "#7a5a55", marginTop: "2px" }}>
                  Balance: <strong style={{ color: G }}>R{(user.wallet.balanceZar || 0).toFixed(2)}</strong>
                </div>
              </div>
              <div style={{ width: "44px", height: "24px", borderRadius: "12px",
                background: payWithWallet ? G : BG3, position: "relative", transition: "background .2s",
                border: `1px solid ${BORDER}` }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#0d0505",
                  position: "absolute", top: "3px", transition: "left .2s",
                  left: payWithWallet ? "22px" : "3px" }} />
              </div>
            </div>
          )}

          {/* Book button */}
          <button onClick={handleBook} disabled={!pickup || !dropoff || loading} style={{
            width: "100%", background: G, color: "#1a0808", border: "none",
            borderRadius: "12px", padding: "15px", fontSize: "15px", fontWeight: "800",
            cursor: (!pickup || !dropoff || loading) ? "not-allowed" : "pointer",
            opacity: (!pickup || !dropoff || loading) ? 0.5 : 1,
            fontFamily: "'Syne',sans-serif", marginBottom: "10px",
          }}>
            {loading ? "Booking..." : bookingType === "ride"
              ? `🚗 Book Ride${fareResult ? ` — ${formatFare(fareResult.totalFare || 60)}` : ""}`
              : `📦 Book Delivery${fareResult ? ` — ${formatFare(fareResult.totalFare || 60)}` : ""}`}
          </button>

          {/* WhatsApp fallback */}
          <div style={{ textAlign: "center" }}>
            <button onClick={() => window.open(CONTACT.whatsappLink, "_blank")} style={{
              background: "transparent", border: "none", color: "#7a5a55",
              fontSize: "12px", cursor: "pointer", textDecoration: "underline",
            }}>💬 Prefer to book via WhatsApp?</button>
          </div>
        </div>

        {/* All services */}
        <div style={{ marginTop: "20px", background: BG2, border: `1px solid ${BORDER}`,
          borderRadius: "16px", padding: "1.25rem" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: G, letterSpacing: "1px",
            textTransform: "uppercase", marginBottom: "12px" }}>All PROJO GROUP Services</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
            {[
              ["🧹","Cleaning","https://www.projogroup.co.za/cleaning"],
              ["🔧","Maintenance","https://www.projogroup.co.za/maintenance"],
              ["🎨","Painting","https://www.projogroup.co.za/painting"],
              ["📷","CCTV","https://www.projogroup.co.za/cctv"],
              ["🐛","Pest Control","https://www.projogroup.co.za/pest-control"],
              ["💻","Geeks IT","https://www.projogroup.co.za/geeks"],
              ["🌐","Web & App","https://www.projogroup.co.za/web-app"],
              ["📣","Digi Marketing","https://www.projogroup.co.za/digi-marketing"],
              ["🐾","Pet Care","https://www.projogroup.co.za/pet-care"],
            ].map(([icon, name, link]) => (
              <button key={name} onClick={() => window.open(link, "_blank")} style={{
                background: BG3, border: `1px solid ${BORDER}`, borderRadius: "10px",
                padding: "10px 6px", cursor: "pointer", textAlign: "center", transition: "all .2s",
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = G}
              onMouseOut={e => e.currentTarget.style.borderColor = BORDER}>
                <div style={{ fontSize: "18px", marginBottom: "4px" }}>{icon}</div>
                <div style={{ fontSize: "10px", fontWeight: "700", color: "#b8a09a" }}>{name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
