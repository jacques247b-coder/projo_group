// PROJO COMMUNITY — Chat Room View
// Real-time anonymous chat via Socket.io. Every message is checked by the
// backend moderation service before it ever reaches this screen for anyone
// else — including the automatic contact-info block described to Jacques.
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import { communityAPI } from "../../services/api";
import toast from "react-hot-toast";

const CC = {
  bg0:"#0A1210", bg1:"#0F1D1A", card:"#122622", cardLight:"#173330",
  bubble:"#1B3A35", bubbleMe:"#1F5A4A",
  teal:"#1F9E82", tealBright:"#2ED9B4", gold:"#D4AF37", goldLight:"#F5D76E",
  border:"rgba(46,217,180,0.18)", borderGold:"rgba(212,175,55,0.25)",
  text:"#EAF7F3", textMuted:"#8FB0A9", textDim:"#5C7871", danger:"#E05252",
};
const FD = "'Cormorant Garamond', 'Georgia', serif";
const FB = "'Inter', sans-serif";

const QUICK_REACTIONS = ["❤️", "😂", "👍", "😮", "😢", "🙌"];

function AvatarBadge({ emoji = "💬", color = CC.teal, size = 34 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `radial-gradient(circle at 35% 30%, ${color}33, ${CC.card})`,
      border: `1.5px solid ${color}66`, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.5, flexShrink: 0,
    }}>{emoji}</div>
  );
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function CommunityRoomView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pinned, setPinned] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showGifModal, setShowGifModal] = useState(false);
  const [recording, setRecording] = useState(false);

  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      setLoading(true);
      try {
        const joinRes = await communityAPI.joinRoom(slug);
        const detailRes = await communityAPI.getRoom(slug, { limit: 50 });
        if (!active) return;
        setRoom(detailRes.room);
        setIdentity(joinRes.identity);
        setMessages(detailRes.messages || []);
        setPinned(detailRes.pinned || null);
        scrollToBottom();
      } catch (e) {
        toast.error(e.error || "Couldn't load this room");
        navigate("/community");
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!room) return;
    const sock = io(process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000", {
      transports: ["websocket"],
    });
    socketRef.current = sock;

    sock.emit("community:join_room", { roomId: room.id });

    sock.on("community:new_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    });

    sock.on("community:message_blocked", ({ reason }) => {
      toast.error(reason || "That message couldn't be sent.");
    });

    sock.on("community:reaction_update", ({ messageId, emoji }) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, _lastReaction: emoji } : m)));
    });

    return () => {
      sock.emit("community:leave_room", { roomId: room.id });
      sock.disconnect();
    };
  }, [room, scrollToBottom]);

  function sendMessage(type = "text", content = input, mediaUrl = null) {
    if (!content && !mediaUrl) return;
    if (!socketRef.current || !room || !identity) return;
    socketRef.current.emit(
      "community:send_message",
      { roomId: room.id, userId: user.id, type, content, mediaUrl },
      (ack) => {
        if (!ack?.ok && !ack?.blocked) {
          toast.error(ack?.error || "Message failed to send");
        }
      }
    );
    if (type === "text") setInput("");
  }

  function handleImagePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Images must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => sendMessage("image", "", reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => sendMessage("voice", "", reader.result);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (e) {
      toast.error("Microphone access denied");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function react(messageId, emoji) {
    if (!socketRef.current || !room) return;
    socketRef.current.emit("community:react", { messageId, roomId: room.id, userId: user.id, emoji });
    communityAPI.react(messageId, emoji).catch(() => {});
  }

  async function reportMessage(messageId) {
    try {
      await communityAPI.report({ messageId, roomId: room.id, reason: "Reported from chat" });
      toast.success("Reported to moderators");
    } catch (e) {
      toast.error("Couldn't send report");
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: CC.bg0, display: "flex", alignItems: "center", justifyContent: "center", color: CC.textMuted, fontFamily: FB }}>
        Loading room…
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${CC.bg0}, ${CC.bg1})`, fontFamily: FB, color: CC.text, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderBottom: `1px solid ${CC.border}`, background: CC.card, position: "sticky", top: 0, zIndex: 5 }}>
        <button onClick={() => navigate("/community")} style={{ background: "none", border: "none", color: CC.textMuted, fontSize: "20px", cursor: "pointer" }}>←</button>
        <AvatarBadge emoji={room?.icon} color={CC.teal} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FD, fontSize: "17px", fontWeight: 700 }}>{room?.name}</div>
          <div style={{ fontSize: "11px", color: CC.textMuted }}>{room?.memberCount || 0} members · anonymous</div>
        </div>
        <button onClick={() => setShowPollModal(true)} title="Create poll" style={{ background: CC.cardLight, border: `1px solid ${CC.borderGold}`, borderRadius: "8px", padding: "6px 10px", color: CC.goldLight, fontSize: "12px", cursor: "pointer" }}>📊 Poll</button>
      </div>

      {/* Pinned message */}
      {pinned && (
        <div style={{ padding: "8px 16px", background: `${CC.gold}14`, borderBottom: `1px solid ${CC.borderGold}`, fontSize: "12.5px", color: CC.goldLight, display: "flex", gap: "6px", alignItems: "center" }}>
          <span>📌</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pinned.displayName}: {pinned.content}</span>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: CC.textDim, fontSize: "13px", marginTop: "2rem" }}>
            No messages yet — say hi 👋
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.displayName === identity?.displayName;
          return (
            <div key={msg.id} style={{ display: "flex", gap: "8px", flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end" }}>
              <AvatarBadge emoji={msg.avatar?.emoji || "💬"} color={isMe ? CC.gold : CC.teal} size={30} />
              <div style={{ maxWidth: "72%" }}>
                {!isMe && <div style={{ fontSize: "11px", color: CC.textMuted, marginBottom: "2px" }}>{msg.displayName}</div>}
                <div style={{
                  background: isMe ? CC.bubbleMe : CC.bubble, borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  padding: "9px 13px", fontSize: "13.5px", lineHeight: 1.45, position: "relative",
                  border: msg.isFlagged ? `1px solid ${CC.danger}55` : "none",
                }}>
                  {msg.type === "image" && msg.mediaUrl && (
                    <img src={msg.mediaUrl} alt="shared" style={{ maxWidth: "220px", borderRadius: "10px", display: "block", marginBottom: msg.content ? "6px" : 0 }} />
                  )}
                  {msg.type === "voice" && msg.mediaUrl && (
                    <audio controls src={msg.mediaUrl} style={{ maxWidth: "220px", height: "32px" }} />
                  )}
                  {msg.type === "gif" && msg.mediaUrl && (
                    <img src={msg.mediaUrl} alt="gif" style={{ maxWidth: "180px", borderRadius: "10px", display: "block" }} />
                  )}
                  {msg.content && <span>{msg.content}</span>}
                </div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "3px", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                  <span style={{ fontSize: "10px", color: CC.textDim }}>{timeAgo(msg.createdAt)}</span>
                  {QUICK_REACTIONS.slice(0, 3).map((e) => (
                    <button key={e} onClick={() => react(msg.id, e)} style={{ background: "none", border: "none", fontSize: "11px", cursor: "pointer", opacity: 0.6 }}>{e}</button>
                  ))}
                  <button onClick={() => reportMessage(msg.id)} style={{ background: "none", border: "none", fontSize: "10px", color: CC.textDim, cursor: "pointer" }}>Report</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div style={{ padding: "10px 12px", borderTop: `1px solid ${CC.border}`, background: CC.card, display: "flex", alignItems: "center", gap: "8px" }}>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} style={{ display: "none" }} />
        <button onClick={() => fileInputRef.current?.click()} title="Share image" style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>🖼️</button>
        <button onClick={() => setShowGifModal(true)} title="Share GIF" style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}>GIF</button>
        <button
          onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
          title="Hold to record voice note"
          style={{ background: recording ? CC.danger : "none", border: "none", fontSize: "20px", cursor: "pointer", borderRadius: "50%", padding: "2px" }}
        >🎙️</button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage("text")}
          placeholder="Message the room…"
          style={{ flex: 1, padding: "10px 14px", borderRadius: "999px", background: CC.cardLight, border: `1px solid ${CC.border}`, color: CC.text, fontSize: "14px", outline: "none" }}
        />
        <button onClick={() => sendMessage("text")} style={{ background: `linear-gradient(135deg, ${CC.teal}, ${CC.tealBright})`, border: "none", borderRadius: "50%", width: "38px", height: "38px", color: "#04211b", fontSize: "16px", cursor: "pointer" }}>➤</button>
      </div>

      {showPollModal && (
        <PollModal
          onClose={() => setShowPollModal(false)}
          onCreate={async (question, options) => {
            try {
              await communityAPI.createPoll(slug, { question, options, closesInMinutes: 1440 });
              toast.success("Poll posted");
              setShowPollModal(false);
              sendMessage("announcement", `📊 New poll: ${question}`);
            } catch (e) { toast.error("Couldn't create poll"); }
          }}
        />
      )}

      {showGifModal && (
        <GifModal onClose={() => setShowGifModal(false)} onSend={(url) => { sendMessage("gif", "", url); setShowGifModal(false); }} />
      )}
    </div>
  );
}

function PollModal({ onClose, onCreate }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: CC.card, borderRadius: "20px 20px 0 0", padding: "1.5rem", width: "100%", maxWidth: "480px", border: `1px solid ${CC.borderGold}` }}>
        <div style={{ fontFamily: FD, fontSize: "20px", marginBottom: "12px" }}>Create a poll</div>
        <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask something…" style={{ width: "100%", padding: "10px", borderRadius: "10px", background: CC.cardLight, border: `1px solid ${CC.border}`, color: CC.text, marginBottom: "10px" }} />
        {options.map((opt, i) => (
          <input key={i} value={opt} onChange={(e) => setOptions((o) => o.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`Option ${i + 1}`} style={{ width: "100%", padding: "9px", borderRadius: "10px", background: CC.cardLight, border: `1px solid ${CC.border}`, color: CC.text, marginBottom: "8px" }} />
        ))}
        <button onClick={() => setOptions((o) => [...o, ""])} style={{ background: "none", border: "none", color: CC.tealBright, fontSize: "13px", cursor: "pointer", marginBottom: "14px" }}>+ Add option</button>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "none", border: `1px solid ${CC.border}`, color: CC.textMuted }}>Cancel</button>
          <button
            onClick={() => { const clean = options.map((o) => o.trim()).filter(Boolean); if (question.trim() && clean.length >= 2) onCreate(question.trim(), clean); else toast.error("Add a question and at least 2 options"); }}
            style={{ flex: 1, padding: "10px", borderRadius: "10px", background: CC.teal, border: "none", color: "#04211b", fontWeight: 600 }}
          >Post poll</button>
        </div>
      </div>
    </div>
  );
}

function GifModal({ onClose, onSend }) {
  const [url, setUrl] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: CC.card, borderRadius: "20px 20px 0 0", padding: "1.5rem", width: "100%", maxWidth: "480px", border: `1px solid ${CC.borderGold}` }}>
        <div style={{ fontFamily: FD, fontSize: "20px", marginBottom: "12px" }}>Share a GIF</div>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a GIF link…" style={{ width: "100%", padding: "10px", borderRadius: "10px", background: CC.cardLight, border: `1px solid ${CC.border}`, color: CC.text, marginBottom: "14px" }} />
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "none", border: `1px solid ${CC.border}`, color: CC.textMuted }}>Cancel</button>
          <button onClick={() => (url.trim() ? onSend(url.trim()) : toast.error("Paste a link first"))} style={{ flex: 1, padding: "10px", borderRadius: "10px", background: CC.teal, border: "none", color: "#04211b", fontWeight: 600 }}>Send</button>
        </div>
      </div>
    </div>
  );
}
