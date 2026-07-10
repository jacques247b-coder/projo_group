// PROJO ADMIN — Live Panic Alert Monitor
// Real-time dashboard for admins and security company staff to watch
// incoming panic alerts the instant they're triggered, with location,
// acknowledge/resolve/SITREP actions, and management of security company
// monitor contacts (the numbers that get SMS/WhatsApp on every alert).
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { panicAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const C = {
  bg: "#0D0F12", card: "#161A1F", border: "rgba(255,255,255,0.08)",
  text: "#F1F3F5", muted: "#8A93A0", danger: "#E05252", warn: "#D4AF37", good: "#2ED9B4",
};
const FB = "'Inter', sans-serif";

const panicIcon = new L.DivIcon({
  html: `<div style="width:18px;height:18px;background:#E05252;border-radius:50%;border:3px solid #fff;box-shadow:0 0 12px rgba(224,82,82,0.9);"></div>`,
  iconSize: [18, 18], iconAnchor: [9, 9], className: "",
});

const SITREP_OPTIONS = [
  { value: "EN_ROUTE",   label: "En Route",     color: "#D4AF37" },
  { value: "ON_SCENE",   label: "On Scene",     color: "#3B9EFF" },
  { value: "ESCALATED",  label: "Escalated",    color: "#E05252" },
  { value: "RESOLVED",   label: "Resolved",     color: "#2ED9B4" },
  { value: "FALSE_ALARM",label: "False Alarm",  color: "#8A93A0" },
];

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleString();
}

function tierBadge(tier) {
  if (tier === "SUBSCRIBED") return { label: "👑 Subscribed", color: "#D4AF37" };
  if (tier === "FREE_SIGNUP") return { label: "🆓 Free Signup", color: "#3B9EFF" };
  return { label: "🌐 Anonymous", color: "#8A93A0" };
}

function statusColor(status) {
  if (status === "ACTIVE") return C.danger;
  if (status === "ACKNOWLEDGED") return C.warn;
  if (status === "FALSE_ALARM") return C.muted;
  return C.good; // RESOLVED
}

function sitrepColor(status) {
  return SITREP_OPTIONS.find(o => o.value === status)?.color || C.muted;
}

// Real, audible alarm tone via Web Audio API — no external file needed,
// so it can never silently fail to load. Three sharp beeps.
function playAlarmTone() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const beepTimes = [0, 0.3, 0.6];
    beepTimes.forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.35, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.25);
    });
  } catch {}
}

export default function PanicMonitorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("alerts"); // alerts | contacts
  const [securityContacts, setSecurityContacts] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactCallmebotKey, setContactCallmebotKey] = useState("");
  const [contactType, setContactType] = useState("SECURITY");
  const [contactIsPrimary, setContactIsPrimary] = useState(false);
  const [securityUsers, setSecurityUsers] = useState([]);
  const [suName, setSuName] = useState("");
  const [suPhone, setSuPhone] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [sitrepOpenFor, setSitrepOpenFor] = useState(null);
  const [sitrepStatus, setSitrepStatus] = useState("EN_ROUTE");
  const [sitrepSummary, setSitrepSummary] = useState("");
  const socketRef = useRef(null);

  async function loadAlerts() {
    setLoading(true);
    try {
      const res = await panicAPI.adminListAlerts();
      setAlerts(res.alerts || []);
    } catch { toast.error("Failed to load alerts"); }
    finally { setLoading(false); }
  }

  async function loadSecurityContacts() {
    if (!isAdmin) return;
    try {
      const res = await panicAPI.adminListSecurityContacts();
      setSecurityContacts(res.contacts || []);
    } catch { toast.error("Failed to load security contacts"); }
  }

  async function loadSecurityUsers() {
    if (!isAdmin) return;
    try {
      const res = await panicAPI.adminListSecurityUsers();
      setSecurityUsers(res.users || []);
    } catch { toast.error("Failed to load security login accounts"); }
  }

  useEffect(() => {
    loadAlerts();
    loadSecurityContacts();
    loadSecurityUsers();

    const sock = io(process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000", { transports: ["websocket"] });
    socketRef.current = sock;
    sock.emit("panic:join_monitor");

    sock.on("panic:new_alert", (alert) => {
      const normalized = {
        ...alert,
        sitreps: [],
        user: { name: alert.userName, phone: alert.userPhone, ...(alert.safetyProfile || {}) },
      };
      setAlerts(prev => [normalized, ...prev]);
      playAlarmTone();
      toast.custom(() => (
        <div style={{ background: "#7A0000", color: "#fff", padding: "16px 22px", borderRadius: "14px", fontWeight: 700, boxShadow: "0 10px 40px rgba(139,0,0,0.6)" }}>
          🚨 NEW PANIC ALERT — {alert.userName || "Unknown"}
        </div>
      ), { duration: 8000 });
    });
    sock.on("panic:alert_cancelled", ({ id }) => {
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "FALSE_ALARM" } : a));
    });
    sock.on("panic:sitrep_added", ({ alertId, sitrep }) => {
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, sitreps: [...(a.sitreps || []), sitrep] } : a));
    });
    sock.on("panic:location_update", ({ id, latitude, longitude, lastLocationAt }) => {
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, latitude, longitude, lastLocationAt } : a));
    });

    return () => { sock.emit("panic:leave_monitor"); sock.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function acknowledge(id) {
    try { await panicAPI.adminAcknowledge(id); loadAlerts(); toast.success("Acknowledged"); }
    catch { toast.error("Failed"); }
  }
  async function resolve(id, falseAlarm) {
    try { await panicAPI.adminResolve(id, "", falseAlarm); loadAlerts(); toast.success(falseAlarm ? "Marked false alarm" : "Resolved"); }
    catch { toast.error("Failed"); }
  }

  async function submitSitRep(alertId) {
    try {
      await panicAPI.submitSitRep(alertId, sitrepStatus, sitrepSummary.trim());
      toast.success("SITREP submitted");
      setSitrepOpenFor(null);
      setSitrepSummary("");
      setSitrepStatus("EN_ROUTE");
      loadAlerts();
    } catch (e) { toast.error(e.error || "Couldn't submit SITREP"); }
  }

  async function addSecurityContact() {
    if (!companyName.trim() || !contactPhone.trim()) { toast.error("Company name and phone required"); return; }
    try {
      await panicAPI.adminAddSecurityContact(companyName.trim(), contactPhone.trim(), contactCallmebotKey.trim() || undefined, contactType, contactIsPrimary);
      setCompanyName(""); setContactPhone(""); setContactCallmebotKey(""); setContactType("SECURITY"); setContactIsPrimary(false);
      loadSecurityContacts();
      toast.success("Security contact added");
    } catch (e) { toast.error(e.error || "Failed to add"); }
  }
  async function togglePrimaryContact(id) {
    try { await panicAPI.adminTogglePrimaryContact(id); loadSecurityContacts(); }
    catch { toast.error("Failed"); }
  }
  async function toggleSecurityContact(id) {
    try { await panicAPI.adminToggleSecurityContact(id); loadSecurityContacts(); }
    catch { toast.error("Failed"); }
  }

  async function createSecurityUser() {
    if (!suName.trim() || !suPhone.trim() || !suEmail.trim()) { toast.error("Name, phone, and email are all required"); return; }
    try {
      await panicAPI.adminCreateSecurityUser(suName.trim(), suPhone.trim(), suEmail.trim());
      setSuName(""); setSuPhone(""); setSuEmail("");
      loadSecurityUsers();
      toast.success("Security login created — they'll log in with their phone, OTP sent to email");
    } catch (e) { toast.error(e.error || "Failed to create account"); }
  }

  async function removeSecurityUser(id) {
    try { await panicAPI.adminRemoveSecurityUser(id); loadSecurityUsers(); toast.success("Access revoked"); }
    catch { toast.error("Failed"); }
  }

  const activeCount = alerts.filter(a => a.status === "ACTIVE").length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FB, padding: "1.5rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <button onClick={() => navigate(isAdmin ? "/admin" : "/panic-monitor")} aria-label="Back" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", width: "34px", height: "34px", color: C.text, fontSize: "16px", cursor: "pointer", flexShrink: 0 }}>←</button>
          <div style={{ fontSize: "22px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
            🆘 Panic Alert Monitor
            {activeCount > 0 && <span style={{ background: C.danger, borderRadius: "999px", padding: "2px 10px", fontSize: "13px" }}>{activeCount} active</span>}
          </div>
        </div>
        <div style={{ fontSize: "13px", color: C.muted, marginBottom: "1.25rem", marginLeft: "44px" }}>
          Live feed — new alerts appear here instantly, no page refresh needed.
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem" }}>
          <button onClick={() => setTab("alerts")} style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "13px", cursor: "pointer", background: tab === "alerts" ? C.card : "transparent", border: `1px solid ${tab === "alerts" ? C.danger : C.border}`, color: tab === "alerts" ? C.danger : C.muted }}>Alerts</button>
          {isAdmin && (
            <button onClick={() => setTab("contacts")} style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "13px", cursor: "pointer", background: tab === "contacts" ? C.card : "transparent", border: `1px solid ${tab === "contacts" ? C.good : C.border}`, color: tab === "contacts" ? C.good : C.muted }}>Security Contacts</button>
          )}
          <button onClick={loadAlerts} style={{ marginLeft: "auto", padding: "8px 14px", borderRadius: "8px", fontSize: "12.5px", background: "transparent", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer" }}>↻ Refresh</button>
        </div>

        {tab === "alerts" ? (
          loading ? (
            <div style={{ color: C.muted }}>Loading…</div>
          ) : alerts.length === 0 ? (
            <div style={{ color: C.muted, textAlign: "center", padding: "2.5rem 0" }}>No alerts yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {alerts.map(a => (
                <div key={a.id} style={{ background: C.card, border: `1px solid ${a.status === "ACTIVE" ? C.danger : C.border}`, borderRadius: "12px", padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "14px" }}>{a.user?.name || a.userName || "Anonymous visitor"}</div>
                      <div style={{ fontSize: "12px", color: C.muted }}>{a.user?.phone || a.userPhone || "Unknown"}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                      <span style={{ background: statusColor(a.status) + "22", color: statusColor(a.status), border: `1px solid ${statusColor(a.status)}55`, borderRadius: "999px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>{a.status}</span>
                      <span style={{ background: tierBadge(a.tier).color + "1a", color: tierBadge(a.tier).color, border: `1px solid ${tierBadge(a.tier).color}44`, borderRadius: "999px", padding: "2px 9px", fontSize: "10px", fontWeight: 600 }}>{tierBadge(a.tier).label}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", color: C.muted, margin: "6px 0" }}>{timeAgo(a.createdAt)}</div>

                  {a.rideContext && (() => {
                    let rc; try { rc = JSON.parse(a.rideContext); } catch { rc = null; }
                    return rc ? (
                      <div style={{ background: "rgba(59,158,255,0.12)", border: "1px solid rgba(59,158,255,0.35)", borderRadius: "8px", padding: "8px 10px", marginBottom: "8px", fontSize: "12px" }}>
                        <div style={{ color: "#3B9EFF", fontWeight: 700, marginBottom: "2px" }}>🚗 IN TRANSIT — PROJO Ride ({rc.status})</div>
                        <div style={{ color: C.muted }}>{rc.pickupAddress} → {rc.dropoffAddress}</div>
                        {rc.driverName && <div style={{ color: C.muted }}>Driver: {rc.driverName}{rc.driverPhone ? ` (${rc.driverPhone})` : ""}</div>}
                      </div>
                    ) : null;
                  })()}

                  {(a.user?.homeAddress || a.user?.bloodGroup || a.user?.medicalNotes || a.user?.insuranceProvider) && (
                    <div style={{ background: "rgba(224,82,82,0.08)", border: `1px solid ${C.danger}44`, borderRadius: "8px", padding: "8px 10px", marginBottom: "8px", fontSize: "12px" }}>
                      <div style={{ color: C.danger, fontWeight: 700, marginBottom: "3px" }}>🩺 Safety & Medical Info</div>
                      {a.user.homeAddress && <div style={{ color: C.text }}>📍 {a.user.homeAddress}</div>}
                      {a.user.bloodGroup && <div style={{ color: C.text }}>🩸 Blood group: {a.user.bloodGroup}</div>}
                      {a.user.medicalNotes && <div style={{ color: C.text }}>⚕️ {a.user.medicalNotes}</div>}
                      {a.user.insuranceProvider && <div style={{ color: C.text }}>🏥 {a.user.insuranceProvider}{a.user.insurancePolicyNumber ? ` — ${a.user.insurancePolicyNumber}` : ""}</div>}
                    </div>
                  )}

                  {a.latitude && a.longitude ? (
                    <div style={{ marginBottom: "8px" }}>
                      <div style={{ height: "180px", borderRadius: "10px", overflow: "hidden", border: `1px solid ${C.border}` }}>
                        <MapContainer center={[a.latitude, a.longitude]} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="" />
                          <Marker position={[a.latitude, a.longitude]} icon={panicIcon}>
                            <Popup>{a.user?.name || "Panic alert"}</Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                        <a href={`https://maps.google.com/?q=${a.latitude},${a.longitude}`} target="_blank" rel="noreferrer" style={{ fontSize: "11.5px", color: C.good }}>Open in Google Maps ↗</a>
                        <span style={{ fontSize: "11px", color: C.muted }}>{a.lastLocationAt ? `Pin updated ${timeAgo(a.lastLocationAt)}` : ""}</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: "12px", color: C.muted, marginBottom: "8px" }}>📍 Location not available</div>
                  )}

                  {/* SITREP timeline */}
                  {a.sitreps && a.sitreps.length > 0 && (
                    <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: C.muted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Situation Reports</div>
                      {a.sitreps.map(s => (
                        <div key={s.id} style={{ fontSize: "12px", marginBottom: "6px", paddingLeft: "8px", borderLeft: `2px solid ${sitrepColor(s.status)}` }}>
                          <span style={{ color: sitrepColor(s.status), fontWeight: 700 }}>{SITREP_OPTIONS.find(o => o.value === s.status)?.label || s.status}</span>
                          <span style={{ color: C.muted }}> — {s.submitter?.name || "Unknown"} ({s.submitter?.role || "?"}) · {timeAgo(s.createdAt)}</span>
                          {s.summary && <div style={{ color: C.text, marginTop: "2px" }}>{s.summary}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {(a.status === "ACTIVE" || a.status === "ACKNOWLEDGED") && (
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                      {a.status === "ACTIVE" && (
                        <button onClick={() => acknowledge(a.id)} style={{ background: "transparent", border: `1px solid ${C.warn}66`, color: C.warn, borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}>Acknowledge</button>
                      )}
                      <button onClick={() => setSitrepOpenFor(sitrepOpenFor === a.id ? null : a.id)} style={{ background: "transparent", border: `1px solid #3B9EFF66`, color: "#3B9EFF", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}>📋 Submit SITREP</button>
                      <button onClick={() => resolve(a.id, false)} style={{ background: "transparent", border: `1px solid ${C.good}66`, color: C.good, borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}>Resolve</button>
                      <button onClick={() => resolve(a.id, true)} style={{ background: "transparent", border: `1px solid ${C.muted}66`, color: C.muted, borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}>False Alarm</button>
                    </div>
                  )}

                  {/* SITREP submission form */}
                  {sitrepOpenFor === a.id && (
                    <div style={{ marginTop: "10px", padding: "12px", background: "#0000002a", borderRadius: "10px", border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: C.muted, marginBottom: "8px", textTransform: "uppercase" }}>Situation Report</div>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                        {SITREP_OPTIONS.map(o => (
                          <button key={o.value} onClick={() => setSitrepStatus(o.value)} style={{
                            padding: "5px 12px", borderRadius: "999px", fontSize: "11.5px", cursor: "pointer",
                            background: sitrepStatus === o.value ? o.color + "33" : "transparent",
                            border: `1px solid ${sitrepStatus === o.value ? o.color : C.border}`,
                            color: sitrepStatus === o.value ? o.color : C.muted, fontWeight: sitrepStatus === o.value ? 700 : 400,
                          }}>{o.label}</button>
                        ))}
                      </div>
                      <textarea value={sitrepSummary} onChange={e => setSitrepSummary(e.target.value)} placeholder="What's happening on the ground..." rows={3} style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", background: "#0000002a", border: `1px solid ${C.border}`, color: C.text, fontSize: "13px", resize: "vertical", boxSizing: "border-box", marginBottom: "8px", fontFamily: FB }} />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => setSitrepOpenFor(null)} style={{ padding: "8px 14px", borderRadius: "8px", background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontSize: "12.5px", cursor: "pointer" }}>Cancel</button>
                        <button onClick={() => submitSitRep(a.id)} style={{ padding: "8px 16px", borderRadius: "8px", background: "#3B9EFF", border: "none", color: "#fff", fontWeight: 700, fontSize: "12.5px", cursor: "pointer" }}>Submit SITREP</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px", marginBottom: "1rem" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "10px" }}>Add Security Company / CPF Contact</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company / CPF name" style={{ flex: 1, minWidth: "160px", padding: "9px 12px", borderRadius: "8px", background: "#0000002a", border: `1px solid ${C.border}`, color: C.text, fontSize: "13px" }} />
                <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+27821234567" style={{ flex: 1, minWidth: "160px", padding: "9px 12px", borderRadius: "8px", background: "#0000002a", border: `1px solid ${C.border}`, color: C.text, fontSize: "13px" }} />
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", margin: "8px 0" }}>
                <select value={contactType} onChange={e => setContactType(e.target.value)} style={{ padding: "8px 10px", borderRadius: "8px", background: "#0000002a", border: `1px solid ${C.border}`, color: C.text, fontSize: "12.5px" }}>
                  <option value="SECURITY">Security Company</option>
                  <option value="CPF">CPF</option>
                </select>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: C.muted, cursor: "pointer" }}>
                  <input type="checkbox" checked={contactIsPrimary} onChange={e => setContactIsPrimary(e.target.checked)} />
                  Primary / nearest (used for free anonymous alerts)
                </label>
              </div>
              <input value={contactCallmebotKey} onChange={e => setContactCallmebotKey(e.target.value)} placeholder="CallMeBot API key (optional, for free WhatsApp)" style={{ width: "100%", marginTop: "4px", padding: "9px 12px", borderRadius: "8px", background: "#0000002a", border: `1px solid ${C.border}`, color: C.text, fontSize: "13px", boxSizing: "border-box" }} />
              <div style={{ fontSize: "10.5px", color: C.muted, lineHeight: 1.5, margin: "6px 0 10px" }}>
                For free WhatsApp delivery: this number sends "I allow callmebot to send me messages" to <b>+34 644 86 70 49</b> on WhatsApp, gets a key back, paste it here. Optional — SMS goes out regardless.
              </div>
              <button onClick={addSecurityContact} style={{ background: C.good, border: "none", borderRadius: "8px", padding: "9px 18px", color: "#04211b", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>Add</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {securityContacts.length === 0 ? (
                <div style={{ color: C.muted, textAlign: "center", padding: "1.5rem 0" }}>No security contacts added yet.</div>
              ) : securityContacts.map(c => (
                <div key={c.id} style={{ background: C.card, border: `1px solid ${c.isPrimary ? C.warn : C.border}`, borderRadius: "10px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: 600 }}>{c.companyName} {c.type === "CPF" && <span style={{ color: "#3B9EFF", fontSize: "11px" }}>(CPF)</span>} {c.isPrimary && <span style={{ color: C.warn, fontSize: "11px" }}>★ Primary</span>}</div>
                    <div style={{ fontSize: "12px", color: C.muted }}>{c.phone}{c.callmebotApiKey ? " · WhatsApp enabled" : ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => togglePrimaryContact(c.id)} style={{ background: "transparent", border: `1px solid ${c.isPrimary ? C.warn : C.border}`, color: c.isPrimary ? C.warn : C.muted, borderRadius: "6px", padding: "6px 10px", fontSize: "11.5px", cursor: "pointer" }}>
                      {c.isPrimary ? "★ Primary" : "Set Primary"}
                    </button>
                    <button onClick={() => toggleSecurityContact(c.id)} style={{ background: "transparent", border: `1px solid ${c.isActive ? C.good : C.muted}66`, color: c.isActive ? C.good : C.muted, borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}>
                      {c.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {isAdmin && (
              <>
                <div style={{ fontSize: "13px", fontWeight: 700, margin: "1.5rem 0 10px" }}>Security Company Login Accounts</div>
                <div style={{ fontSize: "11.5px", color: C.muted, marginBottom: "10px" }}>
                  Give security company staff their own login (phone + OTP, same as any user) so they can watch this dashboard directly — without any other admin access.
                </div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <input value={suName} onChange={e => setSuName(e.target.value)} placeholder="Staff / company name" style={{ flex: 1, minWidth: "160px", padding: "9px 12px", borderRadius: "8px", background: "#0000002a", border: `1px solid ${C.border}`, color: C.text, fontSize: "13px" }} />
                    <input value={suPhone} onChange={e => setSuPhone(e.target.value)} placeholder="+27821234567" style={{ flex: 1, minWidth: "160px", padding: "9px 12px", borderRadius: "8px", background: "#0000002a", border: `1px solid ${C.border}`, color: C.text, fontSize: "13px" }} />
                  </div>
                  <input value={suEmail} onChange={e => setSuEmail(e.target.value)} placeholder="Email (required — see note below)" style={{ width: "100%", marginTop: "8px", padding: "9px 12px", borderRadius: "8px", background: "#0000002a", border: `1px solid ${C.border}`, color: C.text, fontSize: "13px", boxSizing: "border-box" }} />
                  <div style={{ fontSize: "10.5px", color: C.muted, lineHeight: 1.5, margin: "6px 0 10px" }}>
                    Email is required for now — their login code arrives by email (reliable today), same as every other account type in the app. SMS/WhatsApp login can be added as an option later once SMS is fully set up.
                  </div>
                  <button onClick={createSecurityUser} style={{ background: C.warn, border: "none", borderRadius: "8px", padding: "9px 18px", color: "#241a00", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>Create Login</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {securityUsers.length === 0 ? (
                    <div style={{ color: C.muted, textAlign: "center", padding: "1rem 0" }}>No security login accounts yet.</div>
                  ) : securityUsers.map(u => (
                    <div key={u.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "13.5px", fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: "12px", color: C.muted }}>{u.phone} · {u.lastLoginAt ? `last seen ${timeAgo(u.lastLoginAt)}` : "never logged in"}</div>
                      </div>
                      <button onClick={() => removeSecurityUser(u.id)} style={{ background: "transparent", border: `1px solid ${C.danger}66`, color: C.danger, borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}>Revoke</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
