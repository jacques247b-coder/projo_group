// ============================================================
// PROJO GROUP — Admin Routes
// Protected: ADMIN role only
// Live monitoring, driver approval, surge zone controls
// ============================================================
const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth.middleware");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const isAdmin = [authenticate, requireRole("ADMIN")];

// GET /api/admin/stats — dashboard numbers
router.get("/stats", ...isAdmin, async (req, res) => {
  try {
    const [totalUsers, totalDrivers, activeRides, todayRides] = await Promise.all([
      prisma.user.count({ where: { role: "PASSENGER" } }),
      prisma.driver.count(),
      prisma.ride.count({ where: { status: { in: ["DRIVER_ASSIGNED","DRIVER_EN_ROUTE","IN_PROGRESS"] } } }),
      prisma.ride.count({ where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) }, status: "COMPLETED" } }),
    ]);
    const todayRevenue = await prisma.ride.aggregate({
      where: { status: "COMPLETED", rideCompletedAt: { gte: new Date(new Date().setHours(0,0,0,0)) } },
      _sum: { projoCommission: true },
    });
    res.json({ totalUsers, totalDrivers, activeRides, todayRides,
      todayRevenue: todayRevenue._sum.projoCommission || 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/drivers — all drivers
router.get("/drivers", ...isAdmin, async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany({
      include: { user: { select: { name: true, phone: true, email: true } }, vehicles: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ drivers });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/admin/drivers/:id/approve
router.post("/drivers/:id/approve", ...isAdmin, async (req, res) => {
  try {
    const driver = await prisma.driver.update({
      where: { id: req.params.id },
      data: { approvalStatus: "APPROVED" },
    });
    await prisma.user.update({ where: { id: driver.userId }, data: { status: "ACTIVE" } });
    res.json({ driver, message: "Driver approved" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/admin/drivers/:id/reject
router.post("/drivers/:id/reject", ...isAdmin, async (req, res) => {
  const { note } = req.body;
  try {
    const driver = await prisma.driver.update({
      where: { id: req.params.id },
      data: { approvalStatus: "REJECTED", approvalNote: note || "Application rejected" },
    });
    res.json({ driver });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/surge-zones
router.get("/surge-zones", ...isAdmin, async (req, res) => {
  try {
    const zones = await prisma.surgeZone.findMany({ orderBy: { name: "asc" } });
    res.json({ zones });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/admin/surge-zones/:id
router.put("/surge-zones/:id", ...isAdmin, async (req, res) => {
  const { multiplier, isActive } = req.body;
  try {
    const zone = await prisma.surgeZone.update({
      where: { id: req.params.id },
      data: { ...(multiplier !== undefined && { multiplier }), ...(isActive !== undefined && { isActive }) },
    });
    res.json({ zone });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/users
router.get("/users", ...isAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const take = 20;
  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({ skip: (page - 1) * take, take,
        select: { id: true, name: true, phone: true, email: true, role: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" } }),
      prisma.user.count(),
    ]);
    res.json({ users, total, page, pages: Math.ceil(total / take) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/rides/live — active rides
router.get("/rides/live", ...isAdmin, async (req, res) => {
  try {
    const rides = await prisma.ride.findMany({
      where: { status: { in: ["REQUESTED","DRIVER_ASSIGNED","DRIVER_EN_ROUTE","ARRIVED_AT_PICKUP","IN_PROGRESS"] } },
      include: {
        passenger: { select: { name: true, phone: true } },
        driver: { include: { user: { select: { name: true } } } },
      },
    });
    res.json({ rides });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
