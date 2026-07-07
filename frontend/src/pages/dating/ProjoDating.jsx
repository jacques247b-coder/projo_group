// PROJO DATING — Premium Dating App
// Visual: NW Landscapes + Romantic Silhouettes + Heart Particles
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import { datingAPI } from "../../services/api";
import ProfileSetup from "./ProfileSetup";
import toast from "react-hot-toast";

const C = {
  crimson:"#8B0000", rose:"#E8144A", roseLight:"#FF4D7A", rosePale:"#FFB3C6",
  purple:"#2D0A4E", purpleMid:"#6B21A8", gold:"#D4AF37", goldLight:"#F5D76E",
  midnight:"#0D0418", dark:"#120820", card:"#1A0F2E", cardLight:"#231545",
  border:"rgba(232,20,74,0.2)", borderGold:"rgba(212,175,55,0.3)",
  text:"#F8F0FF", textMuted:"#A89BC2", textDim:"#6B5B8A",
};
const FD = "'Cormorant Garamond', 'Georgia', serif";
const FB = "'Inter', sans-serif";

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
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:"1.25rem" }}>
      <div style={{ background:`linear-gradient(160deg, #1A0F2E, #0D0418)`, borderRadius:"28px", padding:"1.5rem 1.5rem calc(1.5rem + env(safe-area-inset-bottom, 0px))", width:"100%", maxWidth:"620px", border:`1px solid rgba(212,175,55,0.4)`, maxHeight:"88vh", overflowY:"auto", WebkitOverflowScrolling:"touch", touchAction:"pan-y" }}>
        {/* Animated gold header */}
        <div style={{ textAlign:"center", marginBottom:"1.1rem", position:"relative" }}>
          <button onClick={onClose} aria-label="Close" style={{ position:"absolute", top:0, right:0, background:"rgba(255,255,255,0.06)", border:`1px solid ${C.border}`, borderRadius:"10px", width:"32px", height:"32px", color:C.text, fontSize:"16px", cursor:"pointer" }}>✕</button>
          <div style={{ fontSize:"44px", marginBottom:"6px" }}>👑</div>
          <div style={{ fontFamily:FD, fontSize:"26px", fontWeight:"700", background:`linear-gradient(135deg, ${C.gold}, ${C.rose}, ${C.gold})`, backgroundSize:"200%", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:"4px" }}>
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
          <div key={title} style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"10px" }}>
            <div style={{ width:"36px", height:"36px", borderRadius:"11px", background:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0, boxShadow:`0 4px 12px rgba(139,0,0,0.3)` }}>{icon}</div>
            <div>
              <div style={{ fontSize:"13.5px", fontWeight:"700", color:C.text }}>{title}</div>
              <div style={{ fontSize:"10.5px", color:C.textMuted }}>{sub}</div>
            </div>
          </div>
        ))}

        {/* Pricing */}
        <div style={{ background:`linear-gradient(135deg, rgba(212,175,55,0.1), rgba(139,0,0,0.1))`, border:`1px solid rgba(212,175,55,0.3)`, borderRadius:"16px", padding:"14px", textAlign:"center", margin:"12px 0" }}>
          <div style={{ fontSize:"11px", color:C.textMuted, marginBottom:"4px", textTransform:"uppercase", letterSpacing:"1px" }}>Monthly</div>
          <div style={{ fontFamily:FD, fontSize:"34px", fontWeight:"700", color:C.gold }}>R80<span style={{ fontSize:"15px", color:C.textMuted }}>/month</span></div>
          <div style={{ fontSize:"11px", color:C.textMuted, marginTop:"4px" }}>Cancel anytime · No hidden fees · Secure payment</div>
        </div>

        <button onClick={onActivate} style={{ width:"100%", background:`linear-gradient(135deg, ${C.gold}, #9A7A10)`, border:"none", borderRadius:"14px", padding:"15px", color:C.dark, fontWeight:"800", fontSize:"15px", cursor:"pointer", marginBottom:"10px", boxShadow:`0 8px 24px rgba(212,175,55,0.4)` }}>
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
function ProfileDetail({ profile, onClose, onLike, onMessage, isPremium, onSuperLike, superLiked, onBlock, onReport }) {
  const [rating, setRating] = useState(0);
  const [showPremium, setShowPremium] = useState(false);
  const photo = profile.photos?.[0];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.95)", zIndex:200, overflowY:"auto" }}>
      <div style={{ maxWidth:"500px", margin:"0 auto", paddingBottom:"2rem" }}>
        {/* Hero photo */}
        <div style={{ position:"relative", height:"400px", background:photo?`url(${photo}) center/cover`:`linear-gradient(135deg, ${C.purple} 0%, ${C.crimson} 50%, #3D0B2B 100%)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
          {!photo && <div style={{ fontSize:"120px", filter:"drop-shadow(0 8px 24px rgba(0,0,0,0.6))" }}>🙂</div>}

          {/* Gradient overlay */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"200px", background:"linear-gradient(transparent, rgba(13,4,24,0.98))" }} />

          {/* Back button */}
          <button onClick={onClose} style={{ position:"absolute", top:"16px", left:"16px", background:"rgba(0,0,0,0.5)", border:`1px solid ${C.border}`, borderRadius:"10px", padding:"8px 14px", color:C.text, cursor:"pointer", backdropFilter:"blur(10px)" }}>← Back</button>

          {/* Badges */}
          <div style={{ position:"absolute", top:"16px", right:"16px", display:"flex", flexDirection:"column", gap:"6px", alignItems:"flex-end" }}>
            {profile.isDemo && <div style={{ background:"rgba(107,33,168,0.9)", borderRadius:"20px", padding:"4px 12px", fontSize:"11px", fontWeight:"700", color:"#fff" }}>🧪 Test Account</div>}
            {profile.isVerified && <div style={{ background:"rgba(212,175,55,0.9)", borderRadius:"20px", padding:"4px 12px", fontSize:"11px", fontWeight:"700", color:C.dark }}>✓ Verified</div>}
            {profile.isOnline && <div style={{ background:"rgba(34,197,94,0.9)", borderRadius:"20px", padding:"4px 12px", fontSize:"11px", fontWeight:"700", color:"#fff" }}>● Online Now</div>}
          </div>

          {/* Compat */}
          <div style={{ position:"absolute", bottom:"80px", right:"16px", background:`linear-gradient(135deg, ${C.crimson}, ${C.roseLight})`, borderRadius:"50%", width:"56px", height:"56px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 16px rgba(232,20,74,0.5)` }}>
            <div style={{ fontSize:"16px", fontWeight:"800", color:"#fff", lineHeight:1 }}>{profile.compatScore}%</div>
            <div style={{ fontSize:"8px", color:"rgba(255,255,255,0.8)" }}>match</div>
          </div>

          {/* Name */}
          <div style={{ position:"absolute", bottom:"16px", left:"16px", right:"80px" }}>
            <div style={{ fontFamily:FD, fontSize:"30px", fontWeight:"700", color:"#fff", letterSpacing:"0.5px" }}>{profile.displayName}, {profile.age}</div>
            <div style={{ fontSize:"13px", color:C.rosePale }}>📍 {profile.city}{profile._distanceKm != null ? ` · ${profile._distanceKm}km` : ""}{profile.occupation ? ` · ${profile.occupation}` : ""}</div>
          </div>
        </div>

        {profile.isDemo && (
          <div style={{ background:"rgba(107,33,168,0.15)", borderTop:"1px solid rgba(107,33,168,0.35)", borderBottom:"1px solid rgba(107,33,168,0.35)", padding:"10px 1rem", fontSize:"12px", color:"#C9A3FF", textAlign:"center" }}>
            🧪 This is a test account used to preview the app — it'll be replaced automatically as real members join.
          </div>
        )}

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
            <div style={{ fontFamily:FD, fontSize:"18px", fontWeight:"700", color:C.text, marginBottom:"10px" }}>About {profile.displayName}</div>
            <p style={{ fontSize:"14px", color:C.textMuted, lineHeight:1.7, margin:0 }}>{profile.bio}</p>
          </div>

          {/* Details grid */}
          <div style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`1px solid ${C.border}`, borderRadius:"18px", padding:"1.25rem", marginBottom:"12px" }}>
            <div style={{ fontFamily:FD, fontSize:"18px", fontWeight:"700", color:C.text, marginBottom:"12px" }}>Profile Details</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
              {[["💼",profile.occupation||"—","Occupation"],["📍",profile.city,"Location"],["🎯",profile.relationshipGoals?.[0]||"—","Looking for"],["💬",profile.languages?.join(", ")||"English","Languages"],["🌟",profile.isPremium?"Premium":"Free","Member type"]].map(([icon,val,label]) => (
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
              {(profile.interests||[]).map(i => (
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
              {(profile.relationshipGoals||[]).map(g => (
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
            <button onClick={() => onBlock?.(profile)} style={{ flex:1, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"12px", padding:"10px", color:"#f87171", fontSize:"12px", cursor:"pointer" }}>🚫 Block User</button>
            <button onClick={() => onReport?.(profile)} style={{ flex:1, background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:"12px", padding:"10px", color:"#fbbf24", fontSize:"12px", cursor:"pointer" }}>⚠️ Report</button>
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
  const photo = profile.photos?.[0];
  return (
    <div onClick={() => onOpen?.(profile)} style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`1px solid ${C.border}`, borderRadius:"22px", overflow:"hidden", cursor:"pointer", boxShadow:`0 16px 48px rgba(139,0,0,0.25), 0 0 0 1px rgba(232,20,74,0.08)`, transition:"transform 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.transform="translateY(-3px)"}
      onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}>
      <div style={{ position:"relative", height:"280px", background:photo?`url(${photo}) center/cover`:`linear-gradient(135deg, ${C.purple} 0%, ${C.crimson} 100%)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {!photo && <div style={{ fontSize:"90px" }}>🙂</div>}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"140px", background:"linear-gradient(transparent, rgba(13,4,24,0.97))" }} />
        <div style={{ position:"absolute", top:"10px", left:"10px", display:"flex", gap:"5px" }}>
          {profile.isDemo && <div style={{ background:"rgba(107,33,168,0.85)", borderRadius:"20px", padding:"3px 9px", fontSize:"9px", fontWeight:"700", color:"#fff" }}>🧪 TEST</div>}
          {profile.isVerified && <div style={{ background:"rgba(212,175,55,0.92)", borderRadius:"20px", padding:"3px 9px", fontSize:"10px", fontWeight:"700", color:C.dark }}>✓</div>}
          {profile.isOnline && <div style={{ background:"rgba(34,197,94,0.9)", borderRadius:"20px", padding:"3px 9px", fontSize:"10px", fontWeight:"700", color:"#fff" }}>●</div>}
          {profile.isPremium && <div style={{ background:`linear-gradient(135deg, ${C.gold}, #B8960C)`, borderRadius:"20px", padding:"3px 9px", fontSize:"10px", fontWeight:"700", color:C.dark }}>★</div>}
        </div>
        <div style={{ position:"absolute", top:"10px", right:"10px", background:`linear-gradient(135deg, ${C.crimson}, ${C.roseLight})`, borderRadius:"50%", width:"44px", height:"44px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <div style={{ fontSize:"13px", fontWeight:"800", color:"#fff", lineHeight:1 }}>{profile.compatScore}%</div>
          <div style={{ fontSize:"7px", color:"rgba(255,255,255,0.8)" }}>match</div>
        </div>
        <div style={{ position:"absolute", bottom:"12px", left:"14px", right:"14px" }}>
          <div style={{ fontFamily:FD, fontSize:"22px", fontWeight:"700", color:"#fff" }}>{profile.displayName}, {profile.age}</div>
          <div style={{ fontSize:"11px", color:C.rosePale }}>📍 {profile.city}{profile._distanceKm != null ? ` · ${profile._distanceKm}km` : ""}</div>
        </div>
      </div>
      <div style={{ padding:"14px" }}>
        <p style={{ fontSize:"12px", color:C.textMuted, lineHeight:1.5, margin:"0 0 10px" }}>{(profile.bio||"").slice(0,85)}{profile.bio?.length > 85 ? "..." : ""}</p>
        <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginBottom:"12px" }}>
          {(profile.interests||[]).slice(0,3).map(i => <span key={i} style={{ background:"rgba(107,33,168,0.25)", border:"1px solid rgba(107,33,168,0.4)", borderRadius:"20px", padding:"2px 9px", fontSize:"10px", color:C.rosePale }}>{i}</span>)}
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

// ── REPORT MODAL ──────────────────────────────────────────────
function ReportModal({ profile, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const REASONS = ["Fake profile", "Inappropriate photos", "Harassment", "Scam / soliciting money", "Underage", "Other"];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:"1.25rem" }}>
      <div style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, borderRadius:"24px", padding:"1.5rem", width:"100%", maxWidth:"500px", border:`1px solid ${C.border}`, maxHeight:"85vh", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
        <div style={{ fontFamily:FD, fontSize:"20px", fontWeight:"700", color:C.text, marginBottom:"4px" }}>Report {profile.displayName}</div>
        <div style={{ fontSize:"12px", color:C.textMuted, marginBottom:"1rem" }}>Our team reviews every report.</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"1rem" }}>
          {REASONS.map(r => (
            <div key={r} onClick={() => setReason(r)} style={{ padding:"10px 14px", borderRadius:"10px", cursor:"pointer", border:`1px solid ${reason===r?C.rose:C.border}`, background:reason===r?"rgba(232,20,74,0.12)":"transparent", fontSize:"13px", color:reason===r?C.roseLight:C.textMuted }}>{r}</div>
          ))}
        </div>
        <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Additional details (optional)" rows={3} style={{ width:"100%", padding:"10px", borderRadius:"10px", background:C.cardLight, border:`1px solid ${C.border}`, color:C.text, fontSize:"13px", marginBottom:"1rem", fontFamily:FB, resize:"vertical" }} />
        <div style={{ display:"flex", gap:"10px" }}>
          <button onClick={onClose} style={{ flex:1, padding:"12px", borderRadius:"12px", background:"none", border:`1px solid ${C.border}`, color:C.textMuted }}>Cancel</button>
          <button onClick={() => reason ? onSubmit(reason, details) : toast.error("Pick a reason")} style={{ flex:1, padding:"12px", borderRadius:"12px", background:"rgba(245,158,11,0.15)", border:"1px solid rgba(245,158,11,0.4)", color:"#fbbf24", fontWeight:"700" }}>Submit Report</button>
        </div>
      </div>
    </div>
  );
}

// ── VERIFY MODAL ──────────────────────────────────────────────
function VerifyModal({ onClose, onSubmit }) {
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  }
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:"1.25rem" }}>
      <div style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, borderRadius:"24px", padding:"1.5rem", width:"100%", maxWidth:"500px", border:`1px solid ${C.borderGold}`, maxHeight:"85vh", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
        <div style={{ fontFamily:FD, fontSize:"20px", fontWeight:"700", color:C.gold, marginBottom:"4px" }}>✓ Get Verified</div>
        <div style={{ fontSize:"12px", color:C.textMuted, marginBottom:"1rem" }}>Upload a clear selfie. Our team reviews it and adds the verified badge to your profile.</div>
        <label style={{ aspectRatio:"1", maxWidth:"200px", margin:"0 auto 1rem", borderRadius:"16px", border:`1.5px dashed ${C.borderGold}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", overflow:"hidden" }}>
          <input type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />
          {preview ? <img src={preview} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ color:C.textDim, fontSize:"13px" }}>Tap to upload selfie</span>}
        </label>
        <div style={{ display:"flex", gap:"10px" }}>
          <button onClick={onClose} style={{ flex:1, padding:"12px", borderRadius:"12px", background:"none", border:`1px solid ${C.border}`, color:C.textMuted }}>Cancel</button>
          <button disabled={!preview || submitting} onClick={async () => { setSubmitting(true); await onSubmit(preview); setSubmitting(false); }} style={{ flex:1, padding:"12px", borderRadius:"12px", background:`linear-gradient(135deg, ${C.gold}, #9A7A10)`, border:"none", color:C.dark, fontWeight:"800" }}>
            {submitting ? "Submitting…" : "Submit for Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── BLOCKED LIST MODAL ────────────────────────────────────────
// ── WELCOME / INFO MODAL (non-Premium members, shown each sign-in) ──
function WelcomeInfoModal({ onClose, onUpgrade }) {
  const canDo = [
    ["💫", "Browse & discover profiles near you"],
    ["♥", "Like up to 20 profiles a day"],
    ["💝", "Match when someone likes you back"],
    ["👥", "Join the anonymous Dating Lounge chat"],
    ["⭐", "Rate profiles to improve your matches"],
  ];
  const cannotDo = [
    ["💬", "Message your matches"],
    ["👁️", "See who already liked you"],
    ["⭐", "Send Super Likes"],
    ["🚀", "Boost your profile's visibility"],
    ["🔒", "Browse privately in Incognito Mode"],
  ];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:600, display:"flex", alignItems:"center", justifyContent:"center", padding:"1.25rem" }}>
      <div style={{ background:`linear-gradient(160deg, #1A0F2E, #0D0418)`, borderRadius:"24px", padding:"1.5rem", width:"100%", maxWidth:"560px", border:`1px solid ${C.border}`, maxHeight:"85vh", overflowY:"auto", WebkitOverflowScrolling:"touch", position:"relative" }}>
        <button onClick={onClose} aria-label="Close" style={{ position:"absolute", top:"1.25rem", right:"1.25rem", background:"rgba(255,255,255,0.06)", border:`1px solid ${C.border}`, borderRadius:"10px", width:"32px", height:"32px", color:C.text, fontSize:"16px", cursor:"pointer" }}>✕</button>

        <div style={{ fontFamily:FD, fontSize:"22px", fontWeight:"700", color:C.text, marginBottom:"4px", paddingRight:"2.5rem" }}>Welcome to PROJO Dating 💕</div>
        <div style={{ fontSize:"12.5px", color:C.textMuted, marginBottom:"1.1rem" }}>Here's what you can do on a free account — and what Premium unlocks.</div>

        <div style={{ fontSize:"12px", fontWeight:"700", color:"#4ADE80", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"8px" }}>✓ You can</div>
        {canDo.map(([icon, text]) => (
          <div key={text} style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }}>
            <span style={{ fontSize:"15px", width:"22px", textAlign:"center" }}>{icon}</span>
            <span style={{ fontSize:"13px", color:C.text }}>{text}</span>
          </div>
        ))}

        <div style={{ fontSize:"12px", fontWeight:"700", color:"#F87171", textTransform:"uppercase", letterSpacing:"0.5px", margin:"14px 0 8px" }}>✕ Free accounts can't</div>
        {cannotDo.map(([icon, text]) => (
          <div key={text} style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }}>
            <span style={{ fontSize:"15px", width:"22px", textAlign:"center", opacity:0.6 }}>{icon}</span>
            <span style={{ fontSize:"13px", color:C.textMuted }}>{text}</span>
          </div>
        ))}

        <div style={{ background:`linear-gradient(135deg, rgba(212,175,55,0.12), rgba(139,0,0,0.12))`, border:`1px solid ${C.borderGold}`, borderRadius:"14px", padding:"12px 14px", margin:"14px 0" }}>
          <div style={{ fontSize:"13px", fontWeight:"700", color:C.gold, marginBottom:"2px" }}>👑 Go Premium — R80/month</div>
          <div style={{ fontSize:"11.5px", color:C.textMuted }}>Unlock everything above. Cancel anytime.</div>
        </div>

        <div style={{ display:"flex", gap:"10px" }}>
          <button onClick={onClose} style={{ flex:1, padding:"13px", borderRadius:"14px", background:"none", border:`1px solid ${C.border}`, color:C.textMuted, fontSize:"14px", cursor:"pointer" }}>Maybe later</button>
          <button onClick={onUpgrade} style={{ flex:1, padding:"13px", borderRadius:"14px", background:`linear-gradient(135deg, ${C.gold}, #9A7A10)`, border:"none", color:C.dark, fontWeight:"800", fontSize:"14px", cursor:"pointer" }}>See Premium</button>
        </div>
      </div>
    </div>
  );
}

function BlockedListModal({ blocked, onUnblock, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:"1.25rem" }}>
      <div style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, borderRadius:"24px", padding:"1.5rem", width:"100%", maxWidth:"500px", border:`1px solid ${C.border}`, maxHeight:"75vh", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
        <div style={{ fontFamily:FD, fontSize:"20px", fontWeight:"700", color:C.text, marginBottom:"1rem" }}>🚫 Blocked Users</div>
        {blocked.length === 0 ? (
          <div style={{ color:C.textDim, textAlign:"center", padding:"2rem 0", fontSize:"13px" }}>No one blocked.</div>
        ) : blocked.map(p => (
          <div key={p.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
            <span style={{ fontSize:"13px", color:C.text }}>{p.displayName}, {p.age}</span>
            <button onClick={() => onUnblock(p.id)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:"8px", padding:"5px 12px", color:C.roseLight, fontSize:"12px", cursor:"pointer" }}>Unblock</button>
          </div>
        ))}
        <button onClick={onClose} style={{ width:"100%", marginTop:"1rem", padding:"12px", borderRadius:"12px", background:"none", border:`1px solid ${C.border}`, color:C.textMuted }}>Close</button>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────
export default function ProjoDating() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Profile / onboarding state ──
  const [myProfile, setMyProfile] = useState(null);
  const [usage, setUsage] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // ── App state ──
  const [tab, setTab] = useState("discover");
  const [showProfile, setShowProfile] = useState(null);
  const [showPremium, setShowPremium] = useState(false);
  const [discoverProfiles, setDiscoverProfiles] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [likedMe, setLikedMe] = useState({ count: 0, profiles: [], premiumRequired: true });
  const [messages, setMessages] = useState({});
  const [msgInput, setMsgInput] = useState("");
  const [activeMatch, setActiveMatch] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({ ageMin: 18, ageMax: 60, maxDistanceKm: "" });
  const [typingMatchId, setTypingMatchId] = useState(null);
  const [superLikedIds, setSuperLikedIds] = useState(new Set());
  const [showWelcomeInfo, setShowWelcomeInfo] = useState(false);
  const [showReport, setShowReport] = useState(null);
  const [showVerify, setShowVerify] = useState(false);
  const [showBlockedList, setShowBlockedList] = useState(false);
  const [blockedProfiles, setBlockedProfiles] = useState([]);
  const [verifyStatus, setVerifyStatus] = useState(null);

  const socketRef = useRef(null);
  const isPremium = !!myProfile?.isPremium;

  // Lock background scrolling whenever any modal/bottom-sheet is open —
  // otherwise on some mobile browsers a touch-scroll gesture can scroll the
  // page behind the modal instead of the modal's own content, making
  // buttons near the bottom of a modal seem unreachable.
  useEffect(() => {
    const anyModalOpen = !!(showProfile || showPremium || showFilter || showReport || showVerify || showBlockedList || showWelcomeInfo);
    document.body.style.overflow = anyModalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showProfile, showPremium, showFilter, showReport, showVerify, showBlockedList, showWelcomeInfo]);

  // ── Load my profile on mount ──
  useEffect(() => {
    (async () => {
      setProfileLoading(true);
      try {
        const res = await datingAPI.getMe();
        setMyProfile(res.profile);
        setUsage(res.usage);
      } catch (e) {
        toast.error("Couldn't load your dating profile");
      } finally {
        setProfileLoading(false);
      }
    })();
  }, []);

  // ── Once we have a profile: connect socket, load discover/matches/liked-me ──
  useEffect(() => {
    if (!myProfile) return;
    loadDiscover();
    loadMatches();
    loadLikedMe();
    if (!myProfile.isPremium) setShowWelcomeInfo(true);

    const sock = io(process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000", { transports: ["websocket"] });
    socketRef.current = sock;
    sock.emit("dating:join", { profileId: myProfile.id });

    sock.on("dating:new_message", (message) => {
      setMessages(prev => ({ ...prev, [message.matchId]: [...(prev[message.matchId] || []), message] }));
      loadMatches();
    });
    sock.on("dating:new_match", () => {
      toast.custom(() => (
        <div style={{ background:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, borderRadius:"20px", padding:"20px 28px", textAlign:"center", boxShadow:"0 20px 60px rgba(139,0,0,0.6)" }}>
          <div style={{ fontSize:"40px", marginBottom:"6px" }}>💝</div>
          <div style={{ fontFamily:FD, fontSize:"22px", fontWeight:"700", color:"#fff" }}>It's a Match!</div>
          <div style={{ fontSize:"12px", color:C.rosePale, marginTop:"4px" }}>Someone liked you back 💕</div>
        </div>
      ), { duration: 4000 });
      loadMatches();
    });
    sock.on("dating:super_liked", () => {
      toast("⭐ Someone Super Liked you!", { duration: 3500 });
      loadLikedMe();
    });
    sock.on("dating:user_typing", ({ matchId }) => {
      setTypingMatchId(matchId);
      setTimeout(() => setTypingMatchId(t => (t === matchId ? null : t)), 3000);
    });

    return () => { sock.emit("dating:leave", { profileId: myProfile.id }); sock.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myProfile?.id]);

  async function refreshMyProfile() {
    try {
      const res = await datingAPI.getMe();
      setMyProfile(res.profile);
      setUsage(res.usage);
    } catch {}
  }

  async function loadDiscover(customFilters = filters) {
    setDiscoverLoading(true);
    try {
      const params = { ageMin: customFilters.ageMin, ageMax: customFilters.ageMax };
      if (customFilters.maxDistanceKm) params.maxDistanceKm = customFilters.maxDistanceKm;
      const res = await datingAPI.getProfiles(params);
      setDiscoverProfiles(res.profiles || []);
    } catch (e) {
      toast.error("Couldn't load profiles");
    } finally {
      setDiscoverLoading(false);
    }
  }

  async function loadMatches() {
    try {
      const res = await datingAPI.getMatches();
      setMatches(res.matches || []);
    } catch {}
  }

  async function loadLikedMe() {
    try {
      const res = await datingAPI.getLikedMe();
      setLikedMe(res);
    } catch {}
  }

  function otherProfileInMatch(match) {
    return match.profile1Id === myProfile.id ? match.profile2 : match.profile1;
  }

  // ── Like / Pass / Super Like / Undo ──
  async function handleLike(profile, isSuperLike = false) {
    try {
      const res = await datingAPI.like(profile.id, isSuperLike);
      if (isSuperLike) setSuperLikedIds(prev => new Set(prev).add(profile.id));
      setDiscoverProfiles(prev => prev.filter(p => p.id !== profile.id));
      setShowProfile(null);
      if (res.matched) {
        toast.custom(() => (
          <div style={{ background: isSuperLike ? `linear-gradient(135deg, ${C.gold}, #9A7A10)` : `linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, borderRadius:"20px", padding:"20px 28px", textAlign:"center", boxShadow:"0 20px 60px rgba(139,0,0,0.6)" }}>
            <div style={{ fontSize:"40px", marginBottom:"6px" }}>{isSuperLike ? "⭐" : "💝"}</div>
            <div style={{ fontFamily:FD, fontSize:"22px", fontWeight:"700", color: isSuperLike ? C.dark : "#fff" }}>It's a Match!</div>
            <div style={{ fontSize:"12px", color: isSuperLike ? C.dark : C.rosePale, marginTop:"4px" }}>You and {profile.displayName} liked each other 💕</div>
          </div>
        ), { duration: 4000 });
        loadMatches();
      } else if (isSuperLike) {
        toast.success(`⭐ Super Like sent to ${profile.displayName}!`);
      }
      refreshMyProfile();
    } catch (e) {
      if (e.error?.includes("Premium")) { setShowPremium(true); return; }
      toast.error(e.error || "Something went wrong");
    }
  }

  async function handleSuperLike(profile) {
    if (superLikedIds.has(profile.id)) return; // already sent, star should be disabled anyway
    if (!isPremium) { setShowPremium(true); return; }
    if ((usage?.superLikesUsedToday || 0) >= (usage?.superLikesLimit || 0)) {
      toast.error(`You've used all ${usage?.superLikesLimit} Super Likes for today — more tomorrow!`);
      return;
    }
    handleLike(profile, true);
  }

  async function handlePass(profile) {
    try {
      await datingAPI.pass(profile.id);
      setDiscoverProfiles(prev => prev.filter(p => p.id !== profile.id));
    } catch (e) {
      toast.error("Something went wrong");
    }
  }

  async function handleUndo() {
    try {
      const res = await datingAPI.undoPass();
      if (res.profile) {
        setDiscoverProfiles(prev => [res.profile, ...prev]);
        toast.success(`Brought back ${res.profile.displayName}`);
      }
    } catch (e) {
      if (e.error?.includes("Premium")) { setShowPremium(true); return; }
      toast.error(e.error || "Nothing to undo");
    }
  }

  // ── Messaging ──
  function openMatch(match) {
    setActiveMatch(match);
    setTab("messages");
    if (!messages[match.id]) {
      datingAPI.getMessages(match.id).then(res => {
        setMessages(prev => ({ ...prev, [match.id]: res.messages }));
      }).catch(() => {});
    }
  }

  async function sendMsg(matchId) {
    if (!msgInput.trim()) return;
    if (!isPremium) { setShowPremium(true); return; }
    const content = msgInput;
    setMsgInput("");
    try {
      const res = await datingAPI.sendMessage({ matchId, content });
      setMessages(prev => ({ ...prev, [matchId]: [...(prev[matchId] || []), res.message] }));
    } catch (e) {
      toast.error(e.error || "Couldn't send message");
    }
  }

  function handleTyping(matchId) {
    if (!socketRef.current || !activeMatch) return;
    const other = otherProfileInMatch(activeMatch);
    socketRef.current.emit("dating:typing", { matchId, toProfileId: other.id });
  }

  function icebreakers(match) {
    const other = otherProfileInMatch(match);
    const shared = (myProfile.interests || []).filter(i => (other.interests || []).includes(i));
    const opener = shared.length
      ? `I see we both love ${shared[0]} — what got you into it?`
      : `Hey ${other.displayName}! What's been the highlight of your week?`;
    return [opener, `What are you looking for on here?`, `Coffee or something stronger? ☕🍷`];
  }

  // ── Boost / Incognito ──
  async function handleBoost() {
    try {
      await datingAPI.activateBoost();
      toast.success("🚀 Boost activated for 30 minutes!");
      refreshMyProfile();
    } catch (e) {
      if (e.error?.includes("Premium")) { setShowPremium(true); return; }
      toast.error(e.error || "Couldn't activate Boost");
    }
  }

  async function handleToggleIncognito() {
    try {
      await datingAPI.setIncognito(!myProfile.isIncognito);
      toast.success(myProfile.isIncognito ? "Incognito Mode off" : "Incognito Mode on — you're browsing privately");
      refreshMyProfile();
    } catch (e) {
      if (e.error?.includes("Premium")) { setShowPremium(true); return; }
      toast.error(e.error || "Couldn't update");
    }
  }

  // ── Block / Report ──
  async function handleBlock(profile) {
    try {
      await datingAPI.block(profile.id);
      toast.success(`${profile.displayName} blocked`);
      setShowProfile(null);
      setDiscoverProfiles(prev => prev.filter(p => p.id !== profile.id));
    } catch (e) {
      toast.error("Couldn't block user");
    }
  }

  async function handleReportSubmit(reason, details) {
    try {
      await datingAPI.report({ reportedId: showReport.id, reason, details });
      toast.success("Report submitted — thank you");
      setShowReport(null);
    } catch (e) {
      toast.error("Couldn't submit report");
    }
  }

  async function openBlockedList() {
    try {
      const res = await datingAPI.getBlocked();
      setBlockedProfiles(res.blocked || []);
      setShowBlockedList(true);
    } catch { toast.error("Couldn't load blocked list"); }
  }

  async function handleUnblock(profileId) {
    try {
      await datingAPI.unblock(profileId);
      setBlockedProfiles(prev => prev.filter(p => p.id !== profileId));
      toast.success("Unblocked");
    } catch { toast.error("Couldn't unblock"); }
  }

  // ── Verification ──
  useEffect(() => {
    if (myProfile) datingAPI.getVerificationStatus().then(setVerifyStatus).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myProfile?.isVerified]);

  async function handleVerifySubmit(selfieDataUrl) {
    try {
      await datingAPI.requestVerification(selfieDataUrl);
      toast.success("Submitted! We'll review it shortly.");
      setShowVerify(false);
      datingAPI.getVerificationStatus().then(setVerifyStatus).catch(() => {});
    } catch (e) {
      toast.error(e.error || "Couldn't submit verification");
    }
  }

  function applyFilters() {
    setShowFilter(false);
    loadDiscover(filters);
  }

  const tabs = [
    { key:"discover", icon:"💫", label:"Discover" },
    { key:"matches",  icon:"💝", label:"Matches" },
    { key:"messages", icon:"💬", label:"Messages" },
    { key:"profile",  icon:"👤", label:"Profile" },
  ];

  // ── Loading / onboarding gates ──
  if (profileLoading) {
    return (
      <div style={{ minHeight:"100vh", background:C.midnight, display:"flex", alignItems:"center", justifyContent:"center", color:C.textMuted, fontFamily:FB }}>
        Loading PROJO Dating…
      </div>
    );
  }

  if (!myProfile || showEditProfile) {
    return (
      <ProfileSetup
        C={C} FD={FD} FB={FB}
        existingProfile={myProfile}
        currentUserName={user?.name}
        onCancel={myProfile ? () => setShowEditProfile(false) : undefined}
        onSaved={async () => {
          setShowEditProfile(false);
          await refreshMyProfile();
        }}
      />
    );
  }

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
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:"4px" }}>
              <div style={{ fontFamily:FD, fontSize:"26px", fontWeight:"700", color:C.text }}>Find Your Match 💕</div>
              {isPremium && <button onClick={handleUndo} style={{ background:"rgba(212,175,55,0.1)", border:`1px solid ${C.borderGold}`, borderRadius:"10px", padding:"6px 10px", color:C.goldLight, fontSize:"11px", fontWeight:"700", cursor:"pointer" }}>↩ Rewind</button>}
            </div>
            <div style={{ fontSize:"12px", color:C.textMuted, marginBottom:"1rem" }}>
              {myProfile.city} & surrounds
              {!isPremium && usage && <span> · {Math.max(0, (usage.likesLimit||0) - (usage.likesUsedToday||0))} likes left today</span>}
            </div>
            {myProfile.boostActive && myProfile.boostExpiry && new Date(myProfile.boostExpiry) > new Date() && (
              <div style={{ background:"rgba(212,175,55,0.12)", border:`1px solid ${C.borderGold}`, borderRadius:"12px", padding:"8px 14px", fontSize:"12px", color:C.goldLight, marginBottom:"1rem" }}>
                🚀 Boost active — you're being shown to more people right now
              </div>
            )}
            {discoverLoading ? (
              <div style={{ textAlign:"center", color:C.textDim, padding:"3rem 0" }}>Finding people near you…</div>
            ) : discoverProfiles.length === 0 ? (
              <div style={{ textAlign:"center", padding:"4rem 1.5rem" }}>
                <div style={{ fontSize:"56px", marginBottom:"12px" }}>🔍</div>
                <div style={{ fontFamily:FD, fontSize:"20px", color:C.text, marginBottom:"6px" }}>No more profiles right now</div>
                <div style={{ color:C.textMuted, fontSize:"13px" }}>Check back later, or widen your filters.</div>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                {discoverProfiles.map(p => (
                  <ProfileCard key={p.id} profile={p} onLike={(pr) => handleLike(pr, false)} onPass={handlePass} onOpen={setShowProfile} onSuperLike={handleSuperLike} superLiked={superLikedIds.has(p.id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MATCHES ── */}
        {tab === "matches" && (
          <div>
            <div style={{ fontFamily:FD, fontSize:"26px", fontWeight:"700", color:C.text, marginBottom:"4px" }}>Matches 💝</div>
            <div style={{ fontSize:"12px", color:C.textMuted, marginBottom:"1rem" }}>{matches.length} mutual connections</div>

            {/* Who Liked Me */}
            <div onClick={() => !isPremium && setShowPremium(true)} style={{ background:`linear-gradient(135deg, rgba(212,175,55,0.12), rgba(139,0,0,0.12))`, border:`1px solid ${C.borderGold}`, borderRadius:"16px", padding:"14px", marginBottom:"1.25rem", cursor: isPremium ? "default" : "pointer" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:"700", color:C.gold, fontSize:"14px" }}>💌 Liked You ({likedMe.count})</div>
                  <div style={{ fontSize:"11px", color:C.textMuted, marginTop:"2px" }}>{isPremium ? "See who's interested" : "Upgrade to see who liked you"}</div>
                </div>
                {!isPremium && <span style={{ fontSize:"18px" }}>🔒</span>}
              </div>
              {likedMe.profiles?.length > 0 && (
                <div style={{ display:"flex", gap:"8px", marginTop:"10px", overflowX:"auto" }}>
                  {likedMe.profiles.slice(0,6).map((p,i) => (
                    <div key={p.id||i} style={{ width:"52px", height:"52px", borderRadius:"50%", flexShrink:0, background: p.blurred ? `linear-gradient(135deg, ${C.purple}, ${C.crimson})` : (p.photos?.[0] ? `url(${p.photos[0]}) center/cover` : `linear-gradient(135deg, ${C.purple}, ${C.crimson})`), filter: p.blurred ? "blur(4px)" : "none", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", border:`2px solid ${C.borderGold}` }}>
                      {!p.blurred && !p.photos?.[0] && "🙂"}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {matches.length === 0 ? (
              <div style={{ textAlign:"center", padding:"4rem 2rem" }}>
                <div style={{ fontSize:"64px", marginBottom:"16px" }}>💕</div>
                <div style={{ fontFamily:FD, fontSize:"24px", color:C.text, marginBottom:"8px" }}>No matches yet</div>
                <div style={{ color:C.textMuted, marginBottom:"24px" }}>Keep liking profiles to find your match</div>
                <button onClick={() => setTab("discover")} style={{ background:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, border:"none", borderRadius:"14px", padding:"14px 28px", color:"#fff", fontWeight:"700", cursor:"pointer" }}>Discover People 💫</button>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                {matches.map(m => {
                  const p = otherProfileInMatch(m);
                  const photo = p.photos?.[0];
                  return (
                    <div key={m.id} style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`2px solid rgba(232,20,74,0.35)`, borderRadius:"18px", overflow:"hidden", cursor:"pointer" }} onClick={() => openMatch(m)}>
                      <div style={{ height:"150px", background:photo?`url(${photo}) center/cover`:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"64px", position:"relative" }}>
                        {!photo && "🙂"}
                        <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent, rgba(13,4,24,0.9))", padding:"8px 10px" }}>
                          <div style={{ fontFamily:FD, fontSize:"16px", fontWeight:"700", color:"#fff" }}>{p.displayName}, {p.age}</div>
                        </div>
                      </div>
                      <div style={{ padding:"10px" }}>
                        <button style={{ width:"100%", background:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, border:"none", borderRadius:"10px", padding:"9px", color:"#fff", fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>💬 Message</button>
                      </div>
                    </div>
                  );
                })}
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
            ) : matches.map(m => {
              const p = otherProfileInMatch(m);
              const msgList = messages[m.id] || [];
              const isOpen = activeMatch?.id === m.id;
              return (
                <div key={m.id} style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`1px solid ${isOpen?C.rose:C.border}`, borderRadius:"18px", padding:"1rem", marginBottom:"12px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"12px", cursor:"pointer" }} onClick={() => isOpen ? setActiveMatch(null) : openMatch(m)}>
                    <div style={{ width:"48px", height:"48px", borderRadius:"50%", background:p.photos?.[0]?`url(${p.photos[0]}) center/cover`:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px", flexShrink:0, border:`2px solid ${C.rose}` }}>{!p.photos?.[0] && "🙂"}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:FD, fontSize:"17px", fontWeight:"700", color:C.text }}>{p.displayName}</div>
                      <div style={{ fontSize:"11px", color:p.isOnline?"#22c55e":C.textDim }}>
                        {typingMatchId === m.id ? "typing…" : p.isOnline ? "● Online" : "Last seen recently"}
                      </div>
                    </div>
                    <span style={{ color:C.textDim }}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                  {isOpen && (
                    <>
                      <div style={{ background:"rgba(0,0,0,0.35)", borderRadius:"12px", padding:"12px", minHeight:"100px", marginBottom:"10px", maxHeight:"220px", overflowY:"auto" }}>
                        {msgList.length === 0 ? (
                          <div>
                            <div style={{ color:C.textDim, fontSize:"13px", textAlign:"center", padding:"1rem 0 1.25rem" }}>
                              💕 You matched with {p.displayName}!<br/>
                              <span style={{ fontSize:"11px" }}>{isPremium?"Send a message to get started":"Upgrade to Premium to start chatting"}</span>
                            </div>
                            {isPremium && (
                              <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                                {icebreakers(m).map((ice, i) => (
                                  <button key={i} onClick={() => setMsgInput(ice)} style={{ textAlign:"left", background:"rgba(232,20,74,0.1)", border:`1px solid ${C.border}`, borderRadius:"10px", padding:"8px 10px", color:C.rosePale, fontSize:"12px", cursor:"pointer" }}>💡 {ice}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : msgList.map((msg) => {
                          const isMine = msg.fromId === myProfile.id;
                          return (
                            <div key={msg.id} style={{ marginBottom:"8px", textAlign:isMine?"right":"left" }}>
                              <span style={{ background:isMine?`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`:"rgba(255,255,255,0.1)", borderRadius:"14px", padding:"8px 14px", fontSize:"13px", color:"#fff", display:"inline-block", maxWidth:"80%" }}>{msg.content}</span>
                              <div style={{ fontSize:"9px", color:C.textDim, marginTop:"2px" }}>
                                {new Date(msg.createdAt).toLocaleTimeString("en-ZA",{hour:"2-digit",minute:"2-digit"})}
                                {isMine && (msg.isRead ? " · Read" : " · Sent")}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display:"flex", gap:"8px" }}>
                        <input value={msgInput} onChange={e => { setMsgInput(e.target.value); handleTyping(m.id); }}
                          onKeyDown={e => e.key==="Enter" && sendMsg(m.id)}
                          placeholder={isPremium?"Type a message... 💕":"Premium required to message"}
                          style={{ flex:1, background:"rgba(255,255,255,0.07)", border:`1px solid ${C.border}`, borderRadius:"12px", color:C.text, padding:"10px 14px", fontSize:"13px", outline:"none" }} />
                        <button onClick={() => sendMsg(m.id)} style={{ background:`linear-gradient(135deg, ${C.crimson}, ${C.rose})`, border:"none", borderRadius:"12px", padding:"10px 18px", color:"#fff", fontSize:"18px", cursor:"pointer" }}>→</button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── PROFILE ── */}
        {tab === "profile" && (
          <div>
            <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
              <div style={{ width:"96px", height:"96px", borderRadius:"50%", background:myProfile.photos?.[0]?`url(${myProfile.photos[0]}) center/cover`:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"44px", margin:"0 auto 12px", border:`3px solid ${C.rose}`, boxShadow:`0 0 32px rgba(232,20,74,0.45)` }}>
                {!myProfile.photos?.[0] && (user?.name?.[0]||"👤")}
              </div>
              <div style={{ fontFamily:FD, fontSize:"24px", fontWeight:"700", color:C.text, display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
                {myProfile.displayName}, {myProfile.age} {myProfile.isVerified && <span style={{ color:C.gold, fontSize:"16px" }}>✓</span>}
              </div>
              <div style={{ fontSize:"12px", color:C.textMuted }}>{myProfile.city}</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"1.5rem" }}>
              {[["💝","Likes",myProfile.likesReceived||0],["💕","Matches",myProfile.matchCount||0],["👁️","Views",myProfile.profileViews||0]].map(([icon,label,val]) => (
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
            {isPremium && (
              <button onClick={handleBoost} style={{ width:"100%", marginBottom:"1rem", background:`linear-gradient(135deg, ${C.purpleMid}, ${C.gold})`, border:"none", borderRadius:"14px", padding:"14px", color:"#fff", fontWeight:"700", fontSize:"14px", cursor:"pointer" }}>
                🚀 {myProfile.boostActive && new Date(myProfile.boostExpiry) > new Date() ? "Boost Active" : "Activate Boost (30 min)"}
              </button>
            )}
            <div onClick={() => setShowEditProfile(true)} style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`1px solid ${C.border}`, borderRadius:"14px", padding:"14px 16px", marginBottom:"8px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                <span style={{ fontSize:"18px" }}>✏️</span>
                <div>
                  <div style={{ fontSize:"14px", fontWeight:"600", color:C.text }}>Edit Profile</div>
                  <div style={{ fontSize:"11px", color:C.textMuted }}>Update your photos and info</div>
                </div>
              </div>
              <span style={{ color:C.textDim }}>›</span>
            </div>
            <div onClick={handleToggleIncognito} style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`1px solid ${C.border}`, borderRadius:"14px", padding:"14px 16px", marginBottom:"8px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                <span style={{ fontSize:"18px" }}>🔒</span>
                <div>
                  <div style={{ fontSize:"14px", fontWeight:"600", color:C.text }}>Incognito Mode {isPremium ? "" : "(Premium)"}</div>
                  <div style={{ fontSize:"11px", color:C.textMuted }}>{myProfile.isIncognito ? "On — you're hidden from Discover" : "Browse privately"}</div>
                </div>
              </div>
              <span style={{ color: myProfile.isIncognito ? C.rose : C.textDim }}>{myProfile.isIncognito ? "●" : "○"}</span>
            </div>
            {!myProfile.isVerified && (
              <div onClick={() => setShowVerify(true)} style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`1px solid ${C.border}`, borderRadius:"14px", padding:"14px 16px", marginBottom:"8px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                  <span style={{ fontSize:"18px" }}>✓</span>
                  <div>
                    <div style={{ fontSize:"14px", fontWeight:"600", color:C.text }}>Get Verified</div>
                    <div style={{ fontSize:"11px", color:C.textMuted }}>
                      {verifyStatus?.latestRequest?.status === "PENDING" ? "Pending review" : verifyStatus?.latestRequest?.status === "REJECTED" ? "Last submission rejected — try again" : "Stand out with a verified badge"}
                    </div>
                  </div>
                </div>
                <span style={{ color:C.textDim }}>›</span>
              </div>
            )}
            <div onClick={openBlockedList} style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, border:`1px solid ${C.border}`, borderRadius:"14px", padding:"14px 16px", marginBottom:"8px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                <span style={{ fontSize:"18px" }}>🛡️</span>
                <div>
                  <div style={{ fontSize:"14px", fontWeight:"600", color:C.text }}>Safety</div>
                  <div style={{ fontSize:"11px", color:C.textMuted }}>Blocked users</div>
                </div>
              </div>
              <span style={{ color:C.textDim }}>›</span>
            </div>
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
          onLike={(pr) => handleLike(pr, false)}
          onMessage={(pr) => { const m = matches.find(mm => otherProfileInMatch(mm).id === pr.id); if (m) openMatch(m); }}
          isPremium={isPremium}
          onSuperLike={handleSuperLike}
          superLiked={superLikedIds.has(showProfile.id)}
          onBlock={handleBlock}
          onReport={setShowReport}
        />
      )}

      {/* Premium Modal */}
      {showPremium && (
        <PremiumModal
          onClose={() => setShowPremium(false)}
          onActivate={async () => {
            try {
              await datingAPI.upsertProfile({ isPremium: true });
              await refreshMyProfile();
              setShowPremium(false);
              toast.success("👑 Welcome to PROJO Premium! 💕");
            } catch { toast.error("Couldn't activate Premium"); }
          }}
        />
      )}

      {/* Report Modal */}
      {showReport && (
        <ReportModal profile={showReport} onClose={() => setShowReport(null)} onSubmit={handleReportSubmit} />
      )}

      {/* Verify Modal */}
      {showVerify && (
        <VerifyModal onClose={() => setShowVerify(false)} onSubmit={handleVerifySubmit} />
      )}

      {/* Blocked List Modal */}
      {showBlockedList && (
        <BlockedListModal blocked={blockedProfiles} onUnblock={handleUnblock} onClose={() => setShowBlockedList(false)} />
      )}

      {/* Welcome / Non-Member Info Modal */}
      {showWelcomeInfo && (
        <WelcomeInfoModal
          onClose={() => setShowWelcomeInfo(false)}
          onUpgrade={() => { setShowWelcomeInfo(false); setShowPremium(true); }}
        />
      )}

      {/* Filter Modal */}
      {showFilter && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"1.25rem" }}>
          <div style={{ background:`linear-gradient(160deg, ${C.card}, ${C.dark})`, borderRadius:"24px", padding:"1.5rem", width:"100%", maxWidth:"500px", border:`1px solid ${C.border}`, maxHeight:"85vh", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
              <div style={{ fontFamily:FD, fontSize:"22px", fontWeight:"700", color:C.text }}>⚙ Filter Profiles</div>
              <button onClick={() => setShowFilter(false)} aria-label="Close" style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${C.border}`, borderRadius:"10px", width:"32px", height:"32px", color:C.text, fontSize:"16px", cursor:"pointer" }}>✕</button>
            </div>
            <label style={{ fontSize:"12px", color:C.textMuted, display:"block", marginBottom:"6px" }}>Age range: {filters.ageMin} – {filters.ageMax}</label>
            <div style={{ display:"flex", gap:"10px", marginBottom:"1rem" }}>
              <input type="number" min="18" max="99" value={filters.ageMin} onChange={e => setFilters(f => ({...f, ageMin: e.target.value}))} style={{ flex:1, padding:"8px", borderRadius:"8px", background:C.cardLight, border:`1px solid ${C.border}`, color:C.text }} />
              <input type="number" min="18" max="99" value={filters.ageMax} onChange={e => setFilters(f => ({...f, ageMax: e.target.value}))} style={{ flex:1, padding:"8px", borderRadius:"8px", background:C.cardLight, border:`1px solid ${C.border}`, color:C.text }} />
            </div>
            <label style={{ fontSize:"12px", color:C.textMuted, display:"block", marginBottom:"6px" }}>Max distance (km) — leave blank for no limit</label>
            <input type="number" min="1" placeholder="e.g. 25" value={filters.maxDistanceKm} onChange={e => setFilters(f => ({...f, maxDistanceKm: e.target.value}))} style={{ width:"100%", padding:"10px", borderRadius:"10px", background:C.cardLight, border:`1px solid ${C.border}`, color:C.text, marginBottom:"1rem" }} />
            <button onClick={applyFilters} style={{ width:"100%", background:`linear-gradient(135deg, ${C.crimson}, ${C.purpleMid})`, border:"none", borderRadius:"14px", padding:"14px", color:"#fff", fontWeight:"700", fontSize:"15px", cursor:"pointer", marginBottom:"env(safe-area-inset-bottom, 0px)" }}>Apply Filters</button>
          </div>
        </div>
      )}
    </div>
  );
}
