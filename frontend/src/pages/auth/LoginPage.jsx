// ============================================================
// PROJO GROUP — Login Page with Email OTP
// Collects email for marketing + sends OTP via Gmail
// ============================================================
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const G    = "#e8b84b";
const RED  = "#8B1A1A";
const BG   = "#0d0505";
const BG2  = "#120808";
const BG3  = "#1c0f0f";
const BORDER = "rgba(232,184,75,0.18)";

export default function LoginPage() {
  const { sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  const [step, setStep]         = useState("phone");
  const [rawPhone, setRawPhone] = useState("");
  const [phone, setPhone]       = useState("");
  const [email, setEmail]       = useState("");
  const [otp, setOtp]           = useState("");
  const [name, setName]         = useState("");
  const [role, setRole]         = useState("PASSENGER");
  const [loading, setLoading]   = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [otpVia, setOtpVia]     = useState("email");

  function formatPhone(raw) {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("27")) return "+" + digits;
    if (digits.startsWith("0"))  return "+27" + digits.slice(1);
    return "+27" + digits;
  }

  async function handleSendOTP(e) {
    e.preventDefault();
    const formatted = formatPhone(rawPhone);
    if (!/^\+27[0-9]{9}$/.test(formatted)) {
      toast.error("Enter a valid SA number e.g. 083 123 4567");
      return;
    }
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setPhone(formatted);
    setLoading(true);
    try {
      const res = await sendOTP(formatted, email);
      setIsNewUser(res?.isNewUser || false);
      setOtpVia(res?.via || "email");
      setStep("otp");
      toast.success(`OTP sent to ${email}`);
    } catch (err) {
      toast.error(err?.error || "Failed to send OTP");
    } finally { setLoading(false); }
  }

  async function handleVerifyOTP(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await verifyOTP(phone, otp, isNewUser ? name : undefined, isNewUser ? role : undefined, email);
      toast.success("Welcome to PROJO GROUP!");
      if (user.role === "DRIVER")     navigate("/driver");
      else if (user.role === "ADMIN") navigate("/admin");
      else                            navigate("/book");
    } catch (err) {
      toast.error(err?.error || "Invalid OTP code");
    } finally { setLoading(false); }
  }

  const inputStyle = {
    width: "100%", background: BG3, border: `1px solid ${BORDER}`,
    color: "#f5ede8", borderRadius: "10px", padding: "13px 16px",
    fontSize: "15px", fontFamily: "'DM Sans',sans-serif",
    outline: "none", boxSizing: "border-box", marginTop: "6px",
  };
  const labelStyle = {
    fontSize: "11px", fontWeight: "700", color: "#7a5a55",
    letterSpacing: "0.8px", textTransform: "uppercase",
  };
  const btnStyle = {
    width: "100%", background: G, color: "#1a0808", border: "none",
    borderRadius: "10px", padding: "15px", fontSize: "15px",
    fontWeight: "800", cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.7 : 1, fontFamily: "'DM Sans',sans-serif",
    marginTop: "8px",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `radial-gradient(ellipse at top, rgba(139,26,26,0.25) 0%, ${BG} 60%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem", fontFamily: "'DM Sans',sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <img src="/assets/logo/PROJO_LOGO.png" alt="PROJO GROUP"
            style={{ width: "90px", height: "90px", borderRadius: "50%",
              objectFit: "cover", filter: "drop-shadow(0 0 16px rgba(232,184,75,0.5))",
              marginBottom: "1rem" }}
            onError={e => e.target.style.display = "none"} />
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.6rem",
            fontWeight: "800", color: G, letterSpacing: "2px", margin: 0 }}>
            PROJO GROUP
          </h1>
          <p style={{ color: "#7a5a55", fontSize: "12px", marginTop: "6px" }}>
            Rustenburg's Own. Ride. Shop. Deliver & Services.
          </p>
        </div>

        {/* Card */}
        <div style={{ background: BG2, border: `1px solid ${BORDER}`,
          borderRadius: "20px", padding: "2rem",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>

          <div style={{ height: "3px", borderRadius: "2px",
            background: `linear-gradient(90deg, ${RED}, ${G}, ${RED})`,
            marginBottom: "1.5rem", marginTop: "-0.5rem" }} />

          {step === "phone" && (
            <form onSubmit={handleSendOTP}>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.2rem",
                fontWeight: "700", color: "#f5ede8", marginBottom: "0.4rem" }}>
                Sign In or Register
              </h2>
              <p style={{ color: "#7a5a55", fontSize: "13px", marginBottom: "1.5rem" }}>
                Enter your details to receive a verification code
              </p>

              <label style={labelStyle}>SA Phone Number</label>
              <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                <div style={{ ...inputStyle, width: "70px", flexShrink: 0,
                  color: G, fontWeight: "800", textAlign: "center", marginTop: "6px" }}>+27</div>
                <input style={{ ...inputStyle, flex: 1 }}
                  placeholder="83 123 4567" value={rawPhone}
                  onChange={e => setRawPhone(e.target.value)}
                  type="tel" maxLength={12} required />
              </div>

              <label style={labelStyle}>Email Address</label>
              <input style={inputStyle} placeholder="your@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
                type="email" required />
              <p style={{ fontSize: "11px", color: "#7a5a55", marginTop: "4px" }}>
                📧 OTP sent to your email · Used for booking confirmations & offers
              </p>

              <button style={{ ...btnStyle, marginTop: "16px" }}
                type="submit" disabled={loading}>
                {loading ? "Sending OTP..." : "Send Verification Code →"}
              </button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOTP}>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.2rem",
                fontWeight: "700", color: "#f5ede8", marginBottom: "0.4rem" }}>
                Enter Verification Code
              </h2>
              <p style={{ color: "#7a5a55", fontSize: "13px", marginBottom: "1.5rem" }}>
                6-digit code sent to{" "}
                <strong style={{ color: G }}>{email}</strong>
              </p>

              {isNewUser && (
                <>
                  <label style={labelStyle}>Your Name</label>
                  <input style={inputStyle} placeholder="Full name"
                    value={name} onChange={e => setName(e.target.value)} required />

                  <label style={{ ...labelStyle, marginTop: "14px", display: "block" }}>I am a</label>
                  <div style={{ display: "flex", gap: "8px", marginTop: "6px", marginBottom: "14px" }}>
                    {["PASSENGER", "DRIVER"].map(r => (
                      <button key={r} type="button" onClick={() => setRole(r)} style={{
                        flex: 1, padding: "10px", borderRadius: "8px", cursor: "pointer",
                        border: `1px solid ${role === r ? G : BORDER}`,
                        background: role === r ? "rgba(232,184,75,0.1)" : BG3,
                        color: role === r ? G : "#b8a09a",
                        fontWeight: "700", fontSize: "13px", transition: "all .15s",
                      }}>
                        {r === "PASSENGER" ? "🧑 Passenger" : "🚗 Driver"}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <label style={labelStyle}>Verification Code</label>
              <input style={{ ...inputStyle, fontSize: "28px",
                letterSpacing: "10px", textAlign: "center", fontWeight: "800" }}
                placeholder="000000" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                type="tel" maxLength={6} required />

              <button style={btnStyle} type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify & Enter App →"}
              </button>

              <button type="button" onClick={() => setStep("phone")} style={{
                width: "100%", background: "transparent", border: "none",
                color: "#7a5a55", fontSize: "13px", cursor: "pointer",
                marginTop: "12px", textDecoration: "underline",
              }}>← Change details</button>
            </form>
          )}
        </div>

        <p style={{ textAlign: "center", color: "#3d1a1a",
          fontSize: "11px", marginTop: "1.5rem" }}>
          © 2023–2026 PROJO GROUP · Rustenburg, North West Province
        </p>
      </div>
    </div>
  );
}
