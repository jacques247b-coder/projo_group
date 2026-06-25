// ============================================================
// PROJO GROUP — React App Entry Point
// Fonts loaded via Google Fonts in index.html (no package needed)
// ============================================================
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<React.StrictMode><App /></React.StrictMode>);
