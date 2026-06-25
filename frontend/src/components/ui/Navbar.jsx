// PROJO GROUP — Top Navigation Bar
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const GOLD     = "#e8b84b";
const TAKE_APP = "https://take.app/projogroup";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname.startsWith(path);

  async function handleLogout() {
    await logout();
    navigate("/");
    toast.success("Logged out");
  }

  const navLink = (to, label) => (
    <Link to={to} style={{
      color: isActive(to) ? GOLD : "#a8a49e",
      fontWeight: isActive(to) ? "700" : "500",
      textDecoration: "none", fontSize: "14px",
      borderBottom: isActive(to) ? `2px solid ${GOLD}` : "2px solid transparent",
      paddingBottom: "2px", transition: "all .2s",
    }}>{label}</Link>
  );

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        height: "64px", background: "rgba(10,10,10,0.95)",
        borderBottom: "1px solid rgba(232,184,75,0.15)",
        backdropFilter: "blur(16px)",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 1.5rem",
        fontFamily: "'DM Sans',sans-serif",
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
            background: "radial-gradient(circle at 35% 35%,#f5d078,#e8b84b,#c49a2f,#9a7520)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "9px", fontWeight: "800", color: "#2a1a00",
            fontFamily: "'Syne',sans-serif", letterSpacing: "0.5px",
            boxShadow: "0 0 12px rgba(232,184,75,0.3)", border: "2px solid #c49a2f",
          }}>PROJO</div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px",
            fontWeight: "800", color: GOLD, letterSpacing: "1.5px" }}>PROJO GROUP</span>
        </Link>

        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          {navLink("/book", "Book Ride")}
          <a href={TAKE_APP} target="_blank" rel="noopener noreferrer" style={{
            color: "#a8a49e", fontWeight: "500", textDecoration: "none", fontSize: "14px",
            borderBottom: "2px solid transparent", paddingBottom: "2px", transition: "color .2s",
            display: "flex", alignItems: "center", gap: "3px",
          }}
          onMouseOver={e => e.currentTarget.style.color = GOLD}
          onMouseOut={e => e.currentTarget.style.color = "#a8a49e"}>
            Shop <span style={{ fontSize: "10px", opacity: 0.6 }}>↗</span>
          </a>
          {navLink("/courier", "Courier")}
          {user?.role === "DRIVER" && navLink("/driver", "Driver Dashboard")}
          {user?.role === "ADMIN"  && navLink("/admin",  "Admin")}
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {user ? (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Link to="/wallet" style={{
                background: "rgba(232,184,75,0.1)", border: "1px solid rgba(232,184,75,0.2)",
                borderRadius: "8px", padding: "6px 12px",
                color: GOLD, fontSize: "13px", fontWeight: "700", textDecoration: "none",
              }}>💰 Wallet</Link>
              <div onClick={() => setMenuOpen(!menuOpen)} style={{
                width: "36px", height: "36px", borderRadius: "50%", background: GOLD,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontWeight: "800", color: "#0a0a0a", fontSize: "13px",
                fontFamily: "'Syne',sans-serif",
              }}>{user.name?.[0]?.toUpperCase() || "U"}</div>
            </div>
          ) : (
            <Link to="/login" style={{
              background: GOLD, color: "#0a0a0a", borderRadius: "8px",
              padding: "9px 20px", fontSize: "13px", fontWeight: "700", textDecoration: "none",
            }}>Sign In</Link>
          )}
        </div>
      </nav>

      {menuOpen && user && (
        <div onClick={() => setMenuOpen(false)} style={{
          position: "fixed", top: "64px", right: "1.5rem", zIndex: 999,
          background: "#111111", border: "1px solid rgba(232,184,75,0.2)",
          borderRadius: "12px", padding: "8px", minWidth: "200px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)", fontFamily: "'DM Sans',sans-serif",
        }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(232,184,75,0.1)", marginBottom: "6px" }}>
            <div style={{ fontWeight: "700", color: "#f0ede8", fontSize: "14px" }}>{user.name}</div>
            <div style={{ fontSize: "12px", color: "#6b6760" }}>{user.phone}</div>
            <div style={{ fontSize: "11px", color: GOLD, marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{user.role}</div>
          </div>
          {[
            { to: "/rides",   label: "🚗 Ride History" },
            { to: "/wallet",  label: "💰 Wallet" },
            { to: "/courier", label: "📦 Courier" },
          ].map(item => (
            <Link key={item.to} to={item.to} style={{
              display: "block", padding: "9px 12px", color: "#a8a49e",
              textDecoration: "none", fontSize: "13px", borderRadius: "8px",
            }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(232,184,75,0.08)"; e.currentTarget.style.color = GOLD; }}
            onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a8a49e"; }}>
              {item.label}
            </Link>
          ))}
          <a href={TAKE_APP} target="_blank" rel="noopener noreferrer" style={{
            display: "block", padding: "9px 12px", color: "#a8a49e",
            textDecoration: "none", fontSize: "13px", borderRadius: "8px",
          }}
          onMouseOver={e => { e.currentTarget.style.background = "rgba(232,184,75,0.08)"; e.currentTarget.style.color = GOLD; }}
          onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a8a49e"; }}>
            🛍️ Online Shop ↗
          </a>
          <button onClick={handleLogout} style={{
            width: "100%", background: "transparent", border: "none", color: "#f87171",
            fontSize: "13px", padding: "9px 12px", textAlign: "left", cursor: "pointer",
            borderRadius: "8px", fontFamily: "'DM Sans',sans-serif",
          }}>🚪 Sign Out</button>
        </div>
      )}
      <div style={{ height: "64px" }} />
    </>
  );
}
