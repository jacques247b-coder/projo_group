// PROJO GROUP — Top Navigation Bar (Mobile Fixed v3 - Shop link fixed)
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const GOLD     = "#e8b84b";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const isActive = (path) => location.pathname.startsWith(path);

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    navigate("/");
    toast.success("Logged out");
  }

  const linkStyle = (to) => ({
    color: isActive(to) ? GOLD : "#a8a49e",
    fontWeight: isActive(to) ? "700" : "500",
    textDecoration: "none", fontSize: "14px",
    borderBottom: isActive(to) ? `2px solid ${GOLD}` : "2px solid transparent",
    paddingBottom: "2px",
  });

  const drawerLink = (to, label) => (
    <Link key={to} to={to} style={{
      display: "block", padding: "14px 16px",
      color: isActive(to) ? GOLD : "#c8b8b0",
      textDecoration: "none", fontSize: "16px",
      fontWeight: isActive(to) ? "700" : "500",
      borderRadius: "10px",
      background: isActive(to) ? "rgba(232,184,75,0.08)" : "transparent",
      borderLeft: isActive(to) ? `3px solid ${GOLD}` : "3px solid transparent",
    }}>{label}</Link>
  );

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        height: "64px", background: "rgba(10,10,10,0.97)",
        borderBottom: "1px solid rgba(232,184,75,0.15)",
        backdropFilter: "blur(16px)",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 1rem",
        fontFamily: "'DM Sans',sans-serif",
      }}>

        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", flexShrink: 0 }}>
          <img src="/assets/logo/PROJO_LOGO.png" alt="PROJO" style={{
            width: "42px", height: "42px", borderRadius: "50%", flexShrink: 0,
            objectFit: "cover",
            boxShadow: "0 0 12px rgba(232,184,75,0.3)", border: "2px solid #c49a2f",
          }} />
          <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px",
            fontWeight: "800", color: GOLD, letterSpacing: "1px" }}>
            PROJO GROUP
          </span>
        </Link>

        {!isMobile && (
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            <Link to="/book"    style={linkStyle("/book")}>Book Ride</Link>
            <Link to="/courier" style={linkStyle("/courier")}>Courier</Link>
            <Link to="/shop"    style={linkStyle("/shop")}>Services</Link>
            <Link to="/products" style={linkStyle("/products")}>Products</Link>
            <Link to="/sports" style={linkStyle("/sports")}>🏆 Sports</Link>
            <Link to="/entertainment" style={linkStyle("/entertainment")}>🎬 Entertainment</Link>
            <Link to="/travel" style={linkStyle("/travel")}>✈️ Travel</Link>
            {user?.role === "DRIVER" && <Link to="/driver" style={linkStyle("/driver")}>Driver</Link>}
            {user?.role === "ADMIN"  && <Link to="/admin"  style={linkStyle("/admin")}>Admin</Link>}
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {user && !isMobile && (
            <Link to="/wallet" style={{
              background: "rgba(232,184,75,0.1)", border: "1px solid rgba(232,184,75,0.2)",
              borderRadius: "8px", padding: "6px 12px",
              color: GOLD, fontSize: "13px", fontWeight: "700", textDecoration: "none",
            }}>💰 Wallet</Link>
          )}

          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            background: menuOpen ? "rgba(232,184,75,0.1)" : "transparent",
            border: `1px solid ${menuOpen ? GOLD : "rgba(232,184,75,0.25)"}`,
            borderRadius: "8px", width: "42px", height: "42px",
            cursor: "pointer", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "5px",
            flexShrink: 0,
          }}>
            <span style={{ width: "18px", height: "2px", background: menuOpen ? GOLD : "#a8a49e", borderRadius: "2px", display: "block", transition: "all .2s", transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
            <span style={{ width: "18px", height: "2px", background: menuOpen ? GOLD : "#a8a49e", borderRadius: "2px", display: "block", transition: "all .2s", opacity: menuOpen ? 0 : 1 }} />
            <span style={{ width: "18px", height: "2px", background: menuOpen ? GOLD : "#a8a49e", borderRadius: "2px", display: "block", transition: "all .2s", transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{
            position: "fixed", inset: 0, zIndex: 998,
            background: "rgba(0,0,0,0.7)",
          }} />
          <div style={{
            position: "fixed", top: "64px", right: 0, bottom: 0,
            width: "280px", zIndex: 999,
            background: "#0d0505", borderLeft: "1px solid rgba(232,184,75,0.15)",
            padding: "1rem", overflowY: "auto",
            fontFamily: "'DM Sans',sans-serif",
            boxShadow: "-8px 0 32px rgba(0,0,0,0.7)",
          }}>

            {user && (
              <div style={{ padding: "12px 14px", background: "#120808",
                borderRadius: "12px", marginBottom: "1rem",
                border: "1px solid rgba(232,184,75,0.1)" }}>
                <div style={{ fontWeight: "700", color: "#f0ede8", fontSize: "15px" }}>{user.name}</div>
                <div style={{ fontSize: "12px", color: "#6b6760", marginTop: "2px" }}>{user.phone}</div>
                <div style={{ fontSize: "11px", color: GOLD, marginTop: "4px",
                  textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "700" }}>
                  {user.role}
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {drawerLink("/book", "🚗 Book a Ride")}
              {drawerLink("/courier", "📦 Courier")}
              {drawerLink("/shop", "🛠️ Services")}
              {drawerLink("/products", "🛍️ Products Shop")}
              {user && drawerLink("/wallet", "💰 Wallet")}
              {user && drawerLink("/rides", "🕐 Ride History")}
              {user?.role === "DRIVER" && drawerLink("/driver", "🚘 Driver Dashboard")}
              {user?.role === "ADMIN"  && drawerLink("/admin",  "⚙️ Admin Panel")}
            </div>

            <div style={{ height: "1px", background: "rgba(232,184,75,0.1)", margin: "12px 0" }} />

            {user ? (
              <button onClick={handleLogout} style={{
                width: "100%", background: "transparent",
                border: "1px solid rgba(248,113,113,0.3)",
                color: "#f87171", fontSize: "15px", padding: "13px 16px",
                textAlign: "left", cursor: "pointer", borderRadius: "10px",
                fontFamily: "'DM Sans',sans-serif", fontWeight: "600",
              }}>🚪 Sign Out</button>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} style={{
                display: "block", background: GOLD, color: "#0a0a0a",
                borderRadius: "10px", padding: "14px 16px",
                fontSize: "15px", fontWeight: "700", textDecoration: "none",
                textAlign: "center",
              }}>Sign In</Link>
            )}
          </div>
        </>
      )}

      <div style={{ height: "64px" }} />
    </>
  );
}
