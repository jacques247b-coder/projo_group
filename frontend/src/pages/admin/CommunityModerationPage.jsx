// PROJO ADMIN — Community Chat Moderation Dashboard
// Reports queue, auto-held messages (contact-info/profanity catches), full
// moderation audit log, and mute/ban controls.
import React, { useEffect, useState } from "react";
import { communityAPI } from "../../services/api";
import toast from "react-hot-toast";

const C = {
  bg: "#0D0F12", card: "#161A1F", border: "rgba(255,255,255,0.08)",
  text: "#F1F3F5", muted: "#8A93A0", danger: "#E05252", warn: "#D4AF37", good: "#2ED9B4",
};
const FB = "'Inter', sans-serif";

const TABS = [
  { key: "reports", label: "Reports" },
  { key: "held", label: "Held Messages" },
  { key: "events", label: "Moderation Log" },
];

function ActionBar({ userId, roomId }) {
  const [busy, setBusy] = useState(false);

  async function mute(minutes) {
    setBusy(true);
    try {
      await communityAPI.modMuteUser(userId, { roomId, minutes, reason: "Moderator action" });
      toast.success(`Muted for ${minutes} minutes`);
    } catch (e) { toast.error("Failed to mute"); } finally { setBusy(false); }
  }
  async function ban() {
    setBusy(true);
    try {
      await communityAPI.modBanUser(userId, { roomId, permanent: true, reason: "Moderator action" });
      toast.success("User banned");
    } catch (e) { toast.error("Failed to ban"); } finally { setBusy(false); }
  }
  async function unban() {
    setBusy(true);
    try {
      await communityAPI.modUnbanUser(userId);
      toast.success("Sanctions cleared");
    } catch (e) { toast.error("Failed"); } finally { setBusy(false); }
  }

  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
      <button disabled={busy} onClick={() => mute(60)} style={btnStyle(C.warn)}>Mute 1h</button>
      <button disabled={busy} onClick={() => mute(1440)} style={btnStyle(C.warn)}>Mute 24h</button>
      <button disabled={busy} onClick={ban} style={btnStyle(C.danger)}>Ban</button>
      <button disabled={busy} onClick={unban} style={btnStyle(C.good)}>Clear sanctions</button>
    </div>
  );
}

function btnStyle(color) {
  return { background: "transparent", border: `1px solid ${color}66`, color, borderRadius: "6px", padding: "4px 9px", fontSize: "11.5px", cursor: "pointer" };
}

export default function CommunityModerationPage() {
  const [tab, setTab] = useState("reports");
  const [reports, setReports] = useState([]);
  const [held, setHeld] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [r, h, e] = await Promise.all([
        communityAPI.modListReports("PENDING"),
        communityAPI.modHeldMessages(),
        communityAPI.modEvents(),
      ]);
      setReports(r.reports || []);
      setHeld(h.messages || []);
      setEvents(e.events || []);
    } catch (err) {
      toast.error("Failed to load moderation data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function approveMessage(id) {
    try { await communityAPI.modApproveMessage(id); toast.success("Approved"); load(); }
    catch (e) { toast.error("Failed"); }
  }
  async function removeMessage(id) {
    try { await communityAPI.modRemoveMessage(id); toast.success("Removed"); load(); }
    catch (e) { toast.error("Failed"); }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FB, padding: "1.5rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>Community Moderation</div>
        <div style={{ fontSize: "13px", color: C.muted, marginBottom: "1.25rem" }}>
          Contact-info shares, profanity, and reported messages land here for review.
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem" }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "8px 16px", borderRadius: "8px", fontSize: "13px", cursor: "pointer",
              background: tab === t.key ? C.card : "transparent",
              border: `1px solid ${tab === t.key ? C.good : C.border}`,
              color: tab === t.key ? C.good : C.muted,
            }}>{t.label}{t.key === "reports" && reports.length > 0 ? ` (${reports.length})` : ""}{t.key === "held" && held.length > 0 ? ` (${held.length})` : ""}</button>
          ))}
          <button onClick={load} style={{ marginLeft: "auto", padding: "8px 14px", borderRadius: "8px", fontSize: "12.5px", background: "transparent", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer" }}>↻ Refresh</button>
        </div>

        {loading ? (
          <div style={{ color: C.muted, padding: "2rem 0" }}>Loading…</div>
        ) : tab === "reports" ? (
          reports.length === 0 ? <Empty text="No pending reports." /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {reports.map((r) => (
                <div key={r.id} style={cardStyle}>
                  <div style={{ fontSize: "13px", marginBottom: "6px" }}><b>Reason:</b> {r.reason}</div>
                  {r.details && <div style={{ fontSize: "12.5px", color: C.muted, marginBottom: "6px" }}>{r.details}</div>}
                  {r.message && (
                    <div style={{ fontSize: "13px", background: "#0000002a", padding: "8px", borderRadius: "6px", marginBottom: "8px" }}>
                      <b>{r.message.displayName}:</b> {r.message.content}
                    </div>
                  )}
                  <div style={{ fontSize: "11px", color: C.muted, marginBottom: "8px" }}>{new Date(r.createdAt).toLocaleString()}</div>
                  {r.messageId && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => approveMessage(r.messageId)} style={btnStyle(C.good)}>Approve message</button>
                      <button onClick={() => removeMessage(r.messageId)} style={btnStyle(C.danger)}>Remove message</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : tab === "held" ? (
          held.length === 0 ? <Empty text="No messages currently held for review." /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {held.map((m) => (
                <div key={m.id} style={cardStyle}>
                  <div style={{ fontSize: "13px", marginBottom: "4px" }}><b>{m.displayName}</b> · <span style={{ color: C.warn }}>{m.flagReason}</span></div>
                  <div style={{ fontSize: "13px", background: "#0000002a", padding: "8px", borderRadius: "6px", marginBottom: "8px", wordBreak: "break-word" }}>{m.content}</div>
                  <div style={{ fontSize: "11px", color: C.muted, marginBottom: "8px" }}>{new Date(m.createdAt).toLocaleString()}</div>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <button onClick={() => approveMessage(m.id)} style={btnStyle(C.good)}>Approve & post</button>
                    <button onClick={() => removeMessage(m.id)} style={btnStyle(C.danger)}>Keep removed</button>
                  </div>
                  <ActionBar userId={m.userId} roomId={m.roomId} />
                </div>
              ))}
            </div>
          )
        ) : (
          events.length === 0 ? <Empty text="No moderation events yet." /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {events.map((ev) => (
                <div key={ev.id} style={{ ...cardStyle, padding: "10px 14px", display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center" }}>
                  <div>
                    <span style={{ fontWeight: 600, color: eventColor(ev.action) }}>{ev.action}</span>
                    {ev.reason && <span style={{ color: C.muted, fontSize: "12px" }}> — {ev.reason}</span>}
                  </div>
                  <div style={{ fontSize: "11px", color: C.muted, flexShrink: 0 }}>{new Date(ev.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function eventColor(action) {
  if (action.includes("BLOCKED") || action === "BANNED") return C.danger;
  if (action.includes("MASKED") || action === "MUTED" || action === "FLOOD_BLOCKED") return C.warn;
  return C.good;
}

function Empty({ text }) {
  return <div style={{ color: C.muted, textAlign: "center", padding: "2.5rem 0", fontSize: "13.5px" }}>{text}</div>;
}

const cardStyle = { background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px" };
