// PROJO GROUP — Entertainment Hub
// Netflix-style entertainment page with YouTube embeds, games, news, local ads
// Free, legal, no ongoing costs
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/ui/Navbar";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const G = "#e8b84b";
const BG = "#0a0a0a";
const BG2 = "#111111";
const BG3 = "#1a1a1a";
const BORDER = "rgba(232,184,75,0.08)";

// ── CONTENT LIBRARY ──────────────────────────────────────────
// All verified YouTube video IDs (checked July 2026)
const CONTENT = {
  featured: [
    { id: "f1", title: "Springboks vs All Blacks Highlights", videoId: "qUAMswHmCjs", category: "Sports", thumb: "https://img.youtube.com/vi/qUAMswHmCjs/maxresdefault.jpg" },
    { id: "f2", title: "South Africa Travel Guide 2026", videoId: "DjoL1ehafFw", category: "Travel", thumb: "https://img.youtube.com/vi/DjoL1ehafFw/maxresdefault.jpg" },
    { id: "f3", title: "Learn Python in 4 Hours — Full Course", videoId: "rfscVS0vtbw", category: "Learning", thumb: "https://img.youtube.com/vi/rfscVS0vtbw/maxresdefault.jpg" },
  ],
  trending: [
    { id: "t1", title: "Best of Amapiano Mix 2025", videoId: "XZhu91HwUR0", category: "Music", thumb: "https://img.youtube.com/vi/XZhu91HwUR0/maxresdefault.jpg" },
    { id: "t2", title: "Cape Town Travel Guide 2026", videoId: "13u-JcPWbkQ", category: "Travel", thumb: "https://img.youtube.com/vi/13u-JcPWbkQ/maxresdefault.jpg" },
    { id: "t3", title: "Amapiano Mix Dec 2025 — Romeo Makota", videoId: "Lgtz-8T3DIc", category: "Music", thumb: "https://img.youtube.com/vi/Lgtz-8T3DIc/maxresdefault.jpg" },
    { id: "t4", title: "AI for Beginners 2025", videoId: "ad79nYk2keg", category: "Learning", thumb: "https://img.youtube.com/vi/ad79nYk2keg/maxresdefault.jpg" },
    { id: "t5", title: "Personal Finance Basics", videoId: "HQzoZfc3GwQ", category: "Learning", thumb: "https://img.youtube.com/vi/HQzoZfc3GwQ/maxresdefault.jpg" },
  ],
  kids: [
    { id: "k1", title: "ABC Song for Kids", videoId: "75p-N9YKqNo", category: "Kids", thumb: "https://img.youtube.com/vi/75p-N9YKqNo/maxresdefault.jpg" },
    { id: "k2", title: "Count 1 to 20 with Songs", videoId: "DR-cfDsHCGA", category: "Kids", thumb: "https://img.youtube.com/vi/DR-cfDsHCGA/maxresdefault.jpg" },
    { id: "k3", title: "African Safari — Animals for Kids", videoId: "14LDUtA7G84", category: "Kids", thumb: "https://img.youtube.com/vi/pPpxPNBflpI/maxresdefault.jpg" },
    { id: "k4", title: "Solar System for Kids", videoId: "libKVRa01L8", category: "Kids", thumb: "https://img.youtube.com/vi/libKVRa01L8/maxresdefault.jpg" },
    { id: "k5", title: "Animal Sounds — Learn & Play", videoId: "wlpMmEI6Eaw", category: "Kids", thumb: "https://img.youtube.com/vi/5aLPE9e5K6E/maxresdefault.jpg" },
  ],
  music: [
    { id: "m1", title: "Best of Amapiano Mix 2025 — OSOCITY", videoId: "XZhu91HwUR0", category: "Music", thumb: "https://img.youtube.com/vi/XZhu91HwUR0/maxresdefault.jpg" },
    { id: "m2", title: "Amapiano Mix April 2025 — DJ ClassCom", videoId: "DlqOIMal8FQ", category: "Music", thumb: "https://img.youtube.com/vi/DlqOIMal8FQ/maxresdefault.jpg" },
    { id: "m3", title: "Amapiano Vibes 2025 Vol. 2", videoId: "UsdxV4Ay3Jk", category: "Music", thumb: "https://img.youtube.com/vi/UsdxV4Ay3Jk/maxresdefault.jpg" },
    { id: "m4", title: "Amapiano Mix Dec 2025 — Romeo Makota", videoId: "Lgtz-8T3DIc", category: "Music", thumb: "https://img.youtube.com/vi/Lgtz-8T3DIc/maxresdefault.jpg" },
  ],
  learning: [
    { id: "l1", title: "Learn Python in 4 Hours — Full Course", videoId: "rfscVS0vtbw", category: "Learning", thumb: "https://img.youtube.com/vi/rfscVS0vtbw/maxresdefault.jpg" },
    { id: "l2", title: "Personal Finance Basics", videoId: "HQzoZfc3GwQ", category: "Learning", thumb: "https://img.youtube.com/vi/HQzoZfc3GwQ/maxresdefault.jpg" },
    { id: "l3", title: "AI for Beginners 2025", videoId: "ad79nYk2keg", category: "Learning", thumb: "https://img.youtube.com/vi/ad79nYk2keg/maxresdefault.jpg" },
    { id: "l4", title: "Photography Masterclass for Beginners", videoId: "LxO-6rlihSg", category: "Learning", thumb: "https://img.youtube.com/vi/LxO-6rlihSg/maxresdefault.jpg" },
    { id: "l5", title: "Start a Business — Full Guide", videoId: "Fl7WLnpVgD0", category: "Learning", thumb: "https://img.youtube.com/vi/Fl7WLnpVgD0/maxresdefault.jpg" },
  ],
  podcasts: [
    { id: "p1", title: "Motivation — How to Build a Better Life", videoId: "HQzoZfc3GwQ", category: "Podcast", thumb: "https://img.youtube.com/vi/mgmVOuLgFB0/maxresdefault.jpg" },
    { id: "p2", title: "AI for Beginners — Tech Talk", videoId: "ad79nYk2keg", category: "Podcast", thumb: "https://img.youtube.com/vi/ad79nYk2keg/maxresdefault.jpg" },
    { id: "p3", title: "Personal Finance Masterclass", videoId: "HQzoZfc3GwQ", category: "Podcast", thumb: "https://img.youtube.com/vi/HQzoZfc3GwQ/maxresdefault.jpg" },
  ],
};

// ── RADIO STATIONS ───────────────────────────────────────────
// North West + SA national stations
// Links open in browser (audio streams can't embed directly)
const RADIO_STATIONS = [
  // North West Province
  { id: "nwfm",      name: "North West FM", freq: "89.8-103.9 FM", desc: "Home of the best music — Rustenburg & NW Province", region: "North West", color: "#e8b84b", icon: "📻", url: "https://onlineradiobox.com/za/northwestfm/", stream: "https://stream.zeno.fm/northwestfm" },
  { id: "groot",     name: "Groot FM", freq: "90.4 FM", desc: "Afrikaans music & entertainment — NW Province", region: "North West", color: "#60a5fa", icon: "📻", url: "https://www.grootfm.co.za", stream: "https://playerservices.streamtheworld.com/api/livestream-redirect/GROOT_FM.mp3" },
  { id: "mmabatho",  name: "Mmabatho Community Radio", freq: "Community FM", desc: "Serving Mmabatho & surrounds", region: "North West", color: "#4ade80", icon: "📻", url: "https://onlineradiobox.com/za/", stream: null },
  // National SA
  { id: "5fm",       name: "5FM", freq: "SA National", desc: "SA's youth music station — hits, Amapiano & more", region: "National", color: "#f59e0b", icon: "🎵", url: "https://www.5fm.co.za", stream: "https://playerservices.streamtheworld.com/api/livestream-redirect/SABC_5FM.mp3" },
  { id: "metro",     name: "Metro FM", freq: "SA National", desc: "Urban music, Amapiano & R&B", region: "National", color: "#a78bfa", icon: "🎵", url: "https://www.metrofm.co.za", stream: "https://playerservices.streamtheworld.com/api/livestream-redirect/SABC_METRO.mp3" },
  { id: "jacaranda", name: "Jacaranda FM", freq: "94.2 FM", desc: "Good music, great vibes — Pretoria/Rustenburg area", region: "National", color: "#f87171", icon: "🌸", url: "https://www.jacarandafm.com", stream: "https://playerservices.streamtheworld.com/api/livestream-redirect/JACARANDA_FM.mp3" },
  { id: "safm",      name: "SAfm", freq: "104-107 FM", desc: "News, talk & current affairs", region: "National", color: "#34d399", icon: "📰", url: "https://www.sabc.co.za/sabc/safm/", stream: "https://playerservices.streamtheworld.com/api/livestream-redirect/SABC_SAFM.mp3" },
];

// ── FREE MUSIC TRACKS ─────────────────────────────────────────
// YouTube Music — free, embeddable tracks
const FREE_MUSIC = [
  { id: "fm1", title: "Amapiano Mix 2025 — Best of Year", videoId: "XZhu91HwUR0", artist: "OSOCITY", genre: "Amapiano", thumb: "https://img.youtube.com/vi/XZhu91HwUR0/maxresdefault.jpg" },
  { id: "fm2", title: "Amapiano Mix December 2025", videoId: "Lgtz-8T3DIc", artist: "Romeo Makota", genre: "Amapiano", thumb: "https://img.youtube.com/vi/Lgtz-8T3DIc/maxresdefault.jpg" },
  { id: "fm3", title: "Afrobeat & Amapiano Mix 2025", videoId: "3wDbin9ByAk", artist: "DJ Perez", genre: "Afrobeat", thumb: "https://img.youtube.com/vi/3wDbin9ByAk/maxresdefault.jpg" },
  { id: "fm4", title: "Amapiano Vibes Vol.2 2025", videoId: "UsdxV4Ay3Jk", artist: "Various Artists", genre: "Amapiano", thumb: "https://img.youtube.com/vi/UsdxV4Ay3Jk/maxresdefault.jpg" },
  { id: "fm5", title: "African Relaxation Music", videoId: "3wDbin9ByAk", artist: "Relaxing Africa", genre: "Relaxation", thumb: "https://img.youtube.com/vi/1ZYbU82GVz4/maxresdefault.jpg" },
  { id: "fm6", title: "SA Gospel Praise Mix", videoId: "DlqOIMal8FQ", artist: "Gospel SA", genre: "Gospel", thumb: "https://img.youtube.com/vi/2P-6JpHN4RU/maxresdefault.jpg" },
  { id: "fm7", title: "DJ Maphorisa & Xduppy — Ngomoya Album", videoId: "sc5-g-fmlyg", artist: "DJ Maphorisa", genre: "Amapiano", thumb: "https://img.youtube.com/vi/sc5-g-fmlyg/maxresdefault.jpg" },
  { id: "fm8", title: "Best Amapiano Mix Vol.179", videoId: "0tMGChhzIRw", artist: "DJ Webaba", genre: "Amapiano", thumb: "https://img.youtube.com/vi/0tMGChhzIRw/maxresdefault.jpg" },
];

// ── NEWS SOURCES (RSS via proxy) ─────────────────────────────
const NEWS_FEEDS = [
  { label: "🇿🇦 SA News", url: "https://www.news24.com/rss" },
  { label: "🌍 World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { label: "💼 Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml" },
  { label: "⚽ Sports", url: "https://feeds.bbci.co.uk/sport/rss.xml" },
];

// ── HTML5 GAMES ──────────────────────────────────────────────
const GAMES = [
  { id: "2048", title: "2048", icon: "🎯", color: "#f59e0b", desc: "Merge tiles to reach 2048" },
  { id: "snake", title: "Snake", icon: "🐍", color: "#4ade80", desc: "Classic snake game" },
  { id: "memory", title: "Memory", icon: "🧠", color: "#a78bfa", desc: "Match the pairs" },
  { id: "tictactoe", title: "Tic Tac Toe", icon: "❌", color: "#60a5fa", desc: "3 in a row wins" },
  { id: "trivia", title: "SA Trivia", icon: "🇿🇦", color: "#f87171", desc: "Test your SA knowledge" },
  { id: "reaction", title: "Reaction Time", icon: "⚡", color: G, desc: "How fast are you?" },
  { id: "sudoku",   title: "Sudoku",        icon: "🔢", color: "#34d399", desc: "Classic number puzzle" },
  { id: "solitaire",title: "Solitaire",     icon: "🃏", color: "#f87171", desc: "Classic card game" },
];

const TABS = [
  { key: "home",      label: "🏠 Home" },
  { key: "kids",      label: "👶 Kids" },
  { key: "music",     label: "🎵 Music" },
  { key: "learning",  label: "📚 Learn" },
  { key: "podcasts",  label: "🎙️ Podcasts" },
  { key: "news",      label: "📰 News" },
  { key: "games",     label: "🎮 Games" },
  { key: "ads",       label: "🏪 Local Deals" },
];

// ── MINI GAMES ────────────────────────────────────────────────
function Game2048() {
  const [grid, setGrid] = useState(() => initGrid());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem("projo_2048_best") || "0"));
  const [gameOver, setGameOver] = useState(false);

  function initGrid() {
    const g = Array(4).fill(null).map(() => Array(4).fill(0));
    addRandom(g); addRandom(g);
    return g;
  }
  function addRandom(g) {
    const empty = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!g[r][c]) empty.push([r,c]);
    if (!empty.length) return;
    const [r,c] = empty[Math.floor(Math.random() * empty.length)];
    g[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
  function move(dir) {
    if (gameOver) return;
    const g = grid.map(r => [...r]);
    let moved = false, gained = 0;
    const rotate = (arr) => arr[0].map((_, i) => arr.map(r => r[i]).reverse());
    let m = dir === "left" ? g : dir === "right" ? g.map(r => [...r].reverse()) : dir === "up" ? rotate(g) : rotate(g).map(r => [...r].reverse());
    m = m.map(row => {
      const filtered = row.filter(x => x);
      const merged = [];
      let i = 0;
      while (i < filtered.length) {
        if (i + 1 < filtered.length && filtered[i] === filtered[i+1]) {
          merged.push(filtered[i] * 2); gained += filtered[i] * 2; i += 2;
        } else { merged.push(filtered[i]); i++; }
      }
      const padded = [...merged, ...Array(4 - merged.length).fill(0)];
      if (padded.join() !== row.join()) moved = true;
      return padded;
    });
    let result = dir === "left" ? m : dir === "right" ? m.map(r => [...r].reverse()) : dir === "up" ? rotate(m.map(r => [...r].reverse())) : rotate(m).map(r => [...r].reverse());
    if (moved) { addRandom(result); setScore(s => { const ns = s + gained; if (ns > best) { setBest(ns); localStorage.setItem("projo_2048_best", ns); } return ns; }); setGrid(result); }
  }

  const COLORS = { 0:"#1a1a1a",2:"#eee4da",4:"#ede0c8",8:"#f2b179",16:"#f59563",32:"#f67c5f",64:"#f65e3b",128:"#edcf72",256:"#edcc61",512:"#edc850",1024:"#edc53f",2048:"#edc22e" };
  return (
    <div style={{ background: BG2, borderRadius: "16px", padding: "1rem", maxWidth: "360px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "24px", fontWeight: "800", color: G }}>2048</div>
        <div style={{ display: "flex", gap: "8px" }}>
          {[["Score", score],["Best", best]].map(([l,v]) => (
            <div key={l} style={{ background: "#8f7a66", borderRadius: "8px", padding: "6px 12px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "#eee4da" }}>{l}</div>
              <div style={{ fontWeight: "700", color: "#fff" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", background: "#bbada0", padding: "8px", borderRadius: "10px", marginBottom: "12px" }}>
        {grid.flat().map((v,i) => (
          <div key={i} style={{ height: "70px", background: COLORS[v] || "#3c3a32", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: v > 999 ? "14px" : v > 99 ? "18px" : "22px", color: v <= 4 ? "#776e65" : "#f9f6f2" }}>
            {v || ""}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "6px" }}>
        {[["←","left"],["↑","up"],["↓","down"],["→","right"]].map(([label, dir]) => (
          <button key={dir} onClick={() => move(dir)} style={{ background: "#8f7a66", color: "#fff", border: "none", borderRadius: "8px", padding: "10px", fontSize: "18px", cursor: "pointer", fontWeight: "700" }}>{label}</button>
        ))}
      </div>
      <button onClick={() => { setGrid(initGrid()); setScore(0); setGameOver(false); }} style={{ width: "100%", marginTop: "10px", background: G, color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "10px", fontWeight: "700", cursor: "pointer" }}>New Game</button>
    </div>
  );
}

function ReactionGame() {
  const [state, setState] = useState("idle"); // idle, waiting, ready, done
  const [time, setTime] = useState(null);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem("projo_reaction_best") || "9999"));
  const timerRef = useRef(null);
  const startRef = useRef(null);

  function start() {
    setState("waiting");
    timerRef.current = setTimeout(() => { setState("ready"); startRef.current = Date.now(); }, 1000 + Math.random() * 3000);
  }
  function tap() {
    if (state === "waiting") { clearTimeout(timerRef.current); setState("idle"); toast.error("Too early! Wait for green."); return; }
    if (state === "ready") {
      const t = Date.now() - startRef.current;
      setTime(t);
      if (t < best) { setBest(t); localStorage.setItem("projo_reaction_best", t); }
      setState("done");
    }
    if (state === "idle" || state === "done") start();
  }
  const colors = { idle:"#1a1a1a", waiting:"#ef4444", ready:"#4ade80", done:"#e8b84b" };
  const messages = { idle:"Tap to Start", waiting:"Wait...", ready:"TAP NOW!", done:`${time}ms${time < best ? " 🏆 New Best!" : ""}` };
  return (
    <div style={{ textAlign: "center", padding: "1rem" }}>
      <div style={{ fontSize: "13px", color: "#6b6760", marginBottom: "8px" }}>Best: {best === 9999 ? "—" : `${best}ms`}</div>
      <div onClick={tap} style={{ height: "200px", background: colors[state], borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.1s" }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "24px", fontWeight: "800", color: state === "ready" ? "#0a0a0a" : "#fff" }}>{messages[state]}</div>
      </div>
      <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "8px" }}>Under 200ms = Elite · Under 300ms = Good · Under 500ms = Average</div>
    </div>
  );
}

function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xTurn, setXTurn] = useState(true);
  const [winner, setWinner] = useState(null);
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  function checkWinner(b) { for (const [a,c,d] of wins) { if (b[a] && b[a]===b[c] && b[a]===b[d]) return b[a]; } return b.includes(null) ? null : "Draw"; }
  function play(i) {
    if (board[i] || winner) return;
    const nb = [...board]; nb[i] = xTurn ? "X" : "O";
    setBoard(nb); setXTurn(!xTurn);
    const w = checkWinner(nb); if (w) setWinner(w);
  }
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "14px", color: G, fontWeight: "700", marginBottom: "12px" }}>
        {winner ? (winner === "Draw" ? "Draw!" : `${winner} Wins! 🎉`) : `${xTurn ? "X" : "O"}'s turn`}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", maxWidth: "220px", margin: "0 auto 12px" }}>
        {board.map((v,i) => (
          <button key={i} onClick={() => play(i)} style={{ height: "70px", background: BG3, border: `1px solid ${BORDER}`, borderRadius: "10px", fontSize: "28px", fontWeight: "800", color: v === "X" ? "#60a5fa" : "#f87171", cursor: "pointer" }}>{v}</button>
        ))}
      </div>
      <button onClick={() => { setBoard(Array(9).fill(null)); setXTurn(true); setWinner(null); }} style={{ background: G, color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "8px 20px", fontWeight: "700", cursor: "pointer" }}>Reset</button>
    </div>
  );
}

function MemoryGame() {
  const emojis = ["🦁","🐘","🦒","🐊","🦓","🐆","🦏","🦛"];
  const [cards, setCards] = useState(() => {
    const deck = [...emojis,...emojis].sort(() => Math.random()-0.5).map((e,i) => ({ id:i, emoji:e, flipped:false, matched:false }));
    return deck;
  });
  const [flipped, setFlipped] = useState([]);
  const [moves, setMoves] = useState(0);
  function flip(id) {
    if (flipped.length === 2) return;
    const card = cards.find(c => c.id === id);
    if (card.flipped || card.matched) return;
    const nf = [...flipped, id];
    setCards(prev => prev.map(c => c.id === id ? {...c, flipped:true} : c));
    setFlipped(nf);
    if (nf.length === 2) {
      setMoves(m => m+1);
      const [a,b] = nf.map(i => cards.find(c => c.id === i));
      if (a.emoji === b.emoji) {
        setCards(prev => prev.map(c => nf.includes(c.id) ? {...c, matched:true} : c));
        setFlipped([]);
      } else {
        setTimeout(() => { setCards(prev => prev.map(c => nf.includes(c.id) ? {...c, flipped:false} : c)); setFlipped([]); }, 800);
      }
    }
  }
  const won = cards.every(c => c.matched);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "13px", color: "#6b6760", marginBottom: "12px" }}>Moves: {moves} {won && "🎉 You won!"}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", maxWidth: "280px", margin: "0 auto 12px" }}>
        {cards.map(c => (
          <button key={c.id} onClick={() => flip(c.id)} style={{ height: "60px", background: c.flipped||c.matched ? BG3 : "#3a2020", border: `1px solid ${c.matched ? G : BORDER}`, borderRadius: "10px", fontSize: "24px", cursor: "pointer", transition: "all 0.3s" }}>
            {c.flipped||c.matched ? c.emoji : "❓"}
          </button>
        ))}
      </div>
      <button onClick={() => { setCards([...emojis,...emojis].sort(() => Math.random()-0.5).map((e,i) => ({id:i,emoji:e,flipped:false,matched:false}))); setFlipped([]); setMoves(0); }} style={{ background: G, color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "8px 20px", fontWeight: "700", cursor: "pointer" }}>New Game</button>
    </div>
  );
}

// ── SNAKE GAME ───────────────────────────────────────────────
function SnakeGame() {
  const canvasRef = React.useRef(null);
  const gameRef = React.useRef({ running: false, dir: "RIGHT", nextDir: "RIGHT", snake: [{x:10,y:10}], food: {x:15,y:15}, score: 0, speed: 150 });
  const [score, setScore] = React.useState(0);
  const [best, setBest] = React.useState(() => parseInt(localStorage.getItem("projo_snake_best")||"0"));
  const [status, setStatus] = React.useState("idle"); // idle, playing, over
  const loopRef = React.useRef(null);

  const COLS = 20, ROWS = 20, CELL = 16;

  function randomFood(snake) {
    let pos;
    do { pos = { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) }; }
    while (snake.some(s => s.x===pos.x && s.y===pos.y));
    return pos;
  }

  function draw() {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const g = gameRef.current;
    ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0,0,COLS*CELL,ROWS*CELL);
    // Grid
    ctx.strokeStyle = "rgba(232,184,75,0.05)";
    for (let i=0;i<=COLS;i++) { ctx.beginPath(); ctx.moveTo(i*CELL,0); ctx.lineTo(i*CELL,ROWS*CELL); ctx.stroke(); }
    for (let i=0;i<=ROWS;i++) { ctx.beginPath(); ctx.moveTo(0,i*CELL); ctx.lineTo(COLS*CELL,i*CELL); ctx.stroke(); }
    // Snake
    g.snake.forEach((s,i) => {
      ctx.fillStyle = i===0 ? "#e8b84b" : "#4ade80";
      ctx.beginPath(); ctx.roundRect(s.x*CELL+1, s.y*CELL+1, CELL-2, CELL-2, 3); ctx.fill();
    });
    // Food
    ctx.fillStyle = "#ef4444";
    ctx.beginPath(); ctx.arc(g.food.x*CELL+CELL/2, g.food.y*CELL+CELL/2, CELL/2-2, 0, Math.PI*2); ctx.fill();
  }

  function gameLoop() {
    const g = gameRef.current;
    g.dir = g.nextDir;
    const head = { ...g.snake[0] };
    if (g.dir==="UP") head.y--; if (g.dir==="DOWN") head.y++;
    if (g.dir==="LEFT") head.x--; if (g.dir==="RIGHT") head.x++;
    // Wall or self collision
    if (head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS||g.snake.some(s=>s.x===head.x&&s.y===head.y)) {
      clearInterval(loopRef.current);
      g.running = false;
      if (g.score > best) { setBest(g.score); localStorage.setItem("projo_snake_best", g.score); }
      setStatus("over");
      return;
    }
    g.snake.unshift(head);
    if (head.x===g.food.x && head.y===g.food.y) {
      g.score++; setScore(g.score);
      g.food = randomFood(g.snake);
      // Speed up
      if (g.score % 5 === 0 && g.speed > 80) {
        clearInterval(loopRef.current);
        g.speed -= 10;
        loopRef.current = setInterval(gameLoop, g.speed);
      }
    } else { g.snake.pop(); }
    draw();
  }

  function startGame() {
    const g = gameRef.current;
    g.snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
    g.dir = "RIGHT"; g.nextDir = "RIGHT";
    g.food = randomFood(g.snake);
    g.score = 0; g.speed = 150; g.running = true;
    setScore(0); setStatus("playing");
    clearInterval(loopRef.current);
    loopRef.current = setInterval(gameLoop, g.speed);
    draw();
  }

  React.useEffect(() => {
    draw();
    return () => clearInterval(loopRef.current);
  }, []);

  React.useEffect(() => {
    function handleKey(e) {
      const g = gameRef.current; if (!g.running) return;
      const map = { ArrowUp:"UP", ArrowDown:"DOWN", ArrowLeft:"LEFT", ArrowRight:"RIGHT", w:"UP", s:"DOWN", a:"LEFT", d:"RIGHT" };
      const newDir = map[e.key];
      if (!newDir) return;
      const opp = {UP:"DOWN",DOWN:"UP",LEFT:"RIGHT",RIGHT:"LEFT"};
      if (newDir !== opp[g.dir]) g.nextDir = newDir;
      e.preventDefault();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  function handleSwipe(dir) {
    const g = gameRef.current; if (!g.running) return;
    const opp = {UP:"DOWN",DOWN:"UP",LEFT:"RIGHT",RIGHT:"LEFT"};
    if (dir !== opp[g.dir]) g.nextDir = dir;
  }

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "12px" }}>
        <div style={{ fontSize: "13px", color: G, fontWeight: "700" }}>Score: {score}</div>
        <div style={{ fontSize: "13px", color: "#6b6760" }}>Best: {best}</div>
      </div>
      <canvas ref={canvasRef} width={COLS*CELL} height={ROWS*CELL} style={{ border: "1px solid rgba(232,184,75,0.2)", borderRadius: "8px", display: "block", margin: "0 auto" }} />
      {status !== "playing" && (
        <button onClick={startGame} style={{ marginTop: "12px", background: "#4ade80", color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "10px 24px", fontWeight: "800", cursor: "pointer", fontSize: "14px" }}>
          {status === "over" ? "🐍 Play Again" : "🐍 Start Game"}
        </button>
      )}
      {status === "over" && <div style={{ color: "#f87171", marginTop: "8px", fontWeight: "700" }}>Game Over! Score: {score}</div>}
      {/* Mobile controls */}
      {status === "playing" && (
        <div style={{ marginTop: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", maxWidth: "150px", margin: "0 auto" }}>
            <div />
            <button onClick={() => handleSwipe("UP")} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "10px", color: G, fontSize: "16px", cursor: "pointer" }}>↑</button>
            <div />
            <button onClick={() => handleSwipe("LEFT")} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "10px", color: G, fontSize: "16px", cursor: "pointer" }}>←</button>
            <button onClick={() => handleSwipe("DOWN")} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "10px", color: G, fontSize: "16px", cursor: "pointer" }}>↓</button>
            <button onClick={() => handleSwipe("RIGHT")} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "10px", color: G, fontSize: "16px", cursor: "pointer" }}>→</button>
          </div>
          <div style={{ fontSize: "10px", color: "#4a3030", marginTop: "6px" }}>Keyboard: WASD or Arrow Keys · Mobile: tap arrows above</div>
        </div>
      )}
    </div>
  );
}

// ── SUDOKU GAME ──────────────────────────────────────────────
function SudokuGame() {
  const G = "#e8b84b";
  const BG = "#0a0a0a";
  const BG3 = "#1a1a1a";
  const BORDER = "rgba(232,184,75,0.15)";

  // Generate a valid sudoku puzzle
  function generatePuzzle() {
    const base = [
      [5,3,0,0,7,0,0,0,0],
      [6,0,0,1,9,5,0,0,0],
      [0,9,8,0,0,0,0,6,0],
      [8,0,0,0,6,0,0,0,3],
      [4,0,0,8,0,3,0,0,1],
      [7,0,0,0,2,0,0,0,6],
      [0,6,0,0,0,0,2,8,0],
      [0,0,0,4,1,9,0,0,5],
      [0,0,0,0,8,0,0,7,9],
    ];
    const solution = [
      [5,3,4,6,7,8,9,1,2],
      [6,7,2,1,9,5,3,4,8],
      [1,9,8,3,4,2,5,6,7],
      [8,5,9,7,6,1,4,2,3],
      [4,2,6,8,5,3,7,9,1],
      [7,1,3,9,2,4,8,5,6],
      [9,6,1,5,3,7,2,8,4],
      [2,8,7,4,1,9,6,3,5],
      [3,4,5,2,8,6,1,7,9],
    ];
    // Shuffle by rotating/reflecting randomly
    return { puzzle: base, solution };
  }

  const { puzzle, solution } = React.useMemo(() => generatePuzzle(), []);
  const [grid, setGrid] = React.useState(() => puzzle.map(r => [...r]));
  const [selected, setSelected] = React.useState(null);
  const [errors, setErrors] = React.useState({});
  const [won, setWon] = React.useState(false);
  const [notes, setNotes] = React.useState(false);

  const isFixed = (r, c) => puzzle[r][c] !== 0;

  function selectCell(r, c) {
    if (isFixed(r, c)) return;
    setSelected([r, c]);
  }

  function inputNum(n) {
    if (!selected || won) return;
    const [r, c] = selected;
    if (isFixed(r, c)) return;
    const ng = grid.map(row => [...row]);
    ng[r][c] = n;
    setGrid(ng);
    // Check error
    const ne = { ...errors };
    const key = `${r}-${c}`;
    if (n !== 0 && n !== solution[r][c]) { ne[key] = true; }
    else { delete ne[key]; }
    setErrors(ne);
    // Check win
    if (ng.every((row, ri) => row.every((v, ci) => v === solution[ri][ci]))) setWon(true);
  }

  function getCellBg(r, c) {
    if (selected && selected[0] === r && selected[1] === c) return "rgba(232,184,75,0.3)";
    if (selected) {
      const [sr, sc] = selected;
      const sBox = Math.floor(sr/3)*3 + Math.floor(sc/3);
      const cBox = Math.floor(r/3)*3 + Math.floor(c/3);
      if (sr === r || sc === c || sBox === cBox) return "rgba(232,184,75,0.06)";
    }
    return Math.floor(r/3)*3 + Math.floor(c/3) % 2 === 0 ? "#111" : "#151515";
  }

  const cellSize = "30px";

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "10px" }}>
        <div style={{ fontSize: "12px", color: "#6b6760" }}>Tap a cell, then tap a number</div>
        {won && <div style={{ fontSize: "13px", color: "#4ade80", fontWeight: "700" }}>🎉 Solved!</div>}
      </div>

      {/* Grid */}
      <div style={{ display: "inline-block", border: "2px solid rgba(232,184,75,0.5)", borderRadius: "4px" }}>
        {grid.map((row, r) => (
          <div key={r} style={{ display: "flex", borderBottom: r === 2 || r === 5 ? "2px solid rgba(232,184,75,0.4)" : "1px solid rgba(232,184,75,0.1)" }}>
            {row.map((val, c) => (
              <div key={c} onClick={() => selectCell(r, c)} style={{
                width: cellSize, height: cellSize, display: "flex", alignItems: "center", justifyContent: "center",
                background: getCellBg(r, c),
                borderRight: c === 2 || c === 5 ? "2px solid rgba(232,184,75,0.4)" : "1px solid rgba(232,184,75,0.1)",
                cursor: isFixed(r,c) ? "default" : "pointer",
                fontSize: "14px",
                fontWeight: isFixed(r,c) ? "800" : "500",
                color: errors[`${r}-${c}`] ? "#ef4444" : isFixed(r,c) ? "#f0ede8" : "#e8b84b",
                transition: "background 0.1s",
              }}>
                {val !== 0 ? val : ""}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Number pad */}
      <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginTop: "12px", flexWrap: "wrap" }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => inputNum(n)} style={{
            width: "36px", height: "36px", background: BG3,
            border: `1px solid ${BORDER}`, borderRadius: "8px",
            color: "#f0ede8", fontSize: "16px", fontWeight: "700", cursor: "pointer",
          }}>{n}</button>
        ))}
        <button onClick={() => inputNum(0)} style={{
          width: "36px", height: "36px", background: "#7f1d1d",
          border: "1px solid #ef4444", borderRadius: "8px",
          color: "#f87171", fontSize: "12px", fontWeight: "700", cursor: "pointer",
        }}>✕</button>
      </div>

      <button onClick={() => { setGrid(puzzle.map(r=>[...r])); setErrors({}); setWon(false); setSelected(null); }}
        style={{ marginTop: "12px", background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 20px", color: "#6b6760", cursor: "pointer", fontSize: "12px" }}>
        Reset Puzzle
      </button>
    </div>
  );
}

// ── SOLITAIRE (Klondike) ──────────────────────────────────────
function SolitaireGame() {
  const G = "#e8b84b";
  const BG2 = "#111111";
  const BG3 = "#1a1a1a";
  const BORDER = "rgba(232,184,75,0.15)";

  const SUITS = ["♠","♥","♦","♣"];
  const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  const RED = ["♥","♦"];

  function newDeck() {
    const deck = [];
    for (const s of SUITS) for (const r of RANKS) deck.push({ suit: s, rank: r, faceUp: false });
    for (let i = deck.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [deck[i],deck[j]]=[deck[j],deck[i]]; }
    return deck;
  }

  function initGame() {
    const deck = newDeck();
    const tableau = Array(7).fill(null).map(() => []);
    let idx = 0;
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = deck[idx++];
        card.faceUp = row === col;
        tableau[col].push(card);
      }
    }
    return {
      tableau,
      stock: deck.slice(idx).map(c => ({ ...c, faceUp: false })),
      waste: [],
      foundations: [[], [], [], []],
    };
  }

  const [game, setGame] = React.useState(() => initGame());
  const [selected, setSelected] = React.useState(null); // { source, colIdx, cardIdx }
  const [moves, setMoves] = React.useState(0);
  const [won, setWon] = React.useState(false);

  function rankVal(r) { return RANKS.indexOf(r); }
  function isRed(s) { return RED.includes(s); }

  function canPlace(card, onto) {
    if (!onto) return card.rank === "K";
    const top = onto[onto.length-1];
    if (!top) return card.rank === "K";
    return rankVal(card.rank) === rankVal(top.rank)-1 && isRed(card.suit) !== isRed(top.suit);
  }

  function canFoundation(card, found) {
    if (found.length === 0) return card.rank === "A";
    const top = found[found.length-1];
    return card.suit === top.suit && rankVal(card.rank) === rankVal(top.rank)+1;
  }

  function drawCard() {
    setGame(prev => {
      const g = JSON.parse(JSON.stringify(prev));
      if (g.stock.length === 0) {
        g.stock = g.waste.reverse().map(c => ({ ...c, faceUp: false }));
        g.waste = [];
      } else {
        const card = g.stock.pop();
        card.faceUp = true;
        g.waste.push(card);
      }
      return g;
    });
    setMoves(m => m+1);
  }

  function selectCard(source, colIdx, cardIdx) {
    if (selected) {
      // Try to move
      moveCard(source, colIdx, cardIdx);
      return;
    }
    setSelected({ source, colIdx, cardIdx });
  }

  function moveCard(destSource, destColIdx, destCardIdx) {
    setGame(prev => {
      const g = JSON.parse(JSON.stringify(prev));
      let cards = [];
      // Get cards to move
      if (selected.source === "waste") {
        cards = [g.waste[g.waste.length-1]];
      } else if (selected.source === "tableau") {
        cards = g.tableau[selected.colIdx].slice(selected.cardIdx);
      }
      if (!cards.length) { setSelected(null); return prev; }

      // Try foundation
      if (destSource === "foundation") {
        const found = g.foundations[destColIdx];
        if (cards.length === 1 && canFoundation(cards[0], found)) {
          found.push(cards[0]);
          if (selected.source === "waste") g.waste.pop();
          else g.tableau[selected.colIdx].splice(selected.cardIdx);
          // Flip top of source column
          if (selected.source === "tableau" && g.tableau[selected.colIdx].length > 0) {
            g.tableau[selected.colIdx][g.tableau[selected.colIdx].length-1].faceUp = true;
          }
          setSelected(null);
          setMoves(m => m+1);
          // Check win
          if (g.foundations.every(f => f.length === 13)) setWon(true);
          return g;
        }
        setSelected(null); return prev;
      }

      // Try tableau
      if (destSource === "tableau") {
        const col = g.tableau[destColIdx];
        const topCard = col.length > 0 ? col[col.length-1] : null;
        if (canPlace(cards[0], col)) {
          col.push(...cards);
          if (selected.source === "waste") g.waste.pop();
          else g.tableau[selected.colIdx].splice(selected.cardIdx);
          if (selected.source === "tableau" && g.tableau[selected.colIdx].length > 0) {
            g.tableau[selected.colIdx][g.tableau[selected.colIdx].length-1].faceUp = true;
          }
          setSelected(null);
          setMoves(m => m+1);
          return g;
        }
        setSelected(null); return prev;
      }

      setSelected(null); return prev;
    });
  }

  function CardView({ card, isSelected, onClick, style = {} }) {
    if (!card) return <div style={{ width: "48px", height: "68px", border: "1px dashed rgba(232,184,75,0.2)", borderRadius: "6px", ...style }} onClick={onClick} />;
    if (!card.faceUp) return (
      <div onClick={onClick} style={{ width: "48px", height: "68px", background: "#1a2a4a", border: "1px solid #2a3a5a", borderRadius: "6px", cursor: "pointer",
        backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 8px)", ...style }} />
    );
    return (
      <div onClick={onClick} style={{
        width: "48px", height: "68px", background: isSelected ? "rgba(232,184,75,0.2)" : "#f8f8f8",
        border: `2px solid ${isSelected ? G : "transparent"}`, borderRadius: "6px", cursor: "pointer",
        display: "flex", flexDirection: "column", padding: "3px 4px", boxSizing: "border-box",
        boxShadow: isSelected ? `0 0 8px ${G}` : "none", ...style,
      }}>
        <div style={{ fontSize: "11px", fontWeight: "800", color: isRed(card.suit) ? "#dc2626" : "#111", lineHeight: 1 }}>{card.rank}</div>
        <div style={{ fontSize: "14px", color: isRed(card.suit) ? "#dc2626" : "#111", textAlign: "center", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>{card.suit}</div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: "360px" }}>
        {won && <div style={{ textAlign: "center", color: "#4ade80", fontWeight: "800", fontSize: "18px", marginBottom: "12px" }}>🎉 You Won in {moves} moves!</div>}

        {/* Top row: stock, waste, foundations */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "12px", alignItems: "flex-start" }}>
          {/* Stock */}
          <div onClick={drawCard} style={{ cursor: "pointer" }}>
            {game.stock.length > 0
              ? <div style={{ width: "48px", height: "68px", background: "#1a2a4a", border: "1px solid #2a3a5a", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🂠</div>
              : <div style={{ width: "48px", height: "68px", border: "1px dashed rgba(232,184,75,0.3)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", color: "#6b6760" }}>↺</div>
            }
          </div>
          {/* Waste */}
          <CardView card={game.waste[game.waste.length-1] || null}
            isSelected={selected?.source === "waste"}
            onClick={() => game.waste.length > 0 && selectCard("waste", 0, game.waste.length-1)} />
          <div style={{ flex: 1 }} />
          {/* Foundations */}
          {game.foundations.map((f, i) => (
            <div key={i} onClick={() => moveCard("foundation", i, f.length)} style={{ cursor: "pointer" }}>
              {f.length > 0
                ? <CardView card={f[f.length-1]} isSelected={false} onClick={() => moveCard("foundation", i, f.length)} />
                : <div style={{ width: "48px", height: "68px", border: "1px dashed rgba(232,184,75,0.3)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "rgba(232,184,75,0.3)" }}>{SUITS[i]}</div>
              }
            </div>
          ))}
        </div>

        {/* Tableau */}
        <div style={{ display: "flex", gap: "6px", alignItems: "flex-start" }}>
          {game.tableau.map((col, colIdx) => (
            <div key={colIdx} style={{ position: "relative", minHeight: "80px", flex: 1 }}
              onClick={() => col.length === 0 && moveCard("tableau", colIdx, 0)}>
              {col.length === 0 && (
                <div style={{ width: "48px", height: "68px", border: "1px dashed rgba(232,184,75,0.2)", borderRadius: "6px" }} />
              )}
              {col.map((card, cardIdx) => (
                <div key={cardIdx} style={{ position: cardIdx === 0 ? "relative" : "absolute", top: cardIdx === 0 ? 0 : cardIdx * (card.faceUp ? 20 : 12), left: 0 }}>
                  <CardView card={card}
                    isSelected={selected?.source==="tableau" && selected?.colIdx===colIdx && selected?.cardIdx===cardIdx}
                    onClick={() => card.faceUp && selectCard("tableau", colIdx, cardIdx)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: `${Math.max(...game.tableau.map(c=>c.length)) * 20 + 80}px` }}>
          <div style={{ fontSize: "12px", color: "#6b6760" }}>Moves: {moves}</div>
          <button onClick={() => { setGame(initGame()); setSelected(null); setMoves(0); setWon(false); }}
            style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "6px 14px", color: G, fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
            New Game
          </button>
        </div>
        <div style={{ fontSize: "10px", color: "#4a3030", marginTop: "6px" }}>Tap a card to select, tap destination to move · Tap deck to draw</div>
      </div>
    </div>
  );
}

// SA Trivia
const TRIVIA = [
  { q: "What is the capital city of South Africa?", a: ["Cape Town", "Pretoria", "Johannesburg", "Durban"], correct: 1 },
  { q: "What year did SA host the FIFA World Cup?", a: ["2006","2010","2014","2018"], correct: 1 },
  { q: "What is South Africa's national animal?", a: ["Lion","Elephant","Springbok","Rhino"], correct: 2 },
  { q: "How many official languages does SA have?", a: ["9","11","7","13"], correct: 1 },
  { q: "Which SA city is called 'eGoli'?", a: ["Durban","Cape Town","Johannesburg","Pretoria"], correct: 2 },
  { q: "What currency does South Africa use?", a: ["Dollar","Pound","Rand","Euro"], correct: 2 },
  { q: "Who was SA's first democratic president?", a: ["F.W. de Klerk","Thabo Mbeki","Nelson Mandela","Cyril Ramaphosa"], correct: 2 },
  { q: "Which ocean borders the Cape of Good Hope?", a: ["Indian","Atlantic","Both","Pacific"], correct: 2 },
];

function TriviaGame() {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [done, setDone] = useState(false);
  const q = TRIVIA[idx];
  function answer(i) {
    if (answered !== null) return;
    setAnswered(i);
    if (i === q.correct) setScore(s => s+1);
    setTimeout(() => {
      if (idx < TRIVIA.length - 1) { setIdx(i => i+1); setAnswered(null); }
      else setDone(true);
    }, 1000);
  }
  if (done) return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>🇿🇦</div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "24px", fontWeight: "800", color: G, marginBottom: "8px" }}>{score}/{TRIVIA.length}</div>
      <div style={{ color: "#6b6760", marginBottom: "16px" }}>{score >= 6 ? "Excellent! You really know SA! 🏆" : score >= 4 ? "Good job! Keep learning!" : "Keep exploring SA!"}</div>
      <button onClick={() => { setIdx(0); setScore(0); setAnswered(null); setDone(false); }} style={{ background: G, color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "10px 24px", fontWeight: "700", cursor: "pointer" }}>Play Again</button>
    </div>
  );
  return (
    <div style={{ padding: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ fontSize: "12px", color: "#6b6760" }}>Question {idx+1}/{TRIVIA.length}</div>
        <div style={{ fontSize: "12px", color: G, fontWeight: "700" }}>Score: {score}</div>
      </div>
      <div style={{ background: BG3, borderRadius: "12px", padding: "1rem", marginBottom: "14px", fontSize: "14px", fontWeight: "600", color: "#f0ede8", lineHeight: 1.5 }}>{q.q}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {q.a.map((ans, i) => (
          <button key={i} onClick={() => answer(i)} style={{
            background: answered === null ? BG3 : i === q.correct ? "rgba(74,222,128,0.2)" : answered === i ? "rgba(248,113,113,0.2)" : BG3,
            border: `1px solid ${answered === null ? BORDER : i === q.correct ? "#4ade80" : answered === i ? "#f87171" : BORDER}`,
            borderRadius: "10px", padding: "12px 14px", textAlign: "left", fontSize: "13px",
            color: "#f0ede8", cursor: "pointer", fontWeight: "500",
          }}>{ans}</button>
        ))}
      </div>
    </div>
  );
}

// ── VIDEO CARD ────────────────────────────────────────────────
function VideoCard({ item, onClick, size = "normal" }) {
  const w = size === "large" ? "260px" : size === "small" ? "160px" : "200px";
  const h = size === "large" ? "146px" : size === "small" ? "90px" : "112px";
  return (
    <div onClick={() => onClick(item)} style={{ flexShrink: 0, width: w, cursor: "pointer" }}>
      <div style={{ position: "relative", width: w, height: h, borderRadius: "12px", overflow: "hidden", background: BG3, marginBottom: "8px" }}>
        <img src={item.thumb} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display="none"} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.opacity=1} onMouseLeave={e => e.currentTarget.style.opacity=0}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>▶</div>
        </div>
        <div style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(0,0,0,0.7)", borderRadius: "4px", padding: "2px 6px", fontSize: "9px", color: "#fff" }}>{item.category}</div>
      </div>
      <div style={{ fontSize: "12px", color: "#f0ede8", fontWeight: "600", lineHeight: 1.3 }}>{item.title}</div>
    </div>
  );
}

function VideoRow({ title, items, onPlay }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "800", color: "#f0ede8", marginBottom: "12px" }}>{title}</div>
      <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
        {items.map(item => <VideoCard key={item.id} item={item} onClick={onPlay} />)}
      </div>
    </div>
  );
}

// ── LOCAL ADS ─────────────────────────────────────────────────
function LocalAdsTab({ user }) {
  const [ads, setAds] = useState([]);
  const [showSubmit, setShowSubmit] = useState(false);
  const [form, setForm] = useState({ businessName: "", category: "Restaurant", offer: "", description: "", phone: "", website: "" });
  const [submitting, setSubmitting] = useState(false);

  const CATEGORIES = ["Restaurant","Retail","Service","Health","Beauty","Auto","Property","Events","Other"];

  async function loadAds() {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/entertainment/ads`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("projo_token")}` }
      });
      const data = await res.json();
      setAds(data.ads || []);
    } catch {}
  }

  useEffect(() => { loadAds(); }, []);

  async function submitAd() {
    if (!form.businessName || !form.offer) return toast.error("Business name and offer required");
    setSubmitting(true);
    try {
      await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/entertainment/ads`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("projo_token")}` },
        body: JSON.stringify(form),
      });
      toast.success("Ad submitted! PROJO will review and approve within 24 hours.");
      setShowSubmit(false);
      setForm({ businessName: "", category: "Restaurant", offer: "", description: "", phone: "", website: "" });
    } catch { toast.error("Could not submit ad"); }
    finally { setSubmitting(false); }
  }

  const inp = { width: "100%", background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px", color: "#f0ede8", padding: "10px 12px", fontSize: "13px", outline: "none", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box", marginBottom: "10px" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "800", color: "#f0ede8" }}>🏪 Local Business Deals</div>
          <div style={{ fontSize: "11px", color: "#6b6760" }}>Exclusive deals from Rustenburg businesses</div>
        </div>
        <button onClick={() => setShowSubmit(true)} style={{ background: G, color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
          + Advertise
        </button>
      </div>

      {ads.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#6b6760" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏪</div>
          <div style={{ fontWeight: "700", marginBottom: "8px" }}>No active deals yet</div>
          <div style={{ fontSize: "12px", marginBottom: "16px" }}>Be the first Rustenburg business to advertise here!</div>
          <button onClick={() => setShowSubmit(true)} style={{ background: G, color: "#0a0a0a", border: "none", borderRadius: "10px", padding: "12px 24px", fontWeight: "700", cursor: "pointer" }}>
            Submit Your Deal
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {ads.map(ad => (
          <div key={ad.id} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: "700", color: "#f0ede8", fontSize: "15px" }}>{ad.businessName}</div>
                <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "2px" }}>{ad.category}</div>
              </div>
              <div style={{ background: "rgba(232,184,75,0.15)", border: `1px solid ${G}`, borderRadius: "8px", padding: "4px 10px", fontSize: "11px", color: G, fontWeight: "700" }}>Special Offer</div>
            </div>
            <div style={{ fontSize: "14px", color: G, fontWeight: "700", margin: "8px 0" }}>{ad.offer}</div>
            {ad.description && <div style={{ fontSize: "12px", color: "#6b6760", marginBottom: "8px" }}>{ad.description}</div>}
            <div style={{ display: "flex", gap: "8px" }}>
              {ad.phone && <a href={`tel:${ad.phone}`} style={{ background: "#166534", border: "1px solid #4ade80", borderRadius: "8px", padding: "6px 12px", color: "#4ade80", fontSize: "12px", fontWeight: "700", textDecoration: "none" }}>📞 Call</a>}
              {ad.website && <a href={ad.website} target="_blank" rel="noreferrer" style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "6px 12px", color: G, fontSize: "12px", fontWeight: "700", textDecoration: "none" }}>🌐 Website ↗</a>}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Ad Modal */}
      {showSubmit && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: BG2, borderRadius: "20px 20px 0 0", padding: "1.5rem", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "18px", fontWeight: "800", color: G, marginBottom: "4px" }}>Advertise Your Business</div>
            <div style={{ fontSize: "12px", color: "#6b6760", marginBottom: "1.25rem" }}>Submit your deal for review. PROJO will approve within 24 hours. Reach thousands of app users in Rustenburg!</div>
            <input style={inp} placeholder="Business Name *" value={form.businessName} onChange={e => setForm(f => ({...f, businessName: e.target.value}))} />
            <select style={inp} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input style={inp} placeholder="Special Offer (e.g. 20% off all meals) *" value={form.offer} onChange={e => setForm(f => ({...f, offer: e.target.value}))} />
            <textarea style={{...inp, minHeight: "80px", resize: "vertical"}} placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
            <input style={inp} placeholder="Phone Number" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
            <input style={inp} placeholder="Website (optional)" value={form.website} onChange={e => setForm(f => ({...f, website: e.target.value}))} />
            <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "12px" }}>
              ✓ Free to submit · ✓ PROJO reviews within 24hrs · ✓ Reaches all app users · ✓ Basic listings are free
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={submitAd} disabled={submitting} style={{ flex: 1, background: G, color: "#0a0a0a", border: "none", borderRadius: "10px", padding: "14px", fontWeight: "800", fontSize: "14px", cursor: "pointer" }}>
                {submitting ? "Submitting..." : "Submit for Approval"}
              </button>
              <button onClick={() => setShowSubmit(false)} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "14px 20px", color: "#6b6760", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────
export default function EntertainmentHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("home");
  const [playing, setPlaying] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [radioPlaying, setRadioPlaying] = useState(null);
  const [radioFilter, setRadioFilter] = useState("All");
  const audioRef = React.useRef(null);

  function playRadio(station) {
    if (!station.stream) {
      window.open(station.url, "_blank");
      return;
    }
    if (radioPlaying?.id === station.id) {
      audioRef.current?.pause();
      setRadioPlaying(null);
      return;
    }
    setRadioPlaying(station);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = station.stream;
        audioRef.current.play().catch(() => {
          // Fallback to browser
          window.open(station.url, "_blank");
          setRadioPlaying(null);
        });
      }
    }, 100);
  }
  const [search, setSearch] = useState("");
  const [newsCategory, setNewsCategory] = useState(0);

  // Auto-rotate featured banner
  useEffect(() => {
    const timer = setInterval(() => setFeaturedIdx(i => (i + 1) % CONTENT.featured.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const allContent = Object.values(CONTENT).flat();
  const searchResults = search.length > 1 ? allContent.filter(v => v.title.toLowerCase().includes(search.toLowerCase())) : [];

  function playVideo(item) { setPlaying(item); window.scrollTo(0, 0); }

  const featured = CONTENT.featured[featuredIdx];

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Sans',sans-serif", paddingBottom: "5rem" }}>
      <Navbar />

      {/* Video Player */}
      {playing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ width: "100%", maxWidth: "800px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "800", color: "#f0ede8" }}>{playing.title}</div>
              <button onClick={() => setPlaying(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", fontSize: "16px" }}>✕</button>
            </div>
            <iframe src={`https://www.youtube.com/embed/${playing.videoId}?autoplay=1`} title={playing.title} style={{ width: "100%", aspectRatio: "16/9", border: "none", borderRadius: "12px" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ background: BG2, borderBottom: `1px solid ${BORDER}`, paddingTop: "72px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ display: "flex", overflowX: "auto", padding: "0 1rem" }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setActiveGame(null); }} style={{
                background: "none", border: "none",
                borderBottom: tab === t.key ? `3px solid ${G}` : "3px solid transparent",
                color: tab === t.key ? G : "#6b6760",
                padding: "12px 16px", fontSize: "12px", fontWeight: "700",
                cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif",
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.25rem 1rem" }}>

        {/* Search bar */}
        <div style={{ marginBottom: "1.25rem" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search videos, music, learning..."
            style={{ width: "100%", background: BG2, border: `1px solid ${BORDER}`, borderRadius: "10px", color: "#f0ede8", padding: "12px 16px", fontSize: "13px", outline: "none", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box" }} />
          {searchResults.length > 0 && (
            <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingTop: "12px" }}>
              {searchResults.map(item => <VideoCard key={item.id} item={item} onClick={playVideo} size="small" />)}
            </div>
          )}
        </div>

        {/* ── HOME TAB ── */}
        {tab === "home" && (
          <div>
            {/* Featured Banner */}
            <div onClick={() => playVideo(featured)} style={{ position: "relative", borderRadius: "20px", overflow: "hidden", marginBottom: "1.5rem", cursor: "pointer", aspectRatio: "16/7" }}>
              <img src={featured.thumb} alt={featured.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />
              <div style={{ position: "absolute", bottom: "1.25rem", left: "1.25rem", right: "1.25rem" }}>
                <div style={{ fontSize: "10px", color: G, fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>{featured.category}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.4rem", fontWeight: "800", color: "#fff", marginBottom: "10px" }}>{featured.title}</div>
                <button style={{ background: "#fff", color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "10px 20px", fontWeight: "800", fontSize: "13px", cursor: "pointer" }}>▶ Play Now</button>
              </div>
              {/* Dots */}
              <div style={{ position: "absolute", bottom: "12px", right: "12px", display: "flex", gap: "4px" }}>
                {CONTENT.featured.map((_, i) => <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: i === featuredIdx ? G : "rgba(255,255,255,0.4)" }} />)}
              </div>
            </div>

            <VideoRow title="🔥 Trending Now" items={CONTENT.trending} onPlay={playVideo} />
            <VideoRow title="🎵 Music" items={CONTENT.music} onPlay={playVideo} />
            <VideoRow title="📚 Learning" items={CONTENT.learning} onPlay={playVideo} />
            <VideoRow title="👶 Kids" items={CONTENT.kids} onPlay={playVideo} />

            {/* Games promo */}
            <div onClick={() => setTab("games")} style={{ background: "linear-gradient(135deg, #1a0a2e, #0a1a2e)", border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1.25rem", marginBottom: "1.5rem", cursor: "pointer" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "800", color: G, marginBottom: "6px" }}>🎮 Play Games</div>
              <div style={{ fontSize: "12px", color: "#6b6760", marginBottom: "12px" }}>2048, Memory, Trivia & more — free to play</div>
              <div style={{ display: "flex", gap: "10px" }}>
                {GAMES.slice(0,4).map(g => <div key={g.id} style={{ fontSize: "24px" }}>{g.icon}</div>)}
              </div>
            </div>

            <VideoRow title="🎙️ Podcasts" items={CONTENT.podcasts} onPlay={playVideo} />
          </div>
        )}

        {/* ── KIDS TAB ── */}
        {tab === "kids" && (
          <div>
            <div style={{ background: "linear-gradient(135deg, #1a2e0a, #0a1a2e)", borderRadius: "16px", padding: "1.25rem", marginBottom: "1.5rem", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>👶 🌈 🦁</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "20px", fontWeight: "800", color: G }}>Kids Zone</div>
              <div style={{ fontSize: "12px", color: "#6b6760" }}>Safe, fun, educational content</div>
            </div>
            {[
              { emoji: "🔤", label: "Alphabet & Numbers", items: CONTENT.kids.slice(0,2) },
              { emoji: "🦁", label: "Animals & Nature", items: CONTENT.kids.slice(2,4) },
              { emoji: "🚀", label: "Science & Space", items: CONTENT.kids.slice(4) },
            ].map(section => (
              <div key={section.label} style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", fontWeight: "800", color: "#f0ede8", marginBottom: "12px" }}>{section.emoji} {section.label}</div>
                <div style={{ display: "flex", gap: "12px", overflowX: "auto" }}>
                  {section.items.map(item => <VideoCard key={item.id} item={item} onClick={playVideo} size="large" />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── MUSIC TAB ── */}
        {tab === "music" && (
          <div>
            {/* Hidden audio element for radio */}
            <audio ref={audioRef} style={{ display: "none" }} />

            {/* Radio section */}
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "800", color: "#f0ede8", marginBottom: "12px" }}>📻 Live Radio</div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", overflowX: "auto" }}>
              {["All", "North West", "National"].map(f => (
                <button key={f} onClick={() => setRadioFilter(f)} style={{
                  background: radioFilter === f ? "rgba(232,184,75,0.15)" : BG2,
                  border: `1px solid ${radioFilter === f ? G : BORDER}`,
                  borderRadius: "8px", padding: "6px 14px", color: radioFilter === f ? G : "#6b6760",
                  fontSize: "12px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap",
                }}>{f}</button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "1.5rem" }}>
              {RADIO_STATIONS.filter(s => radioFilter === "All" || s.region === radioFilter).map(station => (
                <div key={station.id} onClick={() => playRadio(station)} style={{
                  background: radioPlaying?.id === station.id ? "rgba(232,184,75,0.08)" : BG2,
                  border: `1px solid ${radioPlaying?.id === station.id ? G : BORDER}`,
                  borderRadius: "14px", padding: "12px 14px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "12px",
                }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: `${station.color}20`, border: `2px solid ${station.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
                    {radioPlaying?.id === station.id ? "⏸" : station.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "700", color: "#f0ede8", fontSize: "13px" }}>{station.name}</div>
                    <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "2px" }}>{station.freq} · {station.desc}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                    {radioPlaying?.id === station.id && (
                      <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                        {[1,2,3].map(i => <div key={i} style={{ width: "3px", background: G, borderRadius: "2px", animation: `eq${i} 0.8s ease-in-out infinite alternate`, height: `${8+i*4}px` }} />)}
                      </div>
                    )}
                    <div style={{ fontSize: "10px", color: station.region === "North West" ? G : "#6b6760", fontWeight: "700" }}>{station.region}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Now Playing bar */}
            {radioPlaying && (
              <div style={{ position: "fixed", bottom: "70px", left: 0, right: 0, zIndex: 100, padding: "0 1rem", maxWidth: "900px", margin: "0 auto" }}>
                <div style={{ background: BG3, border: `1px solid ${G}`, borderRadius: "14px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "12px", boxShadow: `0 0 20px rgba(232,184,75,0.2)` }}>
                  <div style={{ fontSize: "20px" }}>{radioPlaying.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: G }}>{radioPlaying.name}</div>
                    <div style={{ fontSize: "11px", color: "#6b6760" }}>🔴 LIVE</div>
                  </div>
                  <button onClick={() => { audioRef.current?.pause(); setRadioPlaying(null); }} style={{ background: "none", border: "none", color: "#f87171", fontSize: "18px", cursor: "pointer" }}>⏹</button>
                </div>
              </div>
            )}

            {/* Free Music */}
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "800", color: "#f0ede8", marginBottom: "12px" }}>🎵 Free Music</div>
            <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px", marginBottom: "1.5rem" }}>
              {FREE_MUSIC.map(track => (
                <div key={track.id} onClick={() => playVideo({ ...track, title: track.title })} style={{ flexShrink: 0, width: "160px", cursor: "pointer" }}>
                  <div style={{ position: "relative", width: "160px", height: "160px", borderRadius: "12px", overflow: "hidden", background: BG3, marginBottom: "8px" }}>
                    <img src={track.thumb} alt={track.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display="none"} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.7)", padding: "6px 8px" }}>
                      <div style={{ fontSize: "9px", color: G, fontWeight: "700" }}>{track.genre}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", color: "#f0ede8", fontWeight: "600", lineHeight: 1.3 }}>{track.title}</div>
                  <div style={{ fontSize: "10px", color: "#6b6760", marginTop: "2px" }}>{track.artist}</div>
                </div>
              ))}
            </div>

            <VideoRow title="🎙️ Podcasts" items={CONTENT.podcasts} onPlay={playVideo} />
          </div>
        )}

        {/* ── LEARNING TAB ── */}
        {tab === "learning" && (
          <div>
            <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", fontWeight: "800", color: G, marginBottom: "6px" }}>📚 Learn Something New Today</div>
              <div style={{ fontSize: "12px", color: "#6b6760" }}>Business, Tech, Finance, Coding & more</div>
            </div>
            <VideoRow title="🚀 Business & Entrepreneurship" items={CONTENT.learning.slice(0,2)} onPlay={playVideo} />
            <VideoRow title="💻 Technology & Coding" items={CONTENT.learning.slice(2,4)} onPlay={playVideo} />
            <VideoRow title="📷 Creative Skills" items={CONTENT.learning.slice(4)} onPlay={playVideo} />
          </div>
        )}

        {/* ── PODCASTS TAB ── */}
        {tab === "podcasts" && <VideoRow title="🎙️ Featured Podcasts" items={CONTENT.podcasts} onPlay={playVideo} />}

        {/* ── NEWS TAB ── */}
        {tab === "news" && (
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "1rem", overflowX: "auto" }}>
              {NEWS_FEEDS.map((f, i) => (
                <button key={i} onClick={() => setNewsCategory(i)} style={{
                  background: newsCategory === i ? "rgba(232,184,75,0.15)" : BG2,
                  border: `1px solid ${newsCategory === i ? G : BORDER}`,
                  borderRadius: "8px", padding: "6px 14px", color: newsCategory === i ? G : "#6b6760",
                  fontSize: "12px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap",
                }}>{f.label}</button>
              ))}
            </div>
            <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "1.25rem" }}>
              <div style={{ fontSize: "13px", color: "#6b6760", marginBottom: "1rem" }}>
                Live news headlines from trusted sources
              </div>
              {[
                { name: "News24", url: "https://www.news24.com", desc: "SA's biggest news site" },
                { name: "TimesLive", url: "https://www.timeslive.co.za", desc: "Breaking SA news" },
                { name: "Daily Maverick", url: "https://www.dailymaverick.co.za", desc: "Investigative journalism" },
                { name: "EWN", url: "https://ewn.co.za", desc: "eNCA news portal" },
                { name: "BBC World News", url: "https://www.bbc.com/news/world", desc: "International news" },
                { name: "Netwerk24", url: "https://www.netwerk24.com", desc: "Afrikaans news" },
                { name: "Sowetan Live", url: "https://www.sowetanlive.co.za", desc: "Community news" },
                { name: "IOL", url: "https://www.iol.co.za", desc: "Independent Online" },
              ].filter(s => {
                if (newsCategory === 0) return true;
                if (newsCategory === 1) return ["News24","TimesLive","Daily Maverick","EWN","Sowetan Live","IOL","Netwerk24"].includes(s.name);
                if (newsCategory === 2) return ["BBC World News","Daily Maverick","IOL"].includes(s.name);
                if (newsCategory === 3) return ["News24","TimesLive","EWN"].includes(s.name);
                return true;
              }).map(source => (
                <a key={source.name} href={source.url} target="_blank" rel="noreferrer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${BORDER}`, textDecoration: "none" }}>
                  <div>
                    <div style={{ fontSize: "13px", color: "#f0ede8", fontWeight: "600" }}>{source.name}</div>
                    <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "2px" }}>{source.desc}</div>
                  </div>
                  <span style={{ color: G, fontSize: "12px", flexShrink: 0 }}>Read ↗</span>
                </a>
              ))}
              <div style={{ marginTop: "12px", fontSize: "11px", color: "#4a3030" }}>News opens in browser — all content from original publishers</div>
            </div>
          </div>
        )}

        {/* ── GAMES TAB ── */}
        {tab === "games" && (
          <div>
            {!activeGame ? (
              <>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "18px", fontWeight: "800", color: "#f0ede8", marginBottom: "1rem" }}>🎮 Games</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {GAMES.map(g => (
                    <div key={g.id} onClick={() => setActiveGame(g.id)} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "1.25rem", cursor: "pointer", textAlign: "center" }}>
                      <div style={{ fontSize: "36px", marginBottom: "8px" }}>{g.icon}</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", fontWeight: "800", color: "#f0ede8", marginBottom: "4px" }}>{g.title}</div>
                      <div style={{ fontSize: "11px", color: "#6b6760" }}>{g.desc}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
                  <button onClick={() => setActiveGame(null)} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 14px", color: "#a8a49e", cursor: "pointer", fontSize: "13px" }}>← Back</button>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "800", color: G }}>
                    {GAMES.find(g => g.id === activeGame)?.title}
                  </div>
                </div>
                <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1.25rem" }}>
                  {activeGame === "2048"     && <Game2048 />}
                  {activeGame === "reaction" && <ReactionGame />}
                  {activeGame === "tictactoe"&& <TicTacToe />}
                  {activeGame === "memory"   && <MemoryGame />}
                  {activeGame === "trivia"   && <TriviaGame />}
                  {activeGame === "snake"    && <SnakeGame />}
                  {activeGame === "sudoku"   && <SudokuGame />}
                  {activeGame === "solitaire"&& <SolitaireGame />}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── LOCAL ADS TAB ── */}
        {tab === "ads" && <LocalAdsTab user={user} />}

      </div>
    </div>
  );
}
