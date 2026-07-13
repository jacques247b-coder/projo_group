// PROJO GROUP — Texas Hold'em (free-to-play, fake chips only)
import React, { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const G = "#e8b84b";
const BG = "#0a0a0a";
const BG2 = "#111111";
const BG3 = "#1a1a1a";
const BORDER = "rgba(232,184,75,0.15)";
const SUIT_SYMBOLS = { H: "♥", D: "♦", C: "♣", S: "♠" };
const SUIT_COLORS = { H: "#ef4444", D: "#ef4444", C: "#f0ede8", S: "#f0ede8" };
const RANK_NAMES = { 11: "J", 12: "Q", 13: "K", 14: "A" };

function rankLabel(rank) { return RANK_NAMES[rank] || String(rank); }

function Card({ card, faceDown, small }) {
  const size = small ? { w: 32, h: 44, fs: 13 } : { w: 46, h: 64, fs: 18 };
  if (faceDown || card === "back") {
    return (
      <div style={{ width: size.w, height: size.h, borderRadius: "6px", background: `linear-gradient(135deg, ${G}, #8a6a1a)`, border: "1px solid rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <div style={{ width: "70%", height: "70%", border: "1px solid rgba(0,0,0,0.2)", borderRadius: "3px" }} />
      </div>
    );
  }
  return (
    <div style={{ width: size.w, height: size.h, borderRadius: "6px", background: "#f5f0e8", border: "1px solid rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}>
      <div style={{ fontSize: size.fs, fontWeight: "800", color: SUIT_COLORS[card.suit], lineHeight: 1 }}>{rankLabel(card.rank)}</div>
      <div style={{ fontSize: size.fs, color: SUIT_COLORS[card.suit], lineHeight: 1 }}>{SUIT_SYMBOLS[card.suit]}</div>
    </div>
  );
}

// ── Lobby ──────────────────────────────────────────────────────
function PokerLobby({ onJoinTable }) {
  const [tables, setTables] = useState([]);
  const [chips, setChips] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const { user } = useAuth();

  async function load() {
    try {
      const [t, c] = await Promise.all([api.get("/games/poker/tables"), api.get("/games/poker/chips")]);
      setTables(t.tables || []);
      setChips(c.pokerChips || 0);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); const iv = setInterval(load, 5000); return () => clearInterval(iv); }, []);

  async function loadLeaderboard() {
    try {
      const res = await api.get("/games/poker/leaderboard");
      setLeaderboard(res.leaderboard || []);
    } catch {}
  }

  async function createTable() {
    try {
      const res = await api.post("/games/poker/tables", { name: newTableName.trim() || undefined });
      setShowCreate(false);
      setNewTableName("");
      onJoinTable(res.table.id);
    } catch { toast.error("Could not create table"); }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.4rem", fontWeight: "800", color: G }}>🃏 Texas Hold'em</div>
          <div style={{ fontSize: "12px", color: "#a8a49e" }}>Free-to-play — fake chips only, just for fun and bragging rights</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "10px", color: "#6b6760", textTransform: "uppercase" }}>Your Chips</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "20px", fontWeight: "800", color: G }}>🪙 {chips.toLocaleString()}</div>
          <button onClick={() => { setShowLeaderboard(true); loadLeaderboard(); }} style={{ background: "none", border: "none", color: G, fontSize: "10px", cursor: "pointer", textDecoration: "underline", marginTop: "2px", padding: 0 }}>🏆 Leaderboard</button>
        </div>
      </div>

      <button onClick={() => setShowCreate(true)} style={{ width: "100%", background: G, border: "none", borderRadius: "12px", padding: "14px", color: "#0a0a0a", fontWeight: "800", fontSize: "14px", cursor: "pointer", marginBottom: "1.5rem" }}>
        + Create New Table
      </button>

      {loading ? (
        <div style={{ textAlign: "center", color: "#6b6760", padding: "2rem" }}>Loading tables…</div>
      ) : tables.length === 0 ? (
        <div style={{ textAlign: "center", color: "#6b6760", padding: "2rem" }}>No tables open right now — create one to get started!</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {tables.map(t => (
            <div key={t.id} onClick={() => onJoinTable(t.id)} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
              <div>
                <div style={{ fontWeight: "700", color: "#f0ede8", fontSize: "14px" }}>{t.name}</div>
                <div style={{ fontSize: "11px", color: "#6b6760" }}>Blinds {t.smallBlind}/{t.bigBlind} · {t.playerCount}/{t.maxPlayers} seated</div>
              </div>
              <span style={{ background: t.status === "PLAYING" ? "rgba(245,158,11,0.15)" : "rgba(74,222,128,0.15)", color: t.status === "PLAYING" ? "#f59e0b" : "#4ade80", fontSize: "10px", fontWeight: "700", padding: "4px 10px", borderRadius: "999px", border: `1px solid ${t.status === "PLAYING" ? "#f59e0b" : "#4ade80"}` }}>
                {t.status === "PLAYING" ? "IN PROGRESS" : "OPEN"}
              </span>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={() => setShowCreate(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1.5rem", maxWidth: "360px", width: "100%" }}>
            <div style={{ fontWeight: "800", color: "#f0ede8", marginBottom: "12px" }}>New Table</div>
            <input value={newTableName} onChange={e => setNewTableName(e.target.value)} placeholder="Table name (optional)"
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: BG3, border: `1px solid ${BORDER}`, color: "#f0ede8", fontSize: "13px", boxSizing: "border-box", marginBottom: "16px" }} />
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={createTable} style={{ flex: 1, background: G, border: "none", borderRadius: "10px", padding: "12px", color: "#0a0a0a", fontWeight: "800", cursor: "pointer" }}>Create</button>
              <button onClick={() => setShowCreate(false)} style={{ flex: 1, background: BG3, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "12px", color: "#a8a49e", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showLeaderboard && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={() => setShowLeaderboard(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1.5rem", maxWidth: "380px", width: "100%", maxHeight: "75vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: "800", fontSize: "16px", color: G }}>🏆 Chip Leaderboard</div>
              <button onClick={() => setShowLeaderboard(false)} style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "5px 10px", color: "#a8a49e", cursor: "pointer" }}>✕</button>
            </div>
            {leaderboard.length === 0 ? (
              <div style={{ textAlign: "center", color: "#6b6760", padding: "2rem" }}>Loading…</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {leaderboard.map((entry, i) => {
                  const isMe = entry.id === user?.id;
                  const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
                  return (
                    <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: isMe ? "rgba(232,184,75,0.1)" : "transparent", border: `1px solid ${isMe ? G : "transparent"}`, borderRadius: "8px", padding: "8px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: i < 3 ? G : "#6b6760", minWidth: "24px" }}>{medal}</span>
                        <span style={{ fontSize: "13px", color: isMe ? G : "#f0ede8", fontWeight: isMe ? "700" : "400" }}>{entry.name}{isMe ? " (you)" : ""}</span>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: G }}>🪙 {entry.pokerChips.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Table ──────────────────────────────────────────────────────
function PokerTable({ tableId, onLeave }) {
  const { user } = useAuth();
  const [state, setState] = useState(null);
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [turnSecondsLeft, setTurnSecondsLeft] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const sock = io(process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000", { transports: ["websocket"] });
    socketRef.current = sock;
    sock.on("connect", () => {
      sock.emit("poker:join_table", { tableId, userId: user?.id });
    });
    sock.on("poker:state", setState);
    sock.on("poker:error", ({ error }) => toast.error(error));
    return () => {
      sock.emit("poker:leave_table", { tableId, userId: user?.id });
      sock.disconnect();
    };
  }, [tableId, user?.id]);

  useEffect(() => {
    if (state?.currentTurnSeat === null || state?.currentTurnSeat === undefined) { setTurnSecondsLeft(null); return; }
    setTurnSecondsLeft(25);
    const iv = setInterval(() => setTurnSecondsLeft(s => (s === null ? null : Math.max(0, s - 1))), 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.currentTurnSeat, state?.round]);

  function act(action, amount) {
    socketRef.current?.emit("poker:action", { tableId, userId: user?.id, action, amount });
  }

  function leaveTable() {
    socketRef.current?.emit("poker:leave_table", { tableId, userId: user?.id });
    onLeave();
  }

  if (!state) return <div style={{ textAlign: "center", color: "#6b6760", padding: "3rem" }}>Joining table…</div>;

  const me = state.players.find(p => p.userId === user?.id);
  const isMyTurn = me && state.currentTurnSeat === me.seat;
  const toCall = state.currentBet - (me?.currentBet || 0);
  const minRaise = state.currentBet + state.bigBlind;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <button onClick={leaveTable} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "6px 14px", color: "#a8a49e", fontSize: "12px", cursor: "pointer" }}>← Leave Table</button>
        <div style={{ fontSize: "12px", color: "#6b6760" }}>{state.name}</div>
      </div>

      {/* Table felt */}
      <div style={{ background: "radial-gradient(ellipse at center, #1a3a2a, #0d1f16)", border: `2px solid ${G}`, borderRadius: "50% / 30%", padding: "2.5rem 1rem", position: "relative", minHeight: "220px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "11px", color: "#a8a49e", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>{state.round} · Pot: 🪙{state.pot}</div>
        <div style={{ display: "flex", gap: "6px", marginBottom: "16px", minHeight: "64px", alignItems: "center" }}>
          {state.communityCards.length === 0 ? (
            <span style={{ fontSize: "11px", color: "#6b6760" }}>Waiting for the flop…</span>
          ) : state.communityCards.map((c, i) => <Card key={i} card={c} />)}
        </div>

        {/* Seats */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
          {state.players.map(p => {
            const isTurn = state.currentTurnSeat === p.seat;
            const isMe = p.userId === user?.id;
            return (
              <div key={p.seat} style={{
                background: isTurn ? "rgba(232,184,75,0.2)" : "rgba(0,0,0,0.35)",
                border: `1px solid ${isTurn ? G : "rgba(255,255,255,0.1)"}`,
                borderRadius: "10px", padding: "8px 10px", textAlign: "center", minWidth: "90px",
                opacity: p.status === "FOLDED" ? 0.4 : 1, position: "relative",
              }}>
                {isTurn && turnSecondsLeft !== null && (
                  <span style={{ position: "absolute", top: "-8px", right: "-8px", background: turnSecondsLeft <= 8 ? "#ef4444" : G, color: "#0a0a0a", fontSize: "9px", fontWeight: "800", width: "20px", height: "20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {turnSecondsLeft}
                  </span>
                )}
                <div style={{ fontSize: "11px", fontWeight: "700", color: isMe ? G : "#f0ede8" }}>{p.name}{isMe ? " (you)" : ""}</div>
                <div style={{ fontSize: "10px", color: "#a8a49e" }}>🪙{p.chips}</div>
                <div style={{ display: "flex", gap: "3px", justifyContent: "center", marginTop: "4px" }}>
                  {p.holeCards.map((c, i) => <Card key={i} card={c} faceDown={c === "back"} small />)}
                </div>
                {p.currentBet > 0 && <div style={{ fontSize: "9px", color: G, marginTop: "3px" }}>Bet: {p.currentBet}</div>}
                {p.status === "FOLDED" && <div style={{ fontSize: "9px", color: "#ef4444", marginTop: "2px" }}>FOLDED</div>}
                {p.status === "ALL_IN" && <div style={{ fontSize: "9px", color: "#f59e0b", marginTop: "2px" }}>ALL IN</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action controls */}
      {isMyTurn && state.status === "PLAYING" && (
        <div style={{ background: BG2, border: `1px solid ${G}`, borderRadius: "14px", padding: "1rem" }}>
          <div style={{ fontSize: "12px", color: turnSecondsLeft <= 8 ? "#ef4444" : G, fontWeight: "700", marginBottom: "10px", textAlign: "center" }}>
            Your turn! {turnSecondsLeft !== null && `(${turnSecondsLeft}s)`}
          </div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
            <button onClick={() => act("fold")} style={{ flex: 1, background: "#7f1d1d", border: "1px solid #ef4444", borderRadius: "8px", padding: "10px", color: "#f87171", fontWeight: "700", cursor: "pointer" }}>Fold</button>
            {toCall === 0 ? (
              <button onClick={() => act("check")} style={{ flex: 1, background: "#166534", border: "1px solid #4ade80", borderRadius: "8px", padding: "10px", color: "#4ade80", fontWeight: "700", cursor: "pointer" }}>Check</button>
            ) : (
              <button onClick={() => act("call")} style={{ flex: 1, background: "#166534", border: "1px solid #4ade80", borderRadius: "8px", padding: "10px", color: "#4ade80", fontWeight: "700", cursor: "pointer" }}>Call {toCall}</button>
            )}
            <button onClick={() => act("allin")} style={{ flex: 1, background: "#4a1a1a", border: "1px solid #f59e0b", borderRadius: "8px", padding: "10px", color: "#f59e0b", fontWeight: "700", cursor: "pointer" }}>All In</button>
          </div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
            {[
              { label: "Min", amount: minRaise },
              { label: "½ Pot", amount: Math.min((me?.currentBet || 0) + Math.round(state.pot / 2), (me?.chips || 0) + (me?.currentBet || 0)) },
              { label: "Pot", amount: Math.min((me?.currentBet || 0) + state.pot, (me?.chips || 0) + (me?.currentBet || 0)) },
            ].map(opt => (
              <button key={opt.label} onClick={() => setRaiseAmount(Math.max(opt.amount, minRaise))} style={{ flex: 1, background: raiseAmount === Math.max(opt.amount, minRaise) ? "rgba(232,184,75,0.2)" : BG3, border: `1px solid ${raiseAmount === Math.max(opt.amount, minRaise) ? G : BORDER}`, borderRadius: "6px", padding: "6px", color: G, fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>
                {opt.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input type="range" min={minRaise} max={me?.chips + me?.currentBet || minRaise} value={raiseAmount || minRaise} onChange={e => setRaiseAmount(parseInt(e.target.value))}
              style={{ flex: 1 }} />
            <button onClick={() => act("raise", raiseAmount || minRaise)} style={{ background: G, border: "none", borderRadius: "8px", padding: "10px 16px", color: "#0a0a0a", fontWeight: "800", cursor: "pointer", whiteSpace: "nowrap" }}>
              Raise to {raiseAmount || minRaise}
            </button>
          </div>
        </div>
      )}
      {!isMyTurn && state.status === "PLAYING" && (
        <div style={{ textAlign: "center", color: "#6b6760", fontSize: "12px", padding: "10px" }}>Waiting for other players…</div>
      )}
    </div>
  );
}

export default function PokerGame() {
  const [tableId, setTableId] = useState(null);
  return tableId
    ? <PokerTable tableId={tableId} onLeave={() => setTableId(null)} />
    : <PokerLobby onJoinTable={setTableId} />;
}
