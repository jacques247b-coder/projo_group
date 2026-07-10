// ============================================================
// PROJO GROUP — Driver Controller
// Handles: profile, status, earnings, pending rides, register
// NOTE: Uses User.role = "DRIVER" — no separate Driver table needed
// ============================================================
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET /api/drivers/me
exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { wallet: true },
    });
    if (!user) return res.status(404).json({ error: "Driver not found" });
    const { passwordHash, otpCode, otpExpiresAt, ...safe } = user;
    res.json({ driver: safe });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// POST /api/drivers/status — go ONLINE / OFFLINE
exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const valid = ["ONLINE", "OFFLINE", "ON_RIDE", "ON_DELIVERY"];
  if (!valid.includes(status)) return res.status(400).json({ error: "Invalid status" });
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { driverStatus: status },
    });
    res.json({ status, message: `Status updated to ${status}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// GET /api/drivers/earnings?period=today|week|month
exports.getEarnings = async (req, res) => {
  const { period = "week" } = req.query;
  try {
    const since = new Date();
    if (period === "today")      since.setHours(0, 0, 0, 0);
    else if (period === "week")  since.setDate(since.getDate() - 7);
    else if (period === "month") since.setDate(since.getDate() - 30);

    // Rides where this user was the driver
    const rides = await prisma.ride.findMany({
      where: {
        driverId: req.user.id,
        status: "COMPLETED",
        updatedAt: { gte: since },
      },
      select: {
        id: true,
        totalFare: true,
        driverPayout: true,
        updatedAt: true,
        zone: true,
        pickupAddress: true,
        dropoffAddress: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const totalEarned  = rides.reduce((sum, r) => sum + (r.driverPayout || 0), 0);
    const totalRides   = rides.length;
    const avgPerRide   = totalRides > 0 ? totalEarned / totalRides : 0;

    // Map updatedAt → rideCompletedAt so frontend doesn't break
    const mappedRides = rides.map(r => ({
      ...r,
      rideCompletedAt: r.updatedAt,
    }));

    res.json({
      rides: mappedRides,
      totalEarned:  parseFloat(totalEarned.toFixed(2)),
      totalEarnings: parseFloat(totalEarned.toFixed(2)), // alias for dashboard
      totalRides,
      ridesCompleted: totalRides,                         // alias for dashboard
      avgPerRide:   parseFloat(avgPerRide.toFixed(2)),
      period,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// GET /api/drivers/pending-rides — unassigned ride requests
exports.getPendingRides = async (req, res) => {
  try {
    const rides = await prisma.ride.findMany({
      where: { status: "REQUESTED", driverId: null },
      orderBy: { createdAt: "asc" },
      take: 10,
    });
    res.json({ rides });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// POST /api/drivers/register — submit driver application
exports.register = async (req, res) => {
  const { idNumber, licenseNumber, pdpNumber } = req.body;
  if (!idNumber || !licenseNumber) {
    return res.status(400).json({ error: "ID number and license number are required" });
  }
  try {
    // Update user role to DRIVER and store doc numbers
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        role: "DRIVER",
        // Store doc info in a JSON field if your schema supports it,
        // or just update the role — docs can be collected via WhatsApp/admin
      },
    });
    res.status(201).json({
      message: "Driver application submitted. Pending admin approval.",
      user: { id: user.id, name: user.name, role: user.role },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// POST /api/driver/rides/:id/accept
exports.acceptRide = async (req, res) => {
  try {
    const ride = await prisma.ride.update({
      where: { id: req.params.id },
      data: { driverId: req.user.id, status: "DRIVER_ASSIGNED" },
    });
    // Notify passenger via socket
    const io = req.app.get("io");
    if (io) {
      io.to(`passenger:${ride.passengerId}`).emit("ride:driver_assigned", {
        rideId: ride.id, driverName: req.user.name, driverPhone: req.user.phone,
      });
    }
    res.json({ message: "Ride accepted", ride });
  } catch (err) {
    res.status(500).json({ error: "Could not accept ride" });
  }
};

// POST /api/driver/location — broadcast driver location to passengers
exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng, rideId } = req.body;
    const io = req.app.get("io");
    if (io && rideId) {
      // Find the ride to get passenger ID
      const ride = await prisma.ride.findUnique({ where: { id: rideId } });
      if (ride) {
        io.to(`passenger:${ride.passengerId}`).emit("driver:location", {
          lat, lng, driverId: req.user.id, rideId,
        });
      }
    }
    res.json({ ok: true });
  } catch {
    res.json({ ok: false });
  }
};

// POST /api/driver/shift-end — submit cash owed at shift end
exports.shiftEnd = async (req, res) => {
  try {
    const { cashOwed, totalEarnings, ridesCount } = req.body;
    console.log(`[PROJO Driver] Shift end — ${req.user.name}: earned R${totalEarnings}, owes R${cashOwed} cash (${ridesCount} rides)`);
    // Could save to a ShiftRecord table in future
    res.json({ message: "Shift recorded", cashOwed, totalEarnings });
  } catch {
    res.status(500).json({ error: "Could not record shift" });
  }
};
