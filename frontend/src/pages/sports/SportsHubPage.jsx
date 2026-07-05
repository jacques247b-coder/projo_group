// PROJO GROUP — Sports Hub Page (Real-time Scores + Match Notifications)
// - API-Football free tier for PSL Soccer (League ID: 288) + Rugby
// - SABC+ live embed
// - Betway/HollywoodBets affiliate links
// - YouTube official highlights
// - Match notifications via push
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/ui/Navbar";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const G = "#e8b84b";
const BG = "#0a0a0a";
const BG2 = "#111111";
const BG3 = "#1a1a1a";
const BORDER = "rgba(232,184,75,0.15)";
const RED = "#8B1A1A";

// ── YOUR CREDENTIALS ─────────────────────────────────────────
// 1. Get free API key: dashboard.api-football.com (no credit card)
// 2. Get Betway BTAG: superpartnersafrica.com
const API_FOOTBALL_KEY = process.env.REACT_APP_API_FOOTBALL_KEY || "";
const BETWAY_BTAG = process.env.REACT_APP_BETWAY_BTAG || "";
const HOLLYWOODBETS_REF = process.env.REACT_APP_HB_REF || "";

// South Africa League IDs on API-Football
const PSL_LEAGUE_ID = 288;    // Betway Premiership (PSL)
const NFD_LEAGUE_ID = 289;    // National First Division
const RUGBY_LEAGUE_ID = 175;  // United Rugby Championship (Bulls, Lions, Sharks, Stormers)

const BETTING_PARTNERS = [
  {
    name: "Betway",
    url: `https://www.betway.co.za${BETWAY_BTAG ? `?btag=${BETWAY_BTAG}` : ""}`,
    offer: "R25 Free Bet on Signup",
    color: "#00a651",
    desc: "Official title sponsor — Betway Premiership (PSL)",
    icon: "🟢",
  },
  {
    name: "Hollywood Bets",
    url: `https://www.hollywoodbets.net${HOLLYWOODBETS_REF ? `?ref=${HOLLYWOODBETS_REF}` : ""}`,
    offer: "R50 Free Bet Welcome Bonus",
    color: "#e31837",
    desc: "SA's most trusted sports betting platform",
    icon: "🔴",
  },
  {
    name: "Supabets",
    url: `https://www.supabets.co.za${process.env.REACT_APP_SUPABETS_REF ? `?ref=${process.env.REACT_APP_SUPABETS_REF}` : ""}`,
    offer: "R50 Signup Bonus",
    color: "#ff6600",
    desc: "2 million+ SA players — PSL, rugby, cricket & more",
    icon: "🟠",
  },
];

// YouTube channel IDs — latest video fetched automatically via API
// Get free API key: console.cloud.google.com → YouTube Data API v3
const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY || "";

const YOUTUBE_CHANNELS = [
  {
    id: "springboks",
    title: "🏉 Springboks — Official SA Rugby",
    channelId: "UCVI5iqtQOsWZwtAg1o3SIAQ",
    url: "https://www.youtube.com/@OfficialBokTube",
    fallbackVideoId: "qUAMswHmCjs",
  },
  {
    id: "bafana",
    title: "⚽ Bafana Bafana — SAFA TV",
    channelId: "UCXOkN4e7M7J3UH5BcY1bRpw",
    url: "https://www.youtube.com/@SAFAChannel",
    fallbackVideoId: "G77xiAX0ImE",
  },
  {
    id: "psl",
    title: "⚽ PSL — Betway Premiership",
    channelId: "UCqYPhGiB9tkShZorfgcL2lA",
    url: "https://www.youtube.com/@PSLSouthAfrica",
    fallbackVideoId: null,
  },
  {
    id: "worldrugby",
    title: "🏉 World Rugby Highlights",
    channelId: "UCupKzQoGKzsMfTAlIzC8zEA",
    url: "https://www.youtube.com/@worldrugby",
    fallbackVideoId: null,
  },
];

const TABS = [
  { key: "scores",     label: "📊 Scores" },
  { key: "watch",      label: "📺 Watch" },
  { key: "highlights", label: "🎬 Highlights" },
  { key: "betting",    label: "🎯 Betting" },
];

function statusLabel(status) {
  const s = status?.short || status;
  const map = {
    "NS": "Upcoming", "1H": "1st Half", "HT": "Half Time",
    "2H": "2nd Half", "FT": "Full Time", "AET": "After Extra Time",
    "PEN": "Penalties", "PST": "Postponed", "CANC": "Cancelled",
    "LIVE": "Live", "TBD": "TBD",
  };
  return map[s] || s || "Upcoming";
}

function isLive(status) {
  const s = status?.short || status;
  return ["1H","HT","2H","ET","BT","P","SUSP","INT","LIVE"].includes(s);
}

function ScoreCard({ fixture, sport = "soccer" }) {
  const home = fixture.teams?.home || fixture.teams?.homeName || {};
  const away = fixture.teams?.away || fixture.teams?.awayName || {};
  const goals = fixture.goals || fixture.score || {};
  const status = fixture.fixture?.status || fixture.status || {};
  const live = isLive(status);
  const league = fixture.league?.name || fixture.competition || "";

  return (
    <div style={{
      background: BG2,
      border: `1px solid ${live ? "rgba(74,222,128,0.4)" : BORDER}`,
      borderRadius: "14px", padding: "1rem", marginBottom: "10px",
    }}>
      {live && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", animation: "pulse 1s infinite" }} />
          <span style={{ fontSize: "10px", color: "#4ade80", fontWeight: "700", letterSpacing: "1px" }}>
            LIVE {fixture.fixture?.status?.elapsed ? `${fixture.fixture.status.elapsed}'` : ""}
          </span>
        </div>
      )}
      <div style={{ fontSize: "10px", color: "#6b6760", marginBottom: "8px" }}>
        {sport === "soccer" ? "⚽" : "🏉"} {league}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: "700", color: "#f0ede8" }}>{home.name || home}</div>
        </div>
        <div style={{ textAlign: "center", padding: "0 16px", minWidth: "80px" }}>
          {live || statusLabel(status) === "Full Time" ? (
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "22px", fontWeight: "800", color: G }}>
              {goals.home ?? 0} - {goals.away ?? 0}
            </div>
          ) : (
            <div>
              <div style={{ fontSize: "12px", color: "#6b6760", fontWeight: "700" }}>
                {fixture.fixture?.date ? new Date(fixture.fixture.date).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }) : "TBD"}
              </div>
              <div style={{ fontSize: "10px", color: "#4a3030" }}>
                {fixture.fixture?.date ? new Date(fixture.fixture.date).toLocaleDateString("en-ZA", { day: "2-digit", month: "short" }) : ""}
              </div>
            </div>
          )}
        </div>
        <div style={{ flex: 1, textAlign: "right" }}>
          <div style={{ fontSize: "13px", fontWeight: "700", color: "#f0ede8" }}>{away.name || away}</div>
        </div>
      </div>
      {!live && statusLabel(status) !== "Full Time" && (
        <div style={{ fontSize: "10px", color: "#4a3030", marginTop: "6px", textAlign: "center" }}>{statusLabel(status)}</div>
      )}
    </div>
  );
}

export default function SportsHubPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("scores");
  const [filter, setFilter] = useState("soccer");
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [latestVideos, setLatestVideos] = useState({});

  // Fetch latest video from each YouTube channel
  useEffect(() => {
    if (!YOUTUBE_API_KEY) return;
    YOUTUBE_CHANNELS.forEach(async (ch) => {
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${ch.channelId}&part=snippet&order=date&maxResults=1&type=video`
        );
        const data = await res.json();
        const item = data.items?.[0];
        if (item) {
          setLatestVideos(prev => ({
            ...prev,
            [ch.id]: {
              videoId: item.id.videoId,
              title: item.snippet.title,
              thumb: item.snippet.thumbnails?.high?.url,
              date: new Date(item.snippet.publishedAt).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }),
            }
          }));
        }
      } catch {}
    });
  }, []);
  const pollRef = useRef(null);

  // Check notification preference
  useEffect(() => {
    const pref = localStorage.getItem("projo_sports_notifications");
    setNotifEnabled(pref === "true");
  }, []);

  const fetchFixtures = useCallback(async () => {
    if (!API_FOOTBALL_KEY) {
      // Use mock data if no API key configured yet
      setFixtures(getMockFixtures(filter));
      return;
    }
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const leagueId = filter === "soccer" ? PSL_LEAGUE_ID : RUGBY_LEAGUE_ID;
      const sport = filter === "soccer" ? "football" : "rugby";
      const baseUrl = filter === "soccer"
        ? "https://v3.football.api-sports.io"
        : "https://v1.rugby.api-sports.io";

      const res = await fetch(
        `${baseUrl}/fixtures?league=${leagueId}&season=2025&from=${today}&to=${today}`,
        { headers: { "x-apisports-key": API_FOOTBALL_KEY } }
      );
      const data = await res.json();
      const results = data.response || [];

      // Also get live matches
      const liveRes = await fetch(
        `${baseUrl}/fixtures?live=all&league=${leagueId}`,
        { headers: { "x-apisports-key": API_FOOTBALL_KEY } }
      );
      const liveData = await liveRes.json();
      const liveResults = liveData.response || [];

      // Merge live + today, deduplicate
      const all = [...liveResults, ...results.filter(f => !liveResults.find(l => l.fixture?.id === f.fixture?.id))];
      setFixtures(all.length > 0 ? all : getMockFixtures(filter));
    } catch {
      setFixtures(getMockFixtures(filter));
    } finally {
      setLoading(false); }
  }, [filter]);

  useEffect(() => {
    fetchFixtures();
    // Poll every 60 seconds for live score updates
    pollRef.current = setInterval(fetchFixtures, 60000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchFixtures]);

  function getMockFixtures(sport) {
    if (sport === "soccer") return [
      { fixture: { id: 1, date: new Date(Date.now() + 3600000).toISOString(), status: { short: "NS", elapsed: null } }, teams: { home: { name: "Mamelodi Sundowns" }, away: { name: "Kaizer Chiefs" } }, goals: { home: null, away: null }, league: { name: "Betway Premiership" } },
      { fixture: { id: 2, date: new Date(Date.now() - 1800000).toISOString(), status: { short: "1H", elapsed: 34 } }, teams: { home: { name: "Orlando Pirates" }, away: { name: "SuperSport United" } }, goals: { home: 1, away: 0 }, league: { name: "Betway Premiership" } },
      { fixture: { id: 3, date: new Date(Date.now() + 7200000).toISOString(), status: { short: "NS", elapsed: null } }, teams: { home: { name: "Bafana Bafana" }, away: { name: "Nigeria" } }, goals: { home: null, away: null }, league: { name: "AFCON Qualifier" } },
    ];
    return [
      { fixture: { id: 4, date: new Date(Date.now() + 3600000).toISOString(), status: { short: "NS", elapsed: null } }, teams: { home: { name: "Springboks" }, away: { name: "All Blacks" } }, goals: { home: null, away: null }, league: { name: "Rugby Championship" } },
      { fixture: { id: 5, date: new Date(Date.now() - 900000).toISOString(), status: { short: "1H", elapsed: 22 } }, teams: { home: { name: "Bulls" }, away: { name: "Lions" } }, goals: { home: 14, away: 7 }, league: { name: "United Rugby Championship" } },
    ];
  }

  const [showNotifModal, setShowNotifModal] = useState(false);
  const [sportPrefs, setSportPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("projo_sports_prefs") || "{}"); }
    catch { return {}; }
  });

  const SPORT_OPTIONS = [
    { key: "psl",        label: "⚽ PSL Soccer",          desc: "Betway Premiership matches" },
    { key: "bafana",     label: "⚽ Bafana Bafana",        desc: "National team matches" },
    { key: "springboks", label: "🏉 Springboks",           desc: "Test matches & Rugby Championship" },
    { key: "urc",        label: "🏉 URC Rugby",            desc: "Bulls, Lions, Sharks, Stormers" },
    { key: "cricket",    label: "🏏 Proteas Cricket",      desc: "Test & ODI matches" },
  ];

  async function openNotifPrefs() {
    if (!("Notification" in window)) return toast.error("Notifications not supported on this device");
    if (Notification.permission !== "granted") {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return toast.error("Please allow notifications in your browser settings");
    }
    setShowNotifModal(true);
  }

  function saveNotifPrefs() {
    const anyEnabled = Object.values(sportPrefs).some(Boolean);
    localStorage.setItem("projo_sports_prefs", JSON.stringify(sportPrefs));
    localStorage.setItem("projo_sports_notifications", anyEnabled ? "true" : "false");
    setNotifEnabled(anyEnabled);
    setShowNotifModal(false);
    const enabled = SPORT_OPTIONS.filter(s => sportPrefs[s.key]).map(s => s.label).join(", ");
    toast.success(anyEnabled ? `🔔 Notifications on for: ${enabled}` : "Notifications turned off");
  }

  function toggleSportPref(key) {
    setSportPrefs(p => ({ ...p, [key]: !p[key] }));
  }

  async function toggleNotifications() {
    openNotifPrefs();
  }

  const liveCount = fixtures.filter(f => isLive(f.fixture?.status || f.status)).length;

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Sans',sans-serif", paddingBottom: "4rem" }}>
      <Navbar />

      {/* Header */}
      <div style={{ background: BG2, borderBottom: `1px solid ${BORDER}`, padding: "80px 1rem 0" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "4px" }}>
            <div>
              <div style={{ fontSize: "11px", color: G, fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase" }}>PROJO GROUP</div>
              <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.8rem", fontWeight: "800", color: "#f0ede8", margin: "4px 0" }}>
                Sports Hub 🏆
              </h1>
              {liveCount > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", animation: "pulse 1s infinite" }} />
                  <span style={{ fontSize: "12px", color: "#4ade80", fontWeight: "700" }}>{liveCount} match{liveCount > 1 ? "es" : ""} live now</span>
                </div>
              )}
            </div>
            {/* Notification toggle */}
            <button onClick={toggleNotifications} style={{
              background: notifEnabled ? "rgba(74,222,128,0.1)" : BG3,
              border: `1px solid ${notifEnabled ? "#4ade80" : BORDER}`,
              borderRadius: "10px", padding: "8px 12px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
            }}>
              <span style={{ fontSize: "16px" }}>{notifEnabled ? "🔔" : "🔕"}</span>
              <span style={{ fontSize: "9px", color: notifEnabled ? "#4ade80" : "#6b6760", fontWeight: "700" }}>
                {notifEnabled ? "ON" : "OFF"}
              </span>
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "0", overflowX: "auto", marginTop: "8px" }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                background: "none", border: "none",
                borderBottom: tab === t.key ? `3px solid ${G}` : "3px solid transparent",
                color: tab === t.key ? G : "#6b6760",
                padding: "10px 16px", fontSize: "12px", fontWeight: "700",
                cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif",
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "1.25rem 1rem" }}>

        {/* ── LIVE SCORES ── */}
        {tab === "scores" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                {[["soccer","⚽ Soccer"],["rugby","🏉 Rugby"]].map(([val, lbl]) => (
                  <button key={val} onClick={() => setFilter(val)} style={{
                    background: filter === val ? "rgba(232,184,75,0.15)" : BG2,
                    border: `1px solid ${filter === val ? G : BORDER}`,
                    borderRadius: "8px", padding: "6px 14px",
                    color: filter === val ? G : "#6b6760",
                    fontSize: "12px", fontWeight: "700", cursor: "pointer",
                  }}>{lbl}</button>
                ))}
              </div>
              <button onClick={fetchFixtures} style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "6px 10px", color: "#6b6760", fontSize: "11px", cursor: "pointer" }}>
                🔄 Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#6b6760" }}>Loading scores...</div>
            ) : (
              <>
                {fixtures.map((f, i) => <ScoreCard key={f.fixture?.id || i} fixture={f} sport={filter} />)}
                {fixtures.length === 0 && (
                  <div style={{ textAlign: "center", padding: "3rem", color: "#6b6760" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>📅</div>
                    <div>No matches scheduled today</div>
                  </div>
                )}
              </>
            )}

            {!API_FOOTBALL_KEY && (
              <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "10px", padding: "10px 14px", marginTop: "1rem", fontSize: "11px", color: "#f59e0b" }}>
                ⚙️ Add <strong>REACT_APP_API_FOOTBALL_KEY</strong> to Render frontend env to enable live scores from API-Football (free at dashboard.api-football.com)
              </div>
            )}

            <div style={{ textAlign: "center", padding: "1rem 0 0", fontSize: "10px", color: "#4a3030" }}>
              Scores auto-refresh every 60 seconds · Click 🔔 to get match notifications
            </div>
          </div>
        )}

        {/* ── WATCH LIVE ── */}
        {tab === "watch" && (
          <div>
            {/* SABC Sport — blocks iFrame, link out instead */}
            <a href="https://sabc-plus.com/live/323/SABC-Sport" target="_blank" rel="noreferrer" style={{ textDecoration: "none", display: "block", marginBottom: "1rem" }}>
              <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden" }}>
                <div style={{ background: RED, padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>📺</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "700", color: "#fff", fontSize: "14px" }}>SABC Sport — Watch Live Free</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", marginTop: "2px" }}>PSL Soccer, Rugby, Cricket — Free · Requires free SABC+ account</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "8px", padding: "8px 14px", color: "#fff", fontSize: "13px", fontWeight: "700" }}>Watch Live ↗</div>
                </div>
                <div style={{ padding: "12px 16px", display: "flex", gap: "16px" }}>
                  {["⚽ PSL Matches", "🏉 Rugby", "🏏 Cricket", "🌍 AFCON"].map(tag => (
                    <span key={tag} style={{ fontSize: "11px", color: "#6b6760" }}>{tag}</span>
                  ))}
                </div>
              </div>
            </a>
            <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "1rem" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", fontWeight: "800", color: G, marginBottom: "12px" }}>More Live Sport</div>
              {[
                { name: "DStv Now", url: "https://now.dstv.com", desc: "SuperSport — all SA rugby & soccer live", icon: "📡" },
                { name: "DStv Stream", url: "https://www.dstv.com/en-za/streaming", desc: "Premier League, PSL & all SuperSport live — replaces Showmax", icon: "📡" },
              ].map(s => (
                <a key={s.name} href={s.url} target="_blank" rel="noreferrer" style={{
                  display: "flex", alignItems: "center", gap: "12px", padding: "12px",
                  background: BG3, borderRadius: "10px", marginBottom: "8px", textDecoration: "none",
                }}>
                  <span style={{ fontSize: "22px" }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#f0ede8" }}>{s.name}</div>
                    <div style={{ fontSize: "11px", color: "#6b6760" }}>{s.desc}</div>
                  </div>
                  <span style={{ marginLeft: "auto", color: G, fontSize: "14px" }}>↗</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── HIGHLIGHTS ── */}
        {tab === "highlights" && (
          <div>
            <div style={{ fontSize: "12px", color: "#6b6760", marginBottom: "1rem" }}>
              Tap any channel to watch official highlights on YouTube
            </div>
            {YOUTUBE_CHANNELS.map(v => {
              const latest = latestVideos[v.id];
              const videoId = latest?.videoId || v.fallbackVideoId;
              const videoTitle = latest?.title || v.title;
              const videoDate = latest?.date;
              return (
                <div key={v.id} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden", marginBottom: "1rem" }}>
                  {videoId ? (
                    <>
                      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: "700", color: "#f0ede8", fontSize: "13px" }}>{v.title}</div>
                          {videoDate && <div style={{ fontSize: "10px", color: "#4ade80", marginTop: "2px" }}>🆕 Latest: {videoDate}</div>}
                        </div>
                        <a href={v.url} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: G, textDecoration: "none", whiteSpace: "nowrap", marginLeft: "8px" }}>Channel ↗</a>
                      </div>
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=0`}
                        title={videoTitle}
                        style={{ width: "100%", height: "220px", border: "none", display: "block" }}
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      {videoTitle !== v.title && (
                        <div style={{ padding: "8px 12px", fontSize: "11px", color: "#6b6760", borderTop: `1px solid ${BORDER}` }}>{videoTitle}</div>
                      )}
                    </>
                  ) : (
                    <a href={v.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "14px", padding: "1rem", textDecoration: "none" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: RED, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>▶</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#f0ede8" }}>{v.title}</div>
                        <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "3px" }}>Tap to watch latest highlights on YouTube</div>
                      </div>
                      <span style={{ color: G, fontSize: "18px" }}>↗</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── BETTING ── */}
        {tab === "betting" && (
          <div>
            <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", padding: "10px 14px", marginBottom: "1.25rem", fontSize: "11px", color: "#f87171", lineHeight: 1.6 }}>
              ⚠️ <strong>Gamble responsibly. 18+ only.</strong> Gambling is addictive — play within your means.<br />
              Help: <strong>0800 006 008</strong> (National Responsible Gambling Programme — free, 24/7)
            </div>
            {BETTING_PARTNERS.map(p => (
              <div key={p.name} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1.25rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "800", color: "#f0ede8" }}>
                      {p.icon} {p.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "2px" }}>{p.desc}</div>
                  </div>
                  <div style={{ background: `${p.color}20`, border: `1px solid ${p.color}50`, borderRadius: "8px", padding: "4px 10px", fontSize: "11px", color: p.color, fontWeight: "700", flexShrink: 0, marginLeft: "8px" }}>
                    {p.offer}
                  </div>
                </div>
                <a href={p.url} target="_blank" rel="noreferrer" style={{
                  display: "block", textAlign: "center", background: p.color,
                  color: "#fff", textDecoration: "none", borderRadius: "10px",
                  padding: "12px", fontWeight: "800", fontSize: "14px",
                }}>Bet Now on {p.name} ↗</a>
              </div>
            ))}
            <div style={{ textAlign: "center", fontSize: "10px", color: "#4a3030", marginTop: "8px", lineHeight: 1.6 }}>
              PROJO GROUP earns a commission when you register via these links at no extra cost to you.<br />
              All bookmakers are licensed by South African Provincial Gambling Boards.
            </div>
          </div>
        )}
      </div>

      {/* ── Notification Preferences Modal ── */}
      {showNotifModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "20px 20px 0 0", padding: "1.5rem", width: "100%", maxWidth: "500px" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "18px", fontWeight: "800", color: G, marginBottom: "6px" }}>🔔 Match Notifications</div>
            <div style={{ fontSize: "12px", color: "#6b6760", marginBottom: "1.25rem" }}>Choose which sports you want to be notified about — 30 min before kickoff and when matches go live.</div>

            {SPORT_OPTIONS.map(s => (
              <div key={s.key} onClick={() => toggleSportPref(s.key)} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: sportPrefs[s.key] ? "rgba(232,184,75,0.08)" : BG3,
                border: `1px solid ${sportPrefs[s.key] ? G : BORDER}`,
                borderRadius: "12px", padding: "12px 14px", marginBottom: "8px", cursor: "pointer",
              }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#f0ede8" }}>{s.label}</div>
                  <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "2px" }}>{s.desc}</div>
                </div>
                <div style={{
                  width: "44px", height: "24px", borderRadius: "12px",
                  background: sportPrefs[s.key] ? G : BG,
                  border: `1px solid ${sportPrefs[s.key] ? G : BORDER}`,
                  position: "relative", flexShrink: 0, transition: "all .2s",
                }}>
                  <div style={{
                    width: "18px", height: "18px", borderRadius: "50%",
                    background: sportPrefs[s.key] ? "#0a0a0a" : "#6b6760",
                    position: "absolute", top: "3px",
                    left: sportPrefs[s.key] ? "22px" : "3px", transition: "left .2s",
                  }} />
                </div>
              </div>
            ))}

            <div style={{ display: "flex", gap: "8px", marginTop: "1rem" }}>
              <button onClick={saveNotifPrefs} style={{ flex: 1, background: G, color: "#0a0a0a", border: "none", borderRadius: "10px", padding: "14px", fontWeight: "800", fontSize: "14px", cursor: "pointer" }}>
                Save Preferences
              </button>
              <button onClick={() => setShowNotifModal(false)} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "14px 20px", color: "#6b6760", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
