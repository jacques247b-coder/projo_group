// PROJO WORLD — Full Interactive 2D Virtual World
// Realistic room backgrounds, dressable layered avatars, live chat, economy
import React, { useState, useEffect, useRef, useCallback } from "react";

// ── CONSTANTS ─────────────────────────────────────────────────
import api from "../../services/api";
import toast from "react-hot-toast";
const COINS_KEY = "projo_world_coins";
const AVATAR_KEY = "projo_world_avatar";
const HOME_KEY = "projo_world_home";

const SKIN_TONES = ["#FDBCB4","#F0C8A0","#D4956A","#C8956C","#A0674A","#8D5524","#6B3A2A","#4A2512"];
const HAIR_COLORS = ["#1a0a00","#3B1F0A","#6B3A10","#8B4513","#A0522D","#D4A017","#C0C0C0","#E0E0E0","#FF6B6B","#7B2FBE"];
const EYE_COLORS = ["#2C1810","#3D5A80","#4A7C59","#8B6914"];

const CLOTHING = {
  tops: [
    { id:"t0", label:"Gold Tee", color:"#e8b84b", type:"tee" },
    { id:"t1", label:"Red Crop", color:"#ef4444", type:"crop" },
    { id:"t2", label:"Blue Shirt", color:"#3b82f6", type:"shirt" },
    { id:"t3", label:"Green Hoodie", color:"#10b981", type:"hoodie" },
    { id:"t4", label:"Purple Vest", color:"#7c3aed", type:"vest" },
    { id:"t5", label:"Pink Top", color:"#ec4899", type:"top" },
    { id:"t6", label:"White Formal", color:"#f8fafc", type:"formal" },
    { id:"t7", label:"Black Tuxedo", color:"#0f172a", type:"tux" },
    { id:"t8", label:"Orange Print", color:"#f97316", type:"tee" },
    { id:"t9", label:"Striped Shirt", color:"#64748b", type:"stripe" },
  ],
  bottoms: [
    { id:"b0", label:"Black Jeans", color:"#1e293b" },
    { id:"b1", label:"Blue Denim", color:"#1d4ed8" },
    { id:"b2", label:"Khaki Chinos", color:"#a16207" },
    { id:"b3", label:"White Pants", color:"#e2e8f0" },
    { id:"b4", label:"Red Shorts", color:"#dc2626" },
    { id:"b5", label:"Pink Skirt", color:"#f9a8d4" },
    { id:"b6", label:"Purple Leggings", color:"#6d28d9" },
    { id:"b7", label:"Camo Pants", color:"#4d7c0f" },
  ],
  shoes: [
    { id:"s0", label:"White Sneakers", color:"#f1f5f9", accent:"#94a3b8" },
    { id:"s1", label:"Black Boots", color:"#1e293b", accent:"#475569" },
    { id:"s2", label:"Gold Heels", color:"#e8b84b", accent:"#a16207" },
    { id:"s3", label:"Red Pumps", color:"#dc2626", accent:"#991b1b" },
    { id:"s4", label:"Blue Slides", color:"#3b82f6", accent:"#1d4ed8" },
    { id:"s5", label:"Brown Loafers", color:"#92400e", accent:"#6b2d0a" },
  ],
  accessories: [
    { id:"a0", label:"None", type:"none" },
    { id:"a1", label:"Gold Chain", type:"chain", color:"#e8b84b" },
    { id:"a2", label:"Sunglasses", type:"shades", color:"#0f172a" },
    { id:"a3", label:"Cap", type:"cap", color:"#1e293b" },
    { id:"a4", label:"Beanie", type:"beanie", color:"#7c3aed" },
    { id:"a5", label:"Earrings", type:"earrings", color:"#e8b84b" },
    { id:"a6", label:"Watch", type:"watch", color:"#e8b84b" },
  ]
};

const FURNITURE = {
  living: [
    { id:"f0", label:"Leather Sofa", icon:"🛋️", price:200, x:15, y:62 },
    { id:"f1", label:"Smart TV", icon:"📺", price:350, x:42, y:55 },
    { id:"f2", label:"Coffee Table", icon:"🪑", price:120, x:30, y:72 },
    { id:"f3", label:"Floor Lamp", icon:"🪔", price:80, x:68, y:60 },
    { id:"f4", label:"Wall Art", icon:"🖼️", price:150, x:55, y:40 },
    { id:"f5", label:"House Plant", icon:"🌿", price:60, x:80, y:65 },
    { id:"f6", label:"Bookshelf", icon:"📚", price:180, x:8, y:55 },
    { id:"f7", label:"Gaming Setup", icon:"🎮", price:500, x:70, y:65 },
  ],
  bedroom: [
    { id:"b0", label:"King Bed", icon:"🛏️", price:400, x:30, y:60 },
    { id:"b1", label:"Wardrobe", icon:"🚪", price:280, x:72, y:52 },
    { id:"b2", label:"Mirror", icon:"🪞", price:100, x:8, y:52 },
    { id:"b3", label:"Bedside Lamp", icon:"💡", price:70, x:60, y:63 },
    { id:"b4", label:"Dressing Table", icon:"💄", price:220, x:80, y:60 },
  ]
};

const ROOMS = {
  home: {
    label: "Your Home",
    sublabel: "Level 1 — Starter Apartment",
    people: 0,
    bgColor: "#0f172a",
    quickChatOptions: ["Nice place!","Love the vibe","Come hang!","Check my outfit"],
    npcs: [],
  },
  club: {
    label: "PROJO Club",
    sublabel: "Hosted by DJ NightOwl • Amapiano",
    people: 18,
    bgColor: "#0d0020",
    quickChatOptions: ["This beat is FIRE 🔥","Anyone want to dance?","Love this song!","Who's the DJ?"],
    npcs: [
      { name:"Zanele", skin:"#8D5524", top:"#a78bfa", bottom:"#1e293b", hair:"#1a0a00", x:22 },
      { name:"Thabo", skin:"#4A2512", top:"#3b82f6", bottom:"#1d4ed8", hair:"#1a0a00", x:68 },
      { name:"Lerato", skin:"#C8956C", top:"#ec4899", bottom:"#f9a8d4", hair:"#8B4513", x:80 },
      { name:"DJ NightOwl", skin:"#6B3A2A", top:"#0f172a", bottom:"#1e293b", hair:"#1a0a00", x:50 },
    ]
  },
  restaurant: {
    label: "Savanna Restaurant",
    sublabel: "Fine dining • Rustenburg • Open now",
    people: 8,
    bgColor: "#1a0805",
    quickChatOptions: ["Table for two?","The food looks amazing","Anyone tried the braai platter?","Best restaurant in PROJO!"],
    npcs: [
      { name:"Chef Mosa", skin:"#8D5524", top:"#ffffff", bottom:"#1e293b", hair:"#1a0a00", x:82 },
      { name:"Sipho", skin:"#4A2512", top:"#e8b84b", bottom:"#a16207", hair:"#1a0a00", x:20 },
      { name:"Naledi", skin:"#C8956C", top:"#10b981", bottom:"#1e293b", hair:"#6B3A10", x:35 },
    ]
  },
  mall: {
    label: "PROJO Mall",
    sublabel: "Fashion • Tech • Food Court",
    people: 31,
    bgColor: "#050d1a",
    quickChatOptions: ["Found any deals?","Check out this fit!","The shoe store is amazing","Food court on level 2"],
    npcs: [
      { name:"Nomsa", skin:"#8D5524", top:"#ec4899", bottom:"#6d28d9", hair:"#8B4513", x:18 },
      { name:"Kyle", skin:"#FDBCB4", top:"#3b82f6", bottom:"#1d4ed8", hair:"#D4A017", x:60 },
      { name:"Ayanda", skin:"#6B3A2A", top:"#10b981", bottom:"#1e293b", hair:"#1a0a00", x:78 },
    ]
  },
  cinema: {
    label: "PROJO Cinema",
    sublabel: "Now showing: Mzansi Nights",
    people: 12,
    bgColor: "#050505",
    quickChatOptions: ["This movie is crazy!","Pass the popcorn 🍿","Shhh!","Amazing storyline!"],
    npcs: [
      { name:"Mpho", skin:"#8D5524", top:"#1e293b", bottom:"#1e293b", hair:"#1a0a00", x:28 },
      { name:"Rudo", skin:"#C8956C", top:"#7c3aed", bottom:"#6d28d9", hair:"#3B1F0A", x:70 },
    ]
  },
  beach: {
    label: "Virtual Beach",
    sublabel: "Clifton vibes • Sunny today",
    people: 24,
    bgColor: "#0369a1",
    quickChatOptions: ["This beach is beautiful!","The water looks amazing","Vibes are perfect","Anyone want to play volleyball?"],
    npcs: [
      { name:"Tumi", skin:"#A0674A", top:"#f97316", bottom:"#dc2626", hair:"#1a0a00", x:20 },
      { name:"Priya", skin:"#D4956A", top:"#ec4899", bottom:"#f9a8d4", hair:"#1a0a00", x:65 },
      { name:"Jabu", skin:"#4A2512", top:"#3b82f6", bottom:"#1d4ed8", hair:"#1a0a00", x:82 },
    ]
  }
};

const NPC_REPLIES = {
  Zanele: ["This beat is everything!","Love your fit babe!","We should link later!","Come dance with me!"],
  Thabo: ["What's up fam!","Nice drip!","Bro this place is lit","You new here?"],
  Lerato: ["Hey hey!","Omg your shoes are amazing","Bestie!!","We vibing tonight?"],
  "DJ NightOwl": ["Request a song!","Next drop in 2 min","Who's ready?!","Amapiano forever!"],
  "Chef Mosa": ["Tonight's special is braai platter","Table ready in 5","Enjoy your meal!","Thank you for coming!"],
  Sipho: ["The food here is insane","Try the pap and wors","Best restaurant in town","Join us?"],
  Naledi: ["Hi there!","Love your style","This place is beautiful","First time here?"],
  Nomsa: ["That top is gorgeous!","Check out the new collection","Going to the food court?","Sale on level 3!"],
  Kyle: ["Yo what's good","Cool shoes man","Did you see the new sneakers?","Gaming store has a deal"],
  Ayanda: ["Hey!","Nice to meet you","I'm loving this mall","Want to grab food?"],
  Mpho: ["Shh the movie!","This film is amazing","Pass the popcorn","Best movie ever!"],
  Rudo: ["I love this cinema","The sound is incredible","Crying at this part","10/10 recommend"],
  Tumi: ["Beach vibes only!","The water is perfect today","Volleyball later?","Best day ever"],
  Priya: ["This beach is beautiful","Love the sunset","Are you staying long?","The vibe is perfect"],
  Jabu: ["Beach king right here!","This view though 😍","Let's swim!","Summer forever"],
};

// ── SVG AVATAR RENDERER ───────────────────────────────────────
function AvatarSVG({ skin, hairColor, eyeColor, topItem, bottomItem, shoeItem, accessory, size = 1, flipped = false }) {
  const w = Math.round(60 * size), h = Math.round(100 * size);
  const s = skin || "#C8956C";
  const hc = hairColor || "#1a0a00";
  const ec = eyeColor || "#2C1810";
  const tc = topItem?.color || "#e8b84b";
  const bc = bottomItem?.color || "#1e293b";
  const sc = shoeItem?.color || "#f1f5f9";
  const sa = shoeItem?.accent || "#94a3b8";
  const tt = topItem?.type || "tee";
  const fl = flipped ? "scale(-1,1) translate(-60,0)" : "";

  return (
    <svg width={w} height={h} viewBox="0 0 60 100" style={{ display:"block" }}>
      <g transform={fl}>
        {/* Shadow */}
        <ellipse cx="30" cy="97" rx="14" ry="3" fill="rgba(0,0,0,0.2)" />
        {/* Legs */}
        <rect x="18" y="62" width="11" height="24" rx="5" fill={bc} />
        <rect x="31" y="62" width="11" height="24" rx="5" fill={bc} />
        {/* Shoes */}
        <ellipse cx="23" cy="87" rx="9" ry="5" fill={sc} />
        <ellipse cx="37" cy="87" rx="9" ry="5" fill={sc} />
        <rect x="14" y="83" width="18" height="5" rx="2" fill={sc} />
        <rect x="28" y="83" width="18" height="5" rx="2" fill={sc} />
        <rect x="14" y="83" width="18" height="3" rx="1" fill={sa} />
        <rect x="28" y="83" width="18" height="3" rx="1" fill={sa} />
        {/* Body */}
        <rect x="15" y="36" width="30" height="28" rx="8" fill={tc} />
        {/* Collar detail */}
        {tt === "shirt" && <path d="M26 36 L30 42 L34 36" fill="white" opacity="0.3" />}
        {tt === "hoodie" && <rect x="22" y="36" width="16" height="4" rx="2" fill="rgba(0,0,0,0.15)" />}
        {tt === "formal" && <>
          <rect x="27" y="36" width="6" height="28" fill="rgba(0,0,0,0.08)" />
          <circle cx="30" cy="45" r="1.5" fill="rgba(0,0,0,0.3)" />
          <circle cx="30" cy="52" r="1.5" fill="rgba(0,0,0,0.3)" />
          <circle cx="30" cy="59" r="1.5" fill="rgba(0,0,0,0.3)" />
        </>}
        {tt === "tux" && <>
          <path d="M27 36 L24 64 L30 60 L36 64 L33 36" fill="white" opacity="0.15" />
        </>}
        {/* Arms */}
        <rect x="5" y="37" width="11" height="20" rx="5" fill={tc} />
        <rect x="44" y="37" width="11" height="20" rx="5" fill={tc} />
        {/* Hands */}
        <ellipse cx="10" cy="58" rx="5" ry="5" fill={s} />
        <ellipse cx="50" cy="58" rx="5" ry="5" fill={s} />
        {/* Neck */}
        <rect x="25" y="29" width="10" height="10" rx="3" fill={s} />
        {/* Head */}
        <ellipse cx="30" cy="21" rx="15" ry="17" fill={s} />
        {/* Hair */}
        <ellipse cx="30" cy="8" rx="15" ry="8" fill={hc} />
        <rect x="15" y="8" width="30" height="10" rx="4" fill={hc} />
        <ellipse cx="15" cy="16" rx="4" ry="8" fill={hc} />
        <ellipse cx="45" cy="16" rx="4" ry="8" fill={hc} />
        {/* Eyes */}
        <ellipse cx="24" cy="20" rx="3.5" ry="4" fill="white" />
        <ellipse cx="36" cy="20" rx="3.5" ry="4" fill="white" />
        <ellipse cx="24.5" cy="20.5" rx="2.2" ry="2.8" fill={ec} />
        <ellipse cx="36.5" cy="20.5" rx="2.2" ry="2.8" fill={ec} />
        <ellipse cx="25" cy="20" rx="1" ry="1.2" fill="#0f172a" />
        <ellipse cx="37" cy="20" rx="1" ry="1.2" fill="#0f172a" />
        <ellipse cx="25.5" cy="19.5" rx="0.4" ry="0.4" fill="white" />
        <ellipse cx="37.5" cy="19.5" rx="0.4" ry="0.4" fill="white" />
        {/* Eyebrows */}
        <path d="M21 15 Q24.5 13 28 15" stroke={hc} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M32 15 Q35.5 13 39 15" stroke={hc} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Nose */}
        <path d="M29 22 Q30 25 31 22" stroke={s} strokeWidth="1.2" fill="none" strokeLinecap="round" style={{ filter:"brightness(0.8)" }} />
        <ellipse cx="29" cy="24" rx="1.2" ry="0.8" fill="rgba(0,0,0,0.1)" />
        <ellipse cx="31" cy="24" rx="1.2" ry="0.8" fill="rgba(0,0,0,0.1)" />
        {/* Mouth */}
        <path d="M25 28 Q30 32 35 28" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Accessories */}
        {accessory?.type === "shades" && <>
          <rect x="18" y="18" width="10" height="6" rx="3" fill={accessory.color} opacity="0.95" />
          <rect x="32" y="18" width="10" height="6" rx="3" fill={accessory.color} opacity="0.95" />
          <line x1="28" y1="21" x2="32" y2="21" stroke={accessory.color} strokeWidth="1.5" />
          <line x1="15" y1="21" x2="18" y2="21" stroke={accessory.color} strokeWidth="1" />
          <line x1="42" y1="21" x2="45" y2="21" stroke={accessory.color} strokeWidth="1" />
        </>}
        {accessory?.type === "cap" && <>
          <ellipse cx="30" cy="8" rx="17" ry="5" fill={accessory.color} />
          <rect x="13" y="3" width="34" height="9" rx="4" fill={accessory.color} />
          <rect x="10" y="10" width="40" height="4" rx="2" fill={accessory.color} style={{ filter:"brightness(0.8)" }} />
        </>}
        {accessory?.type === "beanie" && <>
          <ellipse cx="30" cy="7" rx="16" ry="10" fill={accessory.color} />
          <rect x="14" y="12" width="32" height="5" rx="2" fill={accessory.color} style={{ filter:"brightness(0.8)" }} />
          <circle cx="30" cy="2" r="3" fill={accessory.color} style={{ filter:"brightness(1.2)" }} />
        </>}
        {accessory?.type === "chain" && <>
          <path d="M20 36 Q30 40 40 36" stroke={accessory.color} strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="30" cy="40" r="2.5" fill={accessory.color} />
        </>}
        {accessory?.type === "earrings" && <>
          <circle cx="15" cy="22" r="2.5" fill={accessory.color} />
          <circle cx="45" cy="22" r="2.5" fill={accessory.color} />
          <line x1="15" y1="25" x2="15" y2="29" stroke={accessory.color} strokeWidth="1" />
          <line x1="45" y1="25" x2="45" y2="29" stroke={accessory.color} strokeWidth="1" />
          <circle cx="15" cy="29" r="2" fill={accessory.color} />
          <circle cx="45" cy="29" r="2" fill={accessory.color} />
        </>}
        {accessory?.type === "watch" && <>
          <rect x="5" y="53" width="8" height="5" rx="2" fill={accessory.color} />
          <rect x="5.5" y="53.5" width="7" height="4" rx="1.5" fill="#1e293b" />
          <line x1="9" y1="54.5" x2="9" y2="56.5" stroke="white" strokeWidth="0.5" />
          <line x1="9" y1="55.5" x2="11" y2="55.5" stroke="white" strokeWidth="0.5" />
        </>}
      </g>
    </svg>
  );
}

// ── ROOM BACKGROUNDS ──────────────────────────────────────────
function RoomBackground({ roomKey }) {
  const style = { position:"absolute", inset:0, overflow:"hidden" };

  if (roomKey === "home") return (
    <div style={style}>
      {/* Wall */}
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,#1e293b 0%,#1e293b 65%,#0f172a 65%)" }} />
      {/* Wall texture - wallpaper pattern */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"65%", opacity:0.05,
        backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,0.1) 40px,rgba(255,255,255,0.1) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,0.1) 40px,rgba(255,255,255,0.1) 41px)" }} />
      {/* Skirting board */}
      <div style={{ position:"absolute", top:"63%", left:0, right:0, height:"4px", background:"#475569" }} />
      {/* Floor */}
      <div style={{ position:"absolute", top:"65%", left:0, right:0, bottom:0,
        background:"repeating-linear-gradient(90deg,#7c5c3a 0px,#7c5c3a 60px,#6b4f32 60px,#6b4f32 61px,#8b6a45 61px,#8b6a45 120px,#7c5c3a 120px)" }} />
      {/* Window */}
      <div style={{ position:"absolute", top:"8%", left:"10%", width:"130px", height:"100px", background:"linear-gradient(135deg,#0369a1,#075985)", borderRadius:"4px", border:"8px solid #64748b" }}>
        <div style={{ position:"absolute", inset:0, display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px", padding:"4px" }}>
          <div style={{ background:"linear-gradient(160deg,#7dd3fc,#38bdf8)", borderRadius:"2px" }} />
          <div style={{ background:"linear-gradient(160deg,#38bdf8,#0ea5e9)", borderRadius:"2px" }} />
          <div style={{ background:"linear-gradient(160deg,#0ea5e9,#0284c7)", borderRadius:"2px" }} />
          <div style={{ background:"linear-gradient(160deg,#0284c7,#0369a1)", borderRadius:"2px" }} />
        </div>
        {/* Window sill */}
        <div style={{ position:"absolute", bottom:"-16px", left:"-4px", right:"-4px", height:"12px", background:"#94a3b8", borderRadius:"0 0 4px 4px" }} />
        {/* Curtains */}
        <div style={{ position:"absolute", top:"-8px", left:"-20px", width:"24px", height:"110px", background:"#7c3aed", borderRadius:"4px 0 0 12px", opacity:0.8 }} />
        <div style={{ position:"absolute", top:"-8px", right:"-20px", width:"24px", height:"110px", background:"#7c3aed", borderRadius:"0 4px 12px 0", opacity:0.8 }} />
        {/* Curtain rod */}
        <div style={{ position:"absolute", top:"-12px", left:"-24px", right:"-24px", height:"6px", background:"#94a3b8", borderRadius:"3px" }} />
      </div>
      {/* Painting on wall */}
      <div style={{ position:"absolute", top:"8%", right:"12%", width:"80px", height:"60px", background:"#1a0a40", border:"6px solid #a16207", borderRadius:"2px" }}>
        <div style={{ position:"absolute", inset:"6px", background:"linear-gradient(135deg,#7c3aed,#3b82f6,#10b981)" }} />
        <div style={{ position:"absolute", bottom:"-10px", left:"50%", transform:"translateX(-50%)", width:"4px", height:"10px", background:"#a16207" }} />
      </div>
      {/* TV unit */}
      <div style={{ position:"absolute", top:"35%", left:"50%", transform:"translateX(-50%)", width:"180px", height:"110px" }}>
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"20px", background:"#0f172a", borderRadius:"0 0 4px 4px" }} />
        <div style={{ position:"absolute", top:0, left:0, right:0, height:"90px", background:"#020617", borderRadius:"4px", border:"4px solid #1e293b" }}>
          <div style={{ position:"absolute", inset:"4px", background:"linear-gradient(135deg,#0f172a,#1e293b)", borderRadius:"2px", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ fontSize:"24px" }}>📺</div>
          </div>
          <div style={{ position:"absolute", bottom:"8px", right:"12px", width:"6px", height:"6px", borderRadius:"50%", background:"#ef4444" }} />
        </div>
      </div>
      {/* Sofa hint at bottom */}
      <div style={{ position:"absolute", bottom:"14%", left:"8%", width:"200px", height:"50px", background:"#1e3a5f", borderRadius:"12px 12px 4px 4px", border:"2px solid #2d5a8e" }}>
        <div style={{ position:"absolute", top:"-20px", left:0, right:0, height:"22px", background:"#1a3354", borderRadius:"12px 12px 0 0" }} />
        <div style={{ position:"absolute", top:"-24px", left:"-8px", width:"20px", height:"44px", background:"#1a3354", borderRadius:"8px" }} />
        <div style={{ position:"absolute", top:"-24px", right:"-8px", width:"20px", height:"44px", background:"#1a3354", borderRadius:"8px" }} />
        <div style={{ position:"absolute", top:"8px", left:"12px", right:"12px", height:"6px", background:"rgba(255,255,255,0.05)", borderRadius:"3px" }} />
      </div>
      {/* Rug */}
      <div style={{ position:"absolute", bottom:"13%", left:"5%", right:"5%", height:"60px", background:"rgba(124,58,237,0.12)", borderRadius:"8px", border:"2px solid rgba(124,58,237,0.15)" }}>
        <div style={{ position:"absolute", inset:"4px", borderRadius:"4px", border:"1px solid rgba(124,58,237,0.1)" }} />
      </div>
    </div>
  );

  if (roomKey === "club") return (
    <div style={style}>
      <div style={{ position:"absolute", inset:0, background:"#07001a" }} />
      {/* Ceiling lights */}
      {[8,20,32,44,56,68,80,92].map((x,i) => (
        <div key={i} style={{ position:"absolute", top:0, left:`${x}%`, width:"2px", height:`${40+i%3*15}px`, background:`rgba(${i%3===0?'168,85,247':i%3===1?'59,130,246':'16,185,129'},0.7)` }}>
          <div style={{ position:"absolute", bottom:0, left:"-8px", width:"18px", height:"18px", borderRadius:"50%", background:`rgba(${i%3===0?'168,85,247':i%3===1?'59,130,246':'16,185,129'},0.9)`, boxShadow:`0 0 20px 8px rgba(${i%3===0?'168,85,247':i%3===1?'59,130,246':'16,185,129'},0.4)` }} />
        </div>
      ))}
      {/* Dance floor */}
      <div style={{ position:"absolute", bottom:"14%", left:"8%", right:"8%", height:"80px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(8,1fr)", height:"100%", gap:"1px" }}>
          {Array(32).fill(0).map((_,i) => {
            const colors = ["rgba(168,85,247,0.25)","rgba(59,130,246,0.2)","rgba(16,185,129,0.2)","rgba(236,72,153,0.2)","rgba(245,158,11,0.15)"];
            return <div key={i} style={{ background:colors[i%5], border:"1px solid rgba(255,255,255,0.04)", borderRadius:"2px" }} />;
          })}
        </div>
      </div>
      {/* DJ Booth */}
      <div style={{ position:"absolute", bottom:"35%", left:"50%", transform:"translateX(-50%)", width:"120px", height:"50px" }}>
        <div style={{ background:"#1a0035", border:"2px solid rgba(168,85,247,0.5)", borderRadius:"8px", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
          <div style={{ width:"30px", height:"30px", borderRadius:"50%", background:"#0f172a", border:"3px solid rgba(168,85,247,0.6)" }}>
            <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"6px", height:"6px", borderRadius:"50%", background:"#a855f7" }} />
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
            {[1,2,3].map(i => <div key={i} style={{ width:"20px", height:"4px", background:"rgba(168,85,247,0.4)", borderRadius:"2px" }} />)}
          </div>
          <div style={{ width:"30px", height:"30px", borderRadius:"50%", background:"#0f172a", border:"3px solid rgba(59,130,246,0.6)" }} />
        </div>
        <div style={{ textAlign:"center", fontSize:"9px", color:"rgba(168,85,247,0.7)", marginTop:"3px", letterSpacing:"2px" }}>DJ BOOTH</div>
      </div>
      {/* Bar */}
      <div style={{ position:"absolute", bottom:"14%", right:"0%", width:"80px", top:"30%", background:"#1a0030", border:"1px solid rgba(168,85,247,0.2)", borderRadius:"8px 0 0 8px" }}>
        <div style={{ padding:"8px", display:"flex", flexWrap:"wrap", gap:"3px", justifyContent:"center", marginTop:"8px" }}>
          {["🍸","🍹","🥃","🍾","🥂"].map((d,i) => <div key={i} style={{ fontSize:"14px" }}>{d}</div>)}
        </div>
        <div style={{ position:"absolute", bottom:"8px", left:0, right:0, textAlign:"center", fontSize:"8px", color:"rgba(168,85,247,0.5)", letterSpacing:"1px" }}>BAR</div>
      </div>
      {/* Wall speakers */}
      <div style={{ position:"absolute", top:"20%", left:"2%", width:"24px", height:"40px", background:"#0f0020", border:"1px solid rgba(168,85,247,0.3)", borderRadius:"4px" }}>
        <div style={{ position:"absolute", inset:"3px", borderRadius:"50%", border:"2px solid rgba(168,85,247,0.4)" }} />
      </div>
      <div style={{ position:"absolute", top:"20%", right:"10%", width:"24px", height:"40px", background:"#0f0020", border:"1px solid rgba(168,85,247,0.3)", borderRadius:"4px" }}>
        <div style={{ position:"absolute", inset:"3px", borderRadius:"50%", border:"2px solid rgba(168,85,247,0.4)" }} />
      </div>
      {/* Floor */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"14%", background:"#0a0018" }} />
    </div>
  );

  if (roomKey === "restaurant") return (
    <div style={style}>
      <div style={{ position:"absolute", inset:0, background:"#1a0805" }} />
      {/* Brick wall */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"65%",
        backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(0,0,0,0.2) 18px,rgba(0,0,0,0.2) 20px),repeating-linear-gradient(90deg,transparent,transparent 38px,rgba(0,0,0,0.15) 38px,rgba(0,0,0,0.15) 40px)",
        background:"#3d1a0a" }} />
      {/* Warm lighting */}
      {[20,50,80].map((x,i) => (
        <div key={i} style={{ position:"absolute", top:"5%", left:`${x}%`, width:"2px", height:"40px", background:"rgba(251,191,36,0.5)" }}>
          <div style={{ position:"absolute", bottom:"-4px", left:"-10px", width:"22px", height:"22px", borderRadius:"50%", background:"rgba(251,191,36,0.9)", boxShadow:"0 0 30px 12px rgba(251,191,36,0.25)" }}>
            <div style={{ position:"absolute", inset:"3px", borderRadius:"50%", background:"#fef3c7" }} />
          </div>
        </div>
      ))}
      {/* Floor */}
      <div style={{ position:"absolute", top:"65%", left:0, right:0, bottom:0,
        background:"repeating-linear-gradient(45deg,#2d1507 0px,#2d1507 20px,#3d1f0a 20px,#3d1f0a 21px,#2d1507 21px,#2d1507 40px)" }} />
      {/* Skirting */}
      <div style={{ position:"absolute", top:"63%", left:0, right:0, height:"4px", background:"#5d2d14" }} />
      {/* Tables */}
      {[[12,50],[38,50],[62,50],[86,50]].map(([x,y],i) => (
        <div key={i} style={{ position:"absolute", left:`${x}%`, bottom:"16%", transform:"translateX(-50%)" }}>
          {/* Table top */}
          <div style={{ width:"70px", height:"8px", background:"#4a1f0a", borderRadius:"4px", border:"1px solid #6b2d0e", position:"relative" }}>
            {/* Candle */}
            <div style={{ position:"absolute", top:"-24px", left:"50%", transform:"translateX(-50%)", textAlign:"center" }}>
              <div style={{ width:"8px", height:"2px", background:"#f59e0b", borderRadius:"50%", margin:"0 auto", boxShadow:"0 0 6px 2px rgba(251,191,36,0.5)" }} />
              <div style={{ width:"6px", height:"16px", background:"#e2e8f0", margin:"2px auto 0" }} />
            </div>
            {/* Wine glasses */}
            <div style={{ position:"absolute", top:"-18px", left:"12px", fontSize:"14px" }}>🥂</div>
            {/* Plates */}
            <div style={{ position:"absolute", top:"-14px", left:"34px", width:"20px", height:"20px", borderRadius:"50%", background:"#f8fafc", border:"1px solid #e2e8f0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"8px" }}>🍽️</div>
          </div>
          {/* Table leg */}
          <div style={{ width:"6px", height:"20px", background:"#4a1f0a", margin:"0 auto" }} />
          {/* Chairs */}
          <div style={{ position:"absolute", top:"-8px", left:"-20px", width:"16px", height:"24px", background:"#3d1a0a", border:"1px solid #6b2d0e", borderRadius:"4px 4px 0 0" }} />
          <div style={{ position:"absolute", top:"-8px", right:"-20px", width:"16px", height:"24px", background:"#3d1a0a", border:"1px solid #6b2d0e", borderRadius:"4px 4px 0 0" }} />
        </div>
      ))}
      {/* Menu board */}
      <div style={{ position:"absolute", top:"8%", left:"50%", transform:"translateX(-50%)", width:"160px", height:"80px", background:"#1a0a05", border:"4px solid #4a1f0a", borderRadius:"4px", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"4px" }}>
        <div style={{ fontSize:"9px", color:"#fbbf24", letterSpacing:"2px", fontWeight:"bold" }}>MENU</div>
        {["Braai Platter • R189","Pap & Wors • R89","Gatsby • R79"].map((item,i) => (
          <div key={i} style={{ fontSize:"8px", color:"#d4a96a" }}>{item}</div>
        ))}
      </div>
    </div>
  );

  if (roomKey === "mall") return (
    <div style={style}>
      <div style={{ position:"absolute", inset:0, background:"#050d1a" }} />
      {/* Ceiling */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"20%", background:"#0a1628" }}>
        {/* Ceiling lights */}
        {[10,25,40,55,70,85].map((x,i) => (
          <div key={i} style={{ position:"absolute", bottom:"0", left:`${x}%`, width:"30px", height:"12px", background:"#f8fafc", borderRadius:"2px", boxShadow:"0 0 20px 4px rgba(248,250,252,0.3)" }} />
        ))}
      </div>
      {/* Floor tiles */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, top:"60%",
        backgroundImage:"repeating-linear-gradient(0deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 60px),repeating-linear-gradient(90deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 60px)",
        background:"#0d1a2e" }} />
      {/* Shop fronts */}
      {[
        { x:2, label:"FASHION", color:"#7c3aed", icon:"👗" },
        { x:26, label:"TECH", color:"#0369a1", icon:"📱" },
        { x:52, label:"SHOES", color:"#dc2626", icon:"👟" },
        { x:74, label:"JEWELS", color:"#a16207", icon:"💎" },
      ].map((shop,i) => (
        <div key={i} style={{ position:"absolute", top:"18%", left:`${shop.x}%`, width:"22%", bottom:"42%" }}>
          <div style={{ height:"100%", background:"#0a1628", border:`2px solid ${shop.color}40`, borderRadius:"4px 4px 0 0", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"6px" }}>
            <div style={{ fontSize:"24px" }}>{shop.icon}</div>
            <div style={{ fontSize:"9px", color:`${shop.color}`, letterSpacing:"2px", fontWeight:"600" }}>{shop.label}</div>
            <div style={{ width:"80%", height:"1px", background:`${shop.color}30` }} />
            <div style={{ fontSize:"8px", color:"rgba(255,255,255,0.3)" }}>Open</div>
          </div>
          {/* Shop entrance */}
          <div style={{ height:"12px", background:`${shop.color}20`, borderTop:`1px solid ${shop.color}30` }} />
        </div>
      ))}
      {/* Mall sign */}
      <div style={{ position:"absolute", top:"1%", left:"50%", transform:"translateX(-50%)", textAlign:"center" }}>
        <div style={{ fontSize:"11px", fontWeight:"bold", color:"#e8b84b", letterSpacing:"6px" }}>PROJO MALL</div>
      </div>
      {/* Fountain in center */}
      <div style={{ position:"absolute", bottom:"18%", left:"50%", transform:"translateX(-50%)", textAlign:"center" }}>
        <div style={{ width:"60px", height:"16px", background:"#0369a1", borderRadius:"50%", border:"2px solid #0284c7", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ fontSize:"10px" }}>⛲</div>
        </div>
      </div>
    </div>
  );

  if (roomKey === "cinema") return (
    <div style={style}>
      <div style={{ position:"absolute", inset:0, background:"#050505" }} />
      {/* Screen */}
      <div style={{ position:"absolute", top:"5%", left:"5%", right:"5%", height:"42%", background:"#0f172a", border:"3px solid #1e293b", borderRadius:"4px", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,#1e3a5f,#0f2545,#1a1040)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"8px" }}>
          <div style={{ fontSize:"32px" }}>🎬</div>
          <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.5)", letterSpacing:"2px" }}>MZANSI NIGHTS</div>
        </div>
        {/* Screen glow */}
        <div style={{ position:"absolute", bottom:"-10px", left:"10%", right:"10%", height:"20px", background:"rgba(59,130,246,0.1)", filter:"blur(8px)" }} />
      </div>
      {/* Seats rows */}
      {[52,65,76].map((y,row) => (
        <div key={row} style={{ position:"absolute", top:`${y}%`, left:"2%", right:"2%", display:"flex", gap:"3px", justifyContent:"center" }}>
          {Array(14).fill(0).map((_,i) => (
            <div key={i} style={{ width:"28px", height:"16px", background: Math.random()>0.4?"#1e293b":"#2d1b69", borderRadius:"4px 4px 0 0", border:"1px solid rgba(255,255,255,0.05)" }} />
          ))}
        </div>
      ))}
      {/* Side lighting */}
      <div style={{ position:"absolute", top:"48%", left:0, width:"6px", bottom:"14%", background:"linear-gradient(180deg,rgba(251,191,36,0.1),rgba(251,191,36,0))" }} />
      <div style={{ position:"absolute", top:"48%", right:0, width:"6px", bottom:"14%", background:"linear-gradient(180deg,rgba(251,191,36,0.1),rgba(251,191,36,0))" }} />
      {/* Floor */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"14%", background:"#030303" }} />
    </div>
  );

  if (roomKey === "beach") return (
    <div style={style}>
      {/* Sky */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"50%", background:"linear-gradient(180deg,#0369a1 0%,#0ea5e9 60%,#38bdf8 100%)" }}>
        {/* Sun */}
        <div style={{ position:"absolute", top:"15%", right:"15%", width:"50px", height:"50px", background:"#fef08a", borderRadius:"50%", boxShadow:"0 0 40px 15px rgba(254,240,138,0.4)" }} />
        {/* Clouds */}
        <div style={{ position:"absolute", top:"20%", left:"10%", width:"80px", height:"24px", background:"rgba(255,255,255,0.7)", borderRadius:"50px" }} />
        <div style={{ position:"absolute", top:"10%", left:"25%", width:"60px", height:"20px", background:"rgba(255,255,255,0.6)", borderRadius:"50px" }} />
      </div>
      {/* Ocean */}
      <div style={{ position:"absolute", top:"40%", left:0, right:0, height:"20%", background:"linear-gradient(180deg,#0284c7,#0369a1)" }}>
        {/* Waves */}
        {[0,20,40,60,80].map((x,i) => (
          <div key={i} style={{ position:"absolute", top:`${i%2===0?20:40}%`, left:`${x}%`, width:"60px", height:"8px", background:"rgba(255,255,255,0.2)", borderRadius:"50px", transform:"rotate(-3deg)" }} />
        ))}
      </div>
      {/* Sand */}
      <div style={{ position:"absolute", top:"58%", left:0, right:0, bottom:0, background:"linear-gradient(180deg,#fbbf24,#d97706)" }}>
        {/* Umbrella */}
        <div style={{ position:"absolute", top:"-20px", left:"15%", textAlign:"center" }}>
          <div style={{ fontSize:"28px" }}>⛱️</div>
          <div style={{ width:"3px", height:"30px", background:"#92400e", margin:"0 auto" }} />
        </div>
        {/* Beach towels */}
        <div style={{ position:"absolute", top:"10px", left:"10%", width:"60px", height:"20px", background:"#ef4444", borderRadius:"4px", opacity:0.8 }} />
        <div style={{ position:"absolute", top:"10px", left:"55%", width:"60px", height:"20px", background:"#3b82f6", borderRadius:"4px", opacity:0.8 }} />
        {/* Footprints */}
        {[30,40,50,60].map((x,i) => (
          <div key={i} style={{ position:"absolute", top:`${30+i*10}px`, left:`${x}%`, width:"8px", height:"12px", background:"rgba(0,0,0,0.1)", borderRadius:"50% 50% 50% 50% / 60% 60% 40% 40%" }} />
        ))}
      </div>
    </div>
  );

  return <div style={{ ...style, background:"#0f172a" }} />;
}

// ── GIFT SENDER COMPONENT ────────────────────────────────────
function GiftSender({ friend, gifts, coins, onSend, onCancel }) {
  const [selectedGift, setSelectedGift] = React.useState(null);
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const G = "#e8b84b"; const BG2 = "#111111"; const BORDER = "rgba(232,184,75,0.15)";

  async function handleSend() {
    if (!selectedGift) return;
    setSending(true);
    await onSend(friend, selectedGift.type, message);
    setSending(false);
  }

  return (
    <div style={{ background:BG2, border:"1px solid rgba(236,72,153,0.3)", padding:"14px 1rem", borderBottom:"1px solid rgba(236,72,153,0.1)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"13px", fontWeight:"800", color:"#ec4899" }}>🎁 Send Gift to {friend.name}</div>
        <button onClick={onCancel} style={{ background:"none", border:"none", color:"#6b6760", cursor:"pointer", fontSize:"16px" }}>✕</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"6px", marginBottom:"10px" }}>
        {gifts.map(g => (
          <div key={g.type} onClick={() => setSelectedGift(g)} style={{ background:selectedGift?.type===g.type?"rgba(236,72,153,0.15)":"rgba(255,255,255,0.03)", border:`2px solid ${selectedGift?.type===g.type?"#ec4899":"rgba(255,255,255,0.06)"}`, borderRadius:"10px", padding:"8px", textAlign:"center", cursor:"pointer" }}>
            <div style={{ fontSize:"24px" }}>{g.icon}</div>
            <div style={{ fontSize:"10px", color:selectedGift?.type===g.type?"#ec4899":"#6b6760", marginTop:"2px" }}>{g.label}</div>
            <div style={{ fontSize:"10px", color:G, fontWeight:"700" }}>★{g.cost}</div>
          </div>
        ))}
      </div>
      {selectedGift && (
        <>
          <input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Add a message (optional)" style={{ width:"100%", background:"#1a1a1a", border:`1px solid ${BORDER}`, borderRadius:"8px", color:"#f0ede8", padding:"8px 12px", fontSize:"12px", outline:"none", boxSizing:"border-box", marginBottom:"8px" }} />
          <div style={{ fontSize:"11px", color:coins>=selectedGift.cost?"#6b6760":"#ef4444", marginBottom:"8px" }}>
            Cost: <span style={{ color:G, fontWeight:"700" }}>★{selectedGift.cost}</span> · Your balance: <span style={{ color:coins>=selectedGift.cost?G:"#ef4444" }}>★{coins}</span>
          </div>
          <button onClick={handleSend} disabled={sending||coins<selectedGift.cost} style={{ width:"100%", background:coins>=selectedGift.cost?"#ec4899":"#333", border:"none", borderRadius:"10px", padding:"10px", color:"white", fontWeight:"800", fontSize:"13px", cursor:coins>=selectedGift.cost?"pointer":"not-allowed" }}>
            {sending?"Sending...":coins<selectedGift.cost?"Not enough coins":`Send ${selectedGift.icon} to ${friend.name}`}
          </button>
        </>
      )}
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────
export default function ProjoWorld() {
  const [coins, setCoins] = useState(0);
  const [loyaltyCoins, setLoyaltyCoins] = useState(0); // coins from real spend
  const [loyaltyPoints, setLoyaltyPoints] = useState(0); // real loyalty points
  const [lifetimeSpendZar, setLifetimeSpendZar] = useState(0);
  const [coinSyncing, setCoinSyncing] = useState(false);
  const [avatar, setAvatar] = useState(() => {
    try { return JSON.parse(localStorage.getItem(AVATAR_KEY)) || {}; } catch { return {}; }
  });
  const [roomKey, setRoomKey] = useState("home");
  const [avatarX, setAvatarX] = useState(50);
  const [screen, setScreen] = useState("world"); // world | dress | home | shop
  const [chatMessages, setChatMessages] = useState([
    { who:"System", msg:"Welcome to PROJO World! Click to move your avatar." },
    { who:"Zanele", msg:"Hey hey! Love the new world 🌍" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [speechBubble, setSpeechBubble] = useState(null);
  const [npcSpeech, setNpcSpeech] = useState({});
  const [homeFurniture, setHomeFurniture] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HOME_KEY)) || []; } catch { return []; }
  });
  const [notification, setNotification] = useState(null);
  const [friends, setFriends] = useState([]);
  const [giftInbox, setGiftInbox] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [showGifts, setShowGifts] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [giftTarget, setGiftTarget] = useState(null);
  const [friendSearch, setFriendSearch] = useState("");
  const [friendSearchResults, setFriendSearchResults] = useState([]);
  const [showCoinBreakdown, setShowCoinBreakdown] = useState(false);
  const [dressTab, setDressTab] = useState("skin");
  const [isWalking, setIsWalking] = useState(false);
  const canvasRef = useRef(null);
  const chatRef = useRef(null);
  const walkRef = useRef(null);
  const bubbleRef = useRef(null);

  const av = {
    skin: avatar.skin || "#C8956C",
    hairColor: avatar.hairColor || "#1a0a00",
    eyeColor: avatar.eyeColor || "#2C1810",
    topItem: CLOTHING.tops.find(t => t.id === (avatar.topId || "t0")) || CLOTHING.tops[0],
    bottomItem: CLOTHING.bottoms.find(b => b.id === (avatar.bottomId || "b0")) || CLOTHING.bottoms[0],
    shoeItem: CLOTHING.shoes.find(s => s.id === (avatar.shoeId || "s0")) || CLOTHING.shoes[0],
    accessory: CLOTHING.accessories.find(a => a.id === (avatar.accId || "a0")) || CLOTHING.accessories[0],
    name: avatar.name || "You",
  };

  // coins synced with backend
  useEffect(() => { localStorage.setItem(AVATAR_KEY, JSON.stringify(avatar)); }, [avatar]);

  // Load coins from backend on mount
  useEffect(() => {
    loadCoins();
    loadGifts();
    loadFriends();
  }, []);

  async function loadCoins() {
    try {
      const d = await api.get("/world/coins");
      setCoins(d.worldCoins || 0);
      setLoyaltyCoins(d.loyaltyDerivedCoins || 0);
      setLoyaltyPoints(d.loyaltyPoints || 0);
      setLifetimeSpendZar(d.lifetimeSpendZar || 0);
    } catch {
      // Fallback to localStorage if not logged in
      setCoins(parseInt(localStorage.getItem(COINS_KEY) || "500"));
    }
  }

  async function earnCoins(amount, reason) {
    try {
      const d = await api.post("/world/coins/earn", { amount, reason });
      setCoins(d.balance);
      return d.balance;
    } catch {
      setCoins(c => c + amount);
    }
  }
  useEffect(() => { localStorage.setItem(HOME_KEY, JSON.stringify(homeFurniture)); }, [homeFurniture]);
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [chatMessages]);

  function addChat(who, msg) {
    setChatMessages(p => [...p.slice(-30), { who, msg }]);
  }

  function showBubble(msg, duration = 2500) {
    setSpeechBubble(msg);
    clearTimeout(bubbleRef.current);
    bubbleRef.current = setTimeout(() => setSpeechBubble(null), duration);
  }

  function showNotif(msg) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }

  function handleCanvasClick(e) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.max(8, Math.min(88, ((e.clientX - rect.left) / rect.width) * 100));
    setAvatarX(pct);
    earnCoins(1, 'MOVE');
  }

  function moveAvatar(dir) {
    setAvatarX(x => Math.max(8, Math.min(88, x + dir * 12)));
    setIsWalking(true);
    clearTimeout(walkRef.current);
    walkRef.current = setTimeout(() => setIsWalking(false), 400);
    earnCoins(1, 'MOVE');
  }

  function doWave() {
    showBubble("👋 Hey everyone!");
    addChat(av.name, "👋 Hey everyone!");
    earnCoins(2, 'SOCIAL');
  }

  function doDance() {
    showBubble("🕺 Dance move!");
    addChat(av.name, "is showing off some moves! 🕺");
    earnCoins(5, 'DANCE');
    showNotif("+5 coins for dancing! 🕺");
  }

  function doSit() {
    showBubble("😌 Chilling...");
    addChat(av.name, "sat down for a bit 😌");
  }

  function npcTap(npc) {
    const replies = NPC_REPLIES[npc.name] || ["Hey there!"];
    const msg = replies[Math.floor(Math.random() * replies.length)];
    setNpcSpeech(p => ({ ...p, [npc.name]: msg }));
    addChat(npc.name, msg);
    setTimeout(() => setNpcSpeech(p => { const n = { ...p }; delete n[npc.name]; return n; }), 3000);
    earnCoins(2, 'SOCIAL');
    showNotif("+2 coins for socialising! 👋");
  }

  async function loadFriends() {
    try {
      const d = await api.get("/world/friends");
      setFriends(d.friends || []);
      const req = await api.get("/world/friends/requests");
      setFriendRequests(req.requests || []);
    } catch {}
  }

  async function loadGifts() {
    try {
      const d = await api.get("/world/gifts/inbox");
      setGiftInbox(d.gifts || []);
    } catch {}
  }

  async function searchFriends(q) {
    setFriendSearch(q);
    if (q.length < 2) { setFriendSearchResults([]); return; }
    try {
      const d = await api.get(`/world/friends/search?q=${q}`);
      setFriendSearchResults(d.users || []);
    } catch {}
  }

  async function addFriend(userId) {
    try {
      await api.post("/world/friends/add", { friendId: userId });
      toast.success("Friend request sent!");
      setFriendSearchResults([]);
      setFriendSearch("");
    } catch(e) { toast.error(e.message || "Could not add friend"); }
  }

  async function acceptFriend(id) {
    try {
      await api.post(`/world/friends/${id}/accept`);
      toast.success("Friend added!");
      loadFriends();
    } catch {}
  }

  const GIFTS = [
    { type:"PARCEL", icon:"📦", label:"Parcel", cost:20, desc:"A mystery parcel!" },
    { type:"FLOWERS", icon:"💐", label:"Flowers", cost:15, desc:"Beautiful blooms" },
    { type:"CAKE", icon:"🎂", label:"Cake", cost:25, desc:"Celebration cake" },
    { type:"BALLOON", icon:"🎈", label:"Balloon", cost:10, desc:"Cheerful balloon" },
    { type:"TROPHY", icon:"🏆", label:"Trophy", cost:50, desc:"You're a champion" },
    { type:"MYSTERY", icon:"🎁", label:"Mystery Box", cost:30, desc:"What could it be?" },
  ];

  async function sendGift(friend, giftType, message) {
    try {
      await api.post("/world/gifts/send", { toUserId: friend.id, giftType, message });
      toast.success(`${GIFTS.find(g=>g.type===giftType)?.icon} Gift sent to ${friend.name}!`);
      loadCoins();
      setGiftTarget(null);
    } catch(e) { toast.error(e.response?.data?.error || "Could not send gift"); }
  }

  async function openGift(gift) {
    try {
      await api.post(`/world/gifts/${gift.id}/open`);
      toast.success(`${gift.icon} You opened ${gift.giftType}! +5 coins 🎉`);
      loadGifts();
      loadCoins();
    } catch {}
  }

  function sendChat() {
    if (!chatInput.trim()) return;
    addChat(av.name, chatInput);
    showBubble(chatInput);
    const room = ROOMS[roomKey];
    if (room.npcs.length > 0) {
      setTimeout(() => {
        const npc = room.npcs[Math.floor(Math.random() * room.npcs.length)];
        const replies = NPC_REPLIES[npc.name] || ["Hey!"];
        const reply = replies[Math.floor(Math.random() * replies.length)];
        addChat(npc.name, reply);
        setNpcSpeech(p => ({ ...p, [npc.name]: reply }));
        setTimeout(() => setNpcSpeech(p => { const n = { ...p }; delete n[npc.name]; return n; }), 3000);
      }, 1200);
    }
    setChatInput("");
    earnCoins(1, 'MOVE');
  }

  function switchRoom(key) {
    setRoomKey(key);
    setAvatarX(50);
    setChatMessages(p => [...p, { who:"System", msg:`You entered ${ROOMS[key].label}` }]);
    earnCoins(3, 'EXPLORE');
    showNotif(`+3 coins for exploring! 🗺️`);
  }

  function buyFurniture(item) {
    if (coins < item.price) { showNotif("Not enough coins! 💸"); return; }
    if (homeFurniture.find(f => f.id === item.id)) { showNotif("Already owned! ✓"); return; }
    setCoins(c => c - item.price);
    setHomeFurniture(p => [...p, item]);
    showNotif(`${item.icon} ${item.label} added to your home!`);
    addChat("System", `You bought ${item.label} for your home! (-${item.price} coins)`);
  }

  const room = ROOMS[roomKey];
  const G = "#e8b84b";
  const BG = "#0a0a0a";
  const BG2 = "#111111";
  const BORDER = "rgba(232,184,75,0.15)";

  const inp = { background:"#1a1a1a", border:`1px solid ${BORDER}`, borderRadius:"8px", color:"#f0ede8", padding:"8px 12px", fontSize:"13px", outline:"none", fontFamily:"'DM Sans',sans-serif" };

  return (
    <div style={{ background:BG, minHeight:"100vh", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif", userSelect:"none" }}>
      {/* Header */}
      <div style={{ background:BG2, borderBottom:`1px solid ${BORDER}`, padding:"10px 1rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"18px", fontWeight:"800", color:G }}>🌍 PROJO World</div>
        <div style={{ display:"flex", gap:"6px", alignItems:"center", flexWrap:"wrap" }}>
          {/* Dual coin counter */}
          <div onClick={() => setShowCoinBreakdown(s => !s)} style={{ background:"rgba(232,184,75,0.12)", border:`1px solid ${G}`, borderRadius:"20px", padding:"4px 12px", fontSize:"12px", fontWeight:"700", color:G, cursor:"pointer", display:"flex", gap:"6px", alignItems:"center" }}>
            <span>🌍 {coins.toLocaleString()}</span>
            <span style={{ color:"rgba(232,184,75,0.4)" }}>|</span>
            <span style={{ color:"#a78bfa" }}>⭐ {loyaltyPoints.toLocaleString()}</span>
          </div>
          {/* Gift inbox */}
          <button onClick={() => { setShowGifts(s=>!s); setShowFriends(false); }} style={{ background:showGifts?"rgba(236,72,153,0.2)":BG2, border:`1px solid ${showGifts?"#ec4899":BORDER}`, borderRadius:"8px", padding:"6px 10px", color:showGifts?"#ec4899":"#6b6760", fontSize:"13px", cursor:"pointer", position:"relative" }}>
            🎁
            {giftInbox.filter(g=>!g.opened).length > 0 && <span style={{ position:"absolute", top:"-4px", right:"-4px", background:"#ef4444", color:"white", borderRadius:"50%", width:"14px", height:"14px", fontSize:"9px", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"700" }}>{giftInbox.filter(g=>!g.opened).length}</span>}
          </button>
          {/* Friends */}
          <button onClick={() => { setShowFriends(s=>!s); setShowGifts(false); }} style={{ background:showFriends?"rgba(59,130,246,0.2)":BG2, border:`1px solid ${showFriends?"#3b82f6":BORDER}`, borderRadius:"8px", padding:"6px 10px", color:showFriends?"#3b82f6":"#6b6760", fontSize:"13px", cursor:"pointer", position:"relative" }}>
            👥
            {friendRequests.length > 0 && <span style={{ position:"absolute", top:"-4px", right:"-4px", background:"#ef4444", color:"white", borderRadius:"50%", width:"14px", height:"14px", fontSize:"9px", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"700" }}>{friendRequests.length}</span>}
          </button>
          <button onClick={() => setScreen(screen === "dress" ? "world" : "dress")} style={{ background:screen==="dress"?"rgba(124,58,237,0.2)":BG2, border:`1px solid ${screen==="dress"?"#7c3aed":BORDER}`, borderRadius:"8px", padding:"6px 10px", color:screen==="dress"?"#a78bfa":"#6b6760", fontSize:"13px", cursor:"pointer" }}>👗</button>
          <button onClick={() => setScreen(screen === "shop" ? "world" : "shop")} style={{ background:screen==="shop"?"rgba(232,184,75,0.15)":BG2, border:`1px solid ${screen==="shop"?G:BORDER}`, borderRadius:"8px", padding:"6px 10px", color:screen==="shop"?G:"#6b6760", fontSize:"13px", cursor:"pointer" }}>🛋️</button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div style={{ background:"rgba(232,184,75,0.15)", border:`1px solid ${G}`, color:G, padding:"8px 16px", fontSize:"12px", fontWeight:"700", textAlign:"center" }}>{notification}</div>
      )}

      {/* Coin breakdown */}
      {showCoinBreakdown && (
        <div style={{ background:"#111111", border:`1px solid rgba(232,184,75,0.2)`, padding:"12px 1rem", borderBottom:`1px solid rgba(232,184,75,0.1)` }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"13px", fontWeight:"800", color:G, marginBottom:"10px" }}>Your Coin Wallets</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
            <div style={{ background:"rgba(232,184,75,0.06)", border:"1px solid rgba(232,184,75,0.15)", borderRadius:"10px", padding:"10px" }}>
              <div style={{ fontSize:"10px", color:"#6b6760", marginBottom:"3px" }}>🌍 WORLD COINS</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"22px", fontWeight:"800", color:G }}>{coins.toLocaleString()}</div>
              <div style={{ fontSize:"9px", color:"#6b6760", marginTop:"2px" }}>Earned in PROJO World</div>
            </div>
            <div style={{ background:"rgba(124,58,237,0.06)", border:"1px solid rgba(124,58,237,0.2)", borderRadius:"10px", padding:"10px" }}>
              <div style={{ fontSize:"10px", color:"#6b6760", marginBottom:"3px" }}>⭐ LOYALTY POINTS</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"22px", fontWeight:"800", color:"#a78bfa" }}>{loyaltyPoints.toLocaleString()}</div>
              <div style={{ fontSize:"9px", color:"#6b6760", marginTop:"2px" }}>From real PROJO spend</div>
            </div>
          </div>
          <div style={{ marginTop:"8px", background:"rgba(232,184,75,0.04)", border:"1px solid rgba(232,184,75,0.1)", borderRadius:"8px", padding:"8px 10px", fontSize:"11px", color:"#6b6760", lineHeight:1.6 }}>
            <span style={{ color:G }}>★ Earn 1 World Coin per R100</span> spent on rides, deliveries and services. You've spent <span style={{ color:"#f0ede8" }}>R{lifetimeSpendZar.toFixed(0)}</span> total → <span style={{ color:G }}>{loyaltyCoins} bonus coins</span> earned from real spend.
          </div>
          <div style={{ marginTop:"6px", fontSize:"10px", color:"#4a3030" }}>World Coins: move (+1) · chat (+1) · dance (+5) · explore (+3) · receive gift (+5)</div>
        </div>
      )}

      {/* Gifts panel */}
      {showGifts && !giftTarget && (
        <div style={{ background:"#111111", border:`1px solid rgba(236,72,153,0.2)`, padding:"12px 1rem", borderBottom:`1px solid rgba(236,72,153,0.1)`, maxHeight:"320px", overflowY:"auto" }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"13px", fontWeight:"800", color:"#ec4899", marginBottom:"10px" }}>🎁 Gift Inbox</div>
          {giftInbox.length === 0 ? (
            <div style={{ textAlign:"center", padding:"1.5rem", color:"#6b6760", fontSize:"12px" }}>No gifts yet — add friends and they can send you gifts!</div>
          ) : giftInbox.map(gift => (
            <div key={gift.id} style={{ background:"rgba(236,72,153,0.06)", border:`1px solid ${gift.opened?"rgba(255,255,255,0.05)":"rgba(236,72,153,0.25)"}`, borderRadius:"10px", padding:"10px 12px", marginBottom:"6px", display:"flex", gap:"10px", alignItems:"center" }}>
              <div style={{ fontSize:"28px" }}>{gift.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"12px", fontWeight:"600", color:gift.opened?"#6b6760":"#f0ede8" }}>From {gift.fromUser?.name || "Friend"}</div>
                <div style={{ fontSize:"10px", color:"#6b6760" }}>{gift.giftType}{gift.message?` · "${gift.message}"`:""}</div>
                <div style={{ fontSize:"10px", color:"#4a3030" }}>{new Date(gift.createdAt).toLocaleDateString("en-ZA",{day:"2-digit",month:"short"})}</div>
              </div>
              {!gift.opened
                ? <button onClick={() => openGift(gift)} style={{ background:"rgba(236,72,153,0.15)", border:"1px solid rgba(236,72,153,0.4)", borderRadius:"8px", padding:"6px 12px", color:"#ec4899", fontSize:"11px", fontWeight:"700", cursor:"pointer" }}>Open +5★</button>
                : <span style={{ fontSize:"10px", color:"#6b6760" }}>✓ Opened</span>}
            </div>
          ))}
          {friends.length > 0 && (
            <>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"13px", fontWeight:"800", color:"#ec4899", margin:"12px 0 8px" }}>Send a Gift</div>
              <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                {friends.map(f => (
                  <button key={f.id} onClick={() => setGiftTarget(f)} style={{ background:"rgba(236,72,153,0.08)", border:"1px solid rgba(236,72,153,0.2)", borderRadius:"20px", padding:"5px 12px", color:"#ec4899", fontSize:"11px", cursor:"pointer" }}>
                    🎁 {f.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Gift sender */}
      {showGifts && giftTarget && <GiftSender friend={giftTarget} gifts={GIFTS} coins={coins} onSend={sendGift} onCancel={() => setGiftTarget(null)} />}

      {/* Friends panel */}
      {showFriends && (
        <div style={{ background:"#111111", border:`1px solid rgba(59,130,246,0.2)`, padding:"12px 1rem", borderBottom:`1px solid rgba(59,130,246,0.1)` }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"13px", fontWeight:"800", color:"#3b82f6", marginBottom:"10px" }}>👥 Friends</div>
          {/* Friend requests */}
          {friendRequests.length > 0 && (
            <div style={{ marginBottom:"10px" }}>
              <div style={{ fontSize:"11px", color:"#f59e0b", fontWeight:"700", marginBottom:"6px" }}>Pending requests ({friendRequests.length})</div>
              {friendRequests.map(r => (
                <div key={r.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize:"12px" }}>{r.user.name}</span>
                  <button onClick={() => acceptFriend(r.id)} style={{ background:"rgba(59,130,246,0.15)", border:"1px solid rgba(59,130,246,0.3)", borderRadius:"6px", padding:"4px 10px", color:"#3b82f6", fontSize:"11px", cursor:"pointer" }}>Accept</button>
                </div>
              ))}
            </div>
          )}
          {/* Search */}
          <input value={friendSearch} onChange={e => searchFriends(e.target.value)} placeholder="Search by name or phone..." style={{ width:"100%", background:"#1a1a1a", border:`1px solid rgba(232,184,75,0.15)`, borderRadius:"8px", color:"#f0ede8", padding:"8px 12px", fontSize:"12px", outline:"none", boxSizing:"border-box", marginBottom:"8px" }} />
          {friendSearchResults.map(u => (
            <div key={u.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize:"12px" }}>{u.name}</span>
              <button onClick={() => addFriend(u.id)} style={{ background:"rgba(59,130,246,0.15)", border:"1px solid rgba(59,130,246,0.3)", borderRadius:"6px", padding:"4px 10px", color:"#3b82f6", fontSize:"11px", cursor:"pointer" }}>+ Add</button>
            </div>
          ))}
          {/* Friend list */}
          {friends.length === 0 && friendSearch.length < 2 ? (
            <div style={{ textAlign:"center", padding:"1rem", color:"#6b6760", fontSize:"12px" }}>Search for people to add as friends</div>
          ) : friends.map(f => (
            <div key={f.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
              <div>
                <div style={{ fontSize:"12px", color:"#f0ede8" }}>{f.name}</div>
                <div style={{ fontSize:"10px", color:"#6b6760" }}>Friend</div>
              </div>
              <button onClick={() => { setGiftTarget(f); setShowFriends(false); setShowGifts(true); }} style={{ background:"rgba(236,72,153,0.1)", border:"1px solid rgba(236,72,153,0.25)", borderRadius:"6px", padding:"4px 10px", color:"#ec4899", fontSize:"10px", cursor:"pointer" }}>🎁 Gift</button>
            </div>
          ))}
        </div>
      )}

      {/* Room tabs */}
      <div style={{ display:"flex", gap:"4px", padding:"8px 1rem", overflowX:"auto", borderBottom:`1px solid ${BORDER}` }}>
        {Object.entries(ROOMS).map(([key, r]) => (
          <button key={key} onClick={() => switchRoom(key)} style={{ background:roomKey===key?"rgba(232,184,75,0.15)":"transparent", border:`1px solid ${roomKey===key?G:BORDER}`, borderRadius:"20px", padding:"5px 12px", color:roomKey===key?G:"#6b6760", fontSize:"11px", fontWeight:"700", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
            {key==="home"?"🏠":key==="club"?"🎵":key==="restaurant"?"🍽️":key==="mall"?"🛍️":key==="cinema"?"🎬":"🏖️"} {r.label.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* DRESS SCREEN */}
      {screen === "dress" && (
        <div style={{ padding:"1rem" }}>
          <div style={{ display:"flex", gap:"1rem", alignItems:"flex-start" }}>
            {/* Avatar preview */}
            <div style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"16px", padding:"16px", textAlign:"center", flexShrink:0, minWidth:"100px" }}>
              <AvatarSVG {...av} size={1.4} />
              <div style={{ fontSize:"11px", color:G, marginTop:"8px", fontWeight:"700" }}>{av.name}</div>
              <div style={{ fontSize:"10px", color:"#6b6760" }}>Level 3</div>
            </div>
            {/* Dress options */}
            <div style={{ flex:1 }}>
              {/* Name */}
              <div style={{ marginBottom:"10px" }}>
                <label style={{ fontSize:"11px", color:"#6b6760", display:"block", marginBottom:"4px" }}>Your name</label>
                <input value={avatar.name || ""} onChange={e => setAvatar(p => ({ ...p, name: e.target.value }))} placeholder="Enter your name" style={{ ...inp, width:"100%", boxSizing:"border-box" }} />
              </div>
              {/* Category tabs */}
              <div style={{ display:"flex", gap:"4px", marginBottom:"10px", flexWrap:"wrap" }}>
                {[["skin","Skin"],["hair","Hair"],["eyes","Eyes"],["tops","Tops"],["bottoms","Bottoms"],["shoes","Shoes"],["acc","Accessories"]].map(([k,l]) => (
                  <button key={k} onClick={() => setDressTab(k)} style={{ background:dressTab===k?"rgba(124,58,237,0.2)":"transparent", border:`1px solid ${dressTab===k?"#7c3aed":BORDER}`, borderRadius:"20px", padding:"4px 10px", color:dressTab===k?"#a78bfa":"#6b6760", fontSize:"10px", fontWeight:"700", cursor:"pointer" }}>{l}</button>
                ))}
              </div>
              {/* Skin tones */}
              {dressTab === "skin" && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                  {SKIN_TONES.map(c => (
                    <div key={c} onClick={() => setAvatar(p => ({ ...p, skin: c }))} style={{ width:"32px", height:"32px", borderRadius:"50%", background:c, cursor:"pointer", border:`3px solid ${av.skin===c?G:"transparent"}` }} />
                  ))}
                </div>
              )}
              {/* Hair */}
              {dressTab === "hair" && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                  {HAIR_COLORS.map(c => (
                    <div key={c} onClick={() => setAvatar(p => ({ ...p, hairColor: c }))} style={{ width:"32px", height:"32px", borderRadius:"50%", background:c, cursor:"pointer", border:`3px solid ${av.hairColor===c?G:"transparent"}` }} />
                  ))}
                </div>
              )}
              {/* Eyes */}
              {dressTab === "eyes" && (
                <div style={{ display:"flex", gap:"8px" }}>
                  {EYE_COLORS.map(c => (
                    <div key={c} onClick={() => setAvatar(p => ({ ...p, eyeColor: c }))} style={{ width:"36px", height:"36px", borderRadius:"50%", background:c, cursor:"pointer", border:`3px solid ${av.eyeColor===c?G:"transparent"}` }} />
                  ))}
                </div>
              )}
              {/* Tops */}
              {dressTab === "tops" && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
                  {CLOTHING.tops.map(t => (
                    <div key={t.id} onClick={() => setAvatar(p => ({ ...p, topId: t.id }))} style={{ background:`${t.color}18`, border:`2px solid ${av.topItem.id===t.id?t.color:BORDER}`, borderRadius:"8px", padding:"8px", cursor:"pointer", display:"flex", alignItems:"center", gap:"8px" }}>
                      <div style={{ width:"20px", height:"20px", borderRadius:"4px", background:t.color, flexShrink:0 }} />
                      <span style={{ fontSize:"11px", color:av.topItem.id===t.id?t.color:"#a8a49e" }}>{t.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Bottoms */}
              {dressTab === "bottoms" && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
                  {CLOTHING.bottoms.map(b => (
                    <div key={b.id} onClick={() => setAvatar(p => ({ ...p, bottomId: b.id }))} style={{ background:`${b.color}18`, border:`2px solid ${av.bottomItem.id===b.id?b.color:BORDER}`, borderRadius:"8px", padding:"8px", cursor:"pointer", display:"flex", alignItems:"center", gap:"8px" }}>
                      <div style={{ width:"20px", height:"20px", borderRadius:"4px", background:b.color, flexShrink:0 }} />
                      <span style={{ fontSize:"11px", color:av.bottomItem.id===b.id?b.color:"#a8a49e" }}>{b.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Shoes */}
              {dressTab === "shoes" && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
                  {CLOTHING.shoes.map(s => (
                    <div key={s.id} onClick={() => setAvatar(p => ({ ...p, shoeId: s.id }))} style={{ background:`${s.color}18`, border:`2px solid ${av.shoeItem.id===s.id?s.color:BORDER}`, borderRadius:"8px", padding:"8px", cursor:"pointer", display:"flex", alignItems:"center", gap:"8px" }}>
                      <div style={{ width:"20px", height:"20px", borderRadius:"4px", background:s.color, border:`2px solid ${s.accent}`, flexShrink:0 }} />
                      <span style={{ fontSize:"11px", color:av.shoeItem.id===s.id?s.color:"#a8a49e" }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Accessories */}
              {dressTab === "acc" && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
                  {CLOTHING.accessories.map(a => (
                    <div key={a.id} onClick={() => setAvatar(p => ({ ...p, accId: a.id }))} style={{ background:av.accessory?.id===a.id?"rgba(232,184,75,0.1)":"transparent", border:`2px solid ${av.accessory?.id===a.id?G:BORDER}`, borderRadius:"8px", padding:"8px", cursor:"pointer" }}>
                      <span style={{ fontSize:"11px", color:av.accessory?.id===a.id?G:"#a8a49e" }}>{a.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button onClick={() => setScreen("world")} style={{ width:"100%", background:G, border:"none", borderRadius:"12px", padding:"12px", color:BG, fontWeight:"800", fontSize:"15px", cursor:"pointer", marginTop:"1rem" }}>
            Enter World with this look ✓
          </button>
        </div>
      )}

      {/* HOME SHOP SCREEN */}
      {screen === "shop" && (
        <div style={{ padding:"1rem" }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"16px", fontWeight:"800", color:G, marginBottom:"4px" }}>🏠 Furnish Your Home</div>
          <div style={{ fontSize:"12px", color:"#6b6760", marginBottom:"1rem" }}>You have {homeFurniture.length} items placed</div>
          <div style={{ fontWeight:"700", fontSize:"13px", color:"#f0ede8", marginBottom:"8px" }}>Living Room</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"1rem" }}>
            {FURNITURE.living.map(item => {
              const owned = homeFurniture.find(f => f.id === item.id);
              return (
                <div key={item.id} onClick={() => !owned && buyFurniture(item)} style={{ background:owned?"rgba(16,185,129,0.08)":BG2, border:`1px solid ${owned?"rgba(16,185,129,0.3)":BORDER}`, borderRadius:"12px", padding:"12px", cursor:owned?"default":"pointer", display:"flex", gap:"10px", alignItems:"center" }}>
                  <div style={{ fontSize:"28px" }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:"600", color:owned?"#4ade80":"#f0ede8" }}>{item.label}</div>
                    {owned
                      ? <div style={{ fontSize:"10px", color:"#4ade80" }}>✓ Placed</div>
                      : <div style={{ fontSize:"11px", color:G }}>★ {item.price} coins</div>}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontWeight:"700", fontSize:"13px", color:"#f0ede8", marginBottom:"8px" }}>Bedroom</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
            {FURNITURE.bedroom.map(item => {
              const owned = homeFurniture.find(f => f.id === item.id);
              return (
                <div key={item.id} onClick={() => !owned && buyFurniture(item)} style={{ background:owned?"rgba(16,185,129,0.08)":BG2, border:`1px solid ${owned?"rgba(16,185,129,0.3)":BORDER}`, borderRadius:"12px", padding:"12px", cursor:owned?"default":"pointer", display:"flex", gap:"10px", alignItems:"center" }}>
                  <div style={{ fontSize:"28px" }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:"600", color:owned?"#4ade80":"#f0ede8" }}>{item.label}</div>
                    {owned
                      ? <div style={{ fontSize:"10px", color:"#4ade80" }}>✓ Placed</div>
                      : <div style={{ fontSize:"11px", color:G }}>★ {item.price} coins</div>}
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => setScreen("world")} style={{ width:"100%", background:G, border:"none", borderRadius:"12px", padding:"12px", color:BG, fontWeight:"800", fontSize:"14px", cursor:"pointer", marginTop:"1rem" }}>Back to World</button>
        </div>
      )}

      {/* WORLD SCREEN */}
      {screen === "world" && (
        <div>
          {/* Room info bar */}
          <div style={{ padding:"6px 1rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:"14px", fontWeight:"800" }}>{room.label}</span>
              <span style={{ fontSize:"11px", color:"#6b6760", marginLeft:"8px" }}>{room.sublabel}</span>
            </div>
            {room.people > 0 && <div style={{ fontSize:"11px", color:"#4ade80" }}>● {room.people + 1} here</div>}
          </div>

          {/* Main canvas */}
          <div ref={canvasRef} onClick={handleCanvasClick} style={{ position:"relative", height:"300px", cursor:"pointer", overflow:"hidden", margin:"0" }}>
            <RoomBackground roomKey={roomKey} />

            {/* Furniture in home */}
            {roomKey === "home" && homeFurniture.map((item, i) => (
              <div key={item.id} style={{ position:"absolute", bottom:`${14 + (i%2)*8}%`, left:`${10 + (i*14)%75}%`, fontSize:"24px", zIndex:3, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }}>{item.icon}</div>
            ))}

            {/* NPCs */}
            {room.npcs.map((npc, i) => (
              <div key={npc.name} onClick={e => { e.stopPropagation(); npcTap(npc); }} style={{ position:"absolute", bottom:"14%", left:`${npc.x}%`, transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:"2px", cursor:"pointer", zIndex:4 }}>
                {npcSpeech[npc.name] && (
                  <div style={{ background:"rgba(255,255,255,0.95)", color:"#0f172a", borderRadius:"10px", padding:"4px 8px", fontSize:"10px", fontWeight:"600", maxWidth:"80px", textAlign:"center", marginBottom:"2px", boxShadow:"0 2px 8px rgba(0,0,0,0.3)", lineHeight:1.3 }}>
                    {npcSpeech[npc.name]}
                    <div style={{ position:"absolute", bottom:"-5px", left:"50%", transform:"translateX(-50%)", width:0, height:0, borderLeft:"5px solid transparent", borderRight:"5px solid transparent", borderTop:"5px solid rgba(255,255,255,0.95)" }} />
                  </div>
                )}
                <AvatarSVG skin={npc.skin} hairColor={npc.hair} topItem={{ color:npc.top }} bottomItem={{ color:npc.bottom }} shoeItem={{ color:"#1e293b", accent:"#334155" }} size={0.7} />
                <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.7)", fontWeight:"600", textShadow:"0 1px 3px rgba(0,0,0,0.8)" }}>{npc.name}</div>
              </div>
            ))}

            {/* My avatar */}
            <div style={{ position:"absolute", bottom:"14%", left:`${avatarX}%`, transform:`translateX(-50%) ${isWalking ? "scaleX(avatarX > 50 ? 1 : -1)" : ""}`, display:"flex", flexDirection:"column", alignItems:"center", gap:"2px", zIndex:5, transition:"left 0.25s ease" }}>
              {speechBubble && (
                <div style={{ background:"rgba(255,255,255,0.97)", color:"#0f172a", borderRadius:"12px", padding:"5px 10px", fontSize:"11px", fontWeight:"700", maxWidth:"100px", textAlign:"center", marginBottom:"2px", position:"relative", boxShadow:"0 3px 10px rgba(0,0,0,0.4)", lineHeight:1.3, whiteSpace:"nowrap" }}>
                  {speechBubble}
                  <div style={{ position:"absolute", bottom:"-6px", left:"50%", transform:"translateX(-50%)", width:0, height:0, borderLeft:"6px solid transparent", borderRight:"6px solid transparent", borderTop:"6px solid rgba(255,255,255,0.97)" }} />
                </div>
              )}
              <AvatarSVG {...av} size={0.9} />
              <div style={{ fontSize:"9px", color:G, fontWeight:"700", textShadow:"0 1px 3px rgba(0,0,0,0.9)" }}>{av.name}</div>
            </div>

            {/* Control bar */}
            <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"46px", background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", gap:"16px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
              <button onClick={() => moveAvatar(-1)} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"8px", padding:"6px 14px", color:"white", fontSize:"18px", cursor:"pointer" }}>←</button>
              <button onClick={doWave} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"8px", padding:"6px 12px", color:"white", fontSize:"16px", cursor:"pointer" }} title="Wave">👋</button>
              <button onClick={doDance} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"8px", padding:"6px 12px", color:"white", fontSize:"16px", cursor:"pointer" }} title="Dance">🕺</button>
              <button onClick={doSit} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"8px", padding:"6px 12px", color:"white", fontSize:"16px", cursor:"pointer" }} title="Sit">😌</button>
              <button onClick={() => moveAvatar(1)} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"8px", padding:"6px 14px", color:"white", fontSize:"18px", cursor:"pointer" }}>→</button>
            </div>

            {/* Tap NPCs hint */}
            {room.npcs.length > 0 && (
              <div style={{ position:"absolute", top:"8px", right:"8px", fontSize:"9px", color:"rgba(255,255,255,0.4)", background:"rgba(0,0,0,0.4)", borderRadius:"4px", padding:"3px 6px" }}>Tap characters to chat</div>
            )}
          </div>

          {/* Chat + quick actions */}
          <div style={{ padding:"8px 1rem", display:"grid", gridTemplateColumns:"1fr auto", gap:"8px" }}>
            <div style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"12px", overflow:"hidden" }}>
              <div ref={chatRef} style={{ height:"100px", overflowY:"auto", padding:"8px" }}>
                {chatMessages.map((m, i) => (
                  <div key={i} style={{ fontSize:"11px", padding:"2px 0", borderBottom:"1px solid rgba(255,255,255,0.04)", color:m.who==="System"?"#6b6760":m.who===av.name?"#e8b84b":"#f0ede8" }}>
                    <span style={{ fontWeight:"700" }}>{m.who}: </span>{m.msg}
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:"6px", padding:"6px 8px", borderTop:`1px solid ${BORDER}` }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} placeholder="Say something..." style={{ ...inp, flex:1, padding:"6px 10px", fontSize:"12px" }} />
                <button onClick={sendChat} style={{ background:G, border:"none", borderRadius:"6px", padding:"6px 12px", color:BG, fontWeight:"800", fontSize:"12px", cursor:"pointer" }}>→</button>
              </div>
            </div>
            {/* Quick chat */}
            <div style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
              {room.quickChatOptions.slice(0,4).map((q, i) => (
                <button key={i} onClick={() => { setChatInput(q); setTimeout(sendChat, 50); }} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"6px", padding:"4px 8px", color:"#6b6760", fontSize:"9px", cursor:"pointer", textAlign:"left", whiteSpace:"nowrap", maxWidth:"110px", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Earn coins hint */}
          <div style={{ margin:"0 1rem 1rem", background:"rgba(232,184,75,0.05)", border:`1px solid ${BORDER}`, borderRadius:"10px", padding:"8px 12px", fontSize:"11px", color:"#6b6760" }}>
            ★ Earn coins: Move (+1) · Chat (+1) · Dance (+5) · Explore rooms (+3) · Meet people (+2)
          </div>
        </div>
      )}
    </div>
  );
}
