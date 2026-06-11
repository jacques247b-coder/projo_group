// ============================================================
// PROJO GROUP — Backend Server
// ============================================================
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || "*", methods: ["GET", "POST"], credentials: true },
});
app.set("io", io);

// Trust proxy — required for Render deployment
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", app: "PROJO GROUP API", version: "1.0.0" });
});

// Routes
app.use("/api/auth",       require("./routes/auth.routes"));
app.use("/api/rides",      require("./routes/ride.routes"));
app.use("/api/wallet",     require("./routes/wallet.routes"));
app.use("/api/deliveries", require("./routes/delivery.routes"));
app.use("/api/shop",       require("./routes/shop.routes"));

// 404
app.use((req, res) => res.status(404).json({ error: "Route not found", app: "PROJO GROUP" }));

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// Socket
io.on("connection", (socket) => {
  socket.on("driver:location_update", ({ lat, lng }) => {
    io.emit("driver:location", { lat, lng, timestamp: new Date().toISOString() });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("╔════════════════════════════════════════╗");
  console.log("║         PROJO GROUP API SERVER         ║");
  console.log("║  Rustenburg's Own. Ride. Shop. Deliver ║");
  console.log(`║  Port: ${PORT}                              ║`);
  console.log("╚════════════════════════════════════════╝");
});
