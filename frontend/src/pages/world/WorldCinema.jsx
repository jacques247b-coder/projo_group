// PROJO WORLD — Cinema Watch Together
import React, { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const G="#e8b84b"; const BG="#0a0a0a"; const BG2="#111111"; const BG3="#1a1a1a"; const BORDER="rgba(232,184,75,0.15)";
const REACTIONS = ["🔥","😂","❤️","😮","👏","🍿","😭","💯"];

const FEATURED_CHANNELS = [
  { name:"Amapiano TV", query:"amapiano 2025 official", icon:"🎵" },
  { name:"SA Comedy", query:"south african comedy 2025", icon:"😂" },
  { name:"Mzansi Movies", query:"south african short film 2025", icon:"🎬" },
  { name:"Gospel SA", query:"south african gospel music 2025", icon:"🙏" },
  { name:"SA Sports", query:"bafana bafana south africa soccer", icon:"⚽" },
  { name:"Afrikaans", query:"afrikaans musiek 2025", icon:"🎤" },
  { name:"Kwaito Classics", query:"kwaito classic hits", icon:"🎶" },
  { name:"SA News", query:"south africa news today", icon:"📺" },
  { name:"Braai & Food", query:"south african braai recipes", icon:"🔥" },
  { name:"Stand Up SA", query:"south africa stand up comedy", icon:"🎭" },
];

function getYTId(url) {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function getYTSearch(q) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

export default function WorldCinema({ userName }) {
  const [parties, setParties]     = useState([]);
  const [activeParty, setActiveParty] = useState(null);
  const [messages, setMessages]   = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [videoUrl, setVideoUrl]   = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [channelSearch, setChannelSearch] = useState("");
  const [creating, setCreating]   = useState(false);
  const [screen, setScreen]       = useState("lobby"); // lobby | party | create
  const chatRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => { loadParties(); return () => clearInterval(pollRef.current); }, []);
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  async function loadParties() {
    try { const d = await api.get("/world/cinema/party/active"); setParties(d.parties || []); }
    catch {}
  }

  async function createParty() {
    if (!videoUrl.trim()) return toast.error("Paste a YouTube URL or search below");
    setCreating(true);
    try {
      const d = await api.post("/world/cinema/party", { videoUrl, videoTitle: videoTitle || "Watch Party", channelName: channelSearch });
      setActiveParty(d.party);
      setMessages([]);
      setScreen("party");
      startPolling(d.party.id);
      toast.success("Watch party started! 🎬");
    } catch(e) { toast.error("Could not start party"); }
    setCreating(false);
  }

  async function joinParty(party) {
    try {
      const d = await api.post(`/world/cinema/party/${party.id}/join`);
      setActiveParty(d.party);
      setMessages((d.party.messages || []).reverse());
      setVideoUrl(d.party.videoUrl);
      setScreen("party");
      startPolling(party.id);
    } catch { toast.error("Could not join party"); }
  }

  function startPolling(id) {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const d = await api.post(`/world/cinema/party/${id}/join`);
        setMessages((d.party.messages || []).reverse());
      } catch {}
    }, 4000);
  }

  async function sendMessage(reaction = null) {
    const body = reaction ? reaction : chatInput.trim();
    if (!body || !activeParty) return;
    try {
      await api.post(`/world/cinema/party/${activeParty.id}/message`, { body, reaction });
      setChatInput("");
      const d = await api.post(`/world/cinema/party/${activeParty.id}/join`);
      setMessages((d.party.messages || []).reverse());
    } catch {}
  }

  async function endParty() {
    if (!activeParty) return;
    try { await api.post(`/world/cinema/party/${activeParty.id}/end`); }
    catch {}
    clearInterval(pollRef.current);
    setActiveParty(null); setScreen("lobby"); setVideoUrl(""); loadParties();
    toast.success("Watch party ended");
  }

  const ytId = getYTId(videoUrl);
  const inp = { background:BG3, border:`1px solid ${BORDER}`, borderRadius:"8px", color:"#f0ede8", padding:"9px 12px", fontSize:"13px", outline:"none", fontFamily:"'DM Sans',sans-serif", width:"100%", boxSizing:"border-box" };

  // ── ACTIVE PARTY ──────────────────────────────────────────────
  if (screen === "party" && activeParty) return (
    <div style={{ background:BG, color:"#f0ede8", fontFamily:"'DM Sans',sans-serif" }}>
      {/* Header */}
      <div style={{ background:BG2, borderBottom:`1px solid ${BORDER}`, padding:"8px 1rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"14px", fontWeight:"800", color:G }}>🎬 {activeParty.videoTitle || "Watch Party"}</div>
          <div style={{ fontSize:"10px", color:"#6b6760" }}>Hosted by {activeParty.host?.name || "you"} · {activeParty.memberCount || 1} watching</div>
        </div>
        <div style={{ display:"flex", gap:"6px" }}>
          <button onClick={() => { clearInterval(pollRef.current); setScreen("lobby"); loadParties(); }} style={{ background:BG3, border:`1px solid ${BORDER}`, borderRadius:"6px", padding:"5px 10px", color:"#6b6760", fontSize:"11px", cursor:"pointer" }}>← Leave</button>
          {activeParty.hostId === activeParty.host?.id && <button onClick={endParty} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:"6px", padding:"5px 10px", color:"#ef4444", fontSize:"11px", cursor:"pointer" }}>End Party</button>}
        </div>
      </div>
      {/* Video player */}
      <div style={{ position:"relative", paddingBottom:"56.25%", background:"#000" }}>
        {ytId ? (
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
            style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%" }}
            allow="autoplay; fullscreen"
            allowFullScreen
            title="Watch Party"
          />
        ) : (
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"#050505", flexDirection:"column", gap:"8px" }}>
            <div style={{ fontSize:"40px" }}>🎬</div>
            <a href={videoUrl} target="_blank" rel="noreferrer" style={{ color:"#3b82f6", fontSize:"13px" }}>Open in browser →</a>
          </div>
        )}
      </div>
      {/* Reactions bar */}
      <div style={{ background:BG2, borderBottom:`1px solid ${BORDER}`, padding:"6px 1rem", display:"flex", gap:"6px", overflowX:"auto" }}>
        {REACTIONS.map(r => (
          <button key={r} onClick={() => sendMessage(r)} style={{ background:BG3, border:`1px solid ${BORDER}`, borderRadius:"20px", padding:"4px 10px", cursor:"pointer", fontSize:"16px" }}>{r}</button>
        ))}
      </div>
      {/* Live chat */}
      <div ref={chatRef} style={{ height:"140px", overflowY:"auto", padding:"8px 1rem", background:BG }}>
        {messages.map((m, i) => (
          <div key={i} style={{ fontSize:"11px", padding:"2px 0", borderBottom:"1px solid rgba(255,255,255,0.03)", color:"#f0ede8" }}>
            <span style={{ fontWeight:"700", color:G }}>{m.user?.name || "Viewer"}: </span>
            {m.reaction ? <span style={{ fontSize:"16px" }}>{m.body}</span> : m.body}
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:"6px", padding:"8px 1rem", borderTop:`1px solid ${BORDER}` }}>
        <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key==="Enter" && sendMessage()} placeholder="Chat live..." style={{ ...inp, flex:1 }} />
        <button onClick={() => sendMessage()} style={{ background:G, border:"none", borderRadius:"8px", padding:"8px 14px", color:BG, fontWeight:"800", cursor:"pointer" }}>→</button>
      </div>
    </div>
  );

  // ── CREATE / LOBBY ────────────────────────────────────────────
  return (
    <div style={{ background:BG, color:"#f0ede8", fontFamily:"'DM Sans',sans-serif", padding:"1rem" }}>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"18px", fontWeight:"800", color:G, marginBottom:"4px" }}>🎬 Cinema</div>
      <div style={{ fontSize:"12px", color:"#6b6760", marginBottom:"1rem" }}>Start a watch party · Invite friends · Chat live</div>

      {/* Start party */}
      <div style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"14px", padding:"1rem", marginBottom:"1rem" }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"13px", fontWeight:"800", color:G, marginBottom:"10px" }}>▶️ Start a Watch Party</div>
        <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="Paste YouTube URL here..." style={{ ...inp, marginBottom:"8px" }} />
        <input value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="Party name (optional)" style={{ ...inp, marginBottom:"8px" }} />
        <button onClick={createParty} disabled={creating || !videoUrl} style={{ width:"100%", background:videoUrl?G:"#333", border:"none", borderRadius:"10px", padding:"11px", color:BG, fontWeight:"800", fontSize:"14px", cursor:videoUrl?"pointer":"not-allowed" }}>
          {creating ? "Starting..." : "🎬 Start Watch Party"}
        </button>
      </div>

      {/* Channel browser */}
      <div style={{ marginBottom:"1rem" }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"13px", fontWeight:"800", marginBottom:"8px" }}>Browse Channels</div>
        <input value={channelSearch} onChange={e => setChannelSearch(e.target.value)} placeholder="Search any channel or topic..." style={{ ...inp, marginBottom:"10px" }} />
        {channelSearch.length > 1 && (
          <a href={getYTSearch(channelSearch)} target="_blank" rel="noreferrer" style={{ display:"block", background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.3)", borderRadius:"10px", padding:"10px 14px", color:"#3b82f6", textDecoration:"none", fontSize:"13px", fontWeight:"700", marginBottom:"10px", textAlign:"center" }}>
            🔍 Search YouTube for "{channelSearch}" →
          </a>
        )}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
          {FEATURED_CHANNELS.map(ch => (
            <a key={ch.name} href={getYTSearch(ch.query)} target="_blank" rel="noreferrer" style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"10px", padding:"10px 12px", textDecoration:"none", display:"flex", gap:"8px", alignItems:"center" }}
              onMouseEnter={e => e.currentTarget.style.borderColor=G}
              onMouseLeave={e => e.currentTarget.style.borderColor=BORDER}>
              <span style={{ fontSize:"20px" }}>{ch.icon}</span>
              <span style={{ fontSize:"12px", color:"#f0ede8", fontWeight:"600" }}>{ch.name}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Active parties */}
      {parties.length > 0 && (
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"13px", fontWeight:"800", marginBottom:"8px" }}>
            🔴 Live Watch Parties ({parties.length})
          </div>
          {parties.map(party => (
            <div key={party.id} style={{ background:BG2, border:"1px solid rgba(239,68,68,0.25)", borderRadius:"12px", padding:"12px 14px", marginBottom:"8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontWeight:"700", fontSize:"13px", color:"#f0ede8" }}>{party.videoTitle}</div>
                <div style={{ fontSize:"11px", color:"#6b6760" }}>Hosted by {party.host?.name} · 👥 {party.memberCount}</div>
              </div>
              <button onClick={() => joinParty(party)} style={{ background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:"8px", padding:"7px 14px", color:"#ef4444", fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>
                Join
              </button>
            </div>
          ))}
        </div>
      )}

      {parties.length === 0 && (
        <div style={{ textAlign:"center", padding:"2rem", color:"#6b6760", fontSize:"12px" }}>
          <div style={{ fontSize:"36px", marginBottom:"8px" }}>🎬</div>
          No live parties right now — be the first to start one!
        </div>
      )}
    </div>
  );
}
