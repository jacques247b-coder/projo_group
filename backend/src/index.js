// ============================================================
// PROJO GROUP — Backend Server Entry Point
// Node.js + Express + Socket.io
// Default map center: Rustenburg (-25.6670, 27.2420)
// ============================================================

require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Routes
const authRoutes = require("./routes/auth.routes");
const rideRoutes = require("./routes/ride.routes");
const driverRoutes = require("./routes/driver.routes");
const deliveryRoutes = require("./routes/delivery.routes");
const shopRoutes = require("./routes/shop.routes");
const walletRoutes = require("./routes/wallet.routes");
const adminRoutes = require("./routes/admin.routes");
const userRoutes = require("./routes/user.routes");

// Socket handlers
const { initializeSocketHandlers } = require("./sockets/socket.handlers");

const app = express();
const server = http.createServer(app);

// ─── Socket.io setup ─────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io available throughout the app
app.set("io", io);

// ─── Middleware ───────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ─── Health check ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: "PROJO GROUP API",
    tagline: "Rustenburg's Own. Ride. Shop. Deliver.",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    rustenburgCenter: { lat: -25.667, lng: 27.242 },
  });
});

// ─── API Routes ───────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/admin", adminRoutes);

// ─── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found", app: "PROJO GROUP" });
});

// ─── Global error handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("PROJO GROUP API Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ─── Socket.io handlers ──────────────────────────────────────
initializeSocketHandlers(io);

// ─── Start server ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("╔════════════════════════════════════════╗");
  console.log("║         PROJO GROUP API SERVER         ║");
  console.log("║  Rustenburg's Own. Ride. Shop. Deliver ║");
  console.log(`║  Port: ${PORT}                              ║`);
  console.log("║  Center: Rustenburg, North West ZA     ║");
  console.log("╚════════════════════════════════════════╝");
});

module.exports = { app, io };
