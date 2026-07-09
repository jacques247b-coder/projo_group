// ============================================================
// PROJO GROUP — React App Entry Point
// Added ErrorBoundary to catch and display crashes on mobile
// ============================================================
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error: error.message || "Unknown error" };
  }
  componentDidCatch(error, info) {
    console.error("[PROJO ERROR]", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh", background: "#0d0505",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "2rem", fontFamily: "monospace", color: "#e8b84b",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "32px", marginBottom: "1rem" }}>⚠️</div>
          <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "1rem" }}>
            PROJO GROUP — App Error
          </div>
          <div style={{
            background: "#1c0f0f", border: "1px solid rgba(232,184,75,0.2)",
            borderRadius: "10px", padding: "1rem", fontSize: "12px",
            color: "#f87171", maxWidth: "400px", wordBreak: "break-word",
          }}>
            {this.state.error}
          </div>
          <button onClick={() => window.location.reload()} style={{
            marginTop: "1.5rem", background: "#e8b84b", color: "#0d0505",
            border: "none", borderRadius: "8px", padding: "10px 24px",
            fontWeight: "700", cursor: "pointer", fontSize: "14px",
          }}>Reload App</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// ── Service Worker Auto-Update ──────────────────────────────
// Registers the SW and automatically reloads when a new version is deployed.
// IMPORTANT: guarded to only ever auto-reload ONCE per browser session — 
// without this, if the SW looks "updated" on every single load (which can
// happen from caching quirks, especially right after manually clearing
// site data or bumping the version repeatedly), this becomes an infinite
// reload loop with the page never actually finishing loading.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((registration) => {
      console.log("[PROJO SW] Registered:", registration.scope);

      // Check for updates every 60 seconds
      setInterval(() => {
        registration.update();
      }, 60 * 1000);

      // When a new SW is found and installed, reload — but only once per
      // session, so a caching quirk can't trap the user in a reload loop.
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            if (sessionStorage.getItem("projo_sw_auto_reloaded")) {
              console.log("[PROJO SW] New version detected again, but already auto-reloaded once this session — not reloading again to avoid a loop.");
              return;
            }
            console.log("[PROJO SW] New version available — reloading...");
            sessionStorage.setItem("projo_sw_auto_reloaded", "true");
            window.location.reload();
          }
        });
      });

    }).catch((err) => {
      console.error("[PROJO SW] Registration failed:", err);
    });

    // Also reload if the SW controller changes (another tab updated it) —
    // same one-per-session guard applies here too.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (sessionStorage.getItem("projo_sw_auto_reloaded")) return;
      sessionStorage.setItem("projo_sw_auto_reloaded", "true");
      window.location.reload();
    });
  });
}
