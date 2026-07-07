// PROJO COMMUNITY — Anonymous Chat Rooms (Lobby)
// Engagement-only. No dating profiles, photos, or matching happen here —
// this page and everything under /community is fully separate from
// PROJO Dating. See moderation.service.js on the backend for the rule
// that blocks contact-info sharing.
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { communityAPI } from "../../services/api";
import toast from "react-hot-toast";

const CC = {
  bg0:"#0A1210", bg1:"#0F1D1A", card:"#122622", cardLight:"#173330",
  teal:"#1F9E82", tealBright:"#2ED9B4", gold:"#D4AF37", goldLight:"#F5D76E",
  border:"rgba(46,217,180,0.18)", borderGold:"rgba(212,175,55,0.25)",
  text:"#EAF7F3", textMuted:"#8FB0A9", textDim:"#5C7871",
};
const FD = "'Cormorant Garamond', 'Georgia', serif";
const FB = "'Inter', sans-serif";

const CATEGORY_TAGS = ["All", "General", "Relationships", "Advice", "Fun", "Local", "Support"];

function AvatarBadge({ emoji = "💬", color = CC.teal, size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `radial-gradient(circle at 35% 30%, ${color}33, ${CC.card})`,
      border: `1.5px solid ${color}66`, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.5, flexShrink: 0,
      boxShadow: `0 0 16px ${color}22`,
    }}>{emoji}</div>
  );
}

export default function CommunityRooms({
  mode = "OPEN_LOCAL",
  basePath = "/community",
  backPath = "/",
  title = "PROJO Community",
  subtitle = "Open chat for Rustenburg & surrounds — share freely, be kind.",
}) {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [identity, setIdentity] = useState(null);

  useEffect(() => {
    loadRooms();
    if (mode === "ANONYMOUS") {
      communityAPI.getIdentity().then((r) => setIdentity(r.identity)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, mode]);

  async function loadRooms() {
    setLoading(true);
    try {
      const res = await communityAPI.listRooms({ mode, ...(sort === "trending" ? { sort: "trending" } : {}) });
      setRooms(res.rooms || []);
    } catch (e) {
      toast.error("Couldn't load rooms");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return rooms.filter((r) => {
      const matchesCat = category === "All" || r.category === category;
      const matchesSearch = !search || r.name.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [rooms, category, search]);

  async function enterRoom(slug) {
    try {
      await communityAPI.joinRoom(slug);
      navigate(`${basePath}/${slug}`);
    } catch (e) {
      toast.error(e.error || "Couldn't join that room");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${CC.bg0}, ${CC.bg1})`, fontFamily: FB, color: CC.text, paddingBottom: "2rem" }}>
      {/* Header */}
      <div style={{ padding: "1.5rem 1.25rem 1rem", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button onClick={() => navigate(backPath)} aria-label="Back" style={{ background: CC.card, border: `1px solid ${CC.border}`, borderRadius: "10px", width: "36px", height: "36px", color: CC.text, fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>←</button>
            <div>
              <div style={{ fontFamily: FD, fontSize: "28px", fontWeight: 700, color: CC.text }}>{title}</div>
              <div style={{ fontSize: "12.5px", color: CC.textMuted, marginTop: "2px" }}>
                {subtitle}
              </div>
            </div>
          </div>
          {identity && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: CC.card, border: `1px solid ${CC.border}`, borderRadius: "999px", padding: "6px 12px 6px 6px" }}>
              <AvatarBadge emoji={identity.avatar?.emoji} color={identity.avatar?.color} size={28} />
              <span style={{ fontSize: "12.5px", color: CC.textMuted }}>{identity.displayName}</span>
            </div>
          )}
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rooms…"
          style={{
            width: "100%", padding: "11px 14px", borderRadius: "12px",
            background: CC.card, border: `1px solid ${CC.border}`, color: CC.text,
            fontSize: "14px", outline: "none", marginBottom: "0.75rem",
          }}
        />

        {/* Category chips */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", marginBottom: "0.5rem" }}>
          {CATEGORY_TAGS.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              flexShrink: 0, padding: "6px 14px", borderRadius: "999px", fontSize: "12.5px",
              border: `1px solid ${category === cat ? CC.tealBright : CC.border}`,
              background: category === cat ? `${CC.teal}22` : "transparent",
              color: category === cat ? CC.tealBright : CC.textMuted, cursor: "pointer",
              fontWeight: category === cat ? 600 : 400,
            }}>{cat}</button>
          ))}
        </div>

        {/* Sort toggle */}
        <div style={{ display: "flex", gap: "8px" }}>
          {[["default", "All Rooms"], ["trending", "🔥 Trending"]].map(([key, label]) => (
            <button key={key} onClick={() => setSort(key)} style={{
              padding: "5px 12px", borderRadius: "8px", fontSize: "12px",
              background: sort === key ? CC.cardLight : "transparent",
              color: sort === key ? CC.goldLight : CC.textDim,
              border: `1px solid ${sort === key ? CC.borderGold : "transparent"}`,
              cursor: "pointer",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Room list */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 1.25rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: CC.textDim, padding: "3rem 0" }}>Loading rooms…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: CC.textDim, padding: "3rem 0", fontSize: "14px" }}>
            No rooms match that search.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filtered.map((room) => (
              <button key={room.id} onClick={() => enterRoom(room.slug)} style={{
                display: "flex", alignItems: "center", gap: "12px", textAlign: "left",
                background: CC.card, border: `1px solid ${CC.border}`, borderRadius: "16px",
                padding: "14px", cursor: "pointer", color: CC.text, width: "100%",
              }}>
                <AvatarBadge emoji={room.icon} color={CC.teal} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontFamily: FD, fontSize: "17px", fontWeight: 700 }}>{room.name}</span>
                    {room.isPinnedTop && <span style={{ fontSize: "10px", color: CC.goldLight }}>📌</span>}
                  </div>
                  <div style={{ fontSize: "12.5px", color: CC.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {room.description}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "11px", color: CC.tealBright }}>{room.memberCount || 0} members</div>
                  <div style={{ fontSize: "10.5px", color: CC.textDim }}>{room.messageCount || 0} msgs</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 640, margin: "1.5rem auto 0", padding: "0 1.25rem" }}>
        <div style={{ fontSize: "11.5px", color: CC.textDim, textAlign: "center", lineHeight: 1.6 }}>
          {mode === "ANONYMOUS"
            ? "The Dating Lounge is anonymous and separate from PROJO Dating profiles — no photos or matching here. Sharing contact details is not allowed and is filtered automatically."
            : "PROJO Community is open to everyone in Rustenburg & surrounds, under your real name. Photos and contact details are welcome — just keep it kind. Messages are filtered for profanity in English, Afrikaans & isiZulu."}
        </div>
      </div>
    </div>
  );
}
