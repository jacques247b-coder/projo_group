// PROJO GROUP — Panic Button (PROJO Panic — paid safety subscription, R37/month)
// Trigger by holding for 5 seconds (mouse or touch) OR tapping 5 times
// quickly (easier on mobile where a steady long-press can be awkward).
// Captures location best-effort — never blocks the trigger waiting on a
// permission prompt. After triggering, shows a brief window to mark it a
// false alarm in case of an accidental press.
//
// Logged-in, non-subscribed members see an explainer + subscribe prompt
// instead of actually triggering — the button never disappears, it just
// explains itself the first time it's used. Anonymous visitors (public
// landing page) can still trigger for free, since there's no account to
// gate against and no way for them to have subscribed beforehand.
import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { panicAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const HOLD_MS = 5000;
const TAP_COUNT_NEEDED = 5;
const TAP_WINDOW_MS = 3000;
const FALSE_ALARM_WINDOW_S = 10;
const LOCATION_UPDATE_INTERVAL_MS = 5000;  // send a fresh pin every 5s while active
const LOCATION_UPDATE_MAX_MINUTES = 60;    // stop after an hour regardless, to save battery
const SUBSCRIPTION_PRICE_ZAR = 37;

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
  const [showSafetyProfile, setShowSafetyProfile] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [sentAlertId, setSentAlertId] = useState(null);
  const [alertTier, setAlertTier] = useState(null);
  const [countdown, setCountdown] = useState(FALSE_ALARM_WINDOW_S);
  const [subscribed, setSubscribed] = useState(null); // null = unknown yet

  const holdTimerRef = useRef(null);
  const holdIntervalRef = useRef(null);
  const tapTimesRef = useRef([]);
  const locationIntervalRef = useRef(null);

  useEffect(() => {
    if (!user) { setSubscribed(true); return; } // anonymous — no gating possible
    panicAPI.getSubscriptionStatus().then((r) => setSubscribed(r.subscribed)).catch(() => setSubscribed(false));
  }, [user]);

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
      setAlertTier(res.tier || (user ? "FREE_SIGNUP" : "ANONYMOUS"));
      setCountdown(FALSE_ALARM_WINDOW_S);
    } catch (e) {
      toast.dismiss("panic-sending");
      toast.error("Couldn't send alert — please call emergency services directly if you're in danger.", { duration: 8000 });
    }
  }

  async function activateSubscription() {
    try {
      await panicAPI.activateSubscription();
      setSubscribed(true);
      setShowSubscribe(false);
      toast.success("PROJO Panic activated — you're covered.");
    } catch (e) {
      toast.error(e.error || "Couldn't activate subscription");
    }
  }

  useEffect(() => {
    if (!sentAlertId) return;
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [sentAlertId, countdown]);

  // Keep sending fresh location pins while the alert is active — this is
  // what lets the monitor dashboard show a live-updating position instead
  // of just where the person was the instant they triggered it (important
  // if they're moving, e.g. mid-ride, walking, being followed, etc).
  // Live Tracking is a SUBSCRIBED-only perk — free tiers (anonymous or
  // signed-up-free) get one accurate location at trigger time, not a
  // continuously updating pin.
  useEffect(() => {
    if (!sentAlertId || alertTier !== "SUBSCRIBED") {
      clearInterval(locationIntervalRef.current);
      return;
    }
    const startedAt = Date.now();
    locationIntervalRef.current = setInterval(async () => {
      if (Date.now() - startedAt > LOCATION_UPDATE_MAX_MINUTES * 60000) {
        clearInterval(locationIntervalRef.current);
        return;
      }
      const loc = await getLocationBestEffort();
      if (loc) panicAPI.updateLocation(sentAlertId, loc.latitude, loc.longitude).catch(() => {});
    }, LOCATION_UPDATE_INTERVAL_MS);
    return () => clearInterval(locationIntervalRef.current);
  }, [sentAlertId, alertTier]);

  async function markFalseAlarm() {
    try {
      await panicAPI.selfCancel(sentAlertId);
    } catch {}
    clearInterval(locationIntervalRef.current);
    setSentAlertId(null);
    setAlertTier(null);
  }

  return (
    <>
      <div style={{ position: "fixed", top, right: "14px", zIndex: 400 }}>
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
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>PROJO Panic</div>
            <div style={{ fontSize: "13px", color: "#ccc", lineHeight: 1.6, marginBottom: "14px" }}>
              <b>Hold this button for 5 seconds</b>, or <b>tap it 5 times quickly</b>, to send an emergency alert with your location.
              {!user && <><br /><br /><span style={{ color: "#f0a0a0" }}>As a visitor, this reaches the nearest security company with your location and number. Sign up for free to reach every security company & CPF member instead — or subscribe for live tracking, medical info, and your own emergency contacts too.</span></>}
              {user && subscribed === false && <><br /><br /><span style={{ color: "#4ADE80" }}>You're covered: every local security company & CPF member is notified immediately.</span> <span style={{ color: "#f0a0a0" }}>Subscribe to add live tracking, medical info, and your own emergency contacts.</span></>}
              {user && subscribed && <><br /><br /><span style={{ color: "#4ADE80" }}>Full coverage active: security + CPF, live tracking, medical info, and your emergency contacts.</span></>}
            </div>
            {user && subscribed === false && (
              <button onClick={() => { setShowInfo(false); setShowSubscribe(true); }} style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.4)", color: "#F5D76E", fontSize: "13px", fontWeight: 700, cursor: "pointer", marginBottom: "8px" }}>
                See PROJO Panic — R{SUBSCRIPTION_PRICE_ZAR}/month
              </button>
            )}
            {user && subscribed && (
              <>
                <button onClick={() => { setShowInfo(false); setShowContacts(true); }} style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: "13px", cursor: "pointer", marginBottom: "8px" }}>
                  Manage Emergency Contacts
                </button>
                <button onClick={() => { setShowInfo(false); setShowSafetyProfile(true); }} style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: "13px", cursor: "pointer", marginBottom: "8px" }}>
                  Safety & Medical Profile
                </button>
              </>
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
            {alertTier === "SUBSCRIBED" && "Every local security company, CPF member, and your own emergency contacts have been notified with your live, continuously-updating location. A response vehicle is being dispatched."}
            {alertTier === "FREE_SIGNUP" && "Every local security company and CPF member has been notified with your location. Subscribe for live tracking, medical info sharing, and your own emergency contacts too."}
            {alertTier === "ANONYMOUS" && "The nearest security company has been notified with your location and number. Sign in and subscribe next time for full security + CPF coverage, live tracking, and more."}
          </div>
          {alertTier !== "SUBSCRIBED" && (
            <button onClick={() => { setSentAlertId(null); setShowSubscribe(true); }} style={{ padding: "10px 20px", borderRadius: "12px", background: "none", border: "1px solid rgba(212,175,55,0.5)", color: "#F5D76E", fontSize: "12.5px", cursor: "pointer", marginBottom: "12px" }}>
              See what Subscribing unlocks →
            </button>
          )}
          {countdown > 0 ? (
            <button onClick={markFalseAlarm} style={{ padding: "14px 28px", borderRadius: "14px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
              This was accidental — Cancel ({countdown}s)
            </button>
          ) : (
            <button onClick={() => { setSentAlertId(null); setAlertTier(null); }} style={{ padding: "14px 28px", borderRadius: "14px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", fontSize: "14px", cursor: "pointer" }}>
              Close
            </button>
          )}
        </div>
      )}

      {showContacts && <PanicContactsModal onClose={() => setShowContacts(false)} />}
      {showSafetyProfile && <SafetyProfileModal onClose={() => setShowSafetyProfile(false)} />}
      {showSubscribe && <PanicSubscribeModal onClose={() => setShowSubscribe(false)} onSubscribe={activateSubscription} />}
    </>
  );
}

function PanicSubscribeModal({ onClose, onSubscribe }) {
  const features = [
    ["✓", "Already included, free", "Every security company & CPF member in the network is notified the moment you sign up and trigger — no subscription needed for this baseline coverage."],
    ["📍", "Live location, updated every 5 seconds", "Subscriber-only. Protection officers follow your exact position in real time, not just where you were when you triggered it."],
    ["🩺", "Medical & safety profile shared with responders", "Subscriber-only. Blood group, medical notes, insurance, and address — shown only at the moment you trigger an alert."],
    ["👪", "Family & friends can watch live too", "Subscriber-only. Every registered emergency contact gets a private live-tracking link the moment you trigger — no account or app install needed on their side."],
    ["💬", "In-app communication with responders", "Subscriber-only. Two-way updates as the situation develops, not just a one-way alert."],
    ["🚑", "Trauma & medical assistance", "Subscriber-only. Support coordination for medical or trauma follow-up after an incident, not just the emergency response itself."],
    ["🕐", "24/7 priority support", "Subscriber-only. Priority support line for anything related to your safety coverage, any time."],
    ["🚗", "Ride-aware", "Included at every tier — if you're in a PROJO Ride when you trigger, responders are told immediately: pickup/dropoff, driver details, all of it."],
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 404, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem" }}>
      <div style={{ background: "#1a0505", border: "1px solid rgba(212,175,55,0.4)", borderRadius: "20px", padding: "1.5rem", maxWidth: "420px", width: "100%", maxHeight: "88vh", overflowY: "auto", position: "relative" }}>
        <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "10px", width: "32px", height: "32px", color: "#fff", fontSize: "16px", cursor: "pointer" }}>✕</button>

        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <div style={{ fontSize: "40px", marginBottom: "6px" }}>🆘</div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#fff" }}>PROJO Panic</div>
          <div style={{ fontSize: "12px", color: "#999" }}>Real-time emergency dispatch, Rustenburg & surrounds</div>
        </div>

        <div style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: "10px", padding: "8px 12px", fontSize: "11.5px", color: "#F5D76E", marginBottom: "1rem", textAlign: "center" }}>
          This service currently covers Rustenburg & surrounding areas only.
        </div>

        {features.map(([icon, title, text]) => (
          <div key={title} style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
            <div style={{ fontSize: "18px", flexShrink: 0 }}>{icon}</div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{title}</div>
              <div style={{ fontSize: "11.5px", color: "#999", lineHeight: 1.4 }}>{text}</div>
            </div>
          </div>
        ))}

        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "12px", textAlign: "center", margin: "14px 0" }}>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#F5D76E" }}>R{SUBSCRIPTION_PRICE_ZAR}<span style={{ fontSize: "13px", color: "#999" }}>/month</span></div>
        </div>

        <button onClick={onSubscribe} style={{ width: "100%", padding: "14px", borderRadius: "14px", background: "linear-gradient(135deg, #D4AF37, #9A7A10)", border: "none", color: "#1a0505", fontWeight: 800, fontSize: "14px", cursor: "pointer", marginBottom: "8px" }}>
          Subscribe — R{SUBSCRIPTION_PRICE_ZAR}/month
        </button>
        <button onClick={onClose} style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "#999", fontSize: "13px", cursor: "pointer" }}>
          Maybe later
        </button>
      </div>
    </div>
  );
}

function SafetyProfileModal({ onClose }) {
  const [profile, setProfile] = useState({ homeAddress: "", bloodGroup: "", medicalNotes: "", insuranceProvider: "", insurancePolicyNumber: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    panicAPI.getSafetyProfile().then((r) => {
      if (r.profile) setProfile((p) => ({ ...p, ...Object.fromEntries(Object.entries(r.profile).map(([k, v]) => [k, v ?? ""])) }));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      await panicAPI.updateSafetyProfile(profile);
      toast.success("Safety profile saved");
      onClose();
    } catch { toast.error("Couldn't save"); }
    finally { setSaving(false); }
  }

  const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "13px", marginBottom: "8px", boxSizing: "border-box", fontFamily: "inherit" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 403, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem" }}>
      <div style={{ background: "#1a0505", border: "1px solid rgba(139,0,0,0.6)", borderRadius: "18px", padding: "1.5rem", maxWidth: "380px", width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>Safety & Medical Profile</div>
        <div style={{ fontSize: "12px", color: "#999", marginBottom: "14px" }}>Only shown to responders and your registered contacts when you actually trigger an alert — never otherwise.</div>

        {loading ? (
          <div style={{ color: "#999", fontSize: "13px" }}>Loading…</div>
        ) : (
          <>
            <input value={profile.homeAddress} onChange={(e) => setProfile((p) => ({ ...p, homeAddress: e.target.value }))} placeholder="Home address" style={inputStyle} />
            <input value={profile.bloodGroup} onChange={(e) => setProfile((p) => ({ ...p, bloodGroup: e.target.value }))} placeholder="Blood group (e.g. O+)" style={inputStyle} />
            <textarea value={profile.medicalNotes} onChange={(e) => setProfile((p) => ({ ...p, medicalNotes: e.target.value }))} placeholder="Allergies, conditions, medication..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            <input value={profile.insuranceProvider} onChange={(e) => setProfile((p) => ({ ...p, insuranceProvider: e.target.value }))} placeholder="Medical insurance provider" style={inputStyle} />
            <input value={profile.insurancePolicyNumber} onChange={(e) => setProfile((p) => ({ ...p, insurancePolicyNumber: e.target.value }))} placeholder="Policy number" style={inputStyle} />
            <button onClick={save} disabled={saving} style={{ width: "100%", padding: "10px", borderRadius: "10px", background: "rgba(139,0,0,0.7)", border: "none", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", marginTop: "6px" }}>
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        )}

        <button onClick={onClose} style={{ width: "100%", marginTop: "10px", padding: "10px", borderRadius: "10px", background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "#999", fontSize: "13px", cursor: "pointer" }}>Close</button>
      </div>
    </div>
  );
}

function PanicContactsModal({ onClose }) {
  const [contacts, setContacts] = useState([]);
  const [label, setLabel] = useState("");
  const [phone, setPhone] = useState("");
  const [callmebotKey, setCallmebotKey] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    panicAPI.listContacts().then((r) => setContacts(r.contacts || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function addContact() {
    if (!phone.trim()) { toast.error("Enter a phone number"); return; }
    try {
      const res = await panicAPI.addContact(label.trim(), phone.trim(), callmebotKey.trim() || undefined);
      setContacts((c) => [...c, res.contact]);
      setLabel(""); setPhone(""); setCallmebotKey("");
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
      <div style={{ background: "#1a0505", border: "1px solid rgba(139,0,0,0.6)", borderRadius: "18px", padding: "1.5rem", maxWidth: "380px", width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>Emergency Contacts</div>
        <div style={{ fontSize: "12px", color: "#999", marginBottom: "14px" }}>Up to 2 people notified — with your live location — when you trigger the panic button.</div>

        {loading ? (
          <div style={{ color: "#999", fontSize: "13px" }}>Loading…</div>
        ) : (
          <>
            {contacts.map((c) => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <div>
                  <div style={{ fontSize: "13px", color: "#fff" }}>{c.label || "Contact"}</div>
                  <div style={{ fontSize: "11px", color: "#999" }}>{c.phone}{c.callmebotApiKey ? " · WhatsApp enabled" : ""}</div>
                </div>
                <button onClick={() => removeContact(c.id)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "5px 10px", color: "#f87171", fontSize: "11px", cursor: "pointer" }}>Remove</button>
              </div>
            ))}
            {contacts.length < 2 && (
              <div style={{ marginTop: "14px" }}>
                <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (e.g. Mom)" style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "13px", marginBottom: "8px" }} />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+27821234567" style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "13px", marginBottom: "8px" }} />
                <input value={callmebotKey} onChange={(e) => setCallmebotKey(e.target.value)} placeholder="CallMeBot API key (optional)" style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "13px", marginBottom: "6px" }} />
                <div style={{ fontSize: "10.5px", color: "#888", lineHeight: 1.5, marginBottom: "10px" }}>
                  For free WhatsApp delivery: this contact sends "I allow callmebot to send me messages" to <b>+34 644 86 70 49</b> on WhatsApp, gets a key back, and you paste it here. Optional — the in-app monitor notification always goes out regardless.
                </div>
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
