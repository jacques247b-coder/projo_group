// PROJO GROUP — Backend Server
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
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", app: "PROJO GROUP API", version: "1.0.0" });
});

app.use("/api/auth",       require("./routes/auth.routes"));
app.use("/api/rides",      require("./routes/ride.routes"));
app.use("/api/wallet",     require("./routes/wallet.routes"));
app.use("/api/deliveries", require("./routes/delivery.routes"));
app.use("/api/shop",       require("./routes/shop.routes"));
app.use("/api/admin",      require("./routes/admin.routes"));
app.use("/api/drivers",    require("./routes/driver.routes"));
app.use("/api/push",       require("./routes/push.routes"));
app.use("/api/promo",      require("./routes/promo.routes"));
app.use("/api/services",   require("./routes/service.routes")); // ← NEW

app.use((req, res) => res.status(404).json({ error: "Route not found", app: "PROJO GROUP" }));
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

io.on("connection", (socket) => {
  // Driver joins their room
  socket.on("driver:join", ({ driverId }) => {
    socket.join(`driver:${driverId}`);
    console.log(`[PROJO Socket] Driver ${driverId} joined`);
  });

  // Passenger joins their room for direct notifications
  socket.on("passenger:join", ({ passengerId }) => {
    socket.join(`passenger:${passengerId}`);
  });

  // Ride tracking room
  socket.on("ride:join", ({ rideId }) => {
    socket.join(`ride:${rideId}`);
  });

  // Driver location update — broadcast to ride room AND directly to passenger
  socket.on("driver:location_update", ({ lat, lng, rideId, passengerId, heading, driverId }) => {
    const payload = { lat, lng, heading, driverId, timestamp: new Date().toISOString() };
    if (rideId) {
      io.to(`ride:${rideId}`).emit("driver:location", payload);
    }
    if (passengerId) {
      io.to(`passenger:${passengerId}`).emit("driver:location", payload);
    }
  });

  // Driver accepted ride — notify passenger immediately with driver info
  socket.on("ride:accepted", ({ rideId, driverId, driverName, driverPhone }) => {
    io.to(`ride:${rideId}`).emit("ride:driver_assigned", { rideId, driverId, driverName, driverPhone });
    console.log(`[PROJO Socket] Driver ${driverName} accepted ride ${rideId}`);
  });

  // Ride status update from driver
  socket.on("ride:status_update", ({ rideId, status, driverComment }) => {
    io.to(`ride:${rideId}`).emit("ride:status_changed", { status, driverComment });
    console.log(`[PROJO Socket] Ride ${rideId} status: ${status}`);
  });

  // Driver online/offline
  socket.on("driver:online",  ({ driverId }) => {
    socket.join(`driver:${driverId}`);
    console.log(`[PROJO Socket] Driver ${driverId} ONLINE`);
    // Notify admin dashboard
    io.to("admin").emit("driver:status_changed", { driverId, status: "ONLINE" });
  });

  socket.on("driver:offline", ({ driverId }) => {
    console.log(`[PROJO Socket] Driver ${driverId} OFFLINE`);
    io.to("admin").emit("driver:status_changed", { driverId, status: "OFFLINE" });
  });

  socket.on("driver:toggle_status", ({ status }) => {
    console.log(`[PROJO Socket] Driver status: ${status}`);
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
