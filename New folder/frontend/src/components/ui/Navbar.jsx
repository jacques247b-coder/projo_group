// ============================================================
// PROJO GROUP — Navigation Bar
// Logo: PROJO_LOGO.png | Colours: Gold on Amber Red
// ============================================================
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { CONTACT } from "../../utils/constants";
import toast from "react-hot-toast";

const G = "#e8b84b";
const RED = "#8B1A1A";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/");
    toast.success("Logged out. See you soon!");
  }

  const isActive = (path) => location.pathname === path;

  const linkStyle = (path) => ({
    fontSize: "13px", fontWeight: "600", cursor: "pointer", padding: "6px 0",
    color: isActive(path) ? G : "#b8a09a",
    borderBottom: isActive(path) ? `2px solid ${G}` : "2px solid transparent",
    textDecoration: "none", transition: "color .2s",
  });

  const passengerLinks = [
    { label: "Book Ride", path: "/book" },
{ label: "Shop", path: "/shop" },
    { label: "My Rides",  path: "/rides" },
    { label: "Wallet",    path: "/wallet" },
    { label: "Courier",   path: "/courier" },
  ];
  const driverLinks = [
    { label: "Dashboard", path: "/driver" },
    { label: "Earnings",  path: "/driver/earnings" },
    { label: "Wallet",    path: "/wallet" },
  ];
  const adminLinks = [
    { label: "Dashboard", path: "/admin" },
  ];

  const links =
    user?.role === "DRIVER" ? driverLinks :
    user?.role === "ADMIN"  ? adminLinks  :
    passengerLinks;

  const homeRoute =
    user?.role === "DRIVER" ? "/driver" :
    user?.role === "ADMIN"  ? "/admin"  : "/book";

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 999,
      height: "64px", display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 1.5rem",
      background: "rgba(13,5,5,0.96)",
      borderBottom: "1px solid rgba(232,184,75,0.18)",
      backdropFilter: "blur(16px)",
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* ── Brand / Logo ── */}
      <div
        onClick={() => navigate(user ? homeRoute : "/")}
        style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
      >
        <img
          src="/assets/logo/PROJO_LOGO.png"
          alt="PROJO GROUP Logo"
          style={{
            width: "42px", height: "42px",
            borderRadius: "50%",
            objectFit: "cover",
            background: "transparent",
            filter: "drop-shadow(0 0 8px rgba(232,184,75,0.45))",
            flexShrink: 0,
          }}
          onError={(e) => {
            // Fallback to gold coin if logo not found
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
        {/* Fallback coin (hidden by default) */}
        <div style={{
          display: "none", width: "42px", height: "42px", borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%,#f5d078,#e8b84b,#c49a2f,#9a7520)",
          alignItems: "center", justifyContent: "center",
          fontSize: "9px", fontWeight: "800", color: "#2a1a00",
          boxShadow: "0 0 12px rgba(232,184,75,0.4)", flexShrink: 0,
          fontFamily: "'Syne', sans-serif",
        }}>PROJO</div>

        <span style={{
          fontFamily: "'Syne', sans-serif", fontSize: "15px",
          fontWeight: "800", color: G, letterSpacing: "1.5px",
        }}>
          PROJO GROUP
        </span>
      </div>

      {/* ── Desktop nav links ── */}
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
        {links.map((l) => (
          <span key={l.path} style={linkStyle(l.path)} onClick={() => navigate(l.path)}>
            {l.label}
          </span>
        ))}
      </div>

      {/* ── Right side ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

        {/* Wallet balance */}
        {user?.wallet?.balanceZar !== undefined && (
          <div onClick={() => navigate("/wallet")} style={{
            background: "rgba(139,26,26,0.2)",
            border: "1px solid rgba(232,184,75,0.25)",
            borderRadius: "50px", padding: "5px 14px", cursor: "pointer",
            fontSize: "13px", fontWeight: "700", color: G,
          }}>
            R{(user.wallet.balanceZar || 0).toFixed(2)}
          </div>
        )}

        {/* User menu */}
        <div style={{ position: "relative" }}>
          <div
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: "rgba(139,26,26,0.2)",
              border: "1px solid rgba(232,184,75,0.2)",
              borderRadius: "50px", padding: "5px 14px 5px 5px", cursor: "pointer",
            }}
          >
            <div style={{
              width: "30px", height: "30px", borderRadius: "50%",
              background: `radial-gradient(circle at 35% 35%, #a82020, ${RED}, #6b1414)`,
              border: "2px solid rgba(232,184,75,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: "800", color: G,
            }}>
              {user?.name?.[0]?.toUpperCase() || "P"}
            </div>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#f5ede8" }}>
              {user?.name?.split(" ")[0] || "User"}
            </span>
            <span style={{ color: "#7a5a55", fontSize: "10px" }}>▾</span>
          </div>

          {menuOpen && (
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)",
              background: "#120808",
              border: "1px solid rgba(232,184,75,0.2)",
              borderRadius: "14px", padding: "8px", minWidth: "200px", zIndex: 100,
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            }}>
              <div style={{
                padding: "10px 14px",
                borderBottom: "1px solid rgba(232,184,75,0.1)",
                marginBottom: "4px",
              }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#f5ede8" }}>{user?.name}</div>
                <div style={{ fontSize: "11px", color: "#7a5a55", marginTop: "2px" }}>{user?.phone}</div>
                <div style={{
                  fontSize: "10px", color: G, fontWeight: "700", marginTop: "4px",
                  textTransform: "uppercase", letterSpacing: "0.5px",
                }}>{user?.role}</div>
              </div>

              <div
                onClick={() => { window.open(CONTACT.whatsappLink, "_blank"); setMenuOpen(false); }}
                style={{
                  padding: "9px 14px", fontSize: "13px", color: "#b8a09a",
                  cursor: "pointer", borderRadius: "8px", transition: "background .15s",
                }}
                onMouseOver={e => e.target.style.background = "rgba(139,26,26,0.2)"}
                onMouseOut={e => e.target.style.background = "transparent"}
              >
                💬 WhatsApp Support
              </div>

              <div
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                style={{
                  padding: "9px 14px", fontSize: "13px", color: "#f87171",
                  cursor: "pointer", borderRadius: "8px", marginTop: "2px",
                }}
                onMouseOver={e => e.target.style.background = "rgba(248,113,113,0.08)"}
                onMouseOut={e => e.target.style.background = "transparent"}
              >
                ← Log Out
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
