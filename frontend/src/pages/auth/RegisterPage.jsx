// ============================================================
// PROJO GROUP — Register Page
// Passenger or Driver registration — SA +27 phone
// ============================================================
import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { authAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { BRAND, CONTACT } from "../../utils/constants";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState("FORM"); // FORM | OTP
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const [otpVia, setOtpVia] = useState("email");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    role: params.get("role") === "driver" ? "DRIVER" : "PASSENGER",
    referralCode: params.get("ref") || "",
  });

  function getFullPhone() {
    let digits = form.phone.replace(/\D/g, "");
    if (digits.startsWith("0")) digits = digits.slice(1);
    if (digits.startsWith("27")) return `+${digits}`;
    return `+27${digits}`;
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Enter your full name");
    if (!form.email.trim() || !form.email.includes("@")) return toast.error("Enter a valid email address");
    const fullPhone = getFullPhone();
    if (fullPhone.length < 12) return toast.error("Enter a valid SA phone number");
    setLoading(true);
    try {
      const res = await authAPI.register({ ...form, phone: fullPhone });
      toast.success(res?.via === "email" ? "OTP sent! Check your email." : "OTP sent! Check your phone.");
      setOtpVia(res?.via || "email");
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
    if (code.length !== 6) return toast.error("Enter the 6-digit OTP");
    setLoading(true);
    try {
      const data = await authAPI.verifyOTP(getFullPhone(), code);
      login(data.user, data.token, data.refreshToken);
      toast.success(`Welcome to PROJO GROUP, ${data.user.name}! 🏆`);
      if (data.user.role === "DRIVER") navigate("/driver/onboard");
      else navigate("/book");
    } catch (err) {
      toast.error(err?.error || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  }

  function handleOTPInput(val, idx) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[idx] = digit; setOtp(next);
    if (digit && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  }

  function startCountdown() {
    setCountdown(60);
    const t = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  }

  const inputStyle = {
    width: "100%", background: "#1a1a1a",
    border: "1px solid rgba(232,184,75,0.2)", borderRadius: "10px",
    color: "#f0ede8", padding: "12px 14px", fontSize: "15px",
    outline: "none", fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box", transition: "border-color .2s",
  };
  const labelStyle = {
    fontSize: "11px", fontWeight: "700", color: "#6b6760",
    letterSpacing: "0.8px", textTransform: "uppercase",
    display: "block", marginBottom: "6px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "440px" }}>

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: "60px", height: "60px", borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%,#f5d078,#e8b84b,#c49a2f,#9a7520)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 0.75rem",
            boxShadow: "0 0 20px rgba(232,184,75,0.3)",
            fontFamily: "'Syne', sans-serif", fontSize: "11px", fontWeight: "800", color: "#2a1a00",
          }}>PROJO</div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.4rem",
            fontWeight: "800", color: "#e8b84b", letterSpacing: "1.5px", margin: "0 0 4px" }}>
            PROJO GROUP
          </h1>
          <p style={{ color: "#6b6760", fontSize: "12px", margin: 0 }}>{BRAND.tagline}</p>
        </div>

        <div style={{ background: "#111111", border: "1px solid rgba(232,184,75,0.15)",
          borderRadius: "20px", padding: "2rem" }}>

          {step === "FORM" && (
            <>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.25rem",
                fontWeight: "700", color: "#f0ede8", margin: "0 0 0.5rem" }}>Create Account</h2>
              <p style={{ color: "#6b6760", fontSize: "13px", margin: "0 0 1.5rem" }}>
                Join Rustenburg's own platform
              </p>

              {/* Role toggle */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "1.25rem" }}>
                {["PASSENGER", "DRIVER"].map(r => (
                  <button key={r} type="button"
                    onClick={() => setForm(f => ({ ...f, role: r }))}
                    style={{
                      padding: "10px", borderRadius: "10px", fontWeight: "700",
                      fontSize: "13px", cursor: "pointer", transition: "all .2s",
                      background: form.role === r ? "#e8b84b" : "#1a1a1a",
                      color: form.role === r ? "#0a0a0a" : "#a8a49e",
                      border: form.role === r ? "none" : "1px solid rgba(232,184,75,0.2)",
                    }}>
                    {r === "PASSENGER" ? "🧍 Passenger" : "🚗 Driver"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input style={inputStyle} placeholder="Your full name" required
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>

                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <div style={{ display: "flex", background: "#1a1a1a",
                    border: "1px solid rgba(232,184,75,0.2)", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ padding: "12px 14px", background: "#252535",
                      color: "#e8b84b", fontWeight: "700", fontSize: "14px",
                      borderRight: "1px solid rgba(232,184,75,0.15)" }}>
                      🇿🇦 +27
                    </div>
                    <input type="tel" placeholder="76 614 7986" required
                      style={{ ...inputStyle, border: "none", borderRadius: 0, background: "transparent" }}
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, "") }))}
                      maxLength={10} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Email</label>
                  <input style={inputStyle} placeholder="your@email.com" required type="email"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "6px" }}>
                    📧 OTP sent to your email · Used for booking confirmations & offers
                  </div>
                </div>

                {form.referralCode !== undefined && (
                  <div>
                    <label style={labelStyle}>Referral Code (optional)</label>
                    <input style={inputStyle} placeholder="e.g. PROJO50"
                      value={form.referralCode}
                      onChange={e => setForm(f => ({ ...f, referralCode: e.target.value.toUpperCase() }))} />
                  </div>
                )}

                {form.role === "DRIVER" && (
                  <div style={{ background: "rgba(232,184,75,0.06)",
                    border: "1px solid rgba(232,184,75,0.2)", borderRadius: "10px",
                    padding: "12px 14px", fontSize: "12px", color: "#a8a49e", lineHeight: "1.6" }}>
                    🏆 As a driver you keep <strong style={{ color: "#e8b84b" }}>80% of every fare</strong>.
                    Earn R48 per Rustenburg flat ride. We'll ask for your documents after registration.
                  </div>
                )}

                <button type="submit" disabled={loading} style={{
                  background: loading ? "#9a7520" : "#e8b84b", color: "#0a0a0a",
                  border: "none", borderRadius: "10px", padding: "14px",
                  fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {loading ? "Creating account..." : "Create Account →"}
                </button>
              </form>

              <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "13px", color: "#6b6760" }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: "#e8b84b", textDecoration: "none", fontWeight: "600" }}>
                  Sign In
                </Link>
              </p>
            </>
          )}

          {step === "OTP" && (
            <>
              <button onClick={() => setStep("FORM")} style={{
                background: "none", border: "none", color: "#a8a49e",
                fontSize: "13px", cursor: "pointer", padding: "0 0 1rem",
              }}>← Back</button>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.25rem",
                fontWeight: "700", color: "#f0ede8", margin: "0 0 0.5rem" }}>Verify Phone</h2>
              <p style={{ color: "#6b6760", fontSize: "13px", margin: "0 0 1.5rem" }}>
                OTP sent {otpVia === "email" ? "to" : "via SMS to"} <strong style={{ color: "#e8b84b" }}>{otpVia === "email" ? form.email : getFullPhone()}</strong>
              </p>
              <form onSubmit={handleVerifyOTP}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem", justifyContent: "center" }}>
                  {otp.map((d, i) => (
                    <input key={i} id={`otp-${i}`} type="text" inputMode="numeric"
                      maxLength={1} value={d}
                      onChange={e => handleOTPInput(e.target.value, i)}
                      onKeyDown={e => { if (e.key === "Backspace" && !d && i > 0) document.getElementById(`otp-${i-1}`)?.focus(); }}
                      style={{ width: "48px", height: "56px", textAlign: "center",
                        background: "#1a1a1a",
                        border: d ? "2px solid #e8b84b" : "1px solid rgba(232,184,75,0.2)",
                        borderRadius: "10px", color: "#f0ede8",
                        fontSize: "22px", fontWeight: "700", outline: "none",
                        fontFamily: "'Syne', sans-serif" }} />
                  ))}
                </div>
                <button type="submit" disabled={loading} style={{
                  width: "100%", background: loading ? "#9a7520" : "#e8b84b",
                  color: "#0a0a0a", border: "none", borderRadius: "10px",
                  padding: "14px", fontSize: "15px", fontWeight: "700",
                  cursor: loading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif",
                }}>
                  {loading ? "Verifying..." : "Verify & Continue"}
                </button>
                <div style={{ textAlign: "center", marginTop: "1rem" }}>
                  {countdown > 0
                    ? <span style={{ fontSize: "12px", color: "#6b6760" }}>Resend in {countdown}s</span>
                    : <button type="button" onClick={handleRegister} style={{
                        background: "none", border: "none", color: "#e8b84b",
                        fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Resend OTP</button>
                  }
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
