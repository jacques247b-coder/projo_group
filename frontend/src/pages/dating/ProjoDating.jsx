// PROJO DATING — Premium Dating App
// Visual: NW Landscapes + Romantic Silhouettes + Heart Particles
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const C = {
  crimson:"#8B0000", rose:"#E8144A", roseLight:"#FF4D7A", rosePale:"#FFB3C6",
  purple:"#2D0A4E", purpleMid:"#6B21A8", gold:"#D4AF37", goldLight:"#F5D76E",
  midnight:"#0D0418", dark:"#120820", card:"#1A0F2E", cardLight:"#231545",
  border:"rgba(232,20,74,0.2)", borderGold:"rgba(212,175,55,0.3)",
  text:"#F8F0FF", textMuted:"#A89BC2", textDim:"#6B5B8A",
};
const FD = "\'Cormorant Garamond\', \'Georgia\', serif";
const FB = "\'Inter\', sans-serif";

// ── PREMIUM PHOTO BACKGROUND ────────────────────────────────
// Split-image romantic silhouette scene (couple video-calling, hearts rising)
// Desktop: image cut in half — left half anchored to the left of the centered
// column, right half anchored to the right, with a matching gradient fill
// bridging the middle so the two halves + center read as one continuous scene.
// Mobile: the same image shown whole, centered behind the column.

const DATING_BG_LEFT  = "/assets/dating/dating-bg-left.webp";
const DATING_BG_RIGHT = "/assets/dating/dating-bg-right.webp";
const DATING_BG_FULL  = "/assets/dating/dating-bg-full.webp";

// Floating love & romance icons
const FLOAT_ICONS = [
  { emoji:"💕", x:"15%",  y:"22%", size:32, delay:0,   duration:4.5 },
  { emoji:"❤️", x:"82%",  y:"25%", size:28, delay:0.8, duration:3.8 },
  { emoji:"💫", x:"8%",   y:"55%", size:24, delay:1.5, duration:5.0 },
  { emoji:"✨", x:"88%",  y:"52%", size:22, delay:0.3, duration:4.2 },
  { emoji:"💍", x:"45%",  y:"15%", size:28, delay:1.0, duration:4.8 },
  { emoji:"🌹", x:"25%",  y:"45%", size:30, delay:0.5, duration:3.5 },
  { emoji:"💝", x:"70%",  y:"42%", size:26, delay:1.8, duration:4.0 },
  { emoji:"⭐", x:"55%",  y:"8%",  size:22, delay:0.2, duration:5.2 },
  { emoji:"💗", x:"35%",  y:"30%", size:28, delay:1.2, duration:4.3 },
  { emoji:"🦋", x:"78%",  y:"68%", size:26, delay:0.7, duration:4.7 },
  { emoji:"💌", x:"12%",  y:"75%", size:28, delay:1.5, duration:3.9 },
  { emoji:"✦",  x:"92%",  y:"78%", size:20, delay:0.4, duration:4.6 },
  { emoji:"💎", x:"48%",  y:"78%", size:24, delay:2.0, duration:4.1 },
  { emoji:"🌸", x:"62%",  y:"18%", size:30, delay:0.9, duration:5.1 },
  { emoji:"💘", x:"5%",   y:"12%", size:26, delay:1.3, duration:4.4 },
  { emoji:"💞", x:"95%",  y:"40%", size:24, delay:0.6, duration:4.9 },
];

// Approximate gradient sampled from the source artwork (blue corners →
// purple → soft pink/white glow just below center) so the fill strip
// between the two photo halves reads as one continuous background.
const MIDDLE_FILL =
  "radial-gradient(ellipse 90% 75% at 50% 60%, " +
  "rgba(255,222,254,0.95) 0%, rgba(255,166,255,0.9) 16%, " +
  "rgba(180,120,240,0.9) 36%, rgba(103,112,255,0.92) 56%, " +
  "rgba(30,60,180,0.95) 78%, rgba(0,20,93,1) 100%)";

function RomanticBackground() {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", overflow:"hidden" }}>

      <style>{`
        .dating-bg-half-left, .dating-bg-half-right { display:none; }
        .dating-bg-mobile { display:block; }
        @media (min-width: 901px) {
          .dating-bg-half-left, .dating-bg-half-right { display:block; }
          .dating-bg-mobile { display:none; }
        }
        @keyframes float1 { 0%,100%{transform:translateY(0px) rotate(0deg);} 50%{transform:translateY(-18px) rotate(8deg);} }
        @keyframes float2 { 0%,100%{transform:translateY(0px) rotate(0deg);} 50%{transform:translateY(-14px) rotate(-6deg);} }
        @keyframes pulse  { 0%,100%{opacity:0.7;} 50%{opacity:1;} }
        @keyframes drift  { 0%{transform:translateY(0) translateX(0) rotate(0deg);}
                           33%{transform:translateY(-20px) translateX(8px) rotate(5deg);}
                           66%{transform:translateY(-10px) translateX(-5px) rotate(-3deg);}
                          100%{transform:translateY(0) translateX(0) rotate(0deg);} }
      `}</style>

      {/* Base gradient — doubles as the seamless "fill" behind & between the photo halves */}
      <div style={{ position:"absolute", inset:0, background:MIDDLE_FILL }} />

      {/* ── DESKTOP: image split in half, either side of the centered column ── */}
      <div className="dating-bg-half-left" style={{
        position:"absolute", top:0, left:0, bottom:0,
        width:"calc(50% - 260px)", minWidth:"120px",
        backgroundImage:`url(${DATING_BG_LEFT})`,
        backgroundSize:"cover", backgroundPosition:"right center", backgroundRepeat:"no-repeat",
        WebkitMaskImage:"linear-gradient(to right, black 55%, transparent 100%)",
        maskImage:"linear-gradient(to right, black 55%, transparent 100%)",
      }} />
      <div className="dating-bg-half-right" style={{
        position:"absolute", top:0, right:0, bottom:0,
        width:"calc(50% - 260px)", minWidth:"120px",
        backgroundImage:`url(${DATING_BG_RIGHT})`,
        backgroundSize:"cover", backgroundPosition:"left center", backgroundRepeat:"no-repeat",
        WebkitMaskImage:"linear-gradient(to left, black 55%, transparent 100%)",
        maskImage:"linear-gradient(to left, black 55%, transparent 100%)",
      }} />

      {/* ── MOBILE: full image, whole & centered, behind the column ── */}
      <div className="dating-bg-mobile" style={{
        position:"absolute", inset:0,
        backgroundImage:`url(${DATING_BG_FULL})`,
        backgroundSize:"cover", backgroundPosition:"center 35%", backgroundRepeat:"no-repeat",
      }} />

      {/* Premium gold vignette frame */}
      <div style={{ position:"absolute", inset:0,
        boxShadow:"inset 0 0 180px rgba(13,4,24,0.55), inset 0 0 40px rgba(212,175,55,0.06)" }} />

      {/* Floating love & romance icons */}
      {FLOAT_ICONS.map((icon, i) => (
        <div key={i} style={{
          position:"absolute",
          left:icon.x,
          top:icon.y,
          fontSize:`${icon.size}px`,
          opacity:0.6,
          zIndex:2,
          animation:`${i%2===0?"float1":"float2"} ${icon.duration}s ${icon.delay}s ease-in-out infinite, pulse ${icon.duration*0.8}s ${icon.delay}s ease-in-out infinite`,
          filter:"drop-shadow(0 4px 12px rgba(232,20,74,0.4)) drop-shadow(0 0 20px rgba(212,175,55,0.25))",
          userSelect:"none",
          lineHeight:1,
        }}>
          {icon.emoji}
        </div>
      ))}

      {/* Content readability overlay — darkens center where the column sits */}
      <div style={{ position:"absolute", inset:0,
        background:"radial-gradient(ellipse 60% 60% at 50% 50%, rgba(13,4,24,0.55) 0%, rgba(13,4,24,0.2) 60%, rgba(13,4,24,0) 100%)",
        zIndex:3 }} />
    </div>
  );
}


// ── STAR RATING ─────────────────────────────────────────────// ── STAR RATING ─────────────────────────────────────────────// ── STAR RATING ─────────────────────────────────────────────
function StarRating({ profileId, currentRating, onRate }) {
  const [hovered, setHovered] = useState(0);
  const [rated, setRated] = useState(currentRating || 0);
  return (
    <div style={{ display:"flex", gap:"4px", alignItems:"center" }}>
      {[1,2,3,4,5].map(star => (
        <button key={star}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => { setRated(star); onRate?.(star); toast.success(`Rated ${star} ⭐`); }}
          style={{ background:"none", border:"none", cursor:"pointer", fontSize:"22px",
            color: star <= (hovered || rated) ? C.gold : "rgba(255,255,255,0.2)",
            transform: star <= hovered ? "scale(1.2)" : "scale(1)",
            transition: "all 0.15s", filter: star <= (hovered || rated) ? "drop-shadow(0 0 4px rgba(212,175,55,0.6))" : "none",
          }}>★</button>
      ))}
      {rated > 0 && <span style={{ fontSize:"11px", color:C.gold, marginLeft:"4px" }}>{rated}/5</span>}
    </div>
  );
}

// ── PREMIUM MODAL ─────────────────────────────────────────────
function PremiumModal({ onClose, onActivate }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:500, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ background:`linear-gradient(160deg, #1A0F2E, #0D0418)`, borderRadius:"28px 28px 0 0", padding:"2rem 1.5rem", width:"100%", maxWidth:"500px", border:`1px solid rgba(212,175,55,0.4)`, borderBottom:"none", maxHeight:"90vh", overflowY:"auto" }}>
        {/* Animated gold header */}
        <div style={{ textAlign:"center", marginBottom:"1.5rem", position:"relative" }}>
          <div style={{ fontSize:"52px", marginBottom:"8px" }}>👑</div>
          <div style={{ fontFamily:FD, fontSize:"30px", fontWeight:"700", background:`linear-gradient(135deg, ${C.gold}, ${C.rose}, ${C.gold})`, backgroundSize:"200%", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:"4px" }}>
            PROJO Premium
          </div>
          <div style={{ fontSize:"13px", color:C.textMuted }}>Unlock your perfect connection</div>
        </div>

        {/* Features */}
        {[
          ["💬","Unlimited Messaging","Chat freely with all your matches"],
          ["👁️","See Who Liked You","Discover who's already interested"],
          ["⭐","5 Super Likes / day","Make a lasting impression"],
          ["🚀","Profile Boost","Get seen by 10× more people"],
          ["🔍","Advanced Filters","Filter by lifestyle, religion, height & more"],
          ["🔒","Incognito Mode","Browse privately, be seen only when you like"],
          ["✓","Verified Badge","Stand out with a verification checkmark"],
          ["💎","Priority Support","Get help whenever you need it"],
        ].map(([icon,title,sub]) => (
          <div key={title} style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"14px" }}>
            <div style={{ width:"40px", height:"40px", borderRadius:"12px", background:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0, boxShadow:`0 4px 12px rgba(139,0,0,0.3)` }}>{icon}</div>
            <div>
              <div style={{ fontSize:"14px", fontWeight:"700", color:C.text }}>{title}</div>
              <div style={{ fontSize:"11px", color:C.textMuted }}>{sub}</div>
            </div>
          </div>
        ))}

        {/* Pricing */}
        <div style={{ background:`linear-gradient(135deg, rgba(212,175,55,0.1), rgba(139,0,0,0.1))`, border:`1px solid rgba(212,175,55,0.3)`, borderRadius:"16px", padding:"16px", textAlign:"center", margin:"16px 0" }}>
          <div style={{ fontSize:"11px", color:C.textMuted, marginBottom:"4px", textTransform:"uppercase", letterSpacing:"1px" }}>Monthly</div>
          <div style={{ fontFamily:FD, fontSize:"38px", fontWeight:"700", color:C.gold }}>R80<span style={{ fontSize:"15px", color:C.textMuted }}>/month</span></div>
          <div style={{ fontSize:"11px", color:C.textMuted, marginTop:"4px" }}>Cancel anytime · No hidden fees · Secure payment</div>
        </div>

        <button onClick={onActivate} style={{ width:"100%", background:`linear-gradient(135deg, ${C.gold}, #9A7A10)`, border:"none", borderRadius:"14px", padding:"16px", color:C.dark, fontWeight:"800", fontSize:"16px", cursor:"pointer", marginBottom:"10px", boxShadow:`0 8px 24px rgba(212,175,55,0.4)` }}>
          👑 Activate Premium — R80/month
        </button>
        <button onClick={onClose} style={{ width:"100%", background:"none", border:`1px solid ${C.border}`, borderRadius:"14px", padding:"12px", color:C.textMuted, fontSize:"14px", cursor:"pointer" }}>
          Maybe later
        </button>
        <div style={{ fontSize:"10px", color:C.textDim, textAlign:"center", marginTop:"10px" }}>
          By subscribing you agree to our Terms of Service. Subscription auto-renews monthly.
        </div>
      </div>
    </div>
  );
}

// ── PROFILE DETAIL ───────────────────────────────────────────
function ProfileDetail({ profile, onClose, onLike, onMessage, isPremium, onSuperLike, superLiked }) {
  const [rating, setRating] = useState(0);
  const [showPremium, setShowPremium] = useState(false);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.95)", zIndex:200, overflowY:"auto" }}>
      <div style={{ maxWidth:"500px", margin:"0 auto", paddingBottom:"2rem" }}>
        {/* Hero photo */}
        <div style={{ position:"relative", height:"400px", background:`linear-gradient(135deg, ${C.purple} 0%, ${C.crimson} 50%, #3D0B2B 100%)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ fontSize:"120px", filter:"drop-shadow(0 8px 24px rgba(0,0,0,0.6))" }}>{profile.photos[0]}</div>
          
          {/* Gradient overlay */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"200px", background:"linear-gradient(transparent, rgba(13,4,24,0.98))" }} />

          {/* Back button */}
          <button onClick={onClose} style={{ position:"absolute", top:"16px", left:"16px", background:"rgba(0,0,0,0.5)", border:`1px solid ${C.border}`, borderRadius:"10px", padding:"8px 14px", color:C.text, cursor:"pointer", backdropFilter:"blur(10px)" }}>← Back</button>

          {/* Badges */}
          <div style={{ position:"absolute", top:"16px", right:"16px", display:"flex", flexDirection:"column", gap:"6px", alignItems:"flex-end" }}>
            {profile.verified && <div style={{ background:"rgba(212,175,55,0.9)", borderRadius:"20px", padding:"4px 12px", fontSize:"11px", fontWeight:"700", color:C.dark }}>✓ Verified</div>}
            {profile.online && <div style={{ background:"rgba(34,197,94,0.9)", borderRadius:"20px", padding:"4px 12px", fontSize:"11px", fontWeight:"700", color:"#fff" }}>● Online Now</div>}
          </div>

          {/* Compat */}
          <div style={{ position:"absolute", bottom:"80px", right:"16px", background:`linear-gradient(135deg, ${C.crimson}, ${C.roseLight})`, borderRadius:"50%", width:"56px", height:"56px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 16px rgba(232,20,74,0.5)` }}>
            <div style={{ fontSize:"16px", fontWeight:"800", color:"#fff", lineHeight:1 }}>{profile.compatScore}%</div>
            <div style={{ fontSize:"8px", color:"rgba(255,255,255,0.8)" }}>match</div>
          </div>

          {/* Name */}
          <div style={{ position:"absolute", bottom:"16px", left:"16px", right:"80px" }}>
            <div style={{ fontFamily:FD, fontSize:"30px", fontWeight:"700", color:"#fff", letterSpacing:"0.5px" }}>{profile.name}, {profile.age}</div>
            <div style={{ fontSize:"13px", color:C.rosePale }}>📍 {profile.city} · {profile.distance}km · {profile.job}</div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display:"flex", gap:"10px", padding:"1rem", background:C.midnight }}>
          <button onClick={() => onLike?.(profile)} style={{ flex:1, background:`linear-gradient(135deg, ${C.crimson}, ${C.rose})`, border:"none", borderRadius:"14px", padding:"14px", color:"#fff", fontWeight:"800", fontSize:"15px", cursor:"pointer", boxShadow:`0 4px 20px rgba(232,20,74,0.4)`, display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
            ♥ Like
          </button>
          <button onClick={() => isPremium ? onMessage?.(profile) : setShowPremium(true)} style={{ flex:1, background:isPremium ? `linear-gradient(135deg, ${C.purpleMid}, ${C.gold})` : "rgba(255,255,255,0.08)", border:isPremium ? "none" : `1px solid ${C.borderGold}`, borderRadius:"14px", padding:"14px", color:isPremium ? "#fff" : C.gold, fontWeight:"800", fontSize:"15px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
            {isPremium ? "💬 Message" : "🔒 Message"}
          </button>
          <button onClick={() => onSuperLike?.(profile)} disabled={superLiked} style={{ width:"52px", background:superLiked?`linear-gradient(135deg, ${C.gold}, #B8960C)`:`linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.1))`, border:`1px solid ${C.borderGold}`, borderRadius:"14px", color:superLiked?C.dark:C.gold, fontSize:"22px", cursor:superLiked?"default":"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>⭐</button>
        </div>

        {/* Profile info */}
        <div style={{ padding:"0 1rem" }}>
          {/* About */}
          <div style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`1px solid ${C.border}`, borderRadius:"18px", padding:"1.25rem", marginBottom:"12px" }}>
            <div style={{ fontFamily:FD, fontSize:"18px", fontWeight:"700", color:C.text, marginBottom:"10px" }}>About {profile.name}</div>
            <p style={{ fontSize:"14px", color:C.textMuted, lineHeight:1.7, margin:0 }}>{profile.bio}</p>
          </div>

          {/* Details grid */}
          <div style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`1px solid ${C.border}`, borderRadius:"18px", padding:"1.25rem", marginBottom:"12px" }}>
            <div style={{ fontFamily:FD, fontSize:"18px", fontWeight:"700", color:C.text, marginBottom:"12px" }}>Profile Details</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
              {[["💼",profile.job,"Occupation"],["📍",`${profile.city}, NW`,"Location"],["🎯",profile.goals[0],"Looking for"],["💬","English","Languages"],["🌟",profile.premium?"Premium":"Free","Member type"],["🏃","Active","Lifestyle"]].map(([icon,val,label]) => (
                <div key={label} style={{ background:"rgba(255,255,255,0.04)", borderRadius:"12px", padding:"10px 12px" }}>
                  <div style={{ fontSize:"10px", color:C.textDim, marginBottom:"3px", textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</div>
                  <div style={{ fontSize:"13px", color:C.text, fontWeight:"600", display:"flex", alignItems:"center", gap:"6px" }}><span>{icon}</span>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`1px solid ${C.border}`, borderRadius:"18px", padding:"1.25rem", marginBottom:"12px" }}>
            <div style={{ fontFamily:FD, fontSize:"18px", fontWeight:"700", color:C.text, marginBottom:"12px" }}>Interests</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
              {profile.interests.map(i => (
                <span key={i} style={{ background:`linear-gradient(135deg, rgba(107,33,168,0.3), rgba(139,0,0,0.2))`, border:"1px solid rgba(107,33,168,0.4)", borderRadius:"20px", padding:"6px 14px", fontSize:"13px", color:C.rosePale }}>
                  {i}
                </span>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`1px solid ${C.border}`, borderRadius:"18px", padding:"1.25rem", marginBottom:"12px" }}>
            <div style={{ fontFamily:FD, fontSize:"18px", fontWeight:"700", color:C.text, marginBottom:"12px" }}>Relationship Goals</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
              {profile.goals.map(g => (
                <span key={g} style={{ background:"rgba(232,20,74,0.15)", border:`1px solid ${C.border}`, borderRadius:"20px", padding:"6px 14px", fontSize:"13px", color:C.roseLight }}>
                  💝 {g}
                </span>
              ))}
            </div>
          </div>

          {/* Rate this profile */}
          <div style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`1px solid ${C.borderGold}`, borderRadius:"18px", padding:"1.25rem", marginBottom:"12px" }}>
            <div style={{ fontFamily:FD, fontSize:"18px", fontWeight:"700", color:C.text, marginBottom:"8px" }}>Rate this Profile</div>
            <div style={{ fontSize:"12px", color:C.textMuted, marginBottom:"12px" }}>Help our AI find you better matches</div>
            <StarRating profileId={profile.id} currentRating={rating} onRate={setRating} />
          </div>

          {/* Report / Block */}
          <div style={{ display:"flex", gap:"8px", marginBottom:"2rem" }}>
            <button style={{ flex:1, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"12px", padding:"10px", color:"#f87171", fontSize:"12px", cursor:"pointer" }}>🚫 Block User</button>
            <button style={{ flex:1, background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:"12px", padding:"10px", color:"#fbbf24", fontSize:"12px", cursor:"pointer" }}>⚠️ Report</button>
          </div>
        </div>
      </div>

      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} onActivate={() => { setShowPremium(false); toast.success("💕 Premium activated!"); }} />}
    </div>
  );
}

// ── PROFILE CARD ─────────────────────────────────────────────
function ProfileCard({ profile, onLike, onPass, onOpen, onSuperLike, superLiked }) {
  const [liked, setLiked] = useState(false);
  return (
    <div onClick={() => onOpen?.(profile)} style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`1px solid ${C.border}`, borderRadius:"22px", overflow:"hidden", cursor:"pointer", boxShadow:`0 16px 48px rgba(139,0,0,0.25), 0 0 0 1px rgba(232,20,74,0.08)`, transition:"transform 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.transform="translateY(-3px)"}
      onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}>
      <div style={{ position:"relative", height:"280px", background:`linear-gradient(135deg, ${C.purple} 0%, ${C.crimson} 100%)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontSize:"90px" }}>{profile.photos[0]}</div>
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"140px", background:"linear-gradient(transparent, rgba(13,4,24,0.97))" }} />
        <div style={{ position:"absolute", top:"10px", left:"10px", display:"flex", gap:"5px" }}>
          {profile.verified && <div style={{ background:"rgba(212,175,55,0.92)", borderRadius:"20px", padding:"3px 9px", fontSize:"10px", fontWeight:"700", color:C.dark }}>✓</div>}
          {profile.online && <div style={{ background:"rgba(34,197,94,0.9)", borderRadius:"20px", padding:"3px 9px", fontSize:"10px", fontWeight:"700", color:"#fff" }}>●</div>}
          {profile.premium && <div style={{ background:`linear-gradient(135deg, ${C.gold}, #B8960C)`, borderRadius:"20px", padding:"3px 9px", fontSize:"10px", fontWeight:"700", color:C.dark }}>★</div>}
        </div>
        <div style={{ position:"absolute", top:"10px", right:"10px", background:`linear-gradient(135deg, ${C.crimson}, ${C.roseLight})`, borderRadius:"50%", width:"44px", height:"44px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <div style={{ fontSize:"13px", fontWeight:"800", color:"#fff", lineHeight:1 }}>{profile.compatScore}%</div>
          <div style={{ fontSize:"7px", color:"rgba(255,255,255,0.8)" }}>match</div>
        </div>
        <div style={{ position:"absolute", bottom:"12px", left:"14px", right:"14px" }}>
          <div style={{ fontFamily:FD, fontSize:"22px", fontWeight:"700", color:"#fff" }}>{profile.name}, {profile.age}</div>
          <div style={{ fontSize:"11px", color:C.rosePale }}>📍 {profile.city} · {profile.distance}km</div>
        </div>
      </div>
      <div style={{ padding:"14px" }}>
        <p style={{ fontSize:"12px", color:C.textMuted, lineHeight:1.5, margin:"0 0 10px" }}>{profile.bio.slice(0,85)}...</p>
        <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginBottom:"12px" }}>
          {profile.interests.slice(0,3).map(i => <span key={i} style={{ background:"rgba(107,33,168,0.25)", border:"1px solid rgba(107,33,168,0.4)", borderRadius:"20px", padding:"2px 9px", fontSize:"10px", color:C.rosePale }}>{i}</span>)}
        </div>
        <div style={{ display:"flex", gap:"8px" }} onClick={e => e.stopPropagation()}>
          <button onClick={() => onPass?.(profile)} style={{ width:"44px", height:"44px", borderRadius:"50%", background:"rgba(107,33,168,0.15)", border:"1px solid rgba(107,33,168,0.3)", color:C.textMuted, fontSize:"18px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
          <button onClick={() => { setLiked(true); onLike?.(profile); }} style={{ flex:1, height:"44px", borderRadius:"22px", background:liked?`linear-gradient(135deg, ${C.rose}, ${C.roseLight})`:`linear-gradient(135deg, ${C.crimson}, ${C.rose})`, border:"none", color:"#fff", fontWeight:"800", fontSize:"15px", cursor:"pointer", boxShadow:`0 4px 16px rgba(232,20,74,0.4)` }}>
            {liked ? "♥ Liked!" : "♥ Like"}
          </button>
          <button onClick={() => onSuperLike?.(profile)} disabled={superLiked} style={{ width:"44px", height:"44px", borderRadius:"50%", background:superLiked?`linear-gradient(135deg, ${C.gold}, #B8960C)`:`linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.1))`, border:`1px solid ${C.borderGold}`, color:superLiked?C.dark:C.gold, fontSize:"18px", cursor:superLiked?"default":"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>⭐</button>
        </div>
      </div>
    </div>
  );
}

// ── SAMPLE DATA ───────────────────────────────────────────────
const PROFILES = [
  { id:1, name:"Naledi", age:26, city:"Rustenburg", distance:2, job:"Nurse", bio:"Adventurous soul who loves hiking the Magalies, braaing on weekends, and deep conversations under the stars.", interests:["Hiking","Braai","Travel","Music","Yoga"], photos:["💃"], verified:true, online:true, premium:true, compatScore:94, goals:["Serious Relationship","Long-Term"] },
  { id:2, name:"Thabo", age:30, city:"Rustenburg", distance:5, job:"Civil Engineer", bio:"Engineer by day, chef by night. I believe food is love. Seeking genuine connection with someone who appreciates authenticity.", interests:["Cooking","Gym","Soccer","Reading"], photos:["🧑"], verified:true, online:false, premium:false, compatScore:87, goals:["Long-Term Relationship"] },
  { id:3, name:"Sasha", age:24, city:"Brits", distance:45, job:"Teacher", bio:"Passionate about education and dance. Love Sunday drives through the Hartbeespoort area and finding hidden gems.", interests:["Dancing","Books","Art","Nature"], photos:["👩"], verified:false, online:true, premium:true, compatScore:79, goals:["Dating","Friendship"] },
  { id:4, name:"Lerato", age:28, city:"Rustenburg", distance:3, job:"Entrepreneur", bio:"Building my empire one step at a time. Looking for someone ambitious to share the journey. Wine lover, travel addict.", interests:["Business","Travel","Wine","Movies"], photos:["💁"], verified:true, online:true, premium:true, compatScore:91, goals:["Serious Relationship","Marriage"] },
  { id:5, name:"Kagiso", age:32, city:"Phokeng", distance:12, job:"Doctor", bio:"Healing hearts medically and hoping to find someone to complete mine. Jazz nights, country drives, and good conversation.", interests:["Jazz","Travel","Cooking","Fitness"], photos:["🧔"], verified:true, online:false, premium:true, compatScore:85, goals:["Marriage","Serious Relationship"] },
  { id:6, name:"Amara", age:25, city:"Rustenburg", distance:8, job:"Graphic Designer", bio:"I see beauty in everything. My ideal date? Sunset at Sun City followed by stargazing at Pilanesberg.", interests:["Art","Photography","Music","Stargazing"], photos:["🌸"], verified:false, online:true, premium:false, compatScore:76, goals:["Dating","Long-Term"] },
];

// ── MAIN APP ──────────────────────────────────────────────────
export default function ProjoDating() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("discover");
  const [showProfile, setShowProfile] = useState(null);
  const [showPremium, setShowPremium] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [likes, setLikes] = useState([]);
  const [superLikes, setSuperLikes] = useState([]);
  const SUPER_LIKES_PER_DAY = 5;
  const [matches, setMatches] = useState([]);
  const [messages, setMessages] = useState({});
  const [msgInput, setMsgInput] = useState("");
  const [activeMatch, setActiveMatch] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [profileRatings, setProfileRatings] = useState({});

  function handleSuperLike(profile) {
    if (!isPremium) { setShowPremium(true); return; }
    if (superLikes.includes(profile.id)) return;
    if (superLikes.length >= SUPER_LIKES_PER_DAY) {
      toast.error(`You've used all ${SUPER_LIKES_PER_DAY} Super Likes for today — more tomorrow!`);
      return;
    }
    setSuperLikes(p => [...p, profile.id]);
    if (!likes.includes(profile.id)) setLikes(p => [...p, profile.id]);
    // Super Likes make a strong impression — guaranteed match
    setTimeout(() => {
      setMatches(p => (p.some(m => m.id === profile.id) ? p : [...p, profile]));
      toast.custom(() => (
        <div style={{ background:`linear-gradient(135deg, ${C.gold}, #9A7A10)`, borderRadius:"20px", padding:"20px 28px", textAlign:"center", boxShadow:"0 20px 60px rgba(212,175,55,0.5)" }}>
          <div style={{ fontSize:"40px", marginBottom:"6px" }}>⭐</div>
          <div style={{ fontFamily:FD, fontSize:"22px", fontWeight:"700", color:C.dark }}>Super Like Sent!</div>
          <div style={{ fontSize:"12px", color:C.dark, marginTop:"4px" }}>{profile.name} will see you stood out 💫</div>
        </div>
      ), { duration: 4000 });
    }, 500);
  }

  function handleLike(profile) {
    if (likes.includes(profile.id)) return;
    setLikes(p => [...p, profile.id]);
    if (Math.random() > 0.45) {
      setTimeout(() => {
        setMatches(p => [...p, profile]);
        toast.custom(() => (
          <div style={{ background:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, borderRadius:"20px", padding:"20px 28px", textAlign:"center", boxShadow:"0 20px 60px rgba(139,0,0,0.6)" }}>
            <div style={{ fontSize:"40px", marginBottom:"6px" }}>💝</div>
            <div style={{ fontFamily:FD, fontSize:"22px", fontWeight:"700", color:"#fff" }}>It's a Match!</div>
            <div style={{ fontSize:"12px", color:C.rosePale, marginTop:"4px" }}>You and {profile.name} liked each other 💕</div>
          </div>
        ), { duration: 4000 });
      }, 700);
    }
  }

  function handleMessage(profile) {
    setActiveMatch(profile);
    setTab("messages");
    setShowProfile(null);
  }

  function sendMsg(matchId) {
    if (!msgInput.trim()) return;
    if (!isPremium) { setShowPremium(true); return; }
    setMessages(prev => ({ ...prev, [matchId]: [...(prev[matchId]||[]), { from:"me", text:msgInput, time: new Date().toLocaleTimeString("en-ZA",{hour:"2-digit",minute:"2-digit"}) }] }));
    setMsgInput("");
  }

  const tabs = [
    { key:"discover", icon:"💫", label:"Discover" },
    { key:"matches",  icon:"💝", label:"Matches" },
    { key:"messages", icon:"💬", label:"Messages" },
    { key:"profile",  icon:"👤", label:"Profile" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.midnight, color:C.text, fontFamily:FB, position:"relative", overflowX:"hidden" }}>
      <RomanticBackground />

      {/* Header */}
      <div style={{ position:"sticky", top:0, zIndex:100, background:"rgba(13,4,24,0.92)", backdropFilter:"blur(24px)", borderBottom:`1px solid ${C.border}`, padding:"12px 1rem" }}>
        <div style={{ maxWidth:"500px", margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <button onClick={() => navigate("/")} aria-label="Back" style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${C.border}`, borderRadius:"10px", width:"36px", height:"36px", color:C.text, fontSize:"18px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>←</button>
            <div style={{ fontFamily:FD, fontSize:"24px", fontWeight:"700", background:`linear-gradient(135deg, ${C.rose}, ${C.gold}, ${C.rose})`, backgroundSize:"200%", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              💕 PROJO DATING
            </div>
          </div>
          <div style={{ display:"flex", gap:"8px" }}>
            <button onClick={() => navigate("/dating/lounge")} style={{ background:"rgba(212,175,55,0.1)", border:`1px solid ${C.borderGold}`, borderRadius:"10px", padding:"6px 12px", color:C.goldLight, fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>👥 Lounge</button>
            <button onClick={() => setShowFilter(true)} style={{ background:"rgba(232,20,74,0.1)", border:`1px solid ${C.border}`, borderRadius:"10px", padding:"6px 12px", color:C.roseLight, fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>⚙ Filter</button>
            {!isPremium && <button onClick={() => setShowPremium(true)} style={{ background:`linear-gradient(135deg, ${C.gold}, #9A7A10)`, border:"none", borderRadius:"10px", padding:"6px 12px", color:C.dark, fontSize:"12px", fontWeight:"800", cursor:"pointer" }}>★ Premium</button>}
            {isPremium && <div style={{ background:`linear-gradient(135deg, ${C.gold}, #9A7A10)`, borderRadius:"10px", padding:"6px 12px", color:C.dark, fontSize:"12px", fontWeight:"800" }}>👑 Premium</div>}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div style={{ maxWidth:"500px", margin:"0 auto", padding:"1rem", paddingBottom:"85px", position:"relative", zIndex:1 }}>

        {/* ── DISCOVER ── */}
        {tab === "discover" && (
          <div>
            <div style={{ fontFamily:FD, fontSize:"26px", fontWeight:"700", color:C.text, marginBottom:"4px" }}>Find Your Match 💕</div>
            <div style={{ fontSize:"12px", color:C.textMuted, marginBottom:"1.25rem" }}>Rustenburg & North West Province</div>
            {["🔥 Today's Top Picks", "🌟 New Members", "💚 Online Now", "✓ Verified Profiles"].map((section, si) => (
              <div key={section} style={{ marginBottom:"1.75rem" }}>
                <div style={{ fontFamily:FD, fontSize:"20px", fontWeight:"700", color:C.text, marginBottom:"12px" }}>{section}</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                  {PROFILES.slice(si % 3, (si % 3) + 2).map(p => (
                    <ProfileCard key={p.id} profile={p} onLike={handleLike} onPass={() => {}} onOpen={setShowProfile} onSuperLike={handleSuperLike} superLiked={superLikes.includes(p.id)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── MATCHES ── */}
        {tab === "matches" && (
          <div>
            <div style={{ fontFamily:FD, fontSize:"26px", fontWeight:"700", color:C.text, marginBottom:"4px" }}>Matches 💝</div>
            <div style={{ fontSize:"12px", color:C.textMuted, marginBottom:"1.25rem" }}>{matches.length} mutual connections</div>
            {matches.length === 0 ? (
              <div style={{ textAlign:"center", padding:"5rem 2rem" }}>
                <div style={{ fontSize:"64px", marginBottom:"16px" }}>💕</div>
                <div style={{ fontFamily:FD, fontSize:"24px", color:C.text, marginBottom:"8px" }}>No matches yet</div>
                <div style={{ color:C.textMuted, marginBottom:"24px" }}>Keep liking profiles to find your match</div>
                <button onClick={() => setTab("discover")} style={{ background:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, border:"none", borderRadius:"14px", padding:"14px 28px", color:"#fff", fontWeight:"700", cursor:"pointer" }}>Discover People 💫</button>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                {matches.map(p => (
                  <div key={p.id} style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`2px solid rgba(232,20,74,0.35)`, borderRadius:"18px", overflow:"hidden", cursor:"pointer" }} onClick={() => { setActiveMatch(p); setTab("messages"); }}>
                    <div style={{ height:"150px", background:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"64px", position:"relative" }}>
                      {p.photos[0]}
                      <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent, rgba(13,4,24,0.9))", padding:"8px 10px" }}>
                        <div style={{ fontFamily:FD, fontSize:"16px", fontWeight:"700", color:"#fff" }}>{p.name}, {p.age}</div>
                      </div>
                    </div>
                    <div style={{ padding:"10px" }}>
                      <button style={{ width:"100%", background:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, border:"none", borderRadius:"10px", padding:"9px", color:"#fff", fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>💬 Message</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MESSAGES ── */}
        {tab === "messages" && (
          <div>
            <div style={{ fontFamily:FD, fontSize:"26px", fontWeight:"700", color:C.text, marginBottom:"1rem" }}>Messages 💬</div>
            {!isPremium && (
              <div onClick={() => setShowPremium(true)} style={{ background:`linear-gradient(135deg, rgba(212,175,55,0.15), rgba(139,0,0,0.15))`, border:`1px solid ${C.borderGold}`, borderRadius:"16px", padding:"16px", marginBottom:"1rem", cursor:"pointer", textAlign:"center" }}>
                <div style={{ fontSize:"28px", marginBottom:"6px" }}>🔒</div>
                <div style={{ fontWeight:"700", color:C.gold }}>Premium Required to Message</div>
                <div style={{ fontSize:"12px", color:C.textMuted, marginTop:"4px", marginBottom:"10px" }}>Unlock unlimited messaging for R80/month</div>
                <div style={{ background:`linear-gradient(135deg, ${C.gold}, #9A7A10)`, borderRadius:"8px", padding:"8px 20px", color:C.dark, fontWeight:"800", display:"inline-block" }}>★ Upgrade Now</div>
              </div>
            )}
            {matches.length === 0 ? (
              <div style={{ textAlign:"center", padding:"3rem", color:C.textMuted }}>
                <div style={{ fontSize:"48px", marginBottom:"12px" }}>💬</div>
                <div>Match with someone first!</div>
              </div>
            ) : matches.map(p => (
              <div key={p.id} style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`1px solid ${activeMatch?.id===p.id?C.rose:C.border}`, borderRadius:"18px", padding:"1rem", marginBottom:"12px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"12px", cursor:"pointer" }} onClick={() => setActiveMatch(activeMatch?.id===p.id?null:p)}>
                  <div style={{ width:"48px", height:"48px", borderRadius:"50%", background:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px", flexShrink:0, border:`2px solid ${C.rose}` }}>{p.photos[0]}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:FD, fontSize:"17px", fontWeight:"700", color:C.text }}>{p.name}</div>
                    <div style={{ fontSize:"11px", color:p.online?"#22c55e":C.textDim }}>{p.online?"● Online":"Last seen recently"}</div>
                  </div>
                  <span style={{ color:C.textDim }}>{activeMatch?.id===p.id?"▲":"▼"}</span>
                </div>
                {activeMatch?.id === p.id && (
                  <>
                    <div style={{ background:"rgba(0,0,0,0.35)", borderRadius:"12px", padding:"12px", minHeight:"100px", marginBottom:"10px", maxHeight:"220px", overflowY:"auto" }}>
                      {(messages[p.id]||[]).length === 0 ? (
                        <div style={{ color:C.textDim, fontSize:"13px", textAlign:"center", padding:"1.5rem 0" }}>
                          💕 You matched with {p.name}!<br/>
                          <span style={{ fontSize:"11px" }}>{isPremium?"Send a message to get started":"Upgrade to Premium to start chatting"}</span>
                        </div>
                      ) : (messages[p.id]||[]).map((msg,i) => (
                        <div key={i} style={{ marginBottom:"8px", textAlign:msg.from==="me"?"right":"left" }}>
                          <span style={{ background:msg.from==="me"?`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`:"rgba(255,255,255,0.1)", borderRadius:"14px", padding:"8px 14px", fontSize:"13px", color:"#fff", display:"inline-block", maxWidth:"80%" }}>{msg.text}</span>
                          <div style={{ fontSize:"9px", color:C.textDim, marginTop:"2px" }}>{msg.time}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:"8px" }}>
                      <input value={msgInput} onChange={e => setMsgInput(e.target.value)}
                        onKeyDown={e => e.key==="Enter" && sendMsg(p.id)}
                        placeholder={isPremium?"Type a message... 💕":"Premium required to message"}
                        style={{ flex:1, background:"rgba(255,255,255,0.07)", border:`1px solid ${C.border}`, borderRadius:"12px", color:C.text, padding:"10px 14px", fontSize:"13px", outline:"none" }} />
                      <button onClick={() => sendMsg(p.id)} style={{ background:`linear-gradient(135deg, ${C.crimson}, ${C.rose})`, border:"none", borderRadius:"12px", padding:"10px 18px", color:"#fff", fontSize:"18px", cursor:"pointer" }}>→</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── PROFILE ── */}
        {tab === "profile" && (
          <div>
            <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
              <div style={{ width:"96px", height:"96px", borderRadius:"50%", background:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"44px", margin:"0 auto 12px", border:`3px solid ${C.rose}`, boxShadow:`0 0 32px rgba(232,20,74,0.45)` }}>
                {user?.name?.[0]||"👤"}
              </div>
              <div style={{ fontFamily:FD, fontSize:"24px", fontWeight:"700", color:C.text }}>{user?.name||"Your Name"}</div>
              <div style={{ fontSize:"12px", color:C.textMuted }}>Rustenburg, North West</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"1.5rem" }}>
              {[["💝","Likes",likes.length],["💕","Matches",matches.length],["👁️","Views","47"]].map(([icon,label,val]) => (
                <div key={label} style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`1px solid ${C.border}`, borderRadius:"14px", padding:"14px", textAlign:"center" }}>
                  <div style={{ fontSize:"20px" }}>{icon}</div>
                  <div style={{ fontFamily:FD, fontSize:"24px", fontWeight:"700", color:C.rose }}>{val}</div>
                  <div style={{ fontSize:"11px", color:C.textMuted }}>{label}</div>
                </div>
              ))}
            </div>
            {!isPremium && (
              <div onClick={() => setShowPremium(true)} style={{ background:`linear-gradient(135deg, rgba(212,175,55,0.12), rgba(139,0,0,0.12))`, border:`2px solid ${C.borderGold}`, borderRadius:"18px", padding:"1.25rem", marginBottom:"1rem", cursor:"pointer" }}>
                <div style={{ fontFamily:FD, fontSize:"22px", fontWeight:"700", color:C.gold, marginBottom:"6px" }}>★ Upgrade to Premium</div>
                <div style={{ fontSize:"13px", color:C.textMuted, marginBottom:"12px", lineHeight:1.5 }}>Unlock messaging, see who liked you, boost your profile and much more.</div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontFamily:FD, fontSize:"24px", color:C.text }}>R80<span style={{ fontSize:"13px", color:C.textMuted }}>/month</span></div>
                  <div style={{ background:`linear-gradient(135deg, ${C.gold}, #9A7A10)`, borderRadius:"10px", padding:"8px 18px", color:C.dark, fontWeight:"800", fontSize:"13px" }}>Upgrade →</div>
                </div>
              </div>
            )}
            {[["✏️","Edit Profile","Update your photos and info"],["🔒","Privacy","Incognito, location visibility"],["🛡️","Safety","Block list, report history"],["🔔","Notifications","Matches, messages, likes"],["❓","Help & Support","FAQ, contact PROJO"]].map(item => (
              <div key={item[0]} style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`1px solid ${C.border}`, borderRadius:"14px", padding:"14px 16px", marginBottom:"8px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                  <span style={{ fontSize:"18px" }}>{item[0]}</span>
                  <div>
                    <div style={{ fontSize:"14px", fontWeight:"600", color:C.text }}>{item[1]}</div>
                    <div style={{ fontSize:"11px", color:C.textMuted }}>{item[2]}</div>
                  </div>
                </div>
                <span style={{ color:C.textDim }}>›</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:100, background:"rgba(13,4,24,0.97)", backdropFilter:"blur(24px)", borderTop:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-around", maxWidth:"500px", margin:"0 auto", padding:"8px 0 14px" }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ background:"none", border:"none", display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", cursor:"pointer", padding:"4px 16px", position:"relative" }}>
              <span style={{ fontSize:"24px", filter:tab===t.key?"none":"grayscale(60%) opacity(0.45)" }}>{t.icon}</span>
              <span style={{ fontSize:"10px", fontWeight:"700", color:tab===t.key?C.rose:C.textDim }}>{t.label}</span>
              {tab===t.key && <div style={{ position:"absolute", bottom:"-2px", width:"28px", height:"2px", background:`linear-gradient(90deg, ${C.crimson}, ${C.rose})`, borderRadius:"2px" }} />}
              {t.key==="matches" && matches.length>0 && <div style={{ position:"absolute", top:"2px", right:"10px", background:C.rose, borderRadius:"50%", width:"16px", height:"16px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"9px", fontWeight:"800", color:"#fff" }}>{matches.length}</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Detail Modal */}
      {showProfile && (
        <ProfileDetail
          profile={showProfile}
          onClose={() => setShowProfile(null)}
          onLike={handleLike}
          onMessage={handleMessage}
          isPremium={isPremium}
          onSuperLike={handleSuperLike}
          superLiked={superLikes.includes(showProfile.id)}
        />
      )}

      {/* Premium Modal */}
      {showPremium && (
        <PremiumModal
          onClose={() => setShowPremium(false)}
          onActivate={() => { setIsPremium(true); setShowPremium(false); toast.success("👑 Welcome to PROJO Premium! 💕"); }}
        />
      )}

      {/* Filter Modal */}
      {showFilter && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, borderRadius:"24px 24px 0 0", padding:"1.5rem", width:"100%", maxWidth:"500px", border:`1px solid ${C.border}` }}>
            <div style={{ fontFamily:FD, fontSize:"22px", fontWeight:"700", color:C.text, marginBottom:"1.25rem" }}>⚙ Filter Profiles</div>
            {[["Age range","18 – 45"],["Distance","50km"],["Gender","Women & Men"],["Goals","All relationship types"]].map(([label,val]) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:"14px", color:C.textMuted }}>{label}</span>
                <span style={{ fontSize:"14px", color:C.text, fontWeight:"600" }}>{val}</span>
              </div>
            ))}
            <button onClick={() => setShowFilter(false)} style={{ width:"100%", background:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, border:"none", borderRadius:"14px", padding:"14px", color:"#fff", fontWeight:"700", fontSize:"15px", cursor:"pointer", marginTop:"1rem" }}>Apply Filters</button>
          </div>
        </div>
      )}
    </div>
  );
}
