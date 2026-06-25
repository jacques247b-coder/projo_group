// ============================================================
// PROJO GROUP — Socket.io Real-Time Handlers
// Live driver location tracking + ride status updates
// Default map: Rustenburg (-25.6670, 27.2420)
// ============================================================

const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

// Track connected drivers: { driverId -> socketId }
const connectedDrivers = new Map();
// Track connected passengers: { userId -> socketId }
const connectedPassengers = new Map();

/**
 * Authenticate socket connection via JWT
 */
async function authenticateSocket(socket) {
  const token = socket.handshake.auth?.token;
  if (!token) throw new Error("No auth token");
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { driverProfile: true },
  });
  if (!user) throw new Error("User not found");
  return user;
}

function initializeSocketHandlers(io) {
  io.on("connection", async (socket) => {
    let currentUser = null;

    // ── AUTH ─────────────────────────────────────────────────
    try {
      currentUser = await authenticateSocket(socket);
      socket.userId = currentUser.id;
      socket.userRole = currentUser.role;

      if (currentUser.role === "DRIVER" && currentUser.driverProfile) {
        socket.driverId = currentUser.driverProfile.id;
        connectedDrivers.set(currentUser.driverProfile.id, socket.id);
        socket.join(`driver:${currentUser.driverProfile.id}`);
        console.log(`[PROJO] Driver connected: ${currentUser.name} (${currentUser.driverProfile.id})`);
      } else {
        connectedPassengers.set(currentUser.id, socket.id);
        socket.join(`user:${currentUser.id}`);
        console.log(`[PROJO] Passenger connected: ${currentUser.name}`);
      }

      socket.emit("connected", {
        message: "Connected to PROJO GROUP live tracking",
        userId: currentUser.id,
        role: currentUser.role,
      });
    } catch (err) {
      socket.emit("auth_error", { message: "Authentication failed" });
      socket.disconnect();
      return;
    }

    // ── DRIVER: Update live location ──────────────────────────
    // Drivers emit this every ~5 seconds while online
    socket.on("driver:location_update", async ({ lat, lng, heading }) => {
      if (socket.userRole !== "DRIVER" || !socket.driverId) return;

      try {
        // Save to DB
        await prisma.driver.update({
          where: { id: socket.driverId },
          data: {
            latitude: lat,
            longitude: lng,
            lastLocationUpdate: new Date(),
          },
        });

        // Find if driver has an active ride and notify passenger
        const activeRide = await prisma.ride.findFirst({
          where: {
            driverId: socket.driverId,
            status: { in: ["DRIVER_EN_ROUTE", "ARRIVED_AT_PICKUP", "IN_PROGRESS"] },
          },
          select: { id: true, passengerId: true },
        });

        if (activeRide) {
          // Emit to passenger's room
          io.to(`user:${activeRide.passengerId}`).emit("driver:location", {
            rideId: activeRide.id,
            lat,
            lng,
            heading: heading || 0,
            timestamp: new Date().toISOString(),
          });
        }

        // Emit to admin room for live map view
        io.to("admin:live_map").emit("driver:location", {
          driverId: socket.driverId,
          lat,
          lng,
          heading: heading || 0,
        });
      } catch (err) {
        console.error("[PROJO Socket] Location update error:", err);
      }
    });

    // ── DRIVER: Go online/offline ─────────────────────────────
    socket.on("driver:toggle_status", async ({ status }) => {
      if (socket.userRole !== "DRIVER") return;
      const validStatuses = ["ONLINE", "OFFLINE"];
      if (!validStatuses.includes(status)) return;

      try {
        await prisma.driver.update({
          where: { id: socket.driverId },
          data: { status },
        });
        socket.emit("driver:status_updated", { status });
        console.log(`[PROJO] Driver ${socket.driverId} → ${status}`);
      } catch (err) {
        console.error("[PROJO Socket] Status toggle error:", err);
      }
    });

    // ── PASSENGER: Track ride in real time ────────────────────
    socket.on("passenger:join_ride", ({ rideId }) => {
      socket.join(`ride:${rideId}`);
      console.log(`[PROJO] Passenger ${socket.userId} tracking ride ${rideId}`);
    });

    // ── RIDE: Status broadcast ────────────────────────────────
    // Called by backend after DB update to push to all parties
    socket.on("ride:status_update", async ({ rideId, status, data }) => {
      io.to(`ride:${rideId}`).emit("ride:status_changed", {
        rideId,
        status,
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // ── ADMIN: Join live map room ─────────────────────────────
    socket.on("admin:join_live_map", () => {
      if (socket.userRole !== "ADMIN") return;
      socket.join("admin:live_map");
      // Send current driver positions
      sendAllDriverPositions(socket);
    });

    // ── DISCONNECT ────────────────────────────────────────────
    socket.on("disconnect", async () => {
      if (socket.driverId) {
        connectedDrivers.delete(socket.driverId);
        // Mark driver offline if they disconnect unexpectedly
        try {
          await prisma.driver.update({
            where: { id: socket.driverId },
            data: { status: "OFFLINE" },
          });
        } catch (e) {}
        console.log(`[PROJO] Driver disconnected: ${socket.driverId}`);
      } else if (socket.userId) {
        connectedPassengers.delete(socket.userId);
      }
    });
  });

  console.log("[PROJO] Socket.io handlers initialized — Rustenburg live tracking ready");
}

/** Emit all current driver positions to a new admin socket */
async function sendAllDriverPositions(socket) {
  try {
    const drivers = await prisma.driver.findMany({
      where: {
        status: { in: ["ONLINE", "ON_RIDE", "ON_DELIVERY"] },
        latitude: { not: null },
      },
      select: {
        id: true,
        status: true,
        latitude: true,
        longitude: true,
        user: { select: { name: true } },
      },
    });

    socket.emit("admin:all_drivers", { drivers });
  } catch (err) {
    console.error("[PROJO Socket] Failed to send driver positions:", err);
  }
}

/** Utility: notify a passenger about their ride via Socket.io */
function notifyPassenger(io, passengerId, event, data) {
  io.to(`user:${passengerId}`).emit(event, data);
}

/** Utility: notify a driver about a new ride request */
function notifyDriver(io, driverId, event, data) {
  io.to(`driver:${driverId}`).emit(event, data);
}

module.exports = {
  initializeSocketHandlers,
  notifyPassenger,
  notifyDriver,
  connectedDrivers,
  connectedPassengers,
};
