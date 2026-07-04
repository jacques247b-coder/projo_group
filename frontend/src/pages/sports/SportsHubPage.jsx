// PROJO GROUP — Sports Hub Page
// Legal: Live scores (API-Football free tier), SABC+ embed, Betway affiliate links,
// YouTube highlights, Fun predictions league (no real money = not gambling)
import React, { useState, useEffect } from "react";
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

// ── REPLACE WITH YOUR AFFILIATE IDs ──────────────────────────
const BETWAY_BTAG = "YOUR_BETWAY_BTAG"; // From superpartnersafrica.com
const HOLLYWOODBETS_REF = "YOUR_HB_REF"; // From hollywoodbets.net/affiliates

const BETTING_PARTNERS = [
  {
    name: "Betway",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Betway_logo.svg/200px-Betway_logo.svg.png",
    url: `https://www.betway.co.za/?btag=${BETWAY_BTAG}`,
    offer: "R25 Free Bet on Signup",
    color: "#00a651",
    desc: "Title sponsor of the Betway Premiership (PSL)",
  },
  {
    name: "Hollywood Bets",
    logo: "https://www.hollywoodbets.net/images/logo.png",
    url: `https://www.hollywoodbets.net/?ref=${HOLLYWOODBETS_REF}`,
    offer: "R50 Free Bet Welcome Bonus",
    color: "#e31837",
    desc: "SA's most trusted sports betting platform",
  },
  {
    name: "SuperSport Bet",
    logo: "https://www.supersportbet.co.za/assets/img/logo.png",
    url: "https://www.supersportbet.co.za/",
    offer: "Watch & Bet Live",
    color: "#003087",
    desc: "Live streaming + betting in one place",
  },
];

// YouTube highlight playlists — official channels
const YOUTUBE_VIDEOS = [
  { id: "springboks", title: "🏉 Latest Springboks Highlights", videoId: "PLQ5ZTh3GJBE37MtIVqF-g5kGX6JE7zXoE", channel: "Springboks" },
  { id: "bafana", title: "⚽ Bafana Bafana Highlights", videoId: "PLFMKkGlS6z3TdKST_ULwCwnlJv0hRs9Xr", channel: "SAFA TV" },
  { id: "psl", title: "⚽ PSL Match Highlights", videoId: "PLQ3C6XM6I_JRKiBdChkj8-OzAxxbPUq3c", channel: "PSL" },
];

const TABS = [
  { key: "scores",      label: "📊 Live Scores" },
  { key: "watch",       label: "📺 Watch" },
  { key: "highlights",  label: "🎬 Highlights" },
  { key: "betting",     label: "🎯 Betting" },
  { key: "predict",     label: "🏆 Predict & Win" },
];

// Mock fixtures for demo — replace with API-Football free tier
const FIXTURES = [
  { home: "Mamelodi Sundowns", away: "Kaizer Chiefs", time: "19:30", league: "Betway Premiership", sport: "soccer", live: false },
  { home: "Springboks", away: "All Blacks", time: "17:00", league: "Rugby Championship", sport: "rugby", live: true, homeScore: 14, awayScore: 7 },
  { home: "Orlando Pirates", away: "SuperSport United", time: "15:00", league: "Betway Premiership", sport: "soccer", live: false },
  { home: "Lions", away: "Bulls", time: "20:00", league: "United Rugby Championship", sport: "rugby", live: false },
  { home: "Bafana Bafana", away: "Nigeria", time: "21:00", league: "AFCON Qualifier", sport: "soccer", live: false },
];

function ScoreCard({ fixture }) {
  return (
    <div style={{ background: BG2, border: `1px solid ${fixture.live ? "rgba(74,222,128,0.4)" : BORDER}`, borderRadius: "14px", padding: "1rem", marginBottom: "10px" }}>
      {fixture.live && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", animation: "pulse 1s infinite" }} />
          <span style={{ fontSize: "10px", color: "#4ade80", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>LIVE</span>
        </div>
      )}
      <div style={{ fontSize: "10px", color: "#6b6760", marginBottom: "8px" }}>
        {fixture.sport === "soccer" ? "⚽" : "🏉"} {fixture.league}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontSize: "13px", fontWeight: "700", color: "#f0ede8" }}>{fixture.home}</div>
        </div>
        <div style={{ textAlign: "center", padding: "0 16px" }}>
          {fixture.live ? (
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "20px", fontWeight: "800", color: G }}>
              {fixture.homeScore} - {fixture.awayScore}
            </div>
          ) : (
            <div style={{ fontSize: "13px", color: "#6b6760", fontWeight: "700" }}>{fixture.time}</div>
          )}
        </div>
        <div style={{ flex: 1, textAlign: "right" }}>
          <div style={{ fontSize: "13px", fontWeight: "700", color: "#f0ede8" }}>{fixture.away}</div>
        </div>
      </div>
    </div>
  );
}

// ── Predictions Component ────────────────────────────────────
function PredictionsTab({ user }) {
  const [predictions, setPredictions] = useState({});
  const [submitted, setSubmitted] = useState(false);

  function predict(fixtureIdx, pick) {
    setPredictions(p => ({ ...p, [fixtureIdx]: pick }));
  }

  function submit() {
    const count = Object.keys(predictions).length;
    if (count < 3) return toast.error("Pick at least 3 matches to submit");
    // Save to localStorage for now (would go to DB in production)
    localStorage.setItem(`projo_predictions_${new Date().toDateString()}`, JSON.stringify(predictions));
    setSubmitted(true);
    toast.success("🏆 Predictions submitted! Good luck!");
  }

  if (submitted) {
    return (
      <div style={{ background: BG2, border: `1px solid ${G}`, borderRadius: "16px", padding: "1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏆</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "20px", fontWeight: "800", color: G, marginBottom: "8px" }}>Predictions Submitted!</div>
        <div style={{ fontSize: "13px", color: "#6b6760", lineHeight: 1.6, marginBottom: "1rem" }}>
          Correct predictions earn PROJO Prediction Points. Top predictors each month win real prizes — free services, wallet credit and exclusive discounts!
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
          {Object.entries(predictions).map(([idx, pick]) => (
            <div key={idx} style={{ background: BG3, borderRadius: "8px", padding: "6px 12px", fontSize: "12px", color: G, fontWeight: "700" }}>
              {FIXTURES[idx]?.home} vs {FIXTURES[idx]?.away}: <span style={{ color: "#f0ede8" }}>{pick}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: "rgba(232,184,75,0.05)", border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "1rem", marginBottom: "1.25rem" }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", fontWeight: "800", color: G, marginBottom: "6px" }}>🏆 Predict & Win — Free to Play!</div>
        <div style={{ fontSize: "12px", color: "#b8a09a", lineHeight: 1.6 }}>
          Pick the winners of upcoming matches. No money needed — earn PROJO Prediction Points for each correct call. Top predictors win real prizes monthly: free rides, service discounts & wallet credit!
        </div>
        <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
          {[["🥇 1st Place", "R200 Wallet Credit"], ["🥈 2nd Place", "R100 Wallet Credit"], ["🥉 3rd Place", "Free Ride"]].map(([place, prize]) => (
            <div key={place} style={{ background: BG3, borderRadius: "8px", padding: "6px 12px", fontSize: "11px" }}>
              <span style={{ color: G, fontWeight: "700" }}>{place}</span>
              <span style={{ color: "#6b6760" }}> — {prize}</span>
            </div>
          ))}
        </div>
      </div>

      {FIXTURES.filter(f => !f.live).map((fixture, idx) => (
        <div key={idx} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "1rem", marginBottom: "10px" }}>
          <div style={{ fontSize: "10px", color: "#6b6760", marginBottom: "8px" }}>
            {fixture.sport === "soccer" ? "⚽" : "🏉"} {fixture.league} · {fixture.time}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#f0ede8" }}>{fixture.home}</div>
            <div style={{ fontSize: "11px", color: "#6b6760" }}>vs</div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#f0ede8" }}>{fixture.away}</div>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {[fixture.home, "Draw", fixture.away].map(pick => (
              <button key={pick} onClick={() => predict(idx, pick)} style={{
                flex: 1, background: predictions[idx] === pick ? "rgba(232,184,75,0.2)" : BG3,
                border: `1px solid ${predictions[idx] === pick ? G : BORDER}`,
                borderRadius: "8px", padding: "8px 4px",
                color: predictions[idx] === pick ? G : "#6b6760",
                fontSize: "11px", fontWeight: "700", cursor: "pointer",
              }}>{pick === fixture.home ? "Home" : pick === fixture.away ? "Away" : "Draw"}</button>
            ))}
          </div>
        </div>
      ))}

      <button onClick={submit} style={{
        width: "100%", background: G, color: "#0a0a0a", border: "none",
        borderRadius: "12px", padding: "14px", fontWeight: "800",
        fontSize: "15px", cursor: "pointer", marginTop: "8px",
      }}>
        Submit Predictions 🏆
      </button>
      <div style={{ fontSize: "10px", color: "#4a3030", textAlign: "center", marginTop: "8px" }}>
        Free to play · No real money wagered · PROJO Prediction Points only
      </div>
    </div>
  );
}

export default function SportsHubPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("scores");
  const [filter, setFilter] = useState("all");

  const filteredFixtures = filter === "all" ? FIXTURES
    : FIXTURES.filter(f => f.sport === filter);

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Sans',sans-serif", paddingBottom: "4rem" }}>
      <Navbar />

      {/* Header */}
      <div style={{ background: BG2, borderBottom: `1px solid ${BORDER}`, padding: "80px 1rem 0" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <div style={{ paddingBottom: "4px" }}>
            <div style={{ fontSize: "11px", color: G, fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase" }}>PROJO GROUP</div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.8rem", fontWeight: "800", color: "#f0ede8", margin: "4px 0" }}>
              Sports Hub 🏆
            </h1>
            <p style={{ fontSize: "13px", color: "#6b6760", margin: "0 0 12px" }}>
              Scores · Watch · Highlights · Betting · Predictions
            </p>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: "0", overflowX: "auto" }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                background: "none", border: "none",
                borderBottom: tab === t.key ? `3px solid ${G}` : "3px solid transparent",
                color: tab === t.key ? G : "#6b6760",
                padding: "10px 16px", fontSize: "12px", fontWeight: "700",
                cursor: "pointer", whiteSpace: "nowrap",
                fontFamily: "'DM Sans',sans-serif",
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "1.25rem 1rem" }}>

        {/* ── LIVE SCORES ── */}
        {tab === "scores" && (
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "1rem" }}>
              {[["all","All"], ["soccer","⚽ Soccer"], ["rugby","🏉 Rugby"]].map(([val, lbl]) => (
                <button key={val} onClick={() => setFilter(val)} style={{
                  background: filter === val ? "rgba(232,184,75,0.15)" : BG2,
                  border: `1px solid ${filter === val ? G : BORDER}`,
                  borderRadius: "8px", padding: "6px 14px", color: filter === val ? G : "#6b6760",
                  fontSize: "12px", fontWeight: "700", cursor: "pointer",
                }}>{lbl}</button>
              ))}
            </div>
            {filteredFixtures.map((f, i) => <ScoreCard key={i} fixture={f} />)}
            <div style={{ textAlign: "center", padding: "1rem", fontSize: "12px", color: "#4a3030" }}>
              Scores update every 60 seconds · Powered by PROJO Sports
            </div>
          </div>
        )}

        {/* ── WATCH LIVE ── */}
        {tab === "watch" && (
          <div>
            <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden", marginBottom: "1rem" }}>
              <div style={{ background: RED, padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>📺</span>
                <span style={{ fontWeight: "700", color: "#fff", fontSize: "13px" }}>SABC Sport — Free to Watch</span>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", marginLeft: "auto" }}>Live & Free</span>
              </div>
              <iframe
                src="https://sabc-plus.com/live/323/SABC-Sport"
                title="SABC Sport Live"
                style={{ width: "100%", height: "280px", border: "none", display: "block" }}
                allow="autoplay; fullscreen"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            </div>
            <div style={{ fontSize: "11px", color: "#4a3030", textAlign: "center", marginBottom: "1.25rem" }}>
              SABC Sport broadcasts selected PSL matches, rugby and cricket free-to-air
            </div>
            <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "1rem" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", fontWeight: "800", color: G, marginBottom: "12px" }}>📡 Watch More Live Sport</div>
              {[
                { name: "DStv Now", url: "https://now.dstv.com", desc: "SuperSport channels — all rugby & soccer", icon: "📡" },
                { name: "Showmax", url: "https://www.showmax.com", desc: "Premier League & more", icon: "🎬" },
              ].map(s => (
                <a key={s.name} href={s.url} target="_blank" rel="noreferrer" style={{
                  display: "flex", alignItems: "center", gap: "12px", padding: "10px",
                  background: BG3, borderRadius: "10px", marginBottom: "8px", textDecoration: "none",
                }}>
                  <span style={{ fontSize: "20px" }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#f0ede8" }}>{s.name}</div>
                    <div style={{ fontSize: "11px", color: "#6b6760" }}>{s.desc}</div>
                  </div>
                  <span style={{ marginLeft: "auto", color: G, fontSize: "12px" }}>↗</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── HIGHLIGHTS ── */}
        {tab === "highlights" && (
          <div>
            {YOUTUBE_VIDEOS.map(v => (
              <div key={v.id} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden", marginBottom: "1rem" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: "700", color: "#f0ede8", fontSize: "13px" }}>{v.title}</span>
                </div>
                <iframe
                  src={`https://www.youtube.com/embed/videoseries?list=${v.videoId}&autoplay=0`}
                  title={v.title}
                  style={{ width: "100%", height: "220px", border: "none", display: "block" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ))}
            <div style={{ fontSize: "11px", color: "#4a3030", textAlign: "center" }}>
              Official highlights from Springboks, SAFA TV and PSL YouTube channels
            </div>
          </div>
        )}

        {/* ── BETTING PARTNERS ── */}
        {tab === "betting" && (
          <div>
            <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", padding: "10px 14px", marginBottom: "1.25rem", fontSize: "11px", color: "#f87171" }}>
              ⚠️ Gamble responsibly. Must be 18+. Gambling is addictive. Please play within your means. If you need help: <strong>0800 006 008</strong> (National Responsible Gambling Programme — free, 24/7)
            </div>

            {BETTING_PARTNERS.map(partner => (
              <div key={partner.name} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1.25rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "800", color: "#f0ede8" }}>{partner.name}</div>
                    <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "2px" }}>{partner.desc}</div>
                  </div>
                  <div style={{ background: `${partner.color}20`, border: `1px solid ${partner.color}40`, borderRadius: "8px", padding: "4px 10px", fontSize: "11px", color: partner.color, fontWeight: "700", flexShrink: 0 }}>
                    {partner.offer}
                  </div>
                </div>
                <a href={partner.url} target="_blank" rel="noreferrer" style={{
                  display: "block", textAlign: "center", background: partner.color,
                  color: "#fff", textDecoration: "none", borderRadius: "10px",
                  padding: "12px", fontWeight: "800", fontSize: "14px",
                }}>
                  Bet Now on {partner.name} ↗
                </a>
              </div>
            ))}

            <div style={{ textAlign: "center", fontSize: "10px", color: "#4a3030", marginTop: "8px", lineHeight: 1.6 }}>
              PROJO GROUP earns a commission when you sign up via these links at no extra cost to you. All bookmakers are licensed by South African Provincial Gambling Boards.
            </div>
          </div>
        )}

        {/* ── PREDICTIONS ── */}
        {tab === "predict" && <PredictionsTab user={user} />}

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
