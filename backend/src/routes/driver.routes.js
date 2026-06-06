// ============================================================
// PROJO GROUP — Driver Routes
// Online/offline toggle, ride accept, earnings, location
// ============================================================
const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth.middleware");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET /api/drivers/me — driver profile + stats
router.get("/me", authenticate, requireRole("DRIVER"), async (req, res) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { userId: req.user.id },
      include: { vehicles: true, user: { select: { name: true, phone: true, avatarUrl: true } } },
    });
    if (!driver) return res.status(404).json({ error: "Driver profile not found" });
    res.json({ driver });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/drivers/status — go online / offline
router.post("/status", authenticate, requireRole("DRIVER"), async (req, res) => {
  const { status } = req.body;
  const valid = ["ONLINE", "OFFLINE", "ON_RIDE", "ON_DELIVERY"];
  if (!valid.includes(status)) return res.status(400).json({ error: "Invalid status" });
  try {
    const driver = await prisma.driver.update({
      where: { userId: req.user.id },
      data: { status },
    });
    res.json({ driver });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/drivers/earnings — daily/weekly ZAR earnings
router.get("/earnings", authenticate, requireRole("DRIVER"), async (req, res) => {
  const { period = "week" } = req.query;
  try {
    const driver = await prisma.driver.findUnique({ where: { userId: req.user.id } });
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    const since = new Date();
    if (period === "today") since.setHours(0, 0, 0, 0);
    else if (period === "week") since.setDate(since.getDate() - 7);
    else if (period === "month") since.setDate(since.getDate() - 30);

    const rides = await prisma.ride.findMany({
      where: { driverId: driver.id, status: "COMPLETED", rideCompletedAt: { gte: since } },
      select: { totalFare: true, driverPayout: true, rideCompletedAt: true, zone: true },
      orderBy: { rideCompletedAt: "desc" },
    });

    const totalEarned = rides.reduce((sum, r) => sum + (r.driverPayout || 0), 0);
    const totalRides = rides.length;
    const avgPerRide = totalRides > 0 ? totalEarned / totalRides : 0;

    res.json({ rides, totalEarned: parseFloat(totalEarned.toFixed(2)), totalRides, avgPerRide: parseFloat(avgPerRide.toFixed(2)), period });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/drivers/pending-rides — nearby ride requests
router.get("/pending-rides", authenticate, requireRole("DRIVER"), async (req, res) => {
  try {
    const rides = await prisma.ride.findMany({
      where: { status: "REQUESTED", driverId: null },
      include: { passenger: { select: { name: true, phone: true } } },
      orderBy: { createdAt: "asc" },
      take: 10,
    });
    res.json({ rides });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/drivers/register — register as driver (submit docs)
router.post("/register", authenticate, async (req, res) => {
  const { idNumber, licenseNumber, pdpNumber } = req.body;
  try {
    const existing = await prisma.driver.findUnique({ where: { userId: req.user.id } });
    if (existing) return res.status(400).json({ error: "Driver profile already exists" });

    const driver = await prisma.driver.create({
      data: { userId: req.user.id, idNumber, licenseNumber, pdpNumber,
        approvalStatus: "PENDING", status: "OFFLINE" },
    });
    await prisma.user.update({ where: { id: req.user.id }, data: { role: "DRIVER" } });
    res.status(201).json({ driver, message: "Driver application submitted. Pending approval." });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
