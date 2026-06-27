// ============================================================
// PROJO GROUP — Landing Page (Mobile Fixed)
// FIX: Full mobile responsive layout
// FIX: Navbar — removed Coverage, kept Services/Shop/Rides
// FIX: Logo fits correctly — not cut off
// FIX: TikTok added to social links
// FIX: Sign In always visible on mobile
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
const TAGLINE = "Rustenburg's Own. Ride. Shop. Deliver & Services.";
const TAKE_APP = "https://take.app/projogroup";

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
function SectionTitle({ children }) {
  return <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(1.6rem,4vw,2.6rem)",
    fontWeight:"800", textAlign:"center", marginBottom:"0.75rem",
    color:"#f5ede8" }}>{children}</h2>;
}
function SectionSub({ children }) {
  return <p style={{ fontSize:"14px", color:"#b8a09a", textAlign:"center",
    marginBottom:"2.5rem", maxWidth:"520px", margin:"0 auto 2.5rem", lineHeight:1.7 }}>{children}</p>;
}

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
  if (maxDist <= 8) {
    const fare = 60 * vehicleMult;
    return { fare, label:`R${fare % 1===0 ? fare.toFixed(0) : fare.toFixed(2)} — Flat Rate`, zone:1 };
  } else {
    const fare = Math.max(60, maxDist * 7.5) * vehicleMult;
    return { fare, label:`R${fare.toFixed(2)} — ${maxDist}km × R7.50/km`, zone:2 };
  }
}

function BookingWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const areas = Object.keys(AREA_DISTANCES);
  const [pickup,  setPickup]  = useState("Rustenburg CBD");
  const [dropoff, setDropoff] = useState("Boitekong");
  const [vehicle, setVehicle] = useState("ECONOMY");

  const mults = { ECONOMY:1.0, COMFORT:1.3, XL:1.5, LUXURY:2.5 };
  const result = calcFare(pickup, dropoff, mults[vehicle]||1.0);

  const sel = {
    width:"100%", background:"#1c0f0f", border:"1px solid rgba(232,184,75,0.2)",
    borderRadius:"8px", padding:"11px 14px", color:"#f5ede8", fontSize:"14px",
    fontFamily:"'DM Sans',sans-serif", cursor:"pointer",
  };

  return (
    <div style={{ background:"#120808", border:"1px solid rgba(232,184,75,0.2)",
      borderRadius:"20px", padding:"1.5rem", maxWidth:"540px", margin:"0 auto",
      fontFamily:"'DM Sans',sans-serif", boxShadow:"0 8px 40px rgba(0,0,0,0.5)" }}>
      <div style={{ display:"flex", flexDirection:"column", gap:"12px", marginBottom:"1rem" }}>
        <select style={sel} value={pickup} onChange={e=>setPickup(e.target.value)}>
          {areas.map(a=><option key={a}>{a}</option>)}
        </select>
        <select style={sel} value={dropoff} onChange={e=>setDropoff(e.target.value)}>
          {areas.map(a=><option key={a}>{a}</option>)}
        </select>
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
          {["ECONOMY","COMFORT","XL","LUXURY"].map(v=>(
            <button key={v} onClick={()=>setVehicle(v)} style={{
              flex:1, minWidth:"70px", padding:"8px 4px", borderRadius:"8px", cursor:"pointer",
              border:`1px solid ${vehicle===v ? G : "rgba(232,184,75,0.15)"}`,
              background: vehicle===v ? "rgba(232,184,75,0.1)" : "#1c0f0f",
              color: vehicle===v ? G : "#7a5a55", fontSize:"12px", fontWeight:"700",
            }}>{VEHICLE_INFO[v]?.emoji} {v}</button>
          ))}
        </div>
      </div>
      <div style={{ background:"rgba(232,184,75,0.08)", border:`1px solid rgba(232,184,75,0.2)`,
        borderRadius:"12px", padding:"1rem", textAlign:"center", marginBottom:"1rem" }}>
        <div style={{ fontSize:"11px", color:"#7a5a55", marginBottom:"4px" }}>Estimated Fare</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"2.2rem",
          fontWeight:"800", color:G }}>{formatFare(result.fare)}</div>
        <div style={{ fontSize:"12px", color:"#b8a09a", marginTop:"4px" }}>{result.label}</div>
      </div>
      <button onClick={()=>{ user ? navigate("/book") : navigate("/login"); }} style={{
        width:"100%", background:G, color:"#1a0808", border:"none",
        borderRadius:"10px", padding:"14px", fontSize:"15px", fontWeight:"800", cursor:"pointer",
      }}>{user ? "Book Now →" : "Sign In to Book →"}</button>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onResize); };
  }, []);

  const sec  = (bg) => ({ background:bg, padding:"4rem 1rem", borderTop:"1px solid rgba(232,184,75,0.08)" });
  const inner = { maxWidth:"1100px", margin:"0 auto" };
  const homeRoute = !user ? "/login" : user.role==="DRIVER" ? "/driver" : user.role==="ADMIN" ? "/admin" : "/book";

  return (
    <div style={{ background:"#0d0505", color:"#f5ede8", fontFamily:"'DM Sans',sans-serif", minHeight:"100vh", overflowX:"hidden" }}>

      {/* ── NAV ── */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:1000,
        height:"64px", display:"flex", alignItems:"center",
        justifyContent:"space-between", padding:"0 1rem",
        background: scrolled ? "rgba(13,5,5,0.98)" : "rgba(13,5,5,0.85)",
        borderBottom:"1px solid rgba(232,184,75,0.12)",
        backdropFilter:"blur(16px)", transition:"background .3s",
      }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:"8px", cursor:"pointer", flexShrink:0 }}
          onClick={()=>navigate("/")}>
          <div style={{
            width:"38px", height:"38px", borderRadius:"50%", flexShrink:0, overflow:"hidden",
            border:"2px solid #c49a2f", boxShadow:"0 0 10px rgba(232,184,75,0.4)",
          }}>
            <img src="/assets/logo/PROJO_LOGO.png" alt="PROJO"
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
              onError={e=>{e.target.style.display="none"; e.target.parentElement.style.background="radial-gradient(circle at 35% 35%,#f5d078,#e8b84b,#c49a2f,#9a7520)";}} />
          </div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:"14px",
            fontWeight:"800", color:G, letterSpacing:"1px" }}>PROJO GROUP</span>
        </div>

        {/* Desktop nav links */}
        {!isMobile && (
          <div style={{ display:"flex", gap:"1.5rem", alignItems:"center" }}>
            <a href={TAKE_APP} target="_blank" rel="noreferrer"
              style={{ color:"#b8a09a", fontSize:"13px", fontWeight:"600", textDecoration:"none" }}
              onMouseOver={e=>e.target.style.color=G} onMouseOut={e=>e.target.style.color="#b8a09a"}>
              Services ↗
            </a>
            <a href={TAKE_APP} target="_blank" rel="noreferrer"
              style={{ color:"#b8a09a", fontSize:"13px", fontWeight:"600", textDecoration:"none" }}
              onMouseOver={e=>e.target.style.color=G} onMouseOut={e=>e.target.style.color="#b8a09a"}>
              Shop ↗
            </a>
            <a href="#pricing"
              style={{ color:"#b8a09a", fontSize:"13px", fontWeight:"600", textDecoration:"none" }}
              onMouseOver={e=>e.target.style.color=G} onMouseOut={e=>e.target.style.color="#b8a09a"}>
              Pricing
            </a>
            <a href="#contact"
              style={{ color:"#b8a09a", fontSize:"13px", fontWeight:"600", textDecoration:"none" }}
              onMouseOver={e=>e.target.style.color=G} onMouseOut={e=>e.target.style.color="#b8a09a"}>
              Contact
            </a>
          </div>
        )}

        {/* Right buttons */}
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          {user ? (
            <button onClick={()=>navigate(homeRoute)} style={{
              background:G, color:"#1a0808", border:"none", borderRadius:"8px",
              padding:"9px 16px", fontSize:"13px", fontWeight:"700", cursor:"pointer",
            }}>Go to App →</button>
          ) : (
            <>
              <button onClick={()=>navigate("/login")} style={{
                background:"transparent", color:G,
                border:"1px solid rgba(232,184,75,0.3)",
                borderRadius:"8px", padding:"9px 14px", fontSize:"13px",
                fontWeight:"700", cursor:"pointer",
              }}>Sign In</button>
              {!isMobile && (
                <button onClick={()=>navigate("/register")} style={{
                  background:G, color:"#1a0808", border:"none", borderRadius:"8px",
                  padding:"9px 16px", fontSize:"13px", fontWeight:"700", cursor:"pointer",
                }}>Register</button>
              )}
            </>
          )}
          {/* Hamburger on mobile */}
          {isMobile && (
            <button onClick={()=>setMobileMenu(!mobileMenu)} style={{
              background:"transparent", border:"1px solid rgba(232,184,75,0.2)",
              borderRadius:"8px", width:"40px", height:"40px", cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", gap:"5px",
            }}>
              <span style={{ width:"18px", height:"2px", background:"#a8a49e", borderRadius:"2px", display:"block" }} />
              <span style={{ width:"18px", height:"2px", background:"#a8a49e", borderRadius:"2px", display:"block" }} />
              <span style={{ width:"18px", height:"2px", background:"#a8a49e", borderRadius:"2px", display:"block" }} />
            </button>
          )}
        </div>
      </nav>

      {/* Mobile menu drawer */}
      {mobileMenu && isMobile && (
        <>
          <div onClick={()=>setMobileMenu(false)} style={{
            position:"fixed", inset:0, zIndex:998, background:"rgba(0,0,0,0.7)",
          }} />
          <div style={{
            position:"fixed", top:"64px", right:0, bottom:0, width:"260px",
            zIndex:999, background:"#0d0505", borderLeft:"1px solid rgba(232,184,75,0.15)",
            padding:"1rem", fontFamily:"'DM Sans',sans-serif",
          }}>
            {[
              { label:"🛠️ Services", href:TAKE_APP, external:true },
              { label:"🛍️ Shop", href:TAKE_APP, external:true },
              { label:"💰 Pricing", href:"#pricing", external:false },
              { label:"📞 Contact", href:"#contact", external:false },
            ].map(item => item.external ? (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer"
                onClick={()=>setMobileMenu(false)}
                style={{ display:"block", padding:"14px", color:"#c8b8b0",
                  textDecoration:"none", fontSize:"16px", borderRadius:"10px",
                  borderLeft:"3px solid transparent" }}>
                {item.label}
              </a>
            ) : (
              <a key={item.label} href={item.href} onClick={()=>setMobileMenu(false)}
                style={{ display:"block", padding:"14px", color:"#c8b8b0",
                  textDecoration:"none", fontSize:"16px", borderRadius:"10px",
                  borderLeft:"3px solid transparent" }}>
                {item.label}
              </a>
            ))}
            <div style={{ height:"1px", background:"rgba(232,184,75,0.1)", margin:"12px 0" }} />
            {!user && (
              <button onClick={()=>{ setMobileMenu(false); navigate("/register"); }} style={{
                width:"100%", background:G, color:"#1a0808", border:"none",
                borderRadius:"10px", padding:"14px", fontSize:"15px",
                fontWeight:"700", cursor:"pointer",
              }}>Register Free</button>
            )}
          </div>
        </>
      )}

      {/* ── HERO ── */}
      <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", textAlign:"center",
        padding:"90px 1rem 60px",
        background:"radial-gradient(ellipse 80% 60% at 50% 20%, rgba(139,26,26,0.2) 0%, #0d0505 65%)" }}>

        {/* Logo — fixed to not cut off */}
        <div style={{
          width:"100px", height:"100px", borderRadius:"50%",
          overflow:"hidden", marginBottom:"1.5rem",
          border:"3px solid #c49a2f",
          boxShadow:"0 0 30px rgba(232,184,75,0.5)",
          flexShrink:0,
        }}>
          <img src="/assets/logo/PROJO_LOGO.png" alt="PROJO GROUP"
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
            onError={e=>{
              e.target.style.display="none";
              e.target.parentElement.style.background="radial-gradient(circle at 35% 35%,#f5d078,#e8b84b,#c49a2f,#9a7520)";
              e.target.parentElement.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:Syne,sans-serif;font-size:14px;font-weight:800;color:#2a1a00">PROJO</div>';
            }} />
        </div>

        <div style={{ display:"inline-flex", alignItems:"center", gap:"6px",
          background:"rgba(139,26,26,0.2)", border:"1px solid rgba(232,184,75,0.2)",
          borderRadius:"50px", padding:"6px 14px", marginBottom:"1.25rem" }}>
          <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#4ade80" }} />
          <span style={{ fontSize:"12px", color:"#b8a09a", fontWeight:"600" }}>Live in Rustenburg</span>
        </div>

        <h1 style={{ fontFamily:"'Syne',sans-serif",
          fontSize:"clamp(2rem,8vw,4rem)",
          fontWeight:"800", lineHeight:1.1,
          marginBottom:"1rem", letterSpacing:"-1px",
          background:`linear-gradient(135deg, #f5d078, ${G}, #c49a2f)`,
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          backgroundClip:"text", padding:"0 0.5rem",
        }}>
          Rustenburg's<br/>Own App
        </h1>

        <p style={{ fontSize:"clamp(13px,3.5vw,16px)", color:"#b8a09a",
          maxWidth:"480px", lineHeight:1.7, marginBottom:"2rem", padding:"0 0.5rem" }}>
          {TAGLINE}
        </p>

        <div style={{ display:"flex", gap:"10px", flexWrap:"wrap",
          justifyContent:"center", marginBottom:"3rem", padding:"0 1rem" }}>
          <button onClick={()=>navigate("/login")} style={{
            background:G, color:"#1a0808", border:"none", borderRadius:"10px",
            padding:"14px 28px", fontSize:"15px", fontWeight:"800", cursor:"pointer",
          }}>Book a Ride →</button>
          <button onClick={()=>window.open(TAKE_APP,"_blank")} style={{
            background:"transparent", color:G,
            border:"1px solid rgba(232,184,75,0.3)",
            borderRadius:"10px", padding:"14px 28px",
            fontSize:"15px", fontWeight:"700", cursor:"pointer",
          }}>Browse Services ↗</button>
        </div>

        <div style={{ width:"100%", maxWidth:"560px", padding:"0 0.5rem" }}>
          <BookingWidget />
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" style={sec("#120808")}>
        <div style={inner}>
          <Eyebrow text="What We Offer" />
          <SectionTitle>All PROJO Services</SectionTitle>
          <SectionSub>Book anything — rides, deliveries, cleaning, maintenance and more.</SectionSub>
          <div style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",
            gap:"10px" }}>
            {[
              ["🚗","Rides","R60 flat"],
              ["📦","Courier","Same-day"],
              ["🧹","Cleaning","Quote"],
              ["🔧","Maintenance","R350 callout"],
              ["🎨","Painting","R28/sqm"],
              ["🐛","Pest Control","Quote"],
              ["📷","CCTV","Quote"],
              ["💻","Web & App","From R2100"],
              ["📣","Marketing","Quote"],
              ["🔑","Locksmith","Quote"],
              ["🏃","Runners","Errands & shopping"],
              ["🖥️","PC & Console Repair","Quote"],
            ].map(([icon,name,price])=>(
              <div key={name} onClick={()=>window.open(TAKE_APP,"_blank")} style={{
                background:"#1c0f0f", border:"1px solid rgba(232,184,75,0.12)",
                borderRadius:"14px", padding:"1.25rem 1rem", textAlign:"center",
                cursor:"pointer", transition:"all .2s",
              }}
              onMouseOver={e=>e.currentTarget.style.borderColor=G}
              onMouseOut={e=>e.currentTarget.style.borderColor="rgba(232,184,75,0.12)"}>
                <div style={{ fontSize:"28px", marginBottom:"8px" }}>{icon}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"13px",
                  fontWeight:"700", color:"#f5ede8", marginBottom:"4px" }}>{name}</div>
                <div style={{ fontSize:"11px", color:"#7a5a55" }}>{price}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign:"center", marginTop:"2rem" }}>
            <button onClick={()=>window.open(TAKE_APP,"_blank")} style={{
              background:G, color:"#1a0808", border:"none", borderRadius:"10px",
              padding:"14px 32px", fontSize:"15px", fontWeight:"700", cursor:"pointer",
            }}>View All Services & Book ↗</button>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={sec("#0d0505")}>
        <div style={inner}>
          <Eyebrow text="Transparent Pricing" />
          <SectionTitle>Simple, Fair Fares</SectionTitle>
          <div style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",
            gap:"16px", maxWidth:"700px", margin:"0 auto" }}>
            {[
              { zone:"Zone 1", area:"Inside Rustenburg", fare:"R60 flat", desc:"Rustenburg CBD, Waterfall, Boitekong, Tlhabane, Cashan, Protea Park, Industrial, Phokeng", color:G },
              { zone:"Zone 2", area:"Outside Rustenburg", fare:"R7.50/km", desc:"Swartruggens, Brits, Sun City, Johannesburg, Pretoria and beyond", color:"#b8a09a" },
            ].map(z=>(
              <div key={z.zone} style={{ background:"#120808",
                border:`1px solid ${z.color === G ? "rgba(232,184,75,0.3)" : "rgba(232,184,75,0.1)"}`,
                borderRadius:"16px", padding:"1.5rem" }}>
                <div style={{ fontSize:"11px", fontWeight:"700", color:z.color,
                  letterSpacing:"1px", textTransform:"uppercase", marginBottom:"8px" }}>{z.zone}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"2rem",
                  fontWeight:"800", color:z.color, marginBottom:"6px" }}>{z.fare}</div>
                <div style={{ fontSize:"12px", fontWeight:"600", color:"#f5ede8",
                  marginBottom:"8px" }}>{z.area}</div>
                <div style={{ fontSize:"12px", color:"#7a5a55", lineHeight:1.6 }}>{z.desc}</div>
              </div>
            ))}
          </div>
          <p style={{ textAlign:"center", fontSize:"12px", color:"#7a5a55", marginTop:"1.5rem" }}>
            Peak hours (06:00–09:00, 16:00–19:00): 15% surge · Vehicle upgrades available
          </p>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={sec("#120808")}>
        <div style={{ ...inner, textAlign:"center" }}>
          <Eyebrow text="Get In Touch" />
          <SectionTitle>Contact PROJO GROUP</SectionTitle>
          <p style={{ color:"#7a5a55", fontSize:"13px", marginBottom:"2rem" }}>
            Rustenburg, North West Province, South Africa
          </p>
          <div style={{ display:"flex", gap:"10px", justifyContent:"center", flexWrap:"wrap", padding:"0 1rem" }}>
            {[
              { label:"💬 WhatsApp",  href:CONTACT.whatsappLink, bg:"#25D366", color:"#fff" },
              { label:"📘 Facebook",  href:CONTACT.facebook,     bg:"#1877F2", color:"#fff" },
              { label:"📷 Instagram", href:CONTACT.instagram,    bg:"#E1306C", color:"#fff" },
              { label:"🎵 TikTok",   href:CONTACT.tiktok,       bg:"#010101", color:"#fff" },
              { label:"🛍️ Shop",    href:TAKE_APP,              bg:G,         color:"#1a0808" },
              { label:"✉️ Email",   href:`mailto:${CONTACT.email}`, bg:"#120808", color:G },
            ].map(b=>(
              <a key={b.label} href={b.href} target="_blank" rel="noreferrer" style={{
                display:"inline-flex", alignItems:"center", gap:"6px",
                background:b.bg, color:b.color, textDecoration:"none",
                borderRadius:"10px", padding:"11px 18px", fontSize:"13px", fontWeight:"700",
                border:"1px solid rgba(232,184,75,0.1)",
              }}>{b.label}</a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:"#080303", borderTop:"1px solid rgba(232,184,75,0.1)",
        padding:"2.5rem 1rem 2rem", fontFamily:"'DM Sans',sans-serif" }}>
        <div style={inner}>
          {/* Mobile: stacked, Desktop: grid */}
          <div style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",
            gap:"2rem", marginBottom:"2rem" }}>

            {/* Brand */}
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"0.75rem" }}>
                <div style={{ width:"40px", height:"40px", borderRadius:"50%",
                  overflow:"hidden", border:"2px solid #c49a2f", flexShrink:0 }}>
                  <img src="/assets/logo/PROJO_LOGO.png" alt="PROJO"
                    style={{ width:"100%", height:"100%", objectFit:"cover" }}
                    onError={e=>e.target.style.display="none"} />
                </div>
                <div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"14px",
                    fontWeight:"800", color:G }}>PROJO GROUP</div>
                  <div style={{ fontSize:"10px", color:"#7a5a55" }}>Est. 2023</div>
                </div>
              </div>
              <div style={{ fontSize:"12px", color:"#7a5a55", lineHeight:2 }}>
                📞 {CONTACT.phone}<br/>
                ✉️ {CONTACT.email}<br/>
                🌐 www.projogroup.co.za
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 style={{ fontSize:"12px", fontWeight:"700", color:"#b8a09a",
                letterSpacing:"1px", textTransform:"uppercase", marginBottom:"1rem" }}>Services</h4>
              {["Rides","Courier","Cleaning","Maintenance","Painting","CCTV",
                "Pest Control","Web & App","Marketing","Locksmith","Runners","PC & Console Repair"].map(s=>(
                <a key={s} href={TAKE_APP} target="_blank" rel="noreferrer"
                  style={{ display:"block", fontSize:"12px", color:"#7a5a55",
                  textDecoration:"none", marginBottom:"5px" }}
                  onMouseOver={e=>e.target.style.color=G}
                  onMouseOut={e=>e.target.style.color="#7a5a55"}>{s}</a>
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
                ["TikTok",    CONTACT.tiktok],
                ["Shop",      TAKE_APP],
                ["Website",   CONTACT.website],
              ].map(([l,href])=>(
                <a key={l} href={href} target="_blank" rel="noreferrer"
                  style={{ display:"block", fontSize:"12px", color:"#7a5a55",
                  textDecoration:"none", marginBottom:"6px" }}
                  onMouseOver={e=>e.target.style.color=G}
                  onMouseOut={e=>e.target.style.color="#7a5a55"}>{l}</a>
              ))}
            </div>
          </div>

          <div style={{ borderTop:"1px solid rgba(232,184,75,0.08)", paddingTop:"1.5rem",
            textAlign:"center" }}>
            <div style={{ fontSize:"12px", color:"#3d1a1a" }}>
              © 2023–2026 PROJO GROUP. All rights reserved. Proudly Rustenburg.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
