// PROJO GROUP — Ride Chat
// Shared component used by both the driver dashboard and passenger
// tracking page. Fetches history on open, listens for live messages via
// the socket already connected on the parent page, sends via REST.
import React, { useState, useEffect, useRef } from "react";
import { rideAPI } from "../../services/api";
import toast from "react-hot-toast";

const G = "#e8b84b";

export default function RideChat({ rideId, socket, currentUserId, otherPartyName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    rideAPI.getMessages(rideId)
      .then(res => { if (!cancelled) setMessages(res.messages || []); })
      .catch(() => toast.error("Could not load chat history"))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [rideId]);

  useEffect(() => {
    if (!socket) return;
    function onMessage(msg) {
      if (msg.rideId !== rideId) return;
      setMessages(prev => [...prev, msg]);
    }
    socket.on("ride:chat_message", onMessage);
    return () => socket.off("ride:chat_message", onMessage);
  }, [socket, rideId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    try {
      await rideAPI.sendMessage(rideId, text);
      // No need to manually append — the socket event (which the server
      // sends back to this same ride room, including the sender) will add
      // it, keeping a single source of truth instead of two code paths
      // that could drift out of sync.
    } catch {
      toast.error("Could not send — try again");
      setInput(text);
    } finally { setSending(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#111111", border: "1px solid rgba(232,184,75,0.15)", borderRadius: "16px 16px 0 0", padding: "1rem", maxWidth: "480px", width: "100%", height: "70vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ fontWeight: "700", color: "#f0ede8", fontSize: "14px" }}>💬 Chat with {otherPartyName || "the other party"}</div>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid rgba(232,184,75,0.15)", borderRadius: "8px", padding: "4px 10px", color: "#a8a49e", cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
          {loading ? (
            <div style={{ textAlign: "center", color: "#6b6760", padding: "2rem" }}>Loading…</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: "center", color: "#6b6760", padding: "2rem", fontSize: "13px" }}>No messages yet — say hello 👋</div>
          ) : messages.map(m => {
            const isMine = m.senderId === currentUserId;
            return (
              <div key={m.id} style={{ alignSelf: isMine ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                <div style={{
                  background: isMine ? "rgba(232,184,75,0.15)" : "#1a1a1a",
                  border: `1px solid ${isMine ? G : "rgba(232,184,75,0.15)"}`,
                  borderRadius: "12px", padding: "8px 12px", color: "#f0ede8", fontSize: "13px", wordBreak: "break-word",
                }}>
                  {m.message}
                </div>
                <div style={{ fontSize: "10px", color: "#6b6760", marginTop: "2px", textAlign: isMine ? "right" : "left" }}>
                  {new Date(m.createdAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") send(); }}
            placeholder="Type a message..."
            style={{ flex: 1, background: "#1a1a1a", border: "1px solid rgba(232,184,75,0.15)", borderRadius: "10px", padding: "10px 12px", color: "#f0ede8", fontSize: "13px", outline: "none" }}
          />
          <button onClick={send} disabled={sending || !input.trim()} style={{ background: G, border: "none", borderRadius: "10px", padding: "10px 18px", color: "#0a0a0a", fontWeight: "700", cursor: "pointer", opacity: sending || !input.trim() ? 0.5 : 1 }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
