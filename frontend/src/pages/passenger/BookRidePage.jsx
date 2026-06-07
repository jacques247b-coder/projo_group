// ============================================================
// PROJO GROUP — Book Ride / Delivery Page
// - Free text address entry
// - Ride OR Package Delivery toggle
// - Shop link alongside booking
// - Loyalty points: 1 point per R10 spent
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { rideAPI } from "../../services/api";
import { VEHICLE_INFO, formatFare, CONTACT } from "../../utils/constants";
import { reverseGeocode } from "../../services/maps";
import toast from "react-hot-toast";
import Navbar from "../../components/ui/Navbar";

const G = "#e8b84b";
const RED = "#8B1A1A";
const BG = "#0d0505";
const BG2 = "#120808";
const BG3 = "#1c0f0f";
const BORDER = "rgba(232,184,75,0.18)";

const VEHICLE_TYPES = ["ECONOMY", "COMFORT", "XL", "LUXURY"];

// Known areas for quick select
const QUICK_AREAS = [
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
];

// Address search using Nominatim (free, no key)
async function searchAddress(query) {
  if (!query || query.length < 3) return [];
  try {
    const q = encodeURIComponent(query + ", Rustenburg, South Africa");
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5&countrycodes=za`, {
      headers: { "Accept-Language": "en", "User-Agent": "PROJO-GROUP-App" },
    });
    const data = await res.json();
    return data.map(r => ({ name: r.display_name.split(",").slice(0, 2).join(",").trim(), lat: parseFloat(r.lat), lng: parseFloat(r.lon) }));
  } catch { return []; }
}

// Address input with autocomplete
function AddressInput({ label, value, onChange, icon }) {
  const [query, setQuery] = useState(value?.name || "");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef(null);

  useEffect(() => { setQuery(value?.name || ""); }, [value]);

  function handleChange(e) {
    const q = e.target.value;
    setQuery(q);
    if (timer.current) clearTimeout(timer.current);
    if (q.length < 3) { setResults([]); return; }
    setSearching(true);
    timer.current = setTimeout(async () => {
      const res = await searchAddress(q);
      setResults(res);
      setSearching(false);
    }, 500);
  }

  function select(item) {
    onChange(item);
    setQuery(item.name);
    setResults([]);
  }

  return (
    <div style={{ marginBottom: "16px", position: "relative" }}>
      <div style={{ fontSize: "11px", fontWeight: "700", color: "#7a5a55",
        letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "6px" }}>{label}</div>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "16px" }}>{icon}</span>
        <input
          value={query}
          onChange={handleChange}
          placeholder={`Type ${label.toLowerCase()} address...`}
          style={{ width: "100%", background: BG3, border: `1px solid ${BORDER}`,
            color: "#f5ede8", borderRadius: "10px", padding: "12px 12px 12px 40px",
            fontSize: "14px", fontFamily: "'DM Sans',sans-serif", outline: "none",
            boxSizing: "border-box" }}
          onFocus={e => e.target.style.borderColor = G}
          onBlur={e => setTimeout(() => { e.target.style.borderColor = BORDER; setResults([]); }, 200)}
        />
        {searching && <span style={{ position: "absolute", right: "12px", top: "50%",
          transform: "translateY(-50%)", fontSize: "12px", color: "#7a5a55" }}>searching...</span>}
      </div>

      {/* Quick area chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "8px" }}>
        {QUICK_AREAS.map(a => (
          <button key={a.name} onClick={() => select(a)} style={{
            background: value?.name === a.name ? "rgba(232,184,75,0.15)" : BG3,
            border: `1px solid ${value?.name === a.name ? G : "rgba(232,184,75,0.15)"}`,
            borderRadius: "50px", padding: "3px 10px", fontSize: "11px",
            fontWeight: "600", color: value?.name === a.name ? G : "#7a5a55",
            cursor: "pointer",
          }}>{a.name}</button>
        ))}
      </div>

      {/* Autocomplete dropdown */}
      {results.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: BG2, border: `1px solid ${BORDER}`, borderRadius: "10px",
          marginTop: "4px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
          {results.map((r, i) => (
            <div key={i} onMouseDown={() => select(r)} style={{
              padding: "10px 14px", fontSize: "13px", color: "#f5ede8",
              cursor: "pointer", borderBottom: i < results.length - 1 ? `1px solid ${BORDER}` : "none",
            }}
            onMouseOver={e => e.currentTarget.style.background = "rgba(232,184,75,0.08)"}
            onMouseOut={e => e.currentTarget.style.background = "transparent"}>
              📍 {r.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BookRidePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookingType, setBookingType] = useState("ride"); // ride | delivery
  const [pickup,  setPickup]  = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [vehicleType, setVehicleType] = useState("ECONOMY");
  const [fareResult, setFareResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [payWithWallet, setPayWithWallet] = useState(false);
  // Delivery extras
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [packageDesc, setPackageDesc] = useState("");

  useEffect(() => {
    if (!pickup || !dropoff) return;
    estimateFare();
  }, [pickup, dropoff, vehicleType]);

  async function estimateFare() {
    setEstimating(true);
    try {
      const result = await rideAPI.estimateFare({
        pickupLat: pickup.lat, pickupLng: pickup.lng,
        dropoffLat: dropoff.lat, dropoffLng: dropoff.lng,
        vehicleType,
      });
      setFareResult(result);
    } catch { toast.error("Could not calculate fare"); }
    finally { setEstimating(false); }
  }

  // Loyalty points = 1 per R10 spent
  function calcLoyaltyPoints(fare) {
    return Math.floor(fare / 10);
  }

  async function handleBook() {
    if (!pickup || !dropoff) return toast.error("Please enter pickup and dropoff");
    setLoading(true);
    try {
      await rideAPI.bookRide({
        pickupAddress: pickup.name,
        pickupLat: pickup.lat, pickupLng: pickup.lng,
        dropoffAddress: dropoff.name,
        dropoffLat: dropoff.lat, dropoffLng: dropoff.lng,
        vehicleType,
        scheduledFor: scheduledFor || null,
        paidWithWallet: payWithWallet,
        bookingType,
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
    color: "#f5ede8", borderRadius: "10px", padding: "12px 14px",
    fontSize: "14px", fontFamily: "'DM Sans',sans-serif", outline: "none",
    boxSizing: "border-box", marginTop: "6px",
  };
  const lbl = { fontSize: "11px", fontWeight: "700", color: "#7a5a55",
    letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: "2px" };

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "84px 1rem 2rem" }}>

        {/* Top action cards — Ride Booking OR Shop */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
          <div style={{ background: BG2, border: `2px solid ${G}`, borderRadius: "16px",
            padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>🚗</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: "800", color: G, fontSize: "14px" }}>Book a Ride</div>
            <div style={{ fontSize: "11px", color: "#7a5a55", marginTop: "4px" }}>R60 flat · Rustenburg</div>
          </div>
          <div onClick={() => window.open(CONTACT.shopLink, "_blank")}
            style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px",
            padding: "1.25rem", textAlign: "center", cursor: "pointer", transition: "all .2s" }}
            onMouseOver={e => e.currentTarget.style.borderColor = G}
            onMouseOut={e => e.currentTarget.style.borderColor = BORDER}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>🛍️</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: "800", color: "#f5ede8", fontSize: "14px" }}>Online Shop</div>
            <div style={{ fontSize: "11px", color: "#7a5a55", marginTop: "4px" }}>Browse & order</div>
          </div>
        </div>

        {/* Booking card */}
        <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "20px", padding: "1.5rem" }}>

          {/* Ride / Delivery toggle */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }}>
            {[["ride", "🚗", "Request a Ride"], ["delivery", "📦", "Package Delivery"]].map(([t, icon, label]) => (
              <button key={t} onClick={() => setBookingType(t)} style={{
                flex: 1, padding: "10px", borderRadius: "10px", cursor: "pointer",
                border: `1px solid ${bookingType === t ? G : BORDER}`,
                background: bookingType === t ? "rgba(232,184,75,0.1)" : BG3,
                color: bookingType === t ? G : "#b8a09a",
                fontWeight: "700", fontSize: "13px", fontFamily: "'DM Sans',sans-serif",
              }}>{icon} {label}</button>
            ))}
          </div>

          {/* Address inputs */}
          <AddressInput label="Pickup Address" value={pickup} onChange={setPickup} icon="📍" />
          <AddressInput label="Dropoff Address" value={dropoff} onChange={setDropoff} icon="🏁" />

          {/* Delivery extras */}
          {bookingType === "delivery" && (
            <div style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "1rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: G, marginBottom: "10px" }}>📦 Package Details</div>
              <label style={lbl}>Recipient Name</label>
              <input style={inp} value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Who receives the package?" />
              <label style={{ ...lbl, marginTop: "10px" }}>Recipient Phone (+27)</label>
              <input style={inp} value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} placeholder="+27 83 123 4567" type="tel" />
              <label style={{ ...lbl, marginTop: "10px" }}>Package Description</label>
              <input style={inp} value={packageDesc} onChange={e => setPackageDesc(e.target.value)} placeholder="e.g. Documents, small parcel" />
            </div>
          )}

          {/* Vehicle type (rides only) */}
          {bookingType === "ride" && (
            <>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#7a5a55",
                letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "10px" }}>Select Vehicle</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "8px", marginBottom: "1rem" }}>
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
                      <div style={{ fontSize: "10px", color: "#7a5a55", marginTop: "2px" }}>{info.multiplier === 1 ? "Base fare" : `×${info.multiplier}`}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Fare display */}
          {(fareResult || estimating) && (
            <div style={{ background: "rgba(232,184,75,0.06)", border: `1px solid ${BORDER}`,
              borderRadius: "12px", padding: "14px 16px", marginBottom: "1rem" }}>
              {estimating ? (
                <div style={{ color: "#7a5a55", fontSize: "13px" }}>Calculating fare...</div>
              ) : fareResult && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "#7a5a55", fontWeight: "700",
                        textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>
                        {bookingType === "delivery" ? "Delivery Fee" : "Estimated Fare"}
                      </div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "2rem",
                        fontWeight: "800", color: G }}>
                        {formatFare(fareResult.totalFare || fareResult.fare || 60)}
                      </div>
                      <div style={{ fontSize: "12px", color: "#b8a09a", marginTop: "2px" }}>
                        {fareResult.zone === "ZONE_1_FLAT" ? "Flat Rate — Rustenburg Area" :
                          `${fareResult.distanceKm || ""}km × R7.50/km`}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "11px", color: "#7a5a55" }}>Loyalty Points</div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: G }}>
                        +{calcLoyaltyPoints(fareResult.totalFare || fareResult.fare || 60)}pts
                      </div>
                      <div style={{ fontSize: "10px", color: "#7a5a55" }}>1pt per R10</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Schedule */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={lbl}>📅 Schedule for later (optional)</label>
            <input type="datetime-local" value={scheduledFor}
              onChange={e => setScheduledFor(e.target.value)} style={{ ...inp, marginTop: "6px" }} />
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
                background: payWithWallet ? G : "#1c0f0f", position: "relative", transition: "background .2s" }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#0d0505",
                  position: "absolute", top: "3px", transition: "left .2s",
                  left: payWithWallet ? "23px" : "3px" }} />
              </div>
            </div>
          )}

          {/* Book button */}
          <button onClick={handleBook} disabled={!pickup || !dropoff || loading} style={{
            width: "100%", background: G, color: "#1a0808", border: "none",
            borderRadius: "12px", padding: "15px", fontSize: "15px", fontWeight: "800",
            cursor: (!pickup || !dropoff || loading) ? "not-allowed" : "pointer",
            opacity: (!pickup || !dropoff || loading) ? 0.5 : 1,
            fontFamily: "'Syne',sans-serif",
          }}>
            {loading ? "Booking..." : bookingType === "ride"
              ? `🚗 Book Ride${fareResult ? ` — ${formatFare(fareResult.totalFare || fareResult.fare || 60)}` : ""}`
              : `📦 Book Delivery${fareResult ? ` — ${formatFare(fareResult.totalFare || fareResult.fare || 60)}` : ""}`}
          </button>

          {/* WhatsApp fallback */}
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <button onClick={() => window.open(CONTACT.whatsappLink, "_blank")} style={{
              background: "transparent", border: "none", color: "#7a5a55",
              fontSize: "12px", cursor: "pointer", textDecoration: "underline",
            }}>
              💬 Prefer to book via WhatsApp?
            </button>
          </div>
        </div>

        {/* All services quick links */}
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
                padding: "10px 6px", cursor: "pointer", textAlign: "center",
                transition: "all .2s",
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
