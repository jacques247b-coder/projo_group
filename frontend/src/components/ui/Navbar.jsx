// PROJO GROUP — Top Navigation Bar (Mobile Fixed)
// Desktop: horizontal links | Mobile: hamburger menu
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const GOLD     = "#e8b84b";
const TAKE_APP = "https://take.app/projogroup";
const BG_NAV   = "rgba(10,10,10,0.97)";
const BORDER   = "rgba(232,184,75,0.15)";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname.startsWith(path);

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    navigate("/");
    toast.success("Logged out");
  }

  const close = () => setMenuOpen(false);

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        height: "64px", background: BG_NAV,
        borderBottom: `1px solid ${BORDER}`,
        backdropFilter: "blur(16px)",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 1rem",
        fontFamily: "'DM Sans',sans-serif",
      }}>

        {/* Brand */}
        <Link to="/" onClick={close} style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", flexShrink: 0 }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%,#f5d078,#e8b84b,#c49a2f,#9a7520)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "9px", fontWeight: "800", color: "#2a1a00",
            fontFamily: "'Syne',sans-serif", letterSpacing: "0.5px",
            boxShadow: "0 0 12px rgba(232,184,75,0.3)", border: "2px solid #c49a2f",
            flexShrink: 0,
          }}>PROJO</div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px",
            fontWeight: "800", color: GOLD, letterSpacing: "1.5px" }}>
            PROJO GROUP
          </span>
        </Link>

        {/* Desktop links — hidden on mobile */}
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}
          className="nav-desktop-links">
          {[
            { to: "/book", label: "Book Ride" },
            { to: "/courier", label: "Courier" },
          ].map(({ to, label }) => (
            <Link key={to} to={to} style={{
              color: isActive(to) ? GOLD : "#a8a49e",
              fontWeight: isActive(to) ? "700" : "500",
              textDecoration: "none", fontSize: "14px",
              borderBottom: isActive(to) ? `2px solid ${GOLD}` : "2px solid transparent",
              paddingBottom: "2px",
            }}>{label}</Link>
          ))}
          <a href={TAKE_APP} target="_blank" rel="noopener noreferrer" style={{
            color: "#a8a49e", fontWeight: "500", textDecoration: "none", fontSize: "14px",
            display: "flex", alignItems: "center", gap: "3px",
          }}>Shop <span style={{ fontSize: "10px" }}>↗</span></a>
          {user?.role === "DRIVER" && (
            <Link to="/driver" style={{ color: isActive("/driver") ? GOLD : "#a8a49e", textDecoration: "none", fontSize: "14px" }}>Driver</Link>
          )}
          {user?.role === "ADMIN" && (
            <Link to="/admin" style={{ color: isActive("/admin") ? GOLD : "#a8a49e", textDecoration: "none", fontSize: "14px" }}>Admin</Link>
          )}
        </div>

        {/* Right side */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* Wallet — desktop only */}
          {user && (
            <Link to="/wallet" className="nav-desktop-links" style={{
              background: "rgba(232,184,75,0.1)", border: "1px solid rgba(232,184,75,0.2)",
              borderRadius: "8px", padding: "6px 12px",
              color: GOLD, fontSize: "13px", fontWeight: "700", textDecoration: "none",
            }}>💰 Wallet</Link>
          )}

          {/* Hamburger button — always visible */}
          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            background: menuOpen ? "rgba(232,184,75,0.1)" : "transparent",
            border: `1px solid ${menuOpen ? GOLD : "rgba(232,184,75,0.2)"}`,
            borderRadius: "8px", width: "40px", height: "40px",
            cursor: "pointer", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "5px",
            transition: "all .2s",
          }}>
            <span style={{ width: "18px", height: "2px", background: menuOpen ? GOLD : "#a8a49e", borderRadius: "2px", transition: "all .2s", transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
            <span style={{ width: "18px", height: "2px", background: menuOpen ? GOLD : "#a8a49e", borderRadius: "2px", transition: "all .2s", opacity: menuOpen ? 0 : 1 }} />
            <span style={{ width: "18px", height: "2px", background: menuOpen ? GOLD : "#a8a49e", borderRadius: "2px", transition: "all .2s", transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
          </button>
        </div>
      </nav>

      {/* Full menu drawer */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div onClick={close} style={{
            position: "fixed", inset: 0, zIndex: 998,
            background: "rgba(0,0,0,0.6)",
          }} />

          {/* Drawer */}
          <div style={{
            position: "fixed", top: "64px", right: 0, bottom: 0,
            width: "280px", zIndex: 999,
            background: "#0d0505", borderLeft: `1px solid ${BORDER}`,
            padding: "1rem", overflowY: "auto",
            fontFamily: "'DM Sans',sans-serif",
            boxShadow: "-8px 0 32px rgba(0,0,0,0.6)",
          }}>

            {/* User info */}
            {user && (
              <div style={{ padding: "12px", background: "#120808",
                borderRadius: "12px", marginBottom: "1rem",
                border: "1px solid rgba(232,184,75,0.1)" }}>
                <div style={{ fontWeight: "700", color: "#f0ede8", fontSize: "15px" }}>{user.name}</div>
                <div style={{ fontSize: "12px", color: "#6b6760", marginTop: "2px" }}>{user.phone}</div>
                <div style={{ fontSize: "11px", color: GOLD, marginTop: "4px",
                  textTransform: "uppercase", letterSpacing: "0.5px",
                  fontWeight: "700" }}>{user.role}</div>
              </div>
            )}

            {/* Nav links */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {[
                { to: "/book",    label: "🚗 Book a Ride",     show: true },
                { to: "/courier", label: "📦 Courier",          show: true },
                { to: "/wallet",  label: "💰 Wallet",           show: !!user },
                { to: "/rides",   label: "🕐 Ride History",     show: !!user },
                { to: "/driver",  label: "🚘 Driver Dashboard", show: user?.role === "DRIVER" },
                { to: "/admin",   label: "⚙️ Admin Panel",      show: user?.role === "ADMIN" },
              ].filter(i => i.show).map(item => (
                <Link key={item.to} to={item.to} onClick={close} style={{
                  display: "block", padding: "13px 14px",
                  color: isActive(item.to) ? GOLD : "#a8a49e",
                  textDecoration: "none", fontSize: "15px",
                  fontWeight: isActive(item.to) ? "700" : "500",
                  borderRadius: "10px",
                  background: isActive(item.to) ? "rgba(232,184,75,0.08)" : "transparent",
                  borderLeft: isActive(item.to) ? `3px solid ${GOLD}` : "3px solid transparent",
                  transition: "all .15s",
                }}>
                  {item.label}
                </Link>
              ))}

              {/* External shop */}
              <a href={TAKE_APP} target="_blank" rel="noopener noreferrer"
                onClick={close} style={{
                  display: "block", padding: "13px 14px",
                  color: "#a8a49e", textDecoration: "none", fontSize: "15px",
                  borderRadius: "10px", borderLeft: "3px solid transparent",
                }}>
                🛍️ Online Shop ↗
              </a>
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: "rgba(232,184,75,0.1)", margin: "12px 0" }} />

            {/* Sign in / out */}
            {user ? (
              <button onClick={handleLogout} style={{
                width: "100%", background: "transparent",
                border: "1px solid rgba(248,113,113,0.3)",
                color: "#f87171", fontSize: "14px", padding: "12px 14px",
                textAlign: "left", cursor: "pointer", borderRadius: "10px",
                fontFamily: "'DM Sans',sans-serif", fontWeight: "600",
              }}>🚪 Sign Out</button>
            ) : (
              <Link to="/login" onClick={close} style={{
                display: "block", background: GOLD, color: "#0a0a0a",
                borderRadius: "10px", padding: "13px 14px",
                fontSize: "15px", fontWeight: "700", textDecoration: "none",
                textAlign: "center",
              }}>Sign In</Link>
            )}
          </div>
        </>
      )}

      {/* Spacer */}
      <div style={{ height: "64px" }} />

      {/* Hide desktop links on mobile via style tag */}
      <style>{`
        @media (max-width: 640px) {
          .nav-desktop-links { display: none !important; }
        }
      `}</style>
    </>
  );
}
