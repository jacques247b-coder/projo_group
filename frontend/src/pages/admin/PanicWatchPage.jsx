// PROJO GROUP — Panic Watch (public, no login required)
// Opened via the private link included in the SMS/WhatsApp sent to a
// subscriber's registered emergency contacts. Deliberately shows only
// live location + status — never medical info, address, or phone number.
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { panicAPI } from "../services/api";

const C = { bg: "#0D0F12", card: "#161A1F", border: "rgba(255,255,255,0.08)", text: "#F1F3F5", muted: "#8A93A0", danger: "#E05252", good: "#2ED9B4" };

const pinIcon = new L.DivIcon({
  html: `<div style="width:20px;height:20px;background:#E05252;border-radius:50%;border:3px solid #fff;box-shadow:0 0 14px rgba(224,82,82,0.9);"></div>`,
  iconSize: [20, 20], iconAnchor: [10, 10], className: "",
});

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 10) return "just now";
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return new Date(dateStr).toLocaleString();
}

function statusInfo(status) {
  if (status === "ACTIVE") return { label: "🔴 Active — help is on the way", color: C.danger };
  if (status === "ACKNOWLEDGED") return { label: "🟡 Acknowledged by responders", color: "#D4AF37" };
  if (status === "FALSE_ALARM") return { label: "⚪ Marked as false alarm", color: C.muted };
  return { label: "🟢 Resolved — situation over", color: C.good };
}

export default function PanicWatchPage() {
  const { alertId } = useParams();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [, forceTick] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    panicAPI.getWatchAlert(alertId)
      .then((r) => setAlert(r.alert))
      .catch(() => setError("This tracking link isn't valid or has expired."))
      .finally(() => setLoading(false));

    const sock = io(process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000", { transports: ["websocket"] });
    socketRef.current = sock;
    sock.emit("panic:join_watch", { alertId });
    sock.on("panic:location_update", (update) => {
      if (update.id !== alertId) return;
      setAlert((prev) => prev ? { ...prev, latitude: update.latitude, longitude: update.longitude, lastLocationAt: update.lastLocationAt } : prev);
    });

    return () => { sock.emit("panic:leave_watch", { alertId }); sock.disconnect(); };
  }, [alertId]);

  // Re-render every few seconds so "X seconds ago" stays fresh
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 3000);
    return () => clearInterval(t);
  }, []);

  if (loading) {
    return <div style={{ minHeight: "100vh", background: C.bg, color: C.muted, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif" }}>Loading…</div>;
  }
  if (error || !alert) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, color: C.text, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔗</div>
        <div>{error || "This tracking link isn't valid."}</div>
      </div>
    );
  }

  const st = statusInfo(alert.status);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter',sans-serif" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "1.5rem" }}>
        <div style={{ fontSize: "20px", fontWeight: 700, marginBottom: "4px" }}>🆘 PROJO Panic — Live Tracking</div>
        <div style={{ fontSize: "13.5px", color: C.muted, marginBottom: "1.25rem" }}>{alert.firstName} triggered a panic alert. You're seeing their live location because you're a registered emergency contact.</div>

        <div style={{ background: C.card, border: `1px solid ${st.color}55`, borderRadius: "12px", padding: "12px 16px", marginBottom: "1rem", fontWeight: 700, color: st.color }}>
          {st.label}
        </div>

        {alert.latitude && alert.longitude ? (
          <>
            <div style={{ height: "340px", borderRadius: "14px", overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: "8px" }}>
              <MapContainer center={[alert.latitude, alert.longitude]} zoom={16} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="" />
                <Marker position={[alert.latitude, alert.longitude]} icon={pinIcon}>
                  <Popup>{alert.firstName}'s last known location</Popup>
                </Marker>
              </MapContainer>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: C.muted, marginBottom: "1.5rem" }}>
              <a href={`https://maps.google.com/?q=${alert.latitude},${alert.longitude}`} target="_blank" rel="noreferrer" style={{ color: C.good }}>Open in Google Maps ↗</a>
              <span>Updated {timeAgo(alert.lastLocationAt)}</span>
            </div>
          </>
        ) : (
          <div style={{ color: C.muted, textAlign: "center", padding: "2rem 0" }}>No location shared yet.</div>
        )}

        <div style={{ fontSize: "11px", color: C.muted, textAlign: "center", lineHeight: 1.6 }}>
          This page updates automatically. If this is a real emergency, please also contact local emergency services directly.
        </div>
      </div>
    </div>
  );
}
