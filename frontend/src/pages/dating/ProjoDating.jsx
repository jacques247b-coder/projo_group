// PROJO DATING — Full Premium Dating App
// Design: Deep crimson + rose gold + midnight purple + gold accents
// Typography: Cormorant Garamond display + Inter body
// Signature: Animated constellation heart particle system on hero

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

// ── DESIGN TOKENS ────────────────────────────────────────────
const C = {
  crimson:   "#8B0000",
  rose:      "#E8144A",
  roseLight: "#FF4D7A",
  rosePale:  "#FFB3C6",
  purple:    "#2D0A4E",
  purpleMid: "#6B21A8",
  gold:      "#D4AF37",
  goldLight: "#F5D76E",
  midnight:  "#0D0418",
  dark:      "#120820",
  card:      "#1A0F2E",
  cardLight: "#231545",
  border:    "rgba(232,20,74,0.2)",
  borderGold:"rgba(212,175,55,0.3)",
  text:      "#F8F0FF",
  textMuted: "#A89BC2",
  textDim:   "#6B5B8A",
};

const FONT_DISPLAY = "'Cormorant Garamond', 'Georgia', serif";
const FONT_BODY = "'Inter', 'DM Sans', sans-serif";

// ── SAMPLE PROFILES ──────────────────────────────────────────
const SAMPLE_PROFILES = [
  { id:1, name:"Naledi", age:26, city:"Rustenburg", distance:2, job:"Nurse", bio:"Adventurous soul who loves hiking, braaing on weekends, and good conversations. Looking for my partner in crime.", interests:["Hiking","Braai","Travel","Music"], photos:["💃"], verified:true, online:true, premium:true, compatScore:94, goals:["Serious Relationship"], gender:"Woman" },
  { id:2, name:"Thabo", age:30, city:"Rustenburg", distance:5, job:"Engineer", bio:"Engineer by day, chef by night. I believe food is love. Seeking genuine connection.", interests:["Cooking","Gym","Soccer","Reading"], photos:["🧑"], verified:true, online:false, premium:false, compatScore:87, goals:["Long-Term Relationship"], gender:"Man" },
  { id:3, name:"Sasha", age:24, city:"Brits", distance:45, job:"Teacher", bio:"Passionate about education and creating a better future. Love dancing, reading, and Sunday drives.", interests:["Dancing","Books","Art","Yoga"], photos:["👩"], verified:false, online:true, premium:true, compatScore:79, goals:["Dating","Friendship"], gender:"Woman" },
  { id:4, name:"Lerato", age:28, city:"Rustenburg", distance:3, job:"Entrepreneur", bio:"Building my empire one step at a time. Looking for someone to share the journey with.", interests:["Business","Travel","Wine","Movies"], photos:["💁"], verified:true, online:true, premium:true, compatScore:91, goals:["Serious Relationship","Marriage"], gender:"Woman" },
  { id:5, name:"Kagiso", age:32, city:"Phokeng", distance:12, job:"Doctor", bio:"Saving lives by day. Looking for someone to save my evenings with great company and laughter.", interests:["Fitness","Travel","Jazz","Cooking"], photos:["🧔"], verified:true, online:false, premium:true, compatScore:85, goals:["Marriage","Serious Relationship"], gender:"Man" },
  { id:6, name:"Amara", age:25, city:"Rustenburg", distance:8, job:"Designer", bio:"Creative spirit. I see beauty in everything. My ideal date? Sunset picnic with good music.", interests:["Art","Photography","Music","Nature"], photos:["🌸"], verified:false, online:true, premium:false, compatScore:76, goals:["Dating","Long-Term Relationship"], gender:"Woman" },
];

// ── HEART PARTICLE COMPONENT ─────────────────────────────────
function HeartParticles() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = Array.from({ length: 25 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height + canvas.height,
      size: Math.random() * 14 + 6,
      speed: Math.random() * 0.6 + 0.2,
      opacity: Math.random() * 0.4 + 0.1,
      drift: (Math.random() - 0.5) * 0.5,
      pulse: Math.random() * Math.PI * 2,
    }));
    let animId;
    function drawHeart(ctx, x, y, size, opacity) {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = `rgba(232,20,74,${opacity})`;
      ctx.beginPath();
      ctx.moveTo(x, y + size * 0.3);
      ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3);
      ctx.bezierCurveTo(x - size * 0.5, y + size * 0.6, x, y + size * 0.9, x, y + size);
      ctx.bezierCurveTo(x, y + size * 0.9, x + size * 0.5, y + size * 0.6, x + size * 0.5, y + size * 0.3);
      ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3);
      ctx.fill();
      ctx.restore();
    }
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.y -= p.speed;
        p.x += p.drift;
        p.pulse += 0.02;
        p.opacity = 0.15 + Math.sin(p.pulse) * 0.08;
        if (p.y < -50) { p.y = canvas.height + 50; p.x = Math.random() * canvas.width; }
        drawHeart(ctx, p.x, p.y, p.size, p.opacity);
      });
      animId = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(animId);
  }, []);
  return <canvas ref={canvasRef} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }} />;
}

// ── PROFILE CARD ─────────────────────────────────────────────
function ProfileCard({ profile, onLike, onSuperLike, onPass, showActions = true }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [liked, setLiked] = useState(false);

  return (
    <div style={{
      background: `linear-gradient(160deg, ${C.card} 0%, ${C.dark} 100%)`,
      border: `1px solid ${C.border}`,
      borderRadius: "24px",
      overflow: "hidden",
      position: "relative",
      boxShadow: `0 20px 60px rgba(139,0,0,0.3), 0 0 0 1px rgba(232,20,74,0.1)`,
    }}>
      {/* Photo area */}
      <div style={{ position:"relative", height:"320px", background:`linear-gradient(135deg, ${C.purple} 0%, ${C.crimson} 100%)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontSize:"100px", filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}>{profile.photos[0]}</div>

        {/* Gradient overlay */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"160px", background:"linear-gradient(transparent, rgba(13,4,24,0.95))" }} />

        {/* Badges */}
        <div style={{ position:"absolute", top:"12px", left:"12px", display:"flex", gap:"6px", flexWrap:"wrap" }}>
          {profile.verified && (
            <div style={{ background:"rgba(212,175,55,0.9)", borderRadius:"20px", padding:"3px 10px", fontSize:"11px", fontWeight:"700", color:C.dark, display:"flex", alignItems:"center", gap:"3px" }}>
              ✓ Verified
            </div>
          )}
          {profile.premium && (
            <div style={{ background:"linear-gradient(135deg, #D4AF37, #F5D76E)", borderRadius:"20px", padding:"3px 10px", fontSize:"11px", fontWeight:"700", color:C.dark }}>
              ★ Premium
            </div>
          )}
          {profile.online && (
            <div style={{ background:"rgba(34,197,94,0.9)", borderRadius:"20px", padding:"3px 10px", fontSize:"11px", fontWeight:"700", color:"#fff" }}>
              ● Online
            </div>
          )}
        </div>

        {/* Compat score */}
        <div style={{ position:"absolute", top:"12px", right:"12px", background:`linear-gradient(135deg, ${C.crimson}, ${C.roseLight})`, borderRadius:"50%", width:"48px", height:"48px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <div style={{ fontSize:"14px", fontWeight:"800", color:"#fff", lineHeight:1 }}>{profile.compatScore}%</div>
          <div style={{ fontSize:"8px", color:"rgba(255,255,255,0.8)", lineHeight:1 }}>match</div>
        </div>

        {/* Name overlay */}
        <div style={{ position:"absolute", bottom:"14px", left:"16px", right:"16px" }}>
          <div style={{ fontFamily:FONT_DISPLAY, fontSize:"26px", fontWeight:"700", color:"#fff", letterSpacing:"0.5px" }}>
            {profile.name}, {profile.age}
          </div>
          <div style={{ fontSize:"12px", color:C.rosePale, marginTop:"2px" }}>
            📍 {profile.city} · {profile.distance}km away · {profile.job}
          </div>
        </div>
      </div>

      {/* Info section */}
      <div style={{ padding:"16px" }}>
        <p style={{ fontSize:"13px", color:C.textMuted, lineHeight:1.6, margin:"0 0 12px", fontFamily:FONT_BODY }}>
          {profile.bio.slice(0, 100)}...
        </p>

        {/* Interests */}
        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"14px" }}>
          {profile.interests.slice(0,4).map(i => (
            <span key={i} style={{ background:"rgba(107,33,168,0.3)", border:"1px solid rgba(107,33,168,0.5)", borderRadius:"20px", padding:"3px 10px", fontSize:"11px", color:C.rosePale }}>
              {i}
            </span>
          ))}
        </div>

        {/* Goals */}
        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"16px" }}>
          {profile.goals.map(g => (
            <span key={g} style={{ background:"rgba(139,0,0,0.3)", border:`1px solid ${C.border}`, borderRadius:"20px", padding:"3px 10px", fontSize:"11px", color:C.roseLight }}>
              💝 {g}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        {showActions && (
          <div style={{ display:"flex", gap:"10px", justifyContent:"center" }}>
            <button onClick={() => onPass?.(profile)} style={{
              width:"50px", height:"50px", borderRadius:"50%",
              background:"rgba(107,33,168,0.2)", border:"1px solid rgba(107,33,168,0.4)",
              color:C.textMuted, fontSize:"20px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            }}>✕</button>
            <button onClick={() => onSuperLike?.(profile)} style={{
              width:"50px", height:"50px", borderRadius:"50%",
              background:"linear-gradient(135deg, rgba(212,175,55,0.2), rgba(245,215,110,0.1))", border:`1px solid ${C.borderGold}`,
              color:C.gold, fontSize:"20px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            }}>⭐</button>
            <button onClick={() => { setLiked(true); onLike?.(profile); }} style={{
              width:"64px", height:"64px", borderRadius:"50%",
              background:liked ? `linear-gradient(135deg, ${C.rose}, ${C.roseLight})` : `linear-gradient(135deg, ${C.crimson}, ${C.rose})`,
              border:"none", color:"#fff", fontSize:"26px", cursor:"pointer",
              boxShadow:`0 4px 20px rgba(232,20,74,0.5)`,
              display:"flex", alignItems:"center", justifyContent:"center",
              transform: liked ? "scale(1.1)" : "scale(1)",
              transition: "all 0.2s",
            }}>♥</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN DATING APP ───────────────────────────────────────────
export default function ProjoDating() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("discover");
  const [showProfile, setShowProfile] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [likedProfiles, setLikedProfiles] = useState([]);
  const [matches, setMatches] = useState([]);
  const [setupStep, setSetupStep] = useState(0);
  const [setupData, setSetupData] = useState({
    displayName: user?.name?.split(" ")[0] || "",
    age: "", gender: "", interestedIn: [], relationshipGoals: [],
    city: "Rustenburg", bio: "", occupation: "", interests: [],
  });
  const [filter, setFilter] = useState({ ageMin:18, ageMax:45, distance:50, goals:[] });
  const [showFilter, setShowFilter] = useState(false);
  const [messages, setMessages] = useState({});
  const [msgInput, setMsgInput] = useState("");
  const [profileCompletion] = useState(65);

  const profiles = SAMPLE_PROFILES;
  const tabs = [
    { key:"discover", icon:"💫", label:"Discover" },
    { key:"matches",  icon:"💝", label:"Matches" },
    { key:"messages", icon:"💬", label:"Messages" },
    { key:"profile",  icon:"👤", label:"My Profile" },
  ];

  function handleLike(profile) {
    setLikedProfiles(prev => [...prev, profile.id]);
    // Simulate match (50% chance)
    if (Math.random() > 0.5) {
      setTimeout(() => {
        setMatches(prev => [...prev, profile]);
        toast.custom(() => (
          <div style={{ background:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, borderRadius:"20px", padding:"20px 24px", textAlign:"center", boxShadow:"0 20px 60px rgba(139,0,0,0.5)" }}>
            <div style={{ fontSize:"40px", marginBottom:"8px" }}>💝</div>
            <div style={{ fontFamily:FONT_DISPLAY, fontSize:"22px", fontWeight:"700", color:"#fff" }}>It's a Match!</div>
            <div style={{ fontSize:"13px", color:C.rosePale, marginTop:"4px" }}>You and {profile.name} liked each other</div>
          </div>
        ), { duration: 4000 });
      }, 800);
    }
  }

  function sendMessage(matchId) {
    if (!msgInput.trim()) return;
    if (!user?.isPremium) { setShowPremiumModal(true); return; }
    setMessages(prev => ({
      ...prev,
      [matchId]: [...(prev[matchId] || []), { from:"me", text:msgInput, time:new Date().toLocaleTimeString("en-ZA",{hour:"2-digit",minute:"2-digit"}) }]
    }));
    setMsgInput("");
  }

  // ── SETUP WIZARD ─────────────────────────────────────────────
  if (showSetup) {
    const steps = [
      { title:"What's your name?", field:"displayName", type:"text", placeholder:"Your first name" },
      { title:"How old are you?", field:"age", type:"number", placeholder:"Your age" },
      { title:"I identify as...", field:"gender", type:"select", options:["Woman","Man","Non-binary","Prefer not to say"] },
      { title:"I'm interested in...", field:"interestedIn", type:"multi", options:["Women","Men","Everyone"] },
      { title:"What are you looking for?", field:"relationshipGoals", type:"multi", options:["Serious Relationship","Marriage","Long-Term Relationship","Dating","Casual Dating","Friendship","Activity Partner","Travel Companion"] },
      { title:"Where are you based?", field:"city", type:"select", options:["Rustenburg","Brits","Klerksdorp","Potchefstroom","Mahikeng","Phokeng","Sun City area","Other NW town"] },
      { title:"Tell us about yourself", field:"bio", type:"textarea", placeholder:"What makes you unique? What are you passionate about?" },
      { title:"Your interests", field:"interests", type:"multi", options:["Hiking","Braai","Travel","Music","Movies","Gym","Dancing","Cooking","Reading","Art","Photography","Soccer","Cricket","Gaming","Yoga","Wine","Pets"] },
    ];
    const step = steps[setupStep];
    const isLast = setupStep === steps.length - 1;
    const val = setupData[step.field];
    const canNext = Array.isArray(val) ? val.length > 0 : val !== "" && val !== undefined;

    return (
      <div style={{ minHeight:"100vh", background:`linear-gradient(135deg, ${C.midnight} 0%, ${C.dark} 50%, ${C.purple} 100%)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem 1.25rem", position:"relative", overflow:"hidden" }}>
        <HeartParticles />
        <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:"480px" }}>
          {/* Logo */}
          <div style={{ textAlign:"center", marginBottom:"2rem" }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontSize:"28px", fontWeight:"700", background:`linear-gradient(135deg, ${C.rose}, ${C.gold})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              💕 PROJO DATING
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:"10px", height:"4px", marginBottom:"2rem" }}>
            <div style={{ background:`linear-gradient(90deg, ${C.rose}, ${C.gold})`, borderRadius:"10px", height:"100%", width:`${((setupStep+1)/steps.length)*100}%`, transition:"width 0.3s" }} />
          </div>

          <div style={{ background:"rgba(26,15,46,0.9)", border:`1px solid ${C.border}`, borderRadius:"24px", padding:"2rem", backdropFilter:"blur(20px)" }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontSize:"26px", fontWeight:"700", color:C.text, marginBottom:"1.5rem", lineHeight:1.2 }}>{step.title}</div>

            {step.type === "text" && (
              <input value={val} onChange={e => setSetupData(d=>({...d,[step.field]:e.target.value}))}
                placeholder={step.placeholder}
                style={{ width:"100%", background:"rgba(255,255,255,0.07)", border:`1px solid ${C.border}`, borderRadius:"12px", color:C.text, padding:"14px 16px", fontSize:"16px", outline:"none", boxSizing:"border-box", fontFamily:FONT_BODY }} />
            )}
            {step.type === "number" && (
              <input type="number" value={val} onChange={e => setSetupData(d=>({...d,[step.field]:e.target.value}))}
                placeholder={step.placeholder} min="18" max="99"
                style={{ width:"100%", background:"rgba(255,255,255,0.07)", border:`1px solid ${C.border}`, borderRadius:"12px", color:C.text, padding:"14px 16px", fontSize:"16px", outline:"none", boxSizing:"border-box", fontFamily:FONT_BODY }} />
            )}
            {step.type === "textarea" && (
              <textarea value={val} onChange={e => setSetupData(d=>({...d,[step.field]:e.target.value}))}
                placeholder={step.placeholder} rows={4}
                style={{ width:"100%", background:"rgba(255,255,255,0.07)", border:`1px solid ${C.border}`, borderRadius:"12px", color:C.text, padding:"14px 16px", fontSize:"14px", outline:"none", boxSizing:"border-box", resize:"none", fontFamily:FONT_BODY }} />
            )}
            {step.type === "select" && (
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {step.options.map(opt => (
                  <button key={opt} onClick={() => setSetupData(d=>({...d,[step.field]:opt}))}
                    style={{ background: val===opt ? `linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})` : "rgba(255,255,255,0.05)", border:`1px solid ${val===opt ? C.rose : C.border}`, borderRadius:"12px", padding:"14px 16px", color:val===opt?"#fff":C.textMuted, fontSize:"15px", cursor:"pointer", textAlign:"left", fontFamily:FONT_BODY, transition:"all 0.2s" }}>
                    {val===opt ? "● " : "○ "}{opt}
                  </button>
                ))}
              </div>
            )}
            {step.type === "multi" && (
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {step.options.map(opt => {
                  const selected = Array.isArray(val) && val.includes(opt);
                  return (
                    <button key={opt} onClick={() => setSetupData(d=>({...d,[step.field]:selected?val.filter(v=>v!==opt):[...val,opt]}))}
                      style={{ background:selected?`linear-gradient(135deg, rgba(139,0,0,0.4), rgba(107,33,168,0.4))`:"rgba(255,255,255,0.05)", border:`1px solid ${selected?C.rose:C.border}`, borderRadius:"12px", padding:"12px 16px", color:selected?"#fff":C.textMuted, fontSize:"14px", cursor:"pointer", textAlign:"left", fontFamily:FONT_BODY, transition:"all 0.2s", display:"flex", alignItems:"center", gap:"10px" }}>
                      <span style={{ width:"20px", height:"20px", borderRadius:"6px", border:`2px solid ${selected?C.rose:C.textDim}`, background:selected?C.rose:"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", flexShrink:0 }}>
                        {selected?"✓":""}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ display:"flex", gap:"10px", marginTop:"1.5rem" }}>
              {setupStep > 0 && (
                <button onClick={() => setSetupStep(s=>s-1)} style={{ flex:1, background:"rgba(255,255,255,0.07)", border:`1px solid ${C.border}`, borderRadius:"12px", padding:"14px", color:C.textMuted, fontSize:"15px", cursor:"pointer", fontFamily:FONT_BODY }}>← Back</button>
              )}
              <button onClick={() => { if (isLast) { setShowSetup(false); toast.success("Profile created! 💕"); } else setSetupStep(s=>s+1); }}
                disabled={!canNext}
                style={{ flex:2, background:canNext?`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`:"rgba(255,255,255,0.05)", border:"none", borderRadius:"12px", padding:"14px", color:canNext?"#fff":C.textDim, fontSize:"15px", fontWeight:"700", cursor:canNext?"pointer":"not-allowed", fontFamily:FONT_BODY, transition:"all 0.2s" }}>
                {isLast ? "Create My Profile 💕" : "Continue →"}
              </button>
            </div>
          </div>

          <div style={{ textAlign:"center", marginTop:"1rem", fontSize:"12px", color:C.textDim }}>Step {setupStep+1} of {steps.length}</div>
        </div>
      </div>
    );
  }

  // ── MAIN APP ──────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:C.midnight, color:C.text, fontFamily:FONT_BODY, position:"relative" }}>
      <HeartParticles />

      {/* Header */}
      <div style={{ position:"sticky", top:0, zIndex:100, background:`rgba(13,4,24,0.95)`, backdropFilter:"blur(20px)", borderBottom:`1px solid ${C.border}`, padding:"12px 1rem" }}>
        <div style={{ maxWidth:"500px", margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontFamily:FONT_DISPLAY, fontSize:"22px", fontWeight:"700", background:`linear-gradient(135deg, ${C.rose}, ${C.gold})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            💕 PROJO DATING
          </div>
          <div style={{ display:"flex", gap:"8px" }}>
            <button onClick={() => setShowFilter(true)} style={{ background:"rgba(232,20,74,0.1)", border:`1px solid ${C.border}`, borderRadius:"10px", padding:"6px 12px", color:C.roseLight, fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>⚙ Filter</button>
            {!user?.isPremium && (
              <button onClick={() => setShowPremiumModal(true)} style={{ background:`linear-gradient(135deg, ${C.gold}, #B8960C)`, border:"none", borderRadius:"10px", padding:"6px 12px", color:C.dark, fontSize:"12px", fontWeight:"800", cursor:"pointer" }}>★ Premium</button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:"500px", margin:"0 auto", padding:"1rem", paddingBottom:"80px", position:"relative", zIndex:1 }}>

        {/* ── DISCOVER TAB ── */}
        {activeTab === "discover" && (
          <div>
            {/* Setup CTA if new user */}
            <div onClick={() => setShowSetup(true)} style={{ background:`linear-gradient(135deg, rgba(139,0,0,0.3), rgba(107,33,168,0.3))`, border:`1px solid ${C.border}`, borderRadius:"16px", padding:"14px 16px", marginBottom:"1rem", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontWeight:"700", fontSize:"14px", color:C.roseLight }}>💕 Complete Your Profile</div>
                <div style={{ fontSize:"11px", color:C.textMuted, marginTop:"2px" }}>Get {profileCompletion}% more matches</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:"10px", width:"80px", height:"6px" }}>
                  <div style={{ background:`linear-gradient(90deg, ${C.rose}, ${C.gold})`, height:"100%", borderRadius:"10px", width:`${profileCompletion}%` }} />
                </div>
                <span style={{ fontSize:"12px", color:C.gold }}>{profileCompletion}%</span>
              </div>
            </div>

            {/* Section headers */}
            {["Today's Top Picks 🔥", "New Members 🌟", "Online Now 💚", "Verified Members ✓"].map((section, si) => (
              <div key={section} style={{ marginBottom:"1.5rem" }}>
                <div style={{ fontFamily:FONT_DISPLAY, fontSize:"20px", fontWeight:"700", color:C.text, marginBottom:"1rem" }}>{section}</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                  {profiles.slice(si*1, si*1+2).map(profile => (
                    <div key={profile.id} onClick={() => setShowProfile(profile)} style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`1px solid ${C.border}`, borderRadius:"18px", overflow:"hidden", cursor:"pointer", transition:"transform 0.2s", position:"relative" }}
                      onMouseEnter={e => e.currentTarget.style.transform="scale(1.02)"}
                      onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}>
                      <div style={{ height:"160px", background:`linear-gradient(135deg, ${C.purple} 0%, ${C.crimson} 100%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"60px", position:"relative" }}>
                        {profile.photos[0]}
                        {profile.online && <div style={{ position:"absolute", top:"8px", right:"8px", width:"10px", height:"10px", borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 6px #22c55e" }} />}
                        {profile.verified && <div style={{ position:"absolute", top:"8px", left:"8px", background:"rgba(212,175,55,0.9)", borderRadius:"10px", padding:"2px 6px", fontSize:"9px", fontWeight:"700", color:C.dark }}>✓</div>}
                      </div>
                      <div style={{ padding:"10px" }}>
                        <div style={{ fontFamily:FONT_DISPLAY, fontSize:"16px", fontWeight:"700", color:C.text }}>{profile.name}, {profile.age}</div>
                        <div style={{ fontSize:"10px", color:C.textMuted, marginTop:"2px" }}>📍 {profile.city} · {profile.distance}km</div>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"8px" }}>
                          <div style={{ fontSize:"10px", color:C.roseLight, fontWeight:"700" }}>{profile.compatScore}% match</div>
                          <button onClick={e => { e.stopPropagation(); handleLike(profile); }} style={{ background:`linear-gradient(135deg, ${C.crimson}, ${C.rose})`, border:"none", borderRadius:"50%", width:"30px", height:"30px", color:"#fff", fontSize:"14px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>♥</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── MATCHES TAB ── */}
        {activeTab === "matches" && (
          <div>
            <div style={{ fontFamily:FONT_DISPLAY, fontSize:"24px", fontWeight:"700", color:C.text, marginBottom:"4px" }}>Your Matches 💝</div>
            <div style={{ fontSize:"12px", color:C.textMuted, marginBottom:"1.5rem" }}>{matches.length} people liked you back</div>
            {matches.length === 0 ? (
              <div style={{ textAlign:"center", padding:"4rem 2rem" }}>
                <div style={{ fontSize:"64px", marginBottom:"16px" }}>💕</div>
                <div style={{ fontFamily:FONT_DISPLAY, fontSize:"22px", fontWeight:"700", color:C.text, marginBottom:"8px" }}>No matches yet</div>
                <div style={{ fontSize:"14px", color:C.textMuted, marginBottom:"24px" }}>Keep discovering and liking profiles</div>
                <button onClick={() => setActiveTab("discover")} style={{ background:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, border:"none", borderRadius:"12px", padding:"14px 28px", color:"#fff", fontWeight:"700", fontSize:"15px", cursor:"pointer" }}>Discover People 💫</button>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                {matches.map(profile => (
                  <div key={profile.id} onClick={() => setActiveTab("messages")} style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`1px solid rgba(232,20,74,0.4)`, borderRadius:"18px", overflow:"hidden", cursor:"pointer" }}>
                    <div style={{ height:"140px", background:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"56px", position:"relative" }}>
                      {profile.photos[0]}
                      <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent, rgba(13,4,24,0.9))", padding:"8px" }}>
                        <div style={{ fontFamily:FONT_DISPLAY, fontSize:"15px", fontWeight:"700", color:"#fff" }}>{profile.name}, {profile.age}</div>
                      </div>
                    </div>
                    <div style={{ padding:"10px" }}>
                      <button onClick={() => setActiveTab("messages")} style={{ width:"100%", background:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, border:"none", borderRadius:"8px", padding:"8px", color:"#fff", fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>
                        💬 Send Message
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MESSAGES TAB ── */}
        {activeTab === "messages" && (
          <div>
            <div style={{ fontFamily:FONT_DISPLAY, fontSize:"24px", fontWeight:"700", color:C.text, marginBottom:"4px" }}>Messages 💬</div>
            {!user?.isPremium && (
              <div onClick={() => setShowPremiumModal(true)} style={{ background:`linear-gradient(135deg, rgba(212,175,55,0.2), rgba(139,0,0,0.2))`, border:`1px solid ${C.borderGold}`, borderRadius:"16px", padding:"16px", marginBottom:"1rem", cursor:"pointer", textAlign:"center" }}>
                <div style={{ fontSize:"24px", marginBottom:"6px" }}>🔒</div>
                <div style={{ fontWeight:"700", color:C.gold, fontSize:"14px" }}>Unlock Messaging</div>
                <div style={{ fontSize:"12px", color:C.textMuted, marginTop:"4px" }}>Premium — R99.99/month · Chat with all your matches</div>
                <div style={{ background:`linear-gradient(135deg, ${C.gold}, #B8960C)`, borderRadius:"8px", padding:"8px 16px", color:C.dark, fontWeight:"800", fontSize:"13px", marginTop:"10px", display:"inline-block" }}>★ Go Premium</div>
              </div>
            )}
            {matches.length === 0 ? (
              <div style={{ textAlign:"center", padding:"3rem 2rem", color:C.textMuted }}>
                <div style={{ fontSize:"48px", marginBottom:"12px" }}>💬</div>
                <div>Match with someone first to start chatting</div>
              </div>
            ) : matches.map(profile => (
              <div key={profile.id} style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`1px solid ${C.border}`, borderRadius:"16px", padding:"1rem", marginBottom:"10px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"12px" }}>
                  <div style={{ width:"48px", height:"48px", borderRadius:"50%", background:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px", flexShrink:0 }}>{profile.photos[0]}</div>
                  <div>
                    <div style={{ fontFamily:FONT_DISPLAY, fontSize:"16px", fontWeight:"700", color:C.text }}>{profile.name}</div>
                    <div style={{ fontSize:"11px", color:profile.online?"#22c55e":C.textDim }}>{profile.online?"● Online":"Last active recently"}</div>
                  </div>
                </div>
                <div style={{ background:"rgba(0,0,0,0.3)", borderRadius:"12px", padding:"12px", minHeight:"80px", marginBottom:"10px", maxHeight:"200px", overflowY:"auto" }}>
                  {(messages[profile.id] || []).length === 0 ? (
                    <div style={{ color:C.textDim, fontSize:"13px", textAlign:"center", padding:"1rem 0" }}>Say hi to {profile.name}! 👋</div>
                  ) : (messages[profile.id] || []).map((msg, i) => (
                    <div key={i} style={{ marginBottom:"8px", textAlign:msg.from==="me"?"right":"left" }}>
                      <span style={{ background:msg.from==="me"?`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`:"rgba(255,255,255,0.1)", borderRadius:"12px", padding:"8px 12px", fontSize:"13px", color:"#fff", display:"inline-block", maxWidth:"80%" }}>
                        {msg.text}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:"8px" }}>
                  <input value={msgInput} onChange={e => setMsgInput(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && sendMessage(profile.id)}
                    placeholder={user?.isPremium?"Type a message...":"Premium required to message"}
                    disabled={!user?.isPremium}
                    style={{ flex:1, background:"rgba(255,255,255,0.07)", border:`1px solid ${C.border}`, borderRadius:"10px", color:C.text, padding:"10px 14px", fontSize:"13px", outline:"none" }} />
                  <button onClick={() => sendMessage(profile.id)} style={{ background:`linear-gradient(135deg, ${C.crimson}, ${C.rose})`, border:"none", borderRadius:"10px", padding:"10px 16px", color:"#fff", fontSize:"16px", cursor:"pointer" }}>→</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {activeTab === "profile" && (
          <div>
            <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
              <div style={{ width:"100px", height:"100px", borderRadius:"50%", background:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"48px", margin:"0 auto 12px", border:`3px solid ${C.rose}`, boxShadow:`0 0 30px rgba(232,20,74,0.4)` }}>
                {user?.name?.[0] || "👤"}
              </div>
              <div style={{ fontFamily:FONT_DISPLAY, fontSize:"22px", fontWeight:"700", color:C.text }}>{setupData.displayName || user?.name?.split(" ")[0] || "Your Name"}</div>
              <div style={{ fontSize:"12px", color:C.textMuted }}>{setupData.city}</div>
              <button onClick={() => setShowSetup(true)} style={{ background:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, border:"none", borderRadius:"10px", padding:"8px 20px", color:"#fff", fontWeight:"700", fontSize:"13px", cursor:"pointer", marginTop:"10px" }}>
                ✏️ Edit Profile
              </button>
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"1.5rem" }}>
              {[["💝","Likes",likedProfiles.length],["💕","Matches",matches.length],["👁️","Views","24"]].map(([icon,label,val]) => (
                <div key={label} style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`1px solid ${C.border}`, borderRadius:"14px", padding:"14px", textAlign:"center" }}>
                  <div style={{ fontSize:"20px" }}>{icon}</div>
                  <div style={{ fontFamily:FONT_DISPLAY, fontSize:"22px", fontWeight:"700", color:C.rose }}>{val}</div>
                  <div style={{ fontSize:"11px", color:C.textMuted }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Premium upsell */}
            {!user?.isPremium && (
              <div onClick={() => setShowPremiumModal(true)} style={{ background:`linear-gradient(135deg, rgba(212,175,55,0.15), rgba(139,0,0,0.15))`, border:`2px solid ${C.borderGold}`, borderRadius:"18px", padding:"1.25rem", marginBottom:"1rem", cursor:"pointer" }}>
                <div style={{ fontFamily:FONT_DISPLAY, fontSize:"20px", fontWeight:"700", color:C.gold, marginBottom:"8px" }}>★ Upgrade to Premium</div>
                <div style={{ fontSize:"13px", color:C.textMuted, marginBottom:"12px", lineHeight:1.5 }}>Unlock messaging, see who liked you, boost your profile and much more.</div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontFamily:FONT_DISPLAY, fontSize:"22px", fontWeight:"700", color:C.text }}>R99.99<span style={{ fontSize:"13px", color:C.textMuted }}>/month</span></div>
                  <div style={{ background:`linear-gradient(135deg, ${C.gold}, #B8960C)`, borderRadius:"10px", padding:"8px 18px", color:C.dark, fontWeight:"800", fontSize:"13px" }}>Upgrade Now →</div>
                </div>
              </div>
            )}

            {/* Settings */}
            {[
              { icon:"🔒", label:"Privacy Settings", sub:"Incognito, location, visibility" },
              { icon:"🛡️", label:"Safety & Blocking", sub:"Block users, safety tips" },
              { icon:"📍", label:"Location Settings", sub:"How your location is shown" },
              { icon:"🔔", label:"Notifications", sub:"Matches, messages, likes" },
              { icon:"❓", label:"Help & Support", sub:"FAQ, contact us" },
            ].map(item => (
              <div key={item.label} style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`1px solid ${C.border}`, borderRadius:"14px", padding:"14px 16px", marginBottom:"8px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                  <span style={{ fontSize:"18px" }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize:"14px", fontWeight:"600", color:C.text }}>{item.label}</div>
                    <div style={{ fontSize:"11px", color:C.textMuted }}>{item.sub}</div>
                  </div>
                </div>
                <span style={{ color:C.textDim }}>›</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:100, background:`rgba(13,4,24,0.98)`, backdropFilter:"blur(20px)", borderTop:`1px solid ${C.border}`, padding:"8px 0 12px" }}>
        <div style={{ display:"flex", justifyContent:"space-around", maxWidth:"500px", margin:"0 auto" }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              background:"none", border:"none", display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", cursor:"pointer", padding:"4px 12px",
            }}>
              <span style={{ fontSize:"22px", filter:activeTab===tab.key?"none":"grayscale(50%) opacity(0.5)" }}>{tab.icon}</span>
              <span style={{ fontSize:"10px", fontWeight:"700", color:activeTab===tab.key?C.rose:C.textDim }}>{tab.label}</span>
              {activeTab===tab.key && <div style={{ width:"20px", height:"2px", background:C.rose, borderRadius:"2px" }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Detail Modal */}
      {showProfile && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:200, overflowY:"auto" }}>
          <div style={{ maxWidth:"500px", margin:"0 auto", padding:"1rem", paddingBottom:"2rem" }}>
            <button onClick={() => setShowProfile(null)} style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:"10px", padding:"8px 16px", color:C.text, cursor:"pointer", marginBottom:"1rem" }}>← Back</button>
            <ProfileCard profile={showProfile} onLike={handleLike} onSuperLike={p => toast("⭐ Super Like sent!")} onPass={() => setShowProfile(null)} />
            <div style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`1px solid ${C.border}`, borderRadius:"18px", padding:"1.25rem", marginTop:"12px" }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontSize:"18px", fontWeight:"700", color:C.text, marginBottom:"12px" }}>About {showProfile.name}</div>
              <p style={{ fontSize:"14px", color:C.textMuted, lineHeight:1.7, marginBottom:"1rem" }}>{showProfile.bio}</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                {[["💼",showProfile.job],["📍",`${showProfile.city}, NW`],["🎯",showProfile.goals[0]],["💬","English"]].map(([icon,val]) => (
                  <div key={val} style={{ background:"rgba(255,255,255,0.05)", borderRadius:"10px", padding:"10px 12px", display:"flex", alignItems:"center", gap:"8px" }}>
                    <span>{icon}</span>
                    <span style={{ fontSize:"12px", color:C.textMuted }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Modal */}
      {showPremiumModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.95)", zIndex:300, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, borderRadius:"24px 24px 0 0", padding:"2rem 1.5rem", width:"100%", maxWidth:"500px", border:`1px solid ${C.borderGold}`, borderBottom:"none" }}>
            <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
              <div style={{ fontSize:"48px", marginBottom:"8px" }}>👑</div>
              <div style={{ fontFamily:FONT_DISPLAY, fontSize:"28px", fontWeight:"700", background:`linear-gradient(135deg, ${C.gold}, ${C.rose})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>PROJO Premium</div>
              <div style={{ fontSize:"13px", color:C.textMuted, marginTop:"4px" }}>Find your perfect match faster</div>
            </div>
            {[
              ["💬","Unlimited Messaging","Chat with all your matches"],
              ["👁️","See Who Liked You","Know who's interested in you"],
              ["⭐","5 Super Likes/day","Stand out from the crowd"],
              ["🚀","Profile Boost","Be seen by 10x more people"],
              ["🔍","Advanced Filters","Find exactly who you're looking for"],
              ["✓","Priority Support","Get help when you need it"],
            ].map(([icon,title,sub]) => (
              <div key={title} style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"12px" }}>
                <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:"14px", fontWeight:"700", color:C.text }}>{title}</div>
                  <div style={{ fontSize:"11px", color:C.textMuted }}>{sub}</div>
                </div>
              </div>
            ))}
            <div style={{ background:`linear-gradient(135deg, rgba(212,175,55,0.1), rgba(139,0,0,0.1))`, border:`1px solid ${C.borderGold}`, borderRadius:"14px", padding:"14px", textAlign:"center", marginBottom:"16px", marginTop:"16px" }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontSize:"32px", fontWeight:"700", color:C.gold }}>R99.99<span style={{ fontSize:"14px", color:C.textMuted }}>/month</span></div>
              <div style={{ fontSize:"12px", color:C.textMuted }}>Cancel anytime · No hidden fees</div>
            </div>
            <button onClick={() => { setShowPremiumModal(false); toast.success("Premium activated! 💕"); }} style={{ width:"100%", background:`linear-gradient(135deg, ${C.gold}, #B8960C)`, border:"none", borderRadius:"14px", padding:"16px", color:C.dark, fontWeight:"800", fontSize:"16px", cursor:"pointer", marginBottom:"10px" }}>
              👑 Activate Premium — R99.99/month
            </button>
            <button onClick={() => setShowPremiumModal(false)} style={{ width:"100%", background:"none", border:`1px solid ${C.border}`, borderRadius:"14px", padding:"12px", color:C.textMuted, fontSize:"14px", cursor:"pointer" }}>Maybe later</button>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilter && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, borderRadius:"24px 24px 0 0", padding:"1.5rem", width:"100%", maxWidth:"500px", maxHeight:"80vh", overflowY:"auto" }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontSize:"22px", fontWeight:"700", color:C.text, marginBottom:"1.25rem" }}>⚙ Filter Profiles</div>
            <div style={{ marginBottom:"1rem" }}>
              <div style={{ fontSize:"13px", color:C.textMuted, marginBottom:"8px" }}>Age Range: {filter.ageMin} – {filter.ageMax}</div>
              <input type="range" min="18" max="60" value={filter.ageMax} onChange={e => setFilter(f=>({...f,ageMax:parseInt(e.target.value)}))}
                style={{ width:"100%", accentColor:C.rose }} />
            </div>
            <div style={{ marginBottom:"1rem" }}>
              <div style={{ fontSize:"13px", color:C.textMuted, marginBottom:"8px" }}>Distance: {filter.distance}km</div>
              <input type="range" min="5" max="200" value={filter.distance} onChange={e => setFilter(f=>({...f,distance:parseInt(e.target.value)}))}
                style={{ width:"100%", accentColor:C.rose }} />
            </div>
            <div style={{ display:"flex", gap:"8px", marginTop:"1rem" }}>
              <button onClick={() => setShowFilter(false)} style={{ flex:1, background:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, border:"none", borderRadius:"12px", padding:"14px", color:"#fff", fontWeight:"700", cursor:"pointer" }}>Apply Filters</button>
              <button onClick={() => setShowFilter(false)} style={{ background:"rgba(255,255,255,0.07)", border:`1px solid ${C.border}`, borderRadius:"12px", padding:"14px 20px", color:C.textMuted, cursor:"pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
