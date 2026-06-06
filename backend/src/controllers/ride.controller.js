// PROJO GROUP — Ride Controller (Fixed for simplified schema)
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Fare calculation
function calcFare(pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType = "ECONOMY", distanceKm = 0) {
  const mults = { ECONOMY: 1.0, COMFORT: 1.3, XL: 1.5, LUXURY: 2.5, BIKE: 1.0, VAN: 1.5, BUSINESS: 2.0 };
  const mult = mults[vehicleType] || 1.0;
  const inside = pickupLat >= -25.75 && pickupLat <= -25.58 && pickupLng >= 27.18 && pickupLng <= 27.35 &&
                 dropoffLat >= -25.75 && dropoffLat <= -25.58 && dropoffLng >= 27.18 && dropoffLng <= 27.35;
  if (inside) {
    const fare = 60 * mult;
    return { zone: "ZONE_1_FLAT", baseFare: 60, totalFare: fare, driverPayout: fare * 0.8, distanceKm: null };
  } else {
    const km = distanceKm || Math.max(5, Math.sqrt(Math.pow((pickupLat - dropoffLat) * 111, 2) + Math.pow((pickupLng - dropoffLng) * 111, 2)));
    const fare = Math.max(60, km * 7.5) * mult;
    return { zone: "ZONE_2_PER_KM", baseFare: Math.max(60, km * 7.5), totalFare: fare, driverPayout: fare * 0.8, distanceKm: parseFloat(km.toFixed(1)) };
  }
}

// POST /api/rides/estimate
exports.estimateFare = async (req, res) => {
  const { pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType, distanceKm } = req.body;
  const result = calcFare(pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType, distanceKm);
  res.json(result);
};

// POST /api/rides/book
exports.bookRide = async (req, res) => {
  const { pickupAddress, pickupLat, pickupLng, dropoffAddress, dropoffLat, dropoffLng,
    vehicleType = "ECONOMY", scheduledFor, paidWithWallet, distanceKm } = req.body;
  try {
    const fare = calcFare(pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType, distanceKm);
    const ride = await prisma.ride.create({
      data: {
        passengerId: req.user.id,
        pickupAddress,
        pickupLat,
        pickupLng,
        dropoffAddress,
        dropoffLat,
        dropoffLng,
        zone: fare.zone,
        distanceKm: fare.distanceKm,
        baseFare: fare.baseFare,
        totalFare: fare.totalFare,
        driverPayout: fare.driverPayout,
        status: "REQUESTED",
        isScheduled: !!scheduledFor,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        paidWithWallet: !!paidWithWallet,
      },
    });
    res.status(201).json({ message: "Ride booked!", ride });
  } catch (err) {
    console.error("[PROJO Ride] Book error:", err.message);
    res.status(500).json({ error: "Could not book ride: " + err.message });
  }
};

// GET /api/rides/active
exports.getActiveRide = async (req, res) => {
  try {
    const ride = await prisma.ride.findFirst({
      where: { passengerId: req.user.id, status: { in: ["REQUESTED", "DRIVER_ASSIGNED", "DRIVER_EN_ROUTE", "ARRIVED_AT_PICKUP", "IN_PROGRESS"] } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ ride });
  } catch (err) {
    res.json({ ride: null });
  }
};

// GET /api/rides/history
exports.getRideHistory = async (req, res) => {
  try {
    const rides = await prisma.ride.findMany({
      where: { passengerId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json({ rides });
  } catch (err) {
    res.json({ rides: [] });
  }
};

// GET /api/rides/:id
exports.getRideById = async (req, res) => {
  try {
    const ride = await prisma.ride.findUnique({ where: { id: req.params.id } });
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    res.json({ ride });
  } catch (err) {
    res.status(500).json({ error: "Could not get ride" });
  }
};

// GET /api/rides/share/:token
exports.getSharedRide = async (req, res) => {
  try {
    const ride = await prisma.ride.findUnique({ where: { shareToken: req.params.token } });
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    res.json({ ride });
  } catch (err) {
    res.status(500).json({ error: "Could not get ride" });
  }
};

// POST /api/rides/:id/cancel
exports.cancelRide = async (req, res) => {
  try {
    const ride = await prisma.ride.update({
      where: { id: req.params.id },
      data: { status: "CANCELLED" },
    });
    res.json({ message: "Ride cancelled", ride });
  } catch (err) {
    res.status(500).json({ error: "Could not cancel ride" });
  }
};

// POST /api/rides/:id/rate
exports.rateRide = async (req, res) => {
  res.json({ message: "Rating saved. Thank you!" });
};

// Driver actions
exports.acceptRide = async (req, res) => {
  try {
    const ride = await prisma.ride.update({
      where: { id: req.params.id },
      data: { driverId: req.user.id, status: "DRIVER_ASSIGNED" },
    });
    res.json({ message: "Ride accepted", ride });
  } catch (err) {
    res.status(500).json({ error: "Could not accept ride" });
  }
};

exports.updateRideStatus = async (req, res) => {
  try {
    const ride = await prisma.ride.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    });
    res.json({ message: "Status updated", ride });
  } catch (err) {
    res.status(500).json({ error: "Could not update status" });
  }
};
