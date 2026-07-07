// PROJO ADMIN — Live Panic Alert Monitor
// Real-time dashboard for admins and security company staff to watch
// incoming panic alerts the instant they're triggered, with location,
// acknowledge/resolve actions, and management of security company
// monitor contacts (the numbers that get SMS/WhatsApp on every alert).
import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { panicAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const C = {
  bg: "#0D0F12", card: "#161A1F", border: "rgba(255,255,255,0.08)",
  text: "#F1F3F5", muted: "#8A93A0", danger: "#E05252", warn: "#D4AF37", good: "#2ED9B4",
};
const FB = "'Inter', sans-serif";

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleString();
}

function statusColor(status) {
  if (status === "ACTIVE") return C.danger;
  if (status === "ACKNOWLEDGED") return C.warn;
  if (status === "FALSE_ALARM") return C.muted;
  return C.good; // RESOLVED
}

export default function PanicMonitorPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("alerts"); // alerts | contacts
  const [securityContacts, setSecurityContacts] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [securityUsers, setSecurityUsers] = useState([]);
  const [suName, setSuName] = useState("");
  const [suPhone, setSuPhone] = useState("");
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
      setAlerts(prev => [alert, ...prev]);
      // Audio + toast — this is the one channel that must never be missed
      try { new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=").play().catch(() => {}); } catch {}
      toast.custom(() => (
        <div style={{ background: "#7A0000", color: "#fff", padding: "16px 22px", borderRadius: "14px", fontWeight: 700, boxShadow: "0 10px 40px rgba(139,0,0,0.6)" }}>
          🚨 NEW PANIC ALERT — {alert.userName || "Unknown"}
        </div>
      ), { duration: 8000 });
    });
    sock.on("panic:alert_cancelled", ({ id }) => {
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "FALSE_ALARM" } : a));
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

  async function addSecurityContact() {
    if (!companyName.trim() || !contactPhone.trim()) { toast.error("Company name and phone required"); return; }
    try {
      await panicAPI.adminAddSecurityContact(companyName.trim(), contactPhone.trim());
      setCompanyName(""); setContactPhone("");
      loadSecurityContacts();
      toast.success("Security contact added");
    } catch (e) { toast.error(e.error || "Failed to add"); }
  }
  async function toggleSecurityContact(id) {
    try { await panicAPI.adminToggleSecurityContact(id); loadSecurityContacts(); }
    catch { toast.error("Failed"); }
  }

  async function createSecurityUser() {
    if (!suName.trim() || !suPhone.trim()) { toast.error("Name and phone required"); return; }
    try {
      await panicAPI.adminCreateSecurityUser(suName.trim(), suPhone.trim());
      setSuName(""); setSuPhone("");
      loadSecurityUsers();
      toast.success("Security login account created — they can now log in with this phone number");
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
        <div style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
          🆘 Panic Alert Monitor
          {activeCount > 0 && <span style={{ background: C.danger, borderRadius: "999px", padding: "2px 10px", fontSize: "13px" }}>{activeCount} active</span>}
        </div>
        <div style={{ fontSize: "13px", color: C.muted, marginBottom: "1.25rem" }}>
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
                    <span style={{ background: statusColor(a.status) + "22", color: statusColor(a.status), border: `1px solid ${statusColor(a.status)}55`, borderRadius: "999px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{a.status}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: C.muted, margin: "6px 0" }}>{timeAgo(a.createdAt)}</div>
                  {a.latitude && a.longitude ? (
                    <a href={`https://maps.google.com/?q=${a.latitude},${a.longitude}`} target="_blank" rel="noreferrer" style={{ fontSize: "12.5px", color: C.good }}>📍 View location on map</a>
                  ) : (
                    <div style={{ fontSize: "12px", color: C.muted }}>📍 Location not available</div>
                  )}
                  {a.status === "ACTIVE" && (
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                      <button onClick={() => acknowledge(a.id)} style={{ background: "transparent", border: `1px solid ${C.warn}66`, color: C.warn, borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}>Acknowledge</button>
                      <button onClick={() => resolve(a.id, false)} style={{ background: "transparent", border: `1px solid ${C.good}66`, color: C.good, borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}>Resolve</button>
                      <button onClick={() => resolve(a.id, true)} style={{ background: "transparent", border: `1px solid ${C.muted}66`, color: C.muted, borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}>False Alarm</button>
                    </div>
                  )}
                  {a.status === "ACKNOWLEDGED" && (
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                      <button onClick={() => resolve(a.id, false)} style={{ background: "transparent", border: `1px solid ${C.good}66`, color: C.good, borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}>Resolve</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px", marginBottom: "1rem" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "10px" }}>Add Security Company Contact</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company name" style={{ flex: 1, minWidth: "160px", padding: "9px 12px", borderRadius: "8px", background: "#0000002a", border: `1px solid ${C.border}`, color: C.text, fontSize: "13px" }} />
                <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+27821234567" style={{ flex: 1, minWidth: "160px", padding: "9px 12px", borderRadius: "8px", background: "#0000002a", border: `1px solid ${C.border}`, color: C.text, fontSize: "13px" }} />
                <button onClick={addSecurityContact} style={{ background: C.good, border: "none", borderRadius: "8px", padding: "9px 18px", color: "#04211b", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>Add</button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {securityContacts.length === 0 ? (
                <div style={{ color: C.muted, textAlign: "center", padding: "1.5rem 0" }}>No security contacts added yet.</div>
              ) : securityContacts.map(c => (
                <div key={c.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: 600 }}>{c.companyName}</div>
                    <div style={{ fontSize: "12px", color: C.muted }}>{c.phone}</div>
                  </div>
                  <button onClick={() => toggleSecurityContact(c.id)} style={{ background: "transparent", border: `1px solid ${c.isActive ? C.good : C.muted}66`, color: c.isActive ? C.good : C.muted, borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}>
                    {c.isActive ? "Active" : "Inactive"}
                  </button>
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
                    <button onClick={createSecurityUser} style={{ background: C.warn, border: "none", borderRadius: "8px", padding: "9px 18px", color: "#241a00", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>Create Login</button>
                  </div>
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
