// ============================================================
// PROJO GROUP — Delivery / Courier Routes (Step 7)
// Book pickup, track parcel, assign driver
// Service: Rustenburg + North West Province
// ============================================================
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { PrismaClient } = require("@prisma/client");
const { getOSRMDistance } = require("../utils/distance.calculator");
const { calculateFare } = require("../utils/fare.calculator");
const prisma = new PrismaClient();

// POST /api/deliveries/book
router.post("/book", authenticate, async (req, res) => {
  const {
    description, weight, isFragile,
    pickupAddress, pickupLat, pickupLng,
    recipientName, recipientPhone,
    dropoffAddress, dropoffLat, dropoffLng,
  } = req.body;

  if (!pickupAddress || !dropoffAddress || !recipientName || !recipientPhone)
    return res.status(400).json({ error: "Missing required delivery fields" });

  try {
    const { distanceKm } = await getOSRMDistance(
      parseFloat(pickupLat), parseFloat(pickupLng),
      parseFloat(dropoffLat), parseFloat(dropoffLng)
    );

    const fareResult = calculateFare({
      pickupLat: parseFloat(pickupLat), pickupLng: parseFloat(pickupLng),
      dropoffLat: parseFloat(dropoffLat), dropoffLng: parseFloat(dropoffLng),
      distanceKm, vehicleType: "BIKE",
    });

    const delivery = await prisma.delivery.create({
      data: {
        senderId: req.user.id,
        description, weight: weight ? parseFloat(weight) : null,
        isFragile: !!isFragile,
        pickupAddress, pickupLat: parseFloat(pickupLat), pickupLng: parseFloat(pickupLng),
        recipientName, recipientPhone,
        dropoffAddress, dropoffLat: parseFloat(dropoffLat), dropoffLng: parseFloat(dropoffLng),
        distanceKm, fare: fareResult.totalFare,
        status: "PENDING",
      },
    });

    res.status(201).json({
      delivery,
      trackingNumber: delivery.trackingNumber,
      fare: fareResult.totalFare,
      fareLabel: fareResult.fareLabel,
      message: "Courier booked! We will assign a driver shortly.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/deliveries/track/:trackingNumber — public tracking (no auth)
router.get("/track/:trackingNumber", async (req, res) => {
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { trackingNumber: req.params.trackingNumber },
      select: {
        trackingNumber: true, status: true, description: true,
        pickupAddress: true, dropoffAddress: true,
        recipientName: true, fare: true, distanceKm: true,
        estimatedDelivery: true, pickedUpAt: true, deliveredAt: true,
        createdAt: true,
        driver: { select: { user: { select: { name: true } }, latitude: true, longitude: true } },
      },
    });
    if (!delivery) return res.status(404).json({ error: "Tracking number not found" });
    res.json({ delivery });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/deliveries — my deliveries
router.get("/", authenticate, async (req, res) => {
  try {
    const deliveries = await prisma.delivery.findMany({
      where: { senderId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ deliveries });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/deliveries/:id/assign — admin assigns driver
router.post("/:id/assign", authenticate, async (req, res) => {
  const { driverId } = req.body;
  try {
    const delivery = await prisma.delivery.update({
      where: { id: req.params.id },
      data: { driverId, status: "ASSIGNED",
        estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000) }, // +2 hrs
    });
    res.json({ delivery });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/deliveries/:id/status — driver updates delivery status
router.post("/:id/status", authenticate, async (req, res) => {
  const { status } = req.body;
  const valid = ["PICKED_UP", "IN_TRANSIT", "DELIVERED", "FAILED"];
  if (!valid.includes(status)) return res.status(400).json({ error: "Invalid status" });
  try {
    const data = { status };
    if (status === "PICKED_UP") data.pickedUpAt = new Date();
    if (status === "DELIVERED") data.deliveredAt = new Date();
    const delivery = await prisma.delivery.update({ where: { id: req.params.id }, data });
    res.json({ delivery });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
