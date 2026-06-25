// ============================================================
// PROJO GROUP — Landing Page (Updated)
// - Tagline: Ride. Shop. Deliver & Services.
// - Fare: R60 within 8km of CBD, R7.50/km beyond
// - Driver earnings hidden from public
// - Services linked to booking shop + website
// - Sign In required before app access
// ============================================================
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Circle, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CONTACT, BRAND, VEHICLE_INFO, formatFare, ACTIVE_ZONES, FUTURE_ZONES } from "../utils/constants";
import { useAuth } from "../context/AuthContext";

const G   = "#e8b84b";
const RED = "#8B1A1A";
const RUSTENBURG = { lat: -25.667, lng: 27.242 };

// Updated tagline
const TAGLINE = "Rustenburg's Own. Ride. Shop. Deliver & Services.";

const goldIcon = new L.DivIcon({
  html: `<div style="width:12px;height:12px;background:#e8b84b;border-radius:50%;border:2px solid #c49a2f;box-shadow:0 0 8px rgba(232,184,75,0.6)"></div>`,
  iconSize:[12,12], iconAnchor:[6,6], className:"",
});
const dimIcon = new L.DivIcon({
  html: `<div style="width:8px;height:8px;background:#3a3a3a;border-radius:50%;border:1px solid #555"></div>`,
  iconSize:[8,8], iconAnchor:[4,4], className:"",
});

function Eyebrow({ text }) {
  return <div style={{ fontSize:"11px", fontWeight:"700", color:G, letterSpacing:"2px",
    textTransform:"uppercase", textAlign:"center", marginBottom:"0.75rem" }}>{text}</div>;
}
function SectionTitle({ children, align="center" }) {
  return <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(1.8rem,4vw,2.8rem)",
    fontWeight:"800", textAlign:align, marginBottom:"0.75rem", letterSpacing:"-0.5px",
    color:"#f5ede8" }}>{children}</h2>;
}
function SectionSub({ children }) {
  return <p style={{ fontSize:"14px", color:"#b8a09a", textAlign:"center",
    marginBottom:"2.5rem", maxWidth:"520px", margin:"0 auto 2.5rem", lineHeight:1.7 }}>{children}</p>;
}

// ── Fare calculator (8km radius rule) ──────────────────────
const ZONE1_RADIUS_KM = 8;
const ZONE1_FLAT      = 60;
const ZONE2_PER_KM    = 7.50;
const MIN_FARE        = 60;

const AREA_DISTANCES = {
  "Rustenburg CBD":0, "Waterfall East":4, "Boitekong":6,
  "Tlhabane":7, "Cashan":3, "Protea Park":5,
  "Rustenburg Industrial":5, "Phokeng":9,
  "Swartruggens":65, "Brits":90,
  "Sun City / Pilanesberg":58, "Johannesburg":145,
};

function calcFare(pickup, dropoff, vehicleMult=1.0) {
  const d1 = AREA_DISTANCES[pickup]  || 0;
  const d2 = AREA_DISTANCES[dropoff] || 0;
  const maxDist = Math.max(d1, d2);
  if (maxDist <= ZONE1_RADIUS_KM) {
    const fare = ZONE1_FLAT * vehicleMult;
    return { fare, label:`R${fare % 1===0 ? fare.toFixed(0) : fare.toFixed(2)} — Flat Rate (within 8km of CBD)`, zone:1 };
  } else {
    const fare = Math.max(MIN_FARE, maxDist * ZONE2_PER_KM) * vehicleMult;
    return { fare, label:`R${fare.toFixed(2)} — ${maxDist}km × R7.50/km`, zone:2 };
  }
}

// ── Booking Widget ──────────────────────────────────────────
function BookingWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const areas = Object.keys(AREA_DISTANCES);
  const [pickup,  setPickup]  = useState("Rustenburg CBD");
  const [dropoff, setDropoff] = useState("Boitekong");
  const [vehicle, setVehicle] = useState("ECONOMY");
  const [type,    setType]    = useState("ride"); // ride | delivery

  const mults = { ECONOMY:1.0, COMFORT:1.3, XL:1.5, LUXURY:2.5 };
  const result = calcFare(pickup, dropoff, mults[vehicle]||1.0);

  const sel = {
    width:"100%", background:"#1c0f0f", border:"1px solid rgba(232,184,75,0.2)",
    borderRadius:"8px", padding:"11px 14px", color:"#f5ede8", fontSize:"14px",
    fontFamily:"'DM Sans',sans-serif", appearance:"none", cursor:"pointer",
  };

  return (
    <div style={{ background:"#120808", border:"1px solid rgba(232,184,75,0.2)",
      borderRadius:"20px", padding:"2rem", maxWidth:"540px", margin:"0 auto",
      fontFamily:"'DM Sans',sans-serif", boxShadow:"0 8px 40px rgba(0,0,0,0.5)" }}>

      {/* Type toggle */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"1.25rem" }}>
        {[["ride","🚗 Ride"],["delivery","📦 Delivery"]].map(([t,l])=>(
          <button key={t} onClick={()=>setType(t)} style={{
            flex:1, padding:"9px", borderRadius:"8px", cursor:"pointer",
            border:`1px solid ${type===t ? G : "rgba(232,184,75,0.15)"}`,
            background: type===t ? "rgba(232,184,75,0.1)" : "#1c0f0f",
            color: type===t ? G : "#b8a09a",
            fontWeight:"700", fontSize:"13px", fontFamily:"'DM Sans',sans-serif",
          }}>{l}</button>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"12px" }}>
        <div>
          <div style={{ fontSize:"11px", fontWeight:"700", color:"#7a5a55",
            letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:"6px" }}>Pickup</div>
          <select value={pickup} onChange={e=>setPickup(e.target.value)} style={sel}>
            {areas.map(a=><option key={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:"11px", fontWeight:"700", color:"#7a5a55",
            letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:"6px" }}>Dropoff</div>
          <select value={dropoff} onChange={e=>setDropoff(e.target.value)} style={sel}>
            {areas.map(a=><option key={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Vehicle (rides only) */}
      {type==="ride" && (
        <div style={{ display:"flex", gap:"6px", marginBottom:"16px", flexWrap:"wrap" }}>
          {["ECONOMY","COMFORT","XL","LUXURY"].map(v=>(
            <div key={v} onClick={()=>setVehicle(v)} style={{
              background: vehicle===v ? "rgba(232,184,75,0.12)" : "#1c0f0f",
              border:`1px solid ${vehicle===v ? G : "rgba(232,184,75,0.15)"}`,
              borderRadius:"50px", padding:"5px 14px", cursor:"pointer",
              fontSize:"12px", fontWeight:"700",
              color: vehicle===v ? G : "#b8a09a",
            }}>{VEHICLE_INFO[v]?.emoji} {VEHICLE_INFO[v]?.label}</div>
          ))}
        </div>
      )}

      {/* Fare */}
      <div style={{ background:"rgba(232,184,75,0.06)", border:"1px solid rgba(232,184,75,0.2)",
        borderRadius:"12px", padding:"14px 16px", marginBottom:"14px" }}>
        <div style={{ fontSize:"11px", color:"#7a5a55", fontWeight:"700",
          textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"3px" }}>
          {type==="ride" ? "Estimated Fare" : "Estimated Delivery Fee"}
        </div>
        <div style={{ fontSize:"2.2rem", fontWeight:"800", color:G,
          fontFamily:"'Syne',sans-serif" }}>{formatFare(result.fare)}</div>
        <div style={{ fontSize:"12px", color:"#b8a09a", marginTop:"3px" }}>{result.label}</div>
        {result.zone===1 && (
          <div style={{ fontSize:"11px", color:"#7a5a55", marginTop:"4px" }}>
            Within 8km of Rustenburg CBD · Same pricing applies for deliveries
          </div>
        )}
      </div>

      <button onClick={()=>{ user ? navigate("/book") : navigate("/login"); }} style={{
        width:"100%", background:G, color:"#1a0808", border:"none",
        borderRadius:"10px", padding:"14px", fontSize:"15px", fontWeight:"800",
        cursor:"pointer", fontFamily:"'Syne',sans-serif", letterSpacing:"0.5px",
        transition:"all .2s",
      }}>
        {type==="ride" ? "🚗 Book This Ride" : "📦 Book Delivery"} — {formatFare(result.fare)}
      </button>

      <div style={{ textAlign:"center", marginTop:"10px", fontSize:"11px", color:"#7a5a55" }}>
        Sign in required · Secure booking · Cancel anytime
      </div>
    </div>
  );
}

// ── Main Landing Page ───────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const sec  = (bg) => ({ background:bg, padding:"5rem 1.5rem", borderTop:"1px solid rgba(232,184,75,0.08)" });
  const inner = { maxWidth:"1100px", margin:"0 auto" };

  const homeRoute = !user ? null : user.role==="DRIVER" ? "/driver" : user.role==="ADMIN" ? "/admin" : "/book";

  return (
    <div style={{ background:"#0d0505", color:"#f5ede8", fontFamily:"'DM Sans',sans-serif", minHeight:"100vh" }}>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100,
        height:"66px", display:"flex", alignItems:"center",
        justifyContent:"space-between", padding:"0 2rem",
        background: scrolled ? "rgba(13,5,5,0.98)" : "rgba(13,5,5,0.75)",
        borderBottom:"1px solid rgba(232,184,75,0.12)",
        backdropFilter:"blur(16px)", transition:"background .3s",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer" }}
          onClick={()=>navigate("/")}>
          <img src="/assets/logo/PROJO_LOGO.png" alt="PROJO GROUP"
            style={{ width:"40px", height:"40px", borderRadius:"50%", objectFit:"cover",
            filter:"drop-shadow(0 0 8px rgba(232,184,75,0.45))" }}
            onError={e=>e.target.style.display="none"} />
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:"15px",
            fontWeight:"800", color:G, letterSpacing:"1.5px" }}>PROJO GROUP</span>
        </div>

        <div style={{ display:"flex", gap:"1.75rem", alignItems:"center" }}>
          {["services","coverage","pricing","contact"].map(l=>(
            <a key={l} href={`#${l}`} style={{ color:"#b8a09a", fontSize:"13px",
              fontWeight:"600", textDecoration:"none", textTransform:"capitalize",
              transition:"color .2s" }}
              onMouseOver={e=>e.target.style.color=G}
              onMouseOut={e=>e.target.style.color="#b8a09a"}>{l}</a>
          ))}
        </div>

        <div style={{ display:"flex", gap:"10px" }}>
          {user ? (
            <button onClick={()=>navigate(homeRoute)} style={{
              background:G, color:"#1a0808", border:"none", borderRadius:"8px",
              padding:"9px 20px", fontSize:"13px", fontWeight:"700", cursor:"pointer",
            }}>Go to App →</button>
          ) : (
            <>
              <button onClick={()=>navigate("/login")} style={{
                background:"transparent", color:G,
                border:`1px solid rgba(232,184,75,0.3)`,
                borderRadius:"8px", padding:"9px 20px", fontSize:"13px",
                fontWeight:"700", cursor:"pointer",
              }}>Sign In</button>
              <button onClick={()=>navigate("/register")} style={{
                background:G, color:"#1a0808", border:"none", borderRadius:"8px",
                padding:"9px 20px", fontSize:"13px", fontWeight:"700", cursor:"pointer",
              }}>Register</button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", textAlign:"center",
        padding:"100px 1.5rem 60px", position:"relative", overflow:"hidden",
        background:"radial-gradient(ellipse 80% 60% at 50% 20%, rgba(139,26,26,0.2) 0%, #0d0505 65%)" }}>

        <img src="/assets/logo/PROJO_LOGO.png" alt="PROJO GROUP"
          style={{ width:"110px", height:"110px", borderRadius:"50%", objectFit:"cover",
          filter:"drop-shadow(0 0 24px rgba(232,184,75,0.5))", marginBottom:"1.5rem" }}
          onError={e=>e.target.style.display="none"} />

        <div style={{ display:"inline-flex", alignItems:"center", gap:"8px",
          background:"rgba(139,26,26,0.2)", border:"1px solid rgba(232,184,75,0.2)",
          borderRadius:"50px", padding:"6px 16px",
          fontSize:"12px", fontWeight:"700", color:G, letterSpacing:"1px", marginBottom:"1.5rem" }}>
          <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:G,
            animation:"pulse 2s infinite", display:"inline-block" }} />
          Now serving Rustenburg &amp; North West Province
        </div>

        <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(3.5rem,9vw,7rem)",
          fontWeight:"800", lineHeight:0.92, letterSpacing:"-3px", marginBottom:"1.25rem" }}>
          PROJO<br/><span style={{ color:G }}>GROUP</span>
        </h1>

        <p style={{ fontSize:"clamp(1rem,2.5vw,1.3rem)", color:"#b8a09a",
          marginBottom:"2.5rem", fontWeight:"400", letterSpacing:"0.3px" }}>
          <strong style={{ color:G }}>Rustenburg's Own.</strong> Ride. Shop. Deliver &amp; Services.
        </p>

        <div style={{ display:"flex", gap:"12px", justifyContent:"center",
          flexWrap:"wrap", marginBottom:"3rem" }}>
          <button onClick={()=>navigate("/login")} style={{
            background:G, color:"#1a0808", border:"none", borderRadius:"10px",
            padding:"14px 32px", fontSize:"15px", fontWeight:"800", cursor:"pointer",
            fontFamily:"'Syne',sans-serif",
          }}>Book a Ride Now</button>
          <button onClick={()=>window.open(CONTACT.shopLink,"_blank")} style={{
            background:"transparent", color:"#f5ede8",
            border:"1px solid rgba(240,237,232,0.2)",
            borderRadius:"10px", padding:"14px 32px", fontSize:"15px",
            fontWeight:"500", cursor:"pointer",
          }}>Visit Our Shop →</button>
        </div>

        {/* Fare summary pills */}
        <div style={{ display:"flex", gap:"12px", justifyContent:"center", flexWrap:"wrap" }}>
          {[
            ["🚗 Within 8km CBD", "R60 Flat"],
            ["📏 Beyond 8km",     "R7.50/km"],
            ["📦 Deliveries",     "Same rates"],
          ].map(([l,v])=>(
            <div key={l} style={{ background:"rgba(139,26,26,0.15)",
              border:"1px solid rgba(232,184,75,0.2)", borderRadius:"50px",
              padding:"8px 18px", textAlign:"center" }}>
              <div style={{ fontSize:"11px", color:"#7a5a55", fontWeight:"700" }}>{l}</div>
              <div style={{ fontSize:"14px", fontWeight:"800", color:G }}>{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOOKING WIDGET ──────────────────────────────────── */}
      <section style={{ ...sec("#120808"), padding:"4rem 1.5rem" }}>
        <div style={inner}>
          <Eyebrow text="Instant Booking" />
          <SectionTitle>Book a Ride or Delivery</SectionTitle>
          <SectionSub>Choose your pickup and dropoff — get an instant fare estimate. Sign in to confirm.</SectionSub>
          <BookingWidget />
        </div>
      </section>

      {/* ── SERVICES ────────────────────────────────────────── */}
      <section id="services" style={sec("#0d0505")}>
        <div style={inner}>
          <Eyebrow text="What We Offer" />
          <SectionTitle>12 Services. One Platform.</SectionTitle>
          <SectionSub>Everything your home and business needs — proudly based in Rustenburg, North West Province.</SectionSub>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"16px" }}>
            {[
              { icon:"🚗", title:"Ride & Deliver",     desc:"Book instant or scheduled rides. R60 flat within 8km of CBD. R7.50/km beyond.",           shop:"https://take.app/projogroup",                          info:"https://www.projogroup.co.za/run-deliver" },
              { icon:"📦", title:"Courier & Logistics", desc:"Send packages across Rustenburg or North West. Same fare rates as rides. Live tracking.",   shop:"https://take.app/projogroup",                          info:"https://www.projogroup.co.za/run-deliver" },
              { icon:"🛍️", title:"Book & Shop",        desc:"Browse our online store. Pay with PROJO Wallet. Fast delivery within Rustenburg.",          shop:CONTACT.shopLink,                                       info:"https://www.projogroup.co.za/book-shop" },
              { icon:"🧹", title:"Cleaning",            desc:"Professional home and office cleaning services across Rustenburg and surroundings.",         shop:"https://take.app/projogroup",                          info:"https://www.projogroup.co.za/cleaning" },
              { icon:"🔧", title:"Maintenance",         desc:"General repairs and maintenance for homes and businesses in Rustenburg.",                    shop:"https://take.app/projogroup",                          info:"https://www.projogroup.co.za/maintenance" },
              { icon:"🎨", title:"Painting",            desc:"Interior and exterior painting. Quality finishes at fair prices in Rustenburg.",             shop:"https://take.app/projogroup",                          info:"https://www.projogroup.co.za/painting" },
              { icon:"📷", title:"CCTV Installation",   desc:"Security camera installation and monitoring for homes and businesses.",                      shop:"https://take.app/projogroup",                          info:"https://www.projogroup.co.za/cctv" },
              { icon:"🐛", title:"Pest Control",        desc:"Safe and effective pest removal for homes, offices and restaurants in Rustenburg.",          shop:"https://take.app/projogroup",                          info:"https://www.projogroup.co.za/pest-control" },
              { icon:"💻", title:"Geeks — IT Support",  desc:"Computer repairs, networking and tech support for homes and businesses.",                    shop:"https://take.app/projogroup",                          info:"https://www.projogroup.co.za/geeks" },
              { icon:"🌐", title:"Web & App Dev",       desc:"Website and mobile app development for businesses in Rustenburg and beyond.",                shop:"https://take.app/projogroup",                          info:"https://www.projogroup.co.za/web-app" },
              { icon:"📣", title:"Digi Marketing",      desc:"Social media management, ads and digital marketing to grow your business online.",           shop:"https://take.app/projogroup",                          info:"https://www.projogroup.co.za/digi-marketing" },
              { icon:"🐾", title:"Pet Care",            desc:"Professional pet sitting, grooming and care services in Rustenburg.",                        shop:"https://take.app/projogroup",                          info:"https://www.projogroup.co.za/pet-care" },
            ].map(s=>(
              <div key={s.title} style={{ background:"#120808",
                border:"1px solid rgba(139,26,26,0.3)", borderRadius:"16px",
                padding:"1.5rem", transition:"all .25s" }}
                onMouseOver={e=>{ e.currentTarget.style.borderColor="rgba(232,184,75,0.4)"; e.currentTarget.style.transform="translateY(-3px)"; }}
                onMouseOut={e=>{ e.currentTarget.style.borderColor="rgba(139,26,26,0.3)"; e.currentTarget.style.transform="translateY(0)"; }}>
                <div style={{ width:"48px", height:"48px", borderRadius:"12px",
                  background:"rgba(139,26,26,0.25)", border:"1px solid rgba(232,184,75,0.15)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"20px", marginBottom:"1rem" }}>{s.icon}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1rem",
                  fontWeight:"700", marginBottom:"0.4rem", color:"#f5ede8" }}>{s.title}</div>
                <div style={{ fontSize:"12px", color:"#b8a09a", lineHeight:1.6,
                  marginBottom:"1rem" }}>{s.desc}</div>
                <div style={{ display:"flex", gap:"8px" }}>
                  <button onClick={()=>window.open(s.shop,"_blank")} style={{
                    flex:1, background:G, color:"#1a0808", border:"none",
                    borderRadius:"6px", padding:"7px 0", fontSize:"11px",
                    fontWeight:"800", cursor:"pointer",
                  }}>Book Now</button>
                  <button onClick={()=>window.open(s.info,"_blank")} style={{
                    flex:1, background:"transparent",
                    color:"#b8a09a", border:"1px solid rgba(232,184,75,0.2)",
                    borderRadius:"6px", padding:"7px 0", fontSize:"11px",
                    fontWeight:"700", cursor:"pointer",
                  }}>Learn More</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COVERAGE MAP ────────────────────────────────────── */}
      <section id="coverage" style={sec("#120808")}>
        <div style={inner}>
          <Eyebrow text="Coverage Zones" />
          <SectionTitle>Serving Rustenburg &amp; North West</SectionTitle>
          <SectionSub>R60 flat within 8km of Rustenburg CBD. R7.50/km beyond — same for rides and deliveries.</SectionSub>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"3rem", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:"12px", fontWeight:"700", color:G, letterSpacing:"1px",
                textTransform:"uppercase", marginBottom:"10px" }}>Active Zones — R60 Flat (within 8km)</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginBottom:"1.5rem" }}>
                {ACTIVE_ZONES.map(z=>(
                  <span key={z.name} style={{ display:"inline-flex", alignItems:"center", gap:"5px",
                    background:"#1c0f0f", border:"1px solid rgba(232,184,75,0.2)",
                    borderRadius:"50px", padding:"4px 12px", fontSize:"12px",
                    fontWeight:"600", color:"#b8a09a" }}>
                    <span style={{ width:"5px", height:"5px", borderRadius:"50%",
                      background:G, display:"inline-block" }} />
                    {z.name}
                  </span>
                ))}
              </div>
              <div style={{ fontSize:"12px", fontWeight:"700", color:"#7a5a55",
                letterSpacing:"1px", textTransform:"uppercase", marginBottom:"10px" }}>Beyond 8km — R7.50/km</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                {FUTURE_ZONES.map(z=>(
                  <span key={z.name} style={{ display:"inline-flex", alignItems:"center", gap:"5px",
                    background:"#1c0f0f", border:"1px dashed rgba(139,26,26,0.4)",
                    borderRadius:"50px", padding:"4px 12px", fontSize:"12px",
                    fontWeight:"600", color:"#7a5a55" }}>
                    <span style={{ width:"5px", height:"5px", borderRadius:"50%",
                      background:"#7a5a55", display:"inline-block" }} />
                    {z.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Leaflet Map */}
            <div style={{ borderRadius:"16px", overflow:"hidden",
              border:"1px solid rgba(232,184,75,0.15)", height:"320px" }}>
              <MapContainer center={[RUSTENBURG.lat, RUSTENBURG.lng]}
                zoom={12} style={{ height:"100%", width:"100%" }}
                zoomControl={false} scrollWheelZoom={false}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OpenStreetMap &copy; CARTO' />
                <Circle center={[RUSTENBURG.lat, RUSTENBURG.lng]} radius={8000}
                  pathOptions={{ color:G, fillColor:G, fillOpacity:0.07, weight:2 }} />
                {ACTIVE_ZONES.map(z=>(
                  <Marker key={z.name} position={[z.lat, z.lng]} icon={goldIcon}>
                    <Popup><strong style={{ color:G }}>{z.name}</strong><br/>R60 flat rate</Popup>
                  </Marker>
                ))}
                {FUTURE_ZONES.map(z=>(
                  <Marker key={z.name} position={[z.lat, z.lng]} icon={dimIcon}>
                    <Popup>{z.name}<br/>R7.50/km</Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <section id="pricing" style={sec("#0d0505")}>
        <div style={{ ...inner, maxWidth:"800px" }}>
          <Eyebrow text="Simple Pricing" />
          <SectionTitle>Fair. Local. Transparent.</SectionTitle>
          <SectionSub>Same rates for rides and deliveries. No hidden fees.</SectionSub>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>
            {[
              { zone:"Zone 1 — Within 8km of CBD", name:"Flat Rate",
                amount:"R60", unit:"per ride or delivery",
                features:["Rustenburg CBD, Waterfall East, Boitekong","Tlhabane, Cashan, Protea Park","Rustenburg Industrial, Phokeng","Any trip within 8km radius of CBD"],
                featured:true },
              { zone:"Zone 2 — Beyond 8km", name:"Per Kilometre",
                amount:"R7.50", unit:"/km · minimum R60",
                features:["Swartruggens, Brits, Sun City","Magaliesburg, Johannesburg routes","Any destination beyond 8km radius","Actual road distance calculated"],
                featured:false },
            ].map(p=>(
              <div key={p.name} style={{ background:"#120808",
                border:`1px solid ${p.featured ? G : "rgba(139,26,26,0.3)"}`,
                borderRadius:"20px", padding:"2rem", position:"relative",
                boxShadow: p.featured ? `0 0 30px rgba(232,184,75,0.08)` : "none" }}>
                {p.featured && (
                  <div style={{ position:"absolute", top:"1rem", right:"1rem",
                    background:G, color:"#1a0808", fontSize:"10px", fontWeight:"800",
                    padding:"3px 10px", borderRadius:"50px", letterSpacing:"0.5px" }}>
                    MOST COMMON
                  </div>
                )}
                <div style={{ fontSize:"10px", fontWeight:"700", color:G,
                  letterSpacing:"2px", textTransform:"uppercase", marginBottom:"0.5rem" }}>{p.zone}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.3rem",
                  fontWeight:"700", marginBottom:"0.5rem" }}>{p.name}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"3rem",
                  fontWeight:"800", color:G, lineHeight:1 }}>{p.amount}</div>
                <div style={{ fontSize:"13px", color:"#b8a09a", marginBottom:"1.5rem",
                  marginTop:"4px" }}>{p.unit}</div>
                <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:"8px" }}>
                  {p.features.map(f=>(
                    <li key={f} style={{ display:"flex", gap:"8px", fontSize:"13px", color:"#b8a09a" }}>
                      <span style={{ color:G, flexShrink:0 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {/* Vehicle multipliers */}
          <div style={{ marginTop:"1.5rem", background:"#120808",
            border:"1px solid rgba(139,26,26,0.3)", borderRadius:"14px", padding:"1.25rem 1.5rem" }}>
            <div style={{ fontSize:"11px", fontWeight:"700", color:G, letterSpacing:"1px",
              textTransform:"uppercase", marginBottom:"0.75rem" }}>Vehicle Multipliers</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
              {[["🚗","Economy","×1.0"],["🚙","Comfort","×1.3"],["🚐","XL","×1.5"],["🏎️","Luxury","×2.5"]].map(([e,n,m])=>(
                <div key={n} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:"20px", marginBottom:"4px" }}>{e}</div>
                  <div style={{ fontSize:"11px", fontWeight:"700", color:"#b8a09a" }}>{n}</div>
                  <div style={{ fontSize:"13px", color:G, fontWeight:"800" }}>{m}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SIGN IN CTA ─────────────────────────────────────── */}
      {!user && (
        <section style={{ ...sec("#120808"), textAlign:"center" }}>
          <div style={inner}>
            <Eyebrow text="Get Started" />
            <SectionTitle>Join PROJO GROUP Today</SectionTitle>
            <SectionSub>Sign in or register to book rides, deliveries and services instantly.</SectionSub>
            <div style={{ display:"flex", gap:"12px", justifyContent:"center", flexWrap:"wrap" }}>
              <button onClick={()=>navigate("/login")} style={{
                background:G, color:"#1a0808", border:"none", borderRadius:"10px",
                padding:"14px 36px", fontSize:"15px", fontWeight:"800", cursor:"pointer",
              }}>Sign In</button>
              <button onClick={()=>navigate("/register")} style={{
                background:"transparent", color:"#f5ede8",
                border:"1px solid rgba(232,184,75,0.25)",
                borderRadius:"10px", padding:"14px 36px", fontSize:"15px",
                fontWeight:"500", cursor:"pointer",
              }}>Create Account</button>
              <button onClick={()=>window.open(CONTACT.whatsappLink,"_blank")} style={{
                background:"#25D366", color:"#fff", border:"none", borderRadius:"10px",
                padding:"14px 36px", fontSize:"15px", fontWeight:"700", cursor:"pointer",
              }}>💬 WhatsApp Us</button>
            </div>
          </div>
        </section>
      )}

      {/* ── CONTACT ─────────────────────────────────────────── */}
      <section id="contact" style={sec("#0d0505")}>
        <div style={{ ...inner, textAlign:"center" }}>
          <Eyebrow text="Get In Touch" />
          <SectionTitle>Contact PROJO GROUP</SectionTitle>
          <p style={{ color:"#7a5a55", fontSize:"13px", marginBottom:"2rem" }}>
            Rustenburg, North West Province, South Africa
          </p>
          <div style={{ display:"flex", gap:"12px", justifyContent:"center", flexWrap:"wrap" }}>
            {[
              { label:"💬 WhatsApp",  link:CONTACT.whatsappLink, bg:"#25D366", color:"#fff" },
              { label:"📘 Facebook",  link:CONTACT.facebook,     bg:"#1877F2", color:"#fff" },
              { label:"📷 Instagram", link:CONTACT.instagram,    bg:"#E1306C", color:"#fff" },
              { label:"🛍️ Shop",     link:CONTACT.shopLink,     bg:G,         color:"#1a0808" },
              { label:"✉️ Email",    link:`mailto:${CONTACT.email}`, bg:"#120808", color:G },
              { label:"🌐 Website",  link:CONTACT.website,      bg:"#120808", color:G },
            ].map(b=>(
              <a key={b.label} href={b.link} target="_blank" rel="noreferrer" style={{
                display:"inline-flex", alignItems:"center", gap:"6px",
                background:b.bg, color:b.color, textDecoration:"none",
                borderRadius:"10px", padding:"11px 20px", fontSize:"13px", fontWeight:"700",
                border:"1px solid rgba(232,184,75,0.1)", transition:"all .2s",
              }}
              onMouseOver={e=>e.currentTarget.style.transform="translateY(-2px)"}
              onMouseOut={e=>e.currentTarget.style.transform="translateY(0)"}
              >{b.label}</a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ background:"#080303", borderTop:"1px solid rgba(232,184,75,0.1)",
        padding:"3rem 1.5rem 2rem", fontFamily:"'DM Sans',sans-serif" }}>
        <div style={inner}>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:"3rem", marginBottom:"2.5rem" }}>

            {/* Brand */}
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"0.75rem" }}>
                <img src="/assets/logo/PROJO_LOGO.png" alt="PROJO GROUP"
                  style={{ width:"48px", height:"48px", borderRadius:"50%", objectFit:"cover",
                  filter:"drop-shadow(0 0 8px rgba(232,184,75,0.4))" }}
                  onError={e=>e.target.style.display="none"} />
                <div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"16px",
                    fontWeight:"800", color:G, letterSpacing:"1.5px" }}>PROJO GROUP</div>
                  <div style={{ fontSize:"11px", color:"#7a5a55" }}>{TAGLINE}</div>
                </div>
              </div>
              <div style={{ fontSize:"12px", color:"#7a5a55", lineHeight:2 }}>
                Rustenburg, North West Province<br/>
                South Africa<br/>
                📞 {CONTACT.phone}<br/>
                ✉️ {CONTACT.email}<br/>
                🌐 www.projogroup.co.za<br/>
                Est. 2023
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 style={{ fontSize:"12px", fontWeight:"700", color:"#b8a09a",
                letterSpacing:"1px", textTransform:"uppercase", marginBottom:"1rem" }}>Services</h4>
              {[
                ["Ride & Deliver",     "https://www.projogroup.co.za/run-deliver"],
                ["Courier",           "https://www.projogroup.co.za/run-deliver"],
                ["Book & Shop",       "https://www.projogroup.co.za/book-shop"],
                ["Cleaning",          "https://www.projogroup.co.za/cleaning"],
                ["Maintenance",       "https://www.projogroup.co.za/maintenance"],
                ["Painting",          "https://www.projogroup.co.za/painting"],
                ["CCTV",              "https://www.projogroup.co.za/cctv"],
                ["Pest Control",      "https://www.projogroup.co.za/pest-control"],
                ["Geeks IT Support",  "https://www.projogroup.co.za/geeks"],
                ["Web & App",         "https://www.projogroup.co.za/web-app"],
                ["Digi Marketing",    "https://www.projogroup.co.za/digi-marketing"],
                ["Pet Care",          "https://www.projogroup.co.za/pet-care"],
              ].map(([l,href])=>(
                <a key={l} href={href} target="_blank" rel="noreferrer"
                  style={{ display:"block", fontSize:"12px", color:"#7a5a55",
                  textDecoration:"none", marginBottom:"6px", transition:"color .2s" }}
                  onMouseOver={e=>e.target.style.color=G}
                  onMouseOut={e=>e.target.style.color="#7a5a55"}>{l}</a>
              ))}
            </div>

            {/* Coverage */}
            <div>
              <h4 style={{ fontSize:"12px", fontWeight:"700", color:"#b8a09a",
                letterSpacing:"1px", textTransform:"uppercase", marginBottom:"1rem" }}>Coverage</h4>
              {["Rustenburg CBD","Waterfall East","Boitekong","Tlhabane",
                "Cashan","Protea Park","Industrial","Phokeng","Swartruggens","Brits"].map(z=>(
                <div key={z} style={{ fontSize:"12px", color:"#7a5a55", marginBottom:"6px" }}>{z}</div>
              ))}
            </div>

            {/* Connect */}
            <div>
              <h4 style={{ fontSize:"12px", fontWeight:"700", color:"#b8a09a",
                letterSpacing:"1px", textTransform:"uppercase", marginBottom:"1rem" }}>Connect</h4>
              {[
                ["WhatsApp",  CONTACT.whatsappLink],
                ["Facebook",  CONTACT.facebook],
                ["Instagram", CONTACT.instagram],
                ["Shop",      CONTACT.shopLink],
                ["Website",   CONTACT.website],
              ].map(([l,href])=>(
                <a key={l} href={href} target="_blank" rel="noreferrer"
                  style={{ display:"block", fontSize:"12px", color:"#7a5a55",
                  textDecoration:"none", marginBottom:"8px", transition:"color .2s" }}
                  onMouseOver={e=>e.target.style.color=G}
                  onMouseOut={e=>e.target.style.color="#7a5a55"}>{l}</a>
              ))}
            </div>
          </div>

          <div style={{ borderTop:"1px solid rgba(232,184,75,0.08)", paddingTop:"1.5rem",
            display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
            <div style={{ fontSize:"12px", color:"#3d1a1a" }}>
              © 2023–2026 PROJO GROUP. All rights reserved. Proudly Rustenburg.
            </div>
            <div style={{ display:"flex", gap:"1.5rem" }}>
              {["Privacy Policy","Terms of Service","Driver Terms"].map(l=>(
                <a key={l} href="#" style={{ fontSize:"12px", color:"#3d1a1a",
                  textDecoration:"none" }}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
