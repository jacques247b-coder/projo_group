// ============================================================
// PROJO GROUP — Register Page (FIXED)
// FIX 1: Added email field — OTP sent via email not SMS
// FIX 2: Uses sendOTP/verifyOTP from AuthContext (not missing login())
// ============================================================
import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const G      = "#e8b84b";
const BG     = "#0a0a0a";
const BG2    = "#111111";
const BG3    = "#1a1a1a";
const BORDER = "rgba(232,184,75,0.2)";

export default function RegisterPage() {
  const { sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [step, setStep]         = useState("FORM"); // FORM | OTP
  const [loading, setLoading]   = useState(false);
  const [phone, setPhone]       = useState("");
  const [email, setEmail]       = useState("");
  const [name, setName]         = useState("");
  const [role, setRole]         = useState(
    params.get("role") === "driver" ? "DRIVER" : "PASSENGER"
  );
  const [otp, setOtp]           = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);

  function getFullPhone() {
    let digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0")) digits = digits.slice(1);
    if (digits.startsWith("27")) return `+${digits}`;
    return `+27${digits}`;
  }

  function startCountdown() {
    setCountdown(60);
    const t = setInterval(() =>
      setCountdown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  }

  async function handleRegister(e) {
    e?.preventDefault();
    if (!name.trim())                    return toast.error("Enter your full name");
    if (!email || !email.includes("@")) return toast.error("Enter a valid email address");
    const fullPhone = getFullPhone();
    if (fullPhone.length < 12)           return toast.error("Enter a valid SA phone number");

    setLoading(true);
    try {
      // sendOTP creates the user if new, sends OTP to email
      const res = await sendOTP(fullPhone, email);
      toast.success(`Verification code sent to ${email}`);
      setStep("OTP");
      startCountdown();
    } catch (err) {
      toast.error(err?.error || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) return toast.error("Enter the 6-digit code");
    setLoading(true);
    try {
      // verifyOTP sets user + token in AuthContext
      const user = await verifyOTP(getFullPhone(), code, name, role, email);
      toast.success(`Welcome to PROJO GROUP, ${user.name}! 🏆`);
      if (user.role === "DRIVER")      navigate("/driver");
      else if (user.role === "ADMIN")  navigate("/admin");
      else                             navigate("/book");
    } catch (err) {
      toast.error(err?.error || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  }

  function handleOTPInput(val, idx) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[idx] = digit; setOtp(next);
    if (digit && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  }

  const inputStyle = {
    width: "100%", background: BG3,
    border: `1px solid ${BORDER}`, borderRadius: "10px",
    color: "#f0ede8", padding: "12px 14px", fontSize: "15px",
    outline: "none", fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box",
  };
  const labelStyle = {
    fontSize: "11px", fontWeight: "700", color: "#6b6760",
    letterSpacing: "0.8px", textTransform: "uppercase",
    display: "block", marginBottom: "6px",
  };

  return (
    <div style={{ minHeight: "100vh", background: BG,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "440px" }}>

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <img src="/assets/logo/PROJO_LOGO.png" alt="PROJO"
            style={{ width: "70px", height: "70px", borderRadius: "50%",
              objectFit: "cover", filter: "drop-shadow(0 0 14px rgba(232,184,75,0.5))",
              marginBottom: "0.75rem" }}
            onError={e => e.target.style.display = "none"} />
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.4rem",
            fontWeight: "800", color: G, letterSpacing: "1.5px", margin: "0 0 4px" }}>
            PROJO GROUP
          </h1>
          <p style={{ color: "#6b6760", fontSize: "12px", margin: 0 }}>
            Rustenburg's Own. Ride. Shop. Deliver & Services.
          </p>
        </div>

        <div style={{ background: BG2, border: `1px solid ${BORDER}`,
          borderRadius: "20px", padding: "2rem" }}>

          {/* ── STEP 1: Registration form ── */}
          {step === "FORM" && (
            <>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.25rem",
                fontWeight: "700", color: "#f0ede8", margin: "0 0 0.4rem" }}>
                Create Account
              </h2>
              <p style={{ color: "#6b6760", fontSize: "13px", margin: "0 0 1.5rem" }}>
                Join Rustenburg's own platform
              </p>

              {/* Role toggle */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: "8px", marginBottom: "1.25rem" }}>
                {["PASSENGER", "DRIVER"].map(r => (
                  <button key={r} type="button" onClick={() => setRole(r)} style={{
                    padding: "10px", borderRadius: "10px", fontWeight: "700",
                    fontSize: "13px", cursor: "pointer", transition: "all .2s",
                    background: role === r ? G : BG3,
                    color: role === r ? "#0a0a0a" : "#a8a49e",
                    border: role === r ? "none" : `1px solid ${BORDER}`,
                  }}>
                    {r === "PASSENGER" ? "🧍 Passenger" : "🚗 Driver"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleRegister}
                style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input style={inputStyle} placeholder="Your full name" required
                    value={name} onChange={e => setName(e.target.value)} />
                </div>

                <div>
                  <label style={labelStyle}>SA Phone Number</label>
                  <div style={{ display: "flex", background: BG3,
                    border: `1px solid ${BORDER}`, borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ padding: "12px 14px", background: "#252525",
                      color: G, fontWeight: "700", fontSize: "14px",
                      borderRight: `1px solid ${BORDER}` }}>
                      🇿🇦 +27
                    </div>
                    <input type="tel" placeholder="83 123 4567" required
                      style={{ ...inputStyle, border: "none", borderRadius: 0,
                        background: "transparent", flex: 1 }}
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                      maxLength={10} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input style={inputStyle} type="email" placeholder="your@email.com" required
                    value={email} onChange={e => setEmail(e.target.value)} />
                  <p style={{ fontSize: "11px", color: "#6b6760", marginTop: "4px" }}>
                    📧 Verification code sent here · Used for booking confirmations
                  </p>
                </div>

                {role === "DRIVER" && (
                  <div style={{ background: "rgba(232,184,75,0.06)",
                    border: `1px solid rgba(232,184,75,0.2)`, borderRadius: "10px",
                    padding: "12px 14px", fontSize: "12px", color: "#a8a49e", lineHeight: "1.6" }}>
                    🏆 As a driver you keep{" "}
                    <strong style={{ color: G }}>80% of every fare</strong>.
                    Earn R48 per Rustenburg flat ride.
                  </div>
                )}

                <button type="submit" disabled={loading} style={{
                  background: loading ? "#9a7520" : G, color: "#0a0a0a",
                  border: "none", borderRadius: "10px", padding: "14px",
                  fontSize: "15px", fontWeight: "700",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {loading ? "Sending code..." : "Create Account →"}
                </button>
              </form>

              <p style={{ textAlign: "center", marginTop: "1.25rem",
                fontSize: "13px", color: "#6b6760" }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: G, textDecoration: "none", fontWeight: "600" }}>
                  Sign In
                </Link>
              </p>
            </>
          )}

          {/* ── STEP 2: OTP verification ── */}
          {step === "OTP" && (
            <>
              <button onClick={() => setStep("FORM")} style={{
                background: "none", border: "none", color: "#a8a49e",
                fontSize: "13px", cursor: "pointer", padding: "0 0 1rem",
              }}>← Back</button>

              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.25rem",
                fontWeight: "700", color: "#f0ede8", margin: "0 0 0.4rem" }}>
                Verify Your Email
              </h2>
              <p style={{ color: "#6b6760", fontSize: "13px", margin: "0 0 1.5rem" }}>
                6-digit code sent to{" "}
                <strong style={{ color: G }}>{email}</strong>
              </p>

              <form onSubmit={handleVerifyOTP}>
                {/* OTP boxes */}
                <div style={{ display: "flex", gap: "8px",
                  marginBottom: "1.5rem", justifyContent: "center" }}>
                  {otp.map((d, i) => (
                    <input key={i} id={`otp-${i}`} type="text" inputMode="numeric"
                      maxLength={1} value={d}
                      onChange={e => handleOTPInput(e.target.value, i)}
                      onKeyDown={e => {
                        if (e.key === "Backspace" && !d && i > 0)
                          document.getElementById(`otp-${i - 1}`)?.focus();
                      }}
                      style={{
                        width: "48px", height: "56px", textAlign: "center",
                        background: BG3,
                        border: d ? `2px solid ${G}` : `1px solid ${BORDER}`,
                        borderRadius: "10px", color: "#f0ede8",
                        fontSize: "22px", fontWeight: "700", outline: "none",
                        fontFamily: "'Syne', sans-serif",
                      }} />
                  ))}
                </div>

                <button type="submit" disabled={loading} style={{
                  width: "100%", background: loading ? "#9a7520" : G,
                  color: "#0a0a0a", border: "none", borderRadius: "10px",
                  padding: "14px", fontSize: "15px", fontWeight: "700",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {loading ? "Verifying..." : "Verify & Enter App →"}
                </button>

                <div style={{ textAlign: "center", marginTop: "1rem" }}>
                  {countdown > 0
                    ? <span style={{ fontSize: "12px", color: "#6b6760" }}>
                        Resend in {countdown}s
                      </span>
                    : <button type="button" onClick={handleRegister} style={{
                        background: "none", border: "none", color: G,
                        fontSize: "13px", fontWeight: "600", cursor: "pointer",
                      }}>Resend code</button>
                  }
                </div>
              </form>
            </>
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
