// ============================================================
// PROJO GROUP — Driver Signup Page
// Step 1: Personal details
// Step 2: Vehicle details
// Step 3: Document uploads (Operator Card, Vehicle Papers, ID, Photos)
// Step 4: Pending Activation screen
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

const G      = "#e8b84b";
const BG     = "#0a0a0a";
const BG2    = "#111111";
const BG3    = "#1a1a1a";
const BORDER = "rgba(232,184,75,0.18)";
const GREEN  = "#4ade80";

const STEPS = ["Personal Details", "Vehicle Info", "Upload Documents", "Done"];

const REQUIRED_DOCS = [
  { key: "operatorCard",    label: "Operator Card",              icon: "📋", desc: "Valid PDP / Operator card" },
  { key: "vehiclePapers",   label: "Vehicle Registration Papers",icon: "🚗", desc: "Vehicle licence disc & papers" },
  { key: "idCopy",          label: "ID Copy",                    icon: "🪪", desc: "Clear copy of your SA ID" },
  { key: "personPhoto",     label: "Photo of Yourself",          icon: "🤳", desc: "Clear recent photo of your face" },
  { key: "vehicleInside",   label: "Vehicle Interior Photo",     icon: "🪑", desc: "Photo of inside the vehicle" },
  { key: "vehicleOutside",  label: "Vehicle Exterior Photo",     icon: "🚘", desc: "Photo of outside the vehicle" },
];

export default function DriverSignupPage() {
  const navigate = useNavigate();
  const [step, setStep]     = useState(() => {
    try { return parseInt(localStorage.getItem("drv_step") || "0"); } catch { return 0; }
  });
  const socketRef = useRef(null);
  const pollRef = useRef(null);

  // When on pending screen - connect socket + poll for approval
  useEffect(() => {
    if (step !== 3) return;
    const userId = localStorage.getItem("projo_user")
      ? JSON.parse(localStorage.getItem("projo_user"))?.id
      : null;
    if (!userId) return;

    // Connect socket and join pending room
    const sock = io(
      process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000",
      { auth: { token: localStorage.getItem("projo_token") } }
    );
    socketRef.current = sock;
    sock.emit("driver:join_pending", { driverId: userId });

    // Listen for approval
    sock.on("driver:approved", () => {
      toast.success("🎉 You have been approved! Redirecting to driver dashboard...");
      // Clear signup localStorage
      ["drv_step","drv_personal","drv_otpSent","drv_verified","drv_vehicle"].forEach(k => localStorage.removeItem(k));
      setTimeout(() => navigate("/driver"), 2000);
    });

    // Poll every 30 seconds as backup (in case socket misses it)
    pollRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem("projo_token");
        if (!token) return;
        const res = await fetch(
          `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/auth/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.user?.role === "DRIVER" && data.user?.status === "ACTIVE") {
          toast.success("🎉 Approved! Redirecting...");
          ["drv_step","drv_personal","drv_otpSent","drv_verified","drv_vehicle"].forEach(k => localStorage.removeItem(k));
          navigate("/driver");
        }
      } catch {}
    }, 30000);

    return () => {
      sock.disconnect();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step]);
  const [loading, setLoading] = useState(false);

  const [personal, setPersonal] = useState(() => {
    try {
      const saved = localStorage.getItem("drv_personal");
      return saved ? JSON.parse(saved) : { name: "", phone: "", email: "", address: "", idNumber: "" };
    } catch { return { name: "", phone: "", email: "", address: "", idNumber: "" }; }
  });
  const [vehicle, setVehicle] = useState(() => {
    try {
      const saved = localStorage.getItem("drv_vehicle");
      return saved ? JSON.parse(saved) : {
    make: "", model: "", year: "", color: "", registration: "", vehicleType: "ECONOMY",
  };
    } catch { return {
    make: "", model: "", year: "", color: "", registration: "", vehicleType: "ECONOMY",
  }; }
  });
  const [docs, setDocs] = useState({
    operatorCard: null, vehiclePapers: null, idCopy: null,
    personPhoto: null, vehicleInside: null, vehicleOutside: null,
  });
  const [otp, setOtp]         = useState("");
  const [otpSent, setOtpSent] = useState(() => {
    try { return localStorage.getItem("drv_otpSent") === "true"; } catch { return false; }
  });
  const [verified, setVerified] = useState(() => {
    try { return localStorage.getItem("drv_verified") === "true"; } catch { return false; }
  });

  const inp = {
    width: "100%", background: BG3, border: `1px solid ${BORDER}`,
    borderRadius: "10px", color: "#f0ede8", padding: "12px 14px",
    fontSize: "14px", outline: "none", fontFamily: "'DM Sans',sans-serif",
    boxSizing: "border-box",
  };
  const lbl = {
    fontSize: "11px", fontWeight: "700", color: "#6b6760",
    letterSpacing: "0.8px", textTransform: "uppercase",
    display: "block", marginBottom: "6px",
  };

  function formatPhone(raw) {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("27")) return "+" + digits;
    if (digits.startsWith("0"))  return "+27" + digits.slice(1);
    return "+27" + digits;
  }

  async function sendOTP() {
    const formatted = formatPhone(personal.phone);
    if (!/^\+27[0-9]{9}$/.test(formatted)) return toast.error("Enter a valid SA number");
    if (!personal.email.includes("@")) return toast.error("Enter a valid email");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formatted, email: personal.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOtpSent(true);
      localStorage.setItem("drv_otpSent", "true");
      toast.success(`Verification code sent to ${personal.email}`);
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
    } finally { setLoading(false); }
  }

  async function verifyOTP() {
    const formatted = formatPhone(personal.phone);
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formatted, otp,
          name: personal.name, role: "DRIVER", email: personal.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem("projo_token", data.token);
      if (data.refreshToken) localStorage.setItem("projo_refresh_token", data.refreshToken);
      setVerified(true);
      toast.success("Phone verified!");
      setStep(1);
    } catch (err) {
      toast.error(err.message || "Invalid OTP");
    } finally { setLoading(false); }
  }

  async function submitApplication() {
    // Check all docs uploaded
    const missing = REQUIRED_DOCS.filter(d => !docs[d.key]);
    if (missing.length > 0) {
      toast.error(`Please upload: ${missing.map(d => d.label).join(", ")}`);
      return;
    }
    setLoading(true);
    try {
      // Clear session storage on successful submit
    localStorage.removeItem("drv_step");
    localStorage.removeItem("drv_personal");
    localStorage.removeItem("drv_otpSent");
    localStorage.removeItem("drv_verified");
    const token = localStorage.getItem("projo_token");
      const formData = new FormData();

      // Personal & vehicle data
      formData.append("idNumber", personal.idNumber);
      formData.append("address", personal.address);
      formData.append("vehicleMake", vehicle.make);
      formData.append("vehicleModel", vehicle.model);
      formData.append("vehicleYear", vehicle.year);
      formData.append("vehicleColor", vehicle.color);
      formData.append("vehicleRegistration", vehicle.registration);
      formData.append("vehicleType", vehicle.vehicleType);

      // Documents
      REQUIRED_DOCS.forEach(d => {
        if (docs[d.key]) formData.append(d.key, docs[d.key]);
      });

      const res = await fetch(`${process.env.REACT_APP_API_URL}/drivers/apply`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Note missing docs for WhatsApp follow-up
      const missingDocs = Object.entries(docs).filter(([k,v]) => !v).map(([k]) => k);
      if (missingDocs.length > 0) {
        toast(`Some documents missing (${missingDocs.join(", ")}) — we'll request them via WhatsApp`, { icon: "ℹ️", duration: 5000 });
      }
      localStorage.setItem("drv_step", "3");
      setStep(3);
    } catch (err) {
      toast.error(err.message || "Submission failed. Please try again.");
    } finally { setLoading(false); }
  }

  function handleDocUpload(key, file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10MB per document.");
      return;
    }
    setDocs(d => ({ ...d, [key]: file }));
    toast.success(`${key} uploaded ✅`);
  }

  const progressPct = ((step) / (STEPS.length - 1)) * 100;

  return (
    <div style={{ minHeight: "100vh", background: BG,
      fontFamily: "'DM Sans',sans-serif", padding: "0 0 3rem" }}>

      {/* Header */}
      <div style={{ background: BG2, borderBottom: `1px solid ${BORDER}`,
        padding: "1rem", display: "flex", alignItems: "center", gap: "12px" }}>
        <button onClick={() => step > 0 && step < 3 ? setStep(s => s - 1) : navigate("/")}
          style={{ background: "none", border: "none", color: "#a8a49e",
            cursor: "pointer", fontSize: "20px" }}>←</button>
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: "800",
            color: G, fontSize: "1rem" }}>Drive with PROJO</div>
          <div style={{ fontSize: "12px", color: "#6b6760" }}>
            {step < 3 ? `Step ${step + 1} of ${STEPS.length - 1}: ${STEPS[step]}` : "Application Submitted"}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {step < 3 && (
        <div style={{ height: "3px", background: "#1a1a1a" }}>
          <div style={{ height: "100%", background: G, width: `${progressPct}%`,
            transition: "width .4s ease" }} />
        </div>
      )}

      <div style={{ maxWidth: "520px", margin: "0 auto", padding: "1.5rem 1rem" }}>

        {/* ── STEP 0: Personal Details ── */}
        {step === 0 && (
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.3rem",
              fontWeight: "800", color: "#f0ede8", marginBottom: "0.25rem" }}>
              Personal Details
            </h2>
            <p style={{ fontSize: "13px", color: "#6b6760", marginBottom: "1.5rem" }}>
              Tell us about yourself — we'll verify your phone via OTP.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={lbl}>Full Name *</label>
                <input style={inp} placeholder="Your full name"
                  value={personal.name}
                  onChange={e => { const v = e.target.value; setPersonal(p => { const n = {...p, name:v}; localStorage.setItem("drv_personal", JSON.stringify(n)); return n; }); }} />
              </div>
              <div>
                <label style={lbl}>SA Phone Number *</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ ...inp, width: "60px", flexShrink: 0, color: G,
                    fontWeight: "700", textAlign: "center" }}>+27</div>
                  <input style={{ ...inp, flex: 1 }} placeholder="83 123 4567"
                    type="tel" value={personal.phone}
                    onChange={e => { const v = e.target.value; setPersonal(p => { const n = {...p, phone:v}; localStorage.setItem("drv_personal", JSON.stringify(n)); return n; }); }} />
                </div>
              </div>
              <div>
                <label style={lbl}>Email Address *</label>
                <input style={inp} placeholder="your@email.com" type="email"
                  value={personal.email}
                  onChange={e => { const v = e.target.value; setPersonal(p => { const n = {...p, email:v}; localStorage.setItem("drv_personal", JSON.stringify(n)); return n; }); }} />
              </div>
              <div>
                <label style={lbl}>ID Number *</label>
                <input style={inp} placeholder="SA ID number"
                  value={personal.idNumber}
                  onChange={e => setPersonal(p => ({ ...p, idNumber: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Residential Address *</label>
                <input style={inp} placeholder="Street, Area, Rustenburg"
                  value={personal.address}
                  onChange={e => setPersonal(p => ({ ...p, address: e.target.value }))} />
              </div>

              {/* OTP Section */}
              {!verified && (
                <div style={{ background: BG2, border: `1px solid ${BORDER}`,
                  borderRadius: "12px", padding: "1rem" }}>
                  {!otpSent ? (
                    <button onClick={sendOTP} disabled={loading || !personal.name || !personal.phone || !personal.email}
                      style={{ width: "100%", background: G, color: "#0a0a0a",
                        border: "none", borderRadius: "10px", padding: "13px",
                        fontSize: "14px", fontWeight: "700",
                        cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                      {loading ? "Sending..." : "Send Verification Code"}
                    </button>
                  ) : (
                    <div>
                      <label style={lbl}>Enter 6-digit code sent to {personal.email}</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input style={{ ...inp, flex: 1, fontSize: "20px",
                          letterSpacing: "8px", textAlign: "center" }}
                          placeholder="000000" maxLength={6}
                          value={otp}
                          onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          type="tel" />
                        <button onClick={verifyOTP} disabled={loading || otp.length < 6}
                          style={{ background: G, color: "#0a0a0a", border: "none",
                            borderRadius: "10px", padding: "0 20px", fontWeight: "700",
                            cursor: "pointer", whiteSpace: "nowrap", fontSize: "14px" }}>
                          {loading ? "..." : "Verify"}
                        </button>
                      </div>
                      <button onClick={sendOTP} style={{ background: "none", border: "none",
                        color: "#6b6760", fontSize: "12px", cursor: "pointer",
                        marginTop: "8px", textDecoration: "underline" }}>
                        Resend code
                      </button>
                    </div>
                  )}
                </div>
              )}

              {verified && (
                <div style={{ background: "rgba(74,222,128,0.08)",
                  border: "1px solid rgba(74,222,128,0.3)", borderRadius: "10px",
                  padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>✅</span>
                  <span style={{ fontSize: "13px", color: GREEN, fontWeight: "600" }}>
                    Phone verified — {formatPhone(personal.phone)}
                  </span>
                </div>
              )}

              <button onClick={() => setStep(1)}
                disabled={!verified || !personal.name || !personal.idNumber || !personal.address}
                style={{ width: "100%", background: G, color: "#0a0a0a",
                  border: "none", borderRadius: "10px", padding: "14px",
                  fontSize: "15px", fontWeight: "700",
                  cursor: (!verified || !personal.name || !personal.idNumber || !personal.address) ? "not-allowed" : "pointer",
                  opacity: (!verified || !personal.name || !personal.idNumber || !personal.address) ? 0.5 : 1 }}>
                Next: Vehicle Info →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 1: Vehicle Info ── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.3rem",
              fontWeight: "800", color: "#f0ede8", marginBottom: "0.25rem" }}>
              Vehicle Information
            </h2>
            <p style={{ fontSize: "13px", color: "#6b6760", marginBottom: "1.5rem" }}>
              Details about the vehicle you'll be driving.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={lbl}>Make *</label>
                  <input style={inp} placeholder="e.g. Toyota"
                    value={vehicle.make}
                    onChange={e => { const val = e.target.value; setVehicle(v => { const n = {...v, make: val}; localStorage.setItem("drv_vehicle", JSON.stringify(n)); return n; }); }} />
                </div>
                <div>
                  <label style={lbl}>Model *</label>
                  <input style={inp} placeholder="e.g. Corolla"
                    value={vehicle.model}
                    onChange={e => { const val = e.target.value; setVehicle(v => { const n = {...v, model: val}; localStorage.setItem("drv_vehicle", JSON.stringify(n)); return n; }); }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={lbl}>Year *</label>
                  <input style={inp} placeholder="e.g. 2020" type="number"
                    value={vehicle.year}
                    onChange={e => { const val = e.target.value; setVehicle(v => { const n = {...v, year: val}; localStorage.setItem("drv_vehicle", JSON.stringify(n)); return n; }); }} />
                </div>
                <div>
                  <label style={lbl}>Color *</label>
                  <input style={inp} placeholder="e.g. White"
                    value={vehicle.color}
                    onChange={e => { const val = e.target.value; setVehicle(v => { const n = {...v, color: val}; localStorage.setItem("drv_vehicle", JSON.stringify(n)); return n; }); }} />
                </div>
              </div>
              <div>
                <label style={lbl}>Registration Number *</label>
                <input style={inp} placeholder="e.g. JK 12 GP"
                  value={vehicle.registration}
                  onChange={e => { const val = e.target.value; setVehicle(v => { const n = {...v, registration: val}; localStorage.setItem("drv_vehicle", JSON.stringify(n)); return n; }); }} />
              </div>
              <div>
                <label style={lbl}>Vehicle Type *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[
                    { key: "ECONOMY", label: "🚗 Economy", desc: "Standard car" },
                    { key: "COMFORT", label: "🚙 Comfort", desc: "Newer/premium car" },
                    { key: "XL",      label: "🚐 XL",      desc: "SUV or minivan" },
                    { key: "LUXURY",  label: "🏎️ Luxury",  desc: "Premium vehicle" },
                  ].map(t => (
                    <div key={t.key} onClick={() => setVehicle(v => ({ ...v, vehicleType: t.key }))}
                      style={{ background: vehicle.vehicleType === t.key ? "rgba(232,184,75,0.1)" : BG3,
                        border: `1px solid ${vehicle.vehicleType === t.key ? G : BORDER}`,
                        borderRadius: "10px", padding: "10px 12px", cursor: "pointer" }}>
                      <div style={{ fontSize: "13px", fontWeight: "700",
                        color: vehicle.vehicleType === t.key ? G : "#f0ede8" }}>{t.label}</div>
                      <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "2px" }}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => setStep(2)}
                disabled={!vehicle.make || !vehicle.model || !vehicle.year || !vehicle.registration}
                style={{ width: "100%", background: G, color: "#0a0a0a",
                  border: "none", borderRadius: "10px", padding: "14px",
                  fontSize: "15px", fontWeight: "700",
                  cursor: (!vehicle.make || !vehicle.model || !vehicle.year || !vehicle.registration) ? "not-allowed" : "pointer",
                  opacity: (!vehicle.make || !vehicle.model || !vehicle.year || !vehicle.registration) ? 0.5 : 1 }}>
                Next: Upload Documents →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Document Uploads ── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.3rem",
              fontWeight: "800", color: "#f0ede8", marginBottom: "0.25rem" }}>
              Upload Documents
            </h2>
            <p style={{ fontSize: "13px", color: "#6b6760", marginBottom: "1.5rem" }}>
              All 6 documents are required. Max 10MB each. JPG, PNG or PDF accepted.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px",
              marginBottom: "1.5rem" }}>
              {REQUIRED_DOCS.map(doc => (
                <div key={doc.key} style={{ background: BG2,
                  border: `1px solid ${docs[doc.key] ? "rgba(74,222,128,0.4)" : BORDER}`,
                  borderRadius: "12px", padding: "1rem",
                  display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px", flexShrink: 0 }}>{doc.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#f0ede8",
                      marginBottom: "2px" }}>{doc.label}</div>
                    <div style={{ fontSize: "11px", color: "#6b6760" }}>
                      {docs[doc.key] ? (
                        <span style={{ color: GREEN }}>✅ {docs[doc.key].name}</span>
                      ) : doc.desc}
                    </div>
                  </div>
                  <label style={{ background: docs[doc.key] ? "rgba(74,222,128,0.1)" : "rgba(232,184,75,0.1)",
                    border: `1px solid ${docs[doc.key] ? "rgba(74,222,128,0.3)" : "rgba(232,184,75,0.25)"}`,
                    borderRadius: "8px", padding: "7px 12px", cursor: "pointer",
                    fontSize: "12px", fontWeight: "700",
                    color: docs[doc.key] ? GREEN : G, flexShrink: 0 }}>
                    {docs[doc.key] ? "Change" : "Upload"}
                    <input type="file" accept="image/*,.pdf" style={{ display: "none" }}
                      onChange={e => handleDocUpload(doc.key, e.target.files[0])} />
                  </label>
                </div>
              ))}
            </div>

            {/* Upload count */}
            <div style={{ textAlign: "center", fontSize: "13px", color: "#6b6760",
              marginBottom: "1rem" }}>
              {Object.values(docs).filter(Boolean).length} / {REQUIRED_DOCS.length} documents uploaded
            </div>

            <button onClick={submitApplication} disabled={loading}
              style={{ width: "100%", background: G, color: "#0a0a0a",
                border: "none", borderRadius: "10px", padding: "14px",
                fontSize: "15px", fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Submitting Application..." : "Submit Driver Application →"}
            </button>
            <p style={{ fontSize: "11px", color: "#6b6760", textAlign: "center", marginTop: "8px" }}>
              You can still submit with missing docs — upload the rest via WhatsApp after signing up.
            </p>
          </div>
        )}

        {/* ── STEP 3: Pending Activation ── */}
        {step === 3 && (
          <div style={{ textAlign: "center", paddingTop: "2rem" }}>
            <div style={{ fontSize: "64px", marginBottom: "1rem" }}>🎉</div>
            <div style={{ background: "rgba(74,222,128,0.08)",
              border: "2px solid rgba(74,222,128,0.4)",
              borderRadius: "20px", padding: "2rem", marginBottom: "1.5rem" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.4rem",
                fontWeight: "800", color: GREEN, marginBottom: "0.5rem",
                letterSpacing: "1px" }}>
                SIGNUP COMPLETED
              </div>
              <div style={{ fontSize: "1rem", fontWeight: "700", color: "#f59e0b",
                marginBottom: "1rem", letterSpacing: "0.5px" }}>
                ⏳ Pending Activation
              </div>
              <div style={{ fontSize: "13px", color: "#b8a09a", lineHeight: 1.7 }}>
                Your application has been received. The PROJO GROUP team will review
                your documents and activate your account within <strong style={{ color: G }}>24–48 hours</strong>.
              </div>
            </div>

            <div style={{ background: BG2, border: `1px solid ${BORDER}`,
              borderRadius: "14px", padding: "1.25rem", marginBottom: "1.5rem",
              textAlign: "left" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: G,
                textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
                What happens next
              </div>
              {[
                "Our team reviews your documents",
                "We may contact you via WhatsApp for any missing info",
                "Once approved you'll be automatically redirected to the driver dashboard",
                "Or log back in anytime to check your status",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "8px",
                  fontSize: "13px", color: "#b8a09a" }}>
                  <span style={{ color: G, fontWeight: "700", flexShrink: 0 }}>{i + 1}.</span>
                  {item}
                </div>
              ))}
            </div>

            <button onClick={() => window.open(`https://wa.me/27766147986?text=${encodeURIComponent("Hi PROJO GROUP, I just completed my driver signup. My name is " + personal.name + ". Please activate my account.")}`, "_blank")}
              style={{ width: "100%", background: "#25D366", color: "#fff",
                border: "none", borderRadius: "10px", padding: "14px",
                fontSize: "14px", fontWeight: "700", cursor: "pointer",
                marginBottom: "10px" }}>
              💬 WhatsApp Us to Confirm
            </button>

            <button onClick={() => navigate("/login")} style={{
              width: "100%", background: "transparent", color: G,
              border: `1px solid rgba(232,184,75,0.3)`, borderRadius: "10px",
              padding: "14px", fontSize: "14px", fontWeight: "700", cursor: "pointer",
            }}>Sign In to App</button>
          </div>
        )}
      </div>
    </div>
  );

  function formatPhone(raw) {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("27")) return "+" + digits;
    if (digits.startsWith("0"))  return "+27" + digits.slice(1);
    return "+27" + digits;
  }
}
