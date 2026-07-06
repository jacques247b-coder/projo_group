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

// ── ROMANTIC BACKGROUND SVG ─────────────────────────────────
function RomanticBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    let frame = 0;

    // Particles
    const hearts = Array.from({ length: 30 }, () => ({
      x: Math.random() * W, y: Math.random() * H + H,
      size: Math.random() * 12 + 4, speed: Math.random() * 0.5 + 0.15,
      drift: (Math.random() - 0.5) * 0.4, opacity: Math.random() * 0.35 + 0.05,
      pulse: Math.random() * Math.PI * 2,
    }));
    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H * 0.6,
      r: Math.random() * 1.5 + 0.3, twinkle: Math.random() * Math.PI * 2,
    }));

    function drawHeart(x, y, size, alpha) {
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgba(232,20,74,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(x, y + size * 0.3);
      ctx.bezierCurveTo(x, y, x - size*0.5, y, x - size*0.5, y + size*0.3);
      ctx.bezierCurveTo(x - size*0.5, y + size*0.65, x, y + size*0.9, x, y + size);
      ctx.bezierCurveTo(x, y + size*0.9, x + size*0.5, y + size*0.65, x + size*0.5, y + size*0.3);
      ctx.bezierCurveTo(x + size*0.5, y, x, y, x, y + size*0.3);
      ctx.fill(); ctx.restore();
    }

    function drawLandscape() {
      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, H * 0.65);
      sky.addColorStop(0, "#0D0418");
      sky.addColorStop(0.3, "#1A0535");
      sky.addColorStop(0.6, "#3D0B2B");
      sky.addColorStop(1, "#6B0F1A");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      // Stars
      stars.forEach(s => {
        s.twinkle += 0.015;
        const alpha = 0.3 + Math.sin(s.twinkle) * 0.25;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,240,200,${alpha})`; ctx.fill();
      });

      // Moon
      const moonX = W * 0.82, moonY = H * 0.12;
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 50);
      moonGlow.addColorStop(0, "rgba(212,175,55,0.15)");
      moonGlow.addColorStop(1, "transparent");
      ctx.fillStyle = moonGlow;
      ctx.beginPath(); ctx.arc(moonX, moonY, 50, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(moonX, moonY, 18, 0, Math.PI*2);
      ctx.fillStyle = "#F5D76E"; ctx.fill();
      ctx.beginPath(); ctx.arc(moonX + 6, moonY - 4, 14, 0, Math.PI*2);
      ctx.fillStyle = "#2D0A4E"; ctx.fill();

      // Magalies mountains silhouette
      ctx.beginPath(); ctx.moveTo(0, H * 0.55);
      ctx.lineTo(W*0.05, H*0.35); ctx.lineTo(W*0.12, H*0.42);
      ctx.lineTo(W*0.18, H*0.28); ctx.lineTo(W*0.26, H*0.38);
      ctx.lineTo(W*0.32, H*0.22); ctx.lineTo(W*0.40, H*0.33);
      ctx.lineTo(W*0.48, H*0.18); ctx.lineTo(W*0.55, H*0.30);
      ctx.lineTo(W*0.63, H*0.20); ctx.lineTo(W*0.70, H*0.32);
      ctx.lineTo(W*0.78, H*0.15); ctx.lineTo(W*0.85, H*0.28);
      ctx.lineTo(W*0.92, H*0.22); ctx.lineTo(W, H*0.35);
      ctx.lineTo(W, H*0.55); ctx.closePath();
      const mtGrad = ctx.createLinearGradient(0, H*0.15, 0, H*0.55);
      mtGrad.addColorStop(0, "#1A0535");
      mtGrad.addColorStop(1, "#0D0418");
      ctx.fillStyle = mtGrad; ctx.fill();

      // Horizon glow
      const horizonGlow = ctx.createLinearGradient(0, H*0.48, 0, H*0.58);
      horizonGlow.addColorStop(0, "rgba(232,20,74,0.25)");
      horizonGlow.addColorStop(0.5, "rgba(212,175,55,0.12)");
      horizonGlow.addColorStop(1, "transparent");
      ctx.fillStyle = horizonGlow;
      ctx.fillRect(0, H*0.48, W, H*0.1);

      // Ground
      const ground = ctx.createLinearGradient(0, H*0.55, 0, H);
      ground.addColorStop(0, "#0D0418");
      ground.addColorStop(1, "#050210");
      ctx.fillStyle = ground; ctx.fillRect(0, H*0.55, W, H*0.45);

      // Silhouette couple - left side
      const cx1 = W * 0.22, cy = H * 0.56;
      ctx.fillStyle = "#050210";
      // Person 1 (taller)
      ctx.beginPath(); ctx.arc(cx1, cy - 42, 9, 0, Math.PI*2); ctx.fill();
      ctx.fillRect(cx1 - 5, cy - 33, 10, 28);
      ctx.beginPath(); ctx.moveTo(cx1-5, cy-5); ctx.lineTo(cx1-14, cy+18);
      ctx.lineTo(cx1-8, cy+18); ctx.lineTo(cx1, cy-5); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx1+5, cy-5); ctx.lineTo(cx1+14, cy+18);
      ctx.lineTo(cx1+8, cy+18); ctx.lineTo(cx1, cy-5); ctx.closePath(); ctx.fill();
      // Arms reaching toward person 2
      ctx.beginPath(); ctx.moveTo(cx1+5, cy-20); ctx.quadraticCurveTo(cx1+20, cy-28, cx1+30, cy-18);
      ctx.strokeStyle = "#050210"; ctx.lineWidth=7; ctx.lineCap="round"; ctx.stroke();
      // Person 2 (slightly shorter, closer)
      const cx2 = cx1 + 30;
      ctx.beginPath(); ctx.arc(cx2, cy-38, 8, 0, Math.PI*2); ctx.fill();
      ctx.fillRect(cx2-4, cy-30, 9, 24);
      ctx.beginPath(); ctx.moveTo(cx2-4, cy-6); ctx.lineTo(cx2-16, cy+18);
      ctx.lineTo(cx2-9, cy+18); ctx.lineTo(cx2, cy-6); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx2+4, cy-6); ctx.lineTo(cx2+13, cy+18);
      ctx.lineTo(cx2+8, cy+18); ctx.lineTo(cx2, cy-6); ctx.closePath(); ctx.fill();
      // Heart above couple
      const heartPulse = 0.9 + Math.sin(frame * 0.04) * 0.15;
      ctx.save(); ctx.translate(cx1+15, cy-65); ctx.scale(heartPulse, heartPulse);
      ctx.globalAlpha = 0.8;
      drawHeart(-6, -8, 12, 0.9);
      ctx.restore();

      // Silhouette couple 2 - right side (bench scene)
      const bx = W * 0.74, by = H * 0.58;
      ctx.fillStyle = "#050210";
      // Bench
      ctx.fillRect(bx - 28, by + 10, 56, 5);
      ctx.fillRect(bx - 28, by + 5, 56, 5); // back rest
      ctx.fillRect(bx - 25, by + 15, 4, 10);
      ctx.fillRect(bx + 21, by + 15, 4, 10);
      // Person 1 sitting
      ctx.beginPath(); ctx.arc(bx-10, by-18, 7, 0, Math.PI*2); ctx.fill();
      ctx.fillRect(bx-14, by-11, 9, 20);
      ctx.beginPath(); ctx.moveTo(bx-14, by+8); ctx.lineTo(bx-22, by+22);
      ctx.lineTo(bx-16, by+22); ctx.lineTo(bx-7, by+8); ctx.closePath(); ctx.fill();
      // Person 2 sitting closer
      ctx.beginPath(); ctx.arc(bx+10, by-16, 7, 0, Math.PI*2); ctx.fill();
      ctx.fillRect(bx+5, by-9, 9, 18);
      ctx.beginPath(); ctx.moveTo(bx+5, by+8); ctx.lineTo(bx-1, by+22);
      ctx.lineTo(bx+5, by+22); ctx.lineTo(bx+11, by+8); ctx.closePath(); ctx.fill();
      // Phone glow between them (texting)
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = "rgba(212,175,55,0.8)";
      ctx.fillRect(bx+4, by-5, 14, 20);
      ctx.restore();

      // Bokeh orbs
      const bokehs = [[W*0.1,H*0.4,40,"rgba(232,20,74,"],[W*0.6,H*0.25,30,"rgba(212,175,55,"],[W*0.85,H*0.5,25,"rgba(107,33,168,"],[W*0.35,H*0.6,20,"rgba(232,20,74,"]];
      bokehs.forEach(([bx,by,br,col]) => {
        const bg = ctx.createRadialGradient(bx,by,0,bx,by,br);
        const alpha = 0.04 + Math.sin(frame*0.02)*0.02;
        bg.addColorStop(0, col+alpha+")");
        bg.addColorStop(1, "transparent");
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.arc(bx,by,br,0,Math.PI*2); ctx.fill();
      });
    }

    function animate() {
      frame++;
      drawLandscape();
      hearts.forEach(p => {
        p.y -= p.speed; p.x += p.drift; p.pulse += 0.025;
        p.opacity = 0.12 + Math.sin(p.pulse) * 0.08;
        if (p.y < -40) { p.y = H + 40; p.x = Math.random() * W; }
        drawHeart(p.x, p.y, p.size, p.opacity);
      });
      requestAnimationFrame(animate);
    }
    animate();
  }, []);

  return <canvas ref={canvasRef} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }} />;
}

// ── STAR RATING ─────────────────────────────────────────────
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
          <div style={{ fontFamily:FD, fontSize:"38px", fontWeight:"700", color:C.gold }}>R99.99<span style={{ fontSize:"15px", color:C.textMuted }}>/month</span></div>
          <div style={{ fontSize:"11px", color:C.textMuted, marginTop:"4px" }}>Cancel anytime · No hidden fees · Secure payment</div>
        </div>

        <button onClick={onActivate} style={{ width:"100%", background:`linear-gradient(135deg, ${C.gold}, #9A7A10)`, border:"none", borderRadius:"14px", padding:"16px", color:C.dark, fontWeight:"800", fontSize:"16px", cursor:"pointer", marginBottom:"10px", boxShadow:`0 8px 24px rgba(212,175,55,0.4)` }}>
          👑 Activate Premium — R99.99/month
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
function ProfileDetail({ profile, onClose, onLike, onMessage, isPremium }) {
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
          <button onClick={() => toast("⭐ Super Like sent!")} style={{ width:"52px", background:`linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.1))`, border:`1px solid ${C.borderGold}`, borderRadius:"14px", color:C.gold, fontSize:"22px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>⭐</button>
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
function ProfileCard({ profile, onLike, onPass, onOpen }) {
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
          <button style={{ width:"44px", height:"44px", borderRadius:"50%", background:`linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.1))`, border:`1px solid ${C.borderGold}`, color:C.gold, fontSize:"18px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>⭐</button>
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
  const [tab, setTab] = useState("discover");
  const [showProfile, setShowProfile] = useState(null);
  const [showPremium, setShowPremium] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [likes, setLikes] = useState([]);
  const [matches, setMatches] = useState([]);
  const [messages, setMessages] = useState({});
  const [msgInput, setMsgInput] = useState("");
  const [activeMatch, setActiveMatch] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [profileRatings, setProfileRatings] = useState({});

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
          <div style={{ fontFamily:FD, fontSize:"24px", fontWeight:"700", background:`linear-gradient(135deg, ${C.rose}, ${C.gold}, ${C.rose})`, backgroundSize:"200%", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            💕 PROJO DATING
          </div>
          <div style={{ display:"flex", gap:"8px" }}>
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
                    <ProfileCard key={p.id} profile={p} onLike={handleLike} onPass={() => {}} onOpen={setShowProfile} />
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
                <div style={{ fontSize:"12px", color:C.textMuted, marginTop:"4px", marginBottom:"10px" }}>Unlock unlimited messaging for R99.99/month</div>
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
                  <div style={{ fontFamily:FD, fontSize:"24px", color:C.text }}>R99.99<span style={{ fontSize:"13px", color:C.textMuted }}>/month</span></div>
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
