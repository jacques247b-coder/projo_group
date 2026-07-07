// PROJO GROUP — Panic Button
// Trigger by holding for 5 seconds (mouse or touch) OR tapping 5 times
// quickly (easier on mobile where a steady long-press can be awkward).
// Captures location best-effort — never blocks the trigger waiting on a
// permission prompt. After triggering, shows a brief window to mark it a
// false alarm in case of an accidental press.
import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { panicAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const HOLD_MS = 5000;
const TAP_COUNT_NEEDED = 5;
const TAP_WINDOW_MS = 3000;
const FALSE_ALARM_WINDOW_S = 10;

function getLocationBestEffort() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    const timeout = setTimeout(() => resolve(null), 3000);
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(timeout); resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }); },
      () => { clearTimeout(timeout); resolve(null); },
      { timeout: 2800 }
    );
  });
}

export default function PanicButton({ top = "14px" }) {
  const { user } = useAuth();
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [sentAlertId, setSentAlertId] = useState(null);
  const [countdown, setCountdown] = useState(FALSE_ALARM_WINDOW_S);

  const holdTimerRef = useRef(null);
  const holdIntervalRef = useRef(null);
  const tapTimesRef = useRef([]);

  function startHold() {
    if (sentAlertId) return;
    setHolding(true);
    setProgress(0);
    const startedAt = Date.now();
    holdIntervalRef.current = setInterval(() => {
      setProgress(Math.min(100, ((Date.now() - startedAt) / HOLD_MS) * 100));
    }, 50);
    holdTimerRef.current = setTimeout(() => {
      trigger();
    }, HOLD_MS);
  }

  function cancelHold() {
    setHolding(false);
    setProgress(0);
    clearTimeout(holdTimerRef.current);
    clearInterval(holdIntervalRef.current);
  }

  function registerTap() {
    if (sentAlertId) return;
    const now = Date.now();
    tapTimesRef.current = [...tapTimesRef.current, now].filter((t) => now - t < TAP_WINDOW_MS);
    if (tapTimesRef.current.length >= TAP_COUNT_NEEDED) {
      tapTimesRef.current = [];
      trigger();
    }
  }

  async function trigger() {
    cancelHold();
    tapTimesRef.current = [];
    toast.loading("Sending emergency alert…", { id: "panic-sending" });
    try {
      const loc = await getLocationBestEffort();
      const res = user
        ? await panicAPI.trigger(loc?.latitude, loc?.longitude)
        : await panicAPI.triggerAnonymous(loc?.latitude, loc?.longitude);
      toast.dismiss("panic-sending");
      setSentAlertId(res.alertId);
      setCountdown(FALSE_ALARM_WINDOW_S);
    } catch (e) {
      toast.dismiss("panic-sending");
      toast.error("Couldn't send alert — please call emergency services directly if you're in danger.", { duration: 8000 });
    }
  }

  useEffect(() => {
    if (!sentAlertId) return;
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [sentAlertId, countdown]);

  async function markFalseAlarm() {
    try {
      await panicAPI.selfCancel(sentAlertId);
    } catch {}
    setSentAlertId(null);
  }

  return (
    <>
      <div style={{ position: "fixed", top, left: "14px", zIndex: 400 }}>
        <button
          onClick={() => { if (!holding) setShowInfo(true); }}
          onMouseDown={startHold}
          onMouseUp={cancelHold}
          onMouseLeave={cancelHold}
          onTouchStart={(e) => { e.preventDefault(); startHold(); registerTap(); }}
          onTouchEnd={cancelHold}
          aria-label="Panic button — hold 5 seconds or tap 5 times for emergency alert"
          style={{
            position: "relative", width: "52px", height: "52px", borderRadius: "50%",
            background: holding ? "#7A0000" : "rgba(139,0,0,0.92)",
            border: "2px solid rgba(255,255,255,0.5)", boxShadow: "0 4px 16px rgba(139,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px", cursor: "pointer", touchAction: "none", userSelect: "none",
          }}
        >
          🆘
          {holding && (
            <svg width="60" height="60" style={{ position: "absolute", top: "-6px", left: "-6px", transform: "rotate(-90deg)", pointerEvents: "none" }}>
              <circle cx="30" cy="30" r="27" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 27}`} strokeDashoffset={`${2 * Math.PI * 27 * (1 - progress / 100)}`}
                style={{ transition: "stroke-dashoffset 0.05s linear" }} />
            </svg>
          )}
        </button>
      </div>

      {/* Info popover (single tap) */}
      {showInfo && !sentAlertId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 401, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem" }} onClick={() => setShowInfo(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#1a0505", border: "1px solid rgba(139,0,0,0.6)", borderRadius: "18px", padding: "1.5rem", maxWidth: "360px", width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>🆘</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>Emergency Panic Button</div>
            <div style={{ fontSize: "13px", color: "#ccc", lineHeight: 1.6, marginBottom: "14px" }}>
              <b>Hold this button for 5 seconds</b>, or <b>tap it 5 times quickly</b>, to send an emergency alert with your location to {user ? "your emergency contacts and " : ""}our security monitoring team.
              {!user && <><br /><br /><span style={{ color: "#f0a0a0" }}>Sign in to also notify your own emergency contacts automatically.</span></>}
            </div>
            {user && (
              <button onClick={() => { setShowInfo(false); setShowContacts(true); }} style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: "13px", cursor: "pointer", marginBottom: "8px" }}>
                Manage Emergency Contacts
              </button>
            )}
            <button onClick={() => setShowInfo(false)} style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "none", border: "none", color: "#999", fontSize: "13px", cursor: "pointer" }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Post-trigger confirmation */}
      {sentAlertId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(139,0,0,0.97)", zIndex: 402, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🚨</div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>Alert Sent</div>
          <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)", marginBottom: "28px", maxWidth: "320px" }}>
            {user
              ? "Your emergency contacts and security monitoring have been notified with your location."
              : "Our security monitoring team has been notified with your location. Sign in next time to also alert your own emergency contacts."}
          </div>
          {countdown > 0 ? (
            <button onClick={markFalseAlarm} style={{ padding: "14px 28px", borderRadius: "14px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
              This was accidental — Cancel ({countdown}s)
            </button>
          ) : (
            <button onClick={() => setSentAlertId(null)} style={{ padding: "14px 28px", borderRadius: "14px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", fontSize: "14px", cursor: "pointer" }}>
              Close
            </button>
          )}
        </div>
      )}

      {showContacts && <PanicContactsModal onClose={() => setShowContacts(false)} />}
    </>
  );
}

function PanicContactsModal({ onClose }) {
  const [contacts, setContacts] = useState([]);
  const [label, setLabel] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    panicAPI.listContacts().then((r) => setContacts(r.contacts || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function addContact() {
    if (!phone.trim()) { toast.error("Enter a phone number"); return; }
    try {
      const res = await panicAPI.addContact(label.trim(), phone.trim());
      setContacts((c) => [...c, res.contact]);
      setLabel(""); setPhone("");
    } catch (e) { toast.error(e.error || "Couldn't add contact"); }
  }

  async function removeContact(id) {
    try {
      await panicAPI.removeContact(id);
      setContacts((c) => c.filter((x) => x.id !== id));
    } catch { toast.error("Couldn't remove contact"); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 403, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem" }}>
      <div style={{ background: "#1a0505", border: "1px solid rgba(139,0,0,0.6)", borderRadius: "18px", padding: "1.5rem", maxWidth: "380px", width: "100%" }}>
        <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>Emergency Contacts</div>
        <div style={{ fontSize: "12px", color: "#999", marginBottom: "14px" }}>Up to 2 people notified by SMS/WhatsApp when you trigger the panic button.</div>

        {loading ? (
          <div style={{ color: "#999", fontSize: "13px" }}>Loading…</div>
        ) : (
          <>
            {contacts.map((c) => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <div>
                  <div style={{ fontSize: "13px", color: "#fff" }}>{c.label || "Contact"}</div>
                  <div style={{ fontSize: "11px", color: "#999" }}>{c.phone}</div>
                </div>
                <button onClick={() => removeContact(c.id)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "5px 10px", color: "#f87171", fontSize: "11px", cursor: "pointer" }}>Remove</button>
              </div>
            ))}
            {contacts.length < 2 && (
              <div style={{ marginTop: "14px" }}>
                <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (e.g. Mom)" style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "13px", marginBottom: "8px" }} />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+27821234567" style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "13px", marginBottom: "10px" }} />
                <button onClick={addContact} style={{ width: "100%", padding: "10px", borderRadius: "10px", background: "rgba(139,0,0,0.7)", border: "none", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Add Contact</button>
              </div>
            )}
          </>
        )}

        <button onClick={onClose} style={{ width: "100%", marginTop: "14px", padding: "10px", borderRadius: "10px", background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "#999", fontSize: "13px", cursor: "pointer" }}>Close</button>
      </div>
    </div>
  );
}
