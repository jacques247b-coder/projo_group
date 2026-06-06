// ============================================================
// PROJO GROUP — Ride Controller
// Book, track, manage rides — Rustenburg pricing
// ============================================================
const { PrismaClient } = require("@prisma/client");
const { validationResult } = require("express-validator");
const { calculateFare } = require("../utils/fare.calculator");
const { getOSRMDistance } = require("../utils/distance.calculator");
const { notifyDriver, notifyPassenger, connectedDrivers } = require("../sockets/socket.handlers");

const prisma = new PrismaClient();

// ── POST /api/rides/estimate ─────────────────────────────────
exports.estimateFare = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType = "ECONOMY" } = req.body;

  try {
    const { distanceKm, durationMin } = await getOSRMDistance(
      parseFloat(pickupLat), parseFloat(pickupLng),
      parseFloat(dropoffLat), parseFloat(dropoffLng)
    );

    const fareResult = calculateFare({
      pickupLat: parseFloat(pickupLat), pickupLng: parseFloat(pickupLng),
      dropoffLat: parseFloat(dropoffLat), dropoffLng: parseFloat(dropoffLng),
      distanceKm, vehicleType,
    });

    res.json({ ...fareResult, distanceKm, durationMin });
  } catch (err) {
    console.error("[PROJO Ride] Estimate error:", err);
    res.status(500).json({ error: "Could not calculate fare" });
  }
};

// ── POST /api/rides/book ─────────────────────────────────────
exports.bookRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const {
    pickupAddress, pickupLat, pickupLng,
    dropoffAddress, dropoffLat, dropoffLng,
    vehicleType = "ECONOMY",
    scheduledFor,
    paidWithWallet = false,
    promoCode,
  } = req.body;

  try {
    // Check for existing active ride
    const activeRide = await prisma.ride.findFirst({
      where: {
        passengerId: req.user.id,
        status: { in: ["REQUESTED", "DRIVER_ASSIGNED", "DRIVER_EN_ROUTE", "ARRIVED_AT_PICKUP", "IN_PROGRESS"] },
      },
    });
    if (activeRide) {
      return res.status(409).json({ error: "You already have an active ride", rideId: activeRide.id });
    }

    // Get distance via OSRM
    const { distanceKm, durationMin } = await getOSRMDistance(
      parseFloat(pickupLat), parseFloat(pickupLng),
      parseFloat(dropoffLat), parseFloat(dropoffLng)
    );

    // Calculate fare
    const fareResult = calculateFare({
      pickupLat: parseFloat(pickupLat), pickupLng: parseFloat(pickupLng),
      dropoffLat: parseFloat(dropoffLat), dropoffLng: parseFloat(dropoffLng),
      distanceKm, vehicleType,
    });

    // Wallet payment check
    if (paidWithWallet) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
      if (!wallet || wallet.balanceZar < fareResult.totalFare) {
        return res.status(402).json({
          error: `Insufficient wallet balance. Need R${fareResult.totalFare.toFixed(2)}, have R${wallet?.balanceZar.toFixed(2) || "0.00"}`,
        });
      }
    }

    // Create ride
    const ride = await prisma.ride.create({
      data: {
        passengerId: req.user.id,
        pickupAddress, pickupLat: parseFloat(pickupLat), pickupLng: parseFloat(pickupLng),
        dropoffAddress, dropoffLat: parseFloat(dropoffLat), dropoffLng: parseFloat(dropoffLng),
        zone: fareResult.fareZone,
        distanceKm: fareResult.fareZone === "ZONE_2_PER_KM" ? distanceKm : null,
        baseFare: fareResult.baseFare,
        fareMultiplier: fareResult.multiplier,
        surgePct: fareResult.surgePct,
        totalFare: fareResult.totalFare,
        driverPayout: fareResult.driverPayout,
        projoCommission: fareResult.projoCommission,
        status: "REQUESTED",
        isScheduled: !!scheduledFor,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        paidWithWallet,
      },
    });

    // Deduct wallet immediately if paying with wallet
    if (paidWithWallet) {
      await prisma.wallet.update({
        where: { userId: req.user.id },
        data: { balanceZar: { decrement: fareResult.totalFare } },
      });
      await prisma.transaction.create({
        data: {
          wallet: { connect: { userId: req.user.id } },
          type: "RIDE_PAYMENT",
          status: "COMPLETED",
          amountZar: fareResult.totalFare,
          description: `Ride payment — ${pickupAddress} → ${dropoffAddress}`,
          referenceId: ride.id,
        },
      });
    }

    // Find nearest available driver and notify them
    if (!scheduledFor) {
      await findAndNotifyDriver(ride, req.app.get("io"));
    }

    res.status(201).json({
      message: "Ride booked successfully",
      ride: {
        id: ride.id,
        status: ride.status,
        shareToken: ride.shareToken,
        totalFare: fareResult.totalFare,
        displayFare: fareResult.displayString,
        fareLabel: fareResult.fareLabel,
        distanceKm,
        durationMin,
        zone: fareResult.fareZone,
      },
    });
  } catch (err) {
    console.error("[PROJO Ride] Book error:", err);
    res.status(500).json({ error: "Could not book ride. Please try again." });
  }
};

// Find nearest online driver and send ride request
async function findAndNotifyDriver(ride, io) {
  try {
    // Get online drivers with their location
    const drivers = await prisma.driver.findMany({
      where: {
        status: "ONLINE",
        approvalStatus: "APPROVED",
        latitude: { not: null },
        longitude: { not: null },
      },
      include: { vehicles: { where: { isActive: true, isVerified: true } } },
    });

    if (!drivers.length) return;

    // Sort by distance to pickup (simple haversine)
    const sorted = drivers
      .map((d) => ({
        ...d,
        dist: haversine(ride.pickupLat, ride.pickupLng, d.latitude, d.longitude),
      }))
      .sort((a, b) => a.dist - b.dist);

    const nearest = sorted[0];
    if (!nearest) return;

    // Assign driver to ride
    await prisma.ride.update({
      where: { id: ride.id },
      data: { driverId: nearest.id, status: "DRIVER_ASSIGNED" },
    });

    // Notify driver via Socket.io
    if (io) {
      notifyDriver(io, nearest.id, "ride:new_request", {
        rideId: ride.id,
        pickupAddress: ride.pickupAddress,
        pickupLat: ride.pickupLat,
        pickupLng: ride.pickupLng,
        dropoffAddress: ride.dropoffAddress,
        totalFare: ride.totalFare,
        driverPayout: ride.driverPayout,
        distanceKm: ride.distanceKm,
        zone: ride.zone,
      });

      // Notify passenger driver was found
      notifyPassenger(io, ride.passengerId, "ride:driver_assigned", {
        rideId: ride.id,
        driverName: nearest.user?.name,
        distanceToPickup: Math.round(nearest.dist * 10) / 10,
        eta: Math.round(nearest.dist * 3), // rough min estimate
      });
    }
  } catch (err) {
    console.error("[PROJO Ride] findAndNotifyDriver error:", err);
  }
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── GET /api/rides/active ────────────────────────────────────
exports.getActiveRide = async (req, res) => {
  try {
    const ride = await prisma.ride.findFirst({
      where: {
        passengerId: req.user.id,
        status: { in: ["REQUESTED", "DRIVER_ASSIGNED", "DRIVER_EN_ROUTE", "ARRIVED_AT_PICKUP", "IN_PROGRESS"] },
      },
      include: {
        driver: { include: { user: { select: { name: true, phone: true, avatarUrl: true } }, vehicles: true } },
        vehicle: true,
      },
    });
    res.json({ ride });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch active ride" });
  }
};

// ── GET /api/rides/history ───────────────────────────────────
exports.getRideHistory = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  try {
    const where = req.user.role === "DRIVER"
      ? { driverId: req.user.driverProfile?.id }
      : { passengerId: req.user.id };

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where: { ...where, status: { in: ["COMPLETED", "CANCELLED"] } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { rating: true },
      }),
      prisma.ride.count({ where }),
    ]);

    res.json({ rides, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch ride history" });
  }
};

// ── GET /api/rides/:id ───────────────────────────────────────
exports.getRideById = async (req, res) => {
  try {
    const ride = await prisma.ride.findUnique({
      where: { id: req.params.id },
      include: {
        driver: { include: { user: { select: { name: true, phone: true, avatarUrl: true } } } },
        vehicle: true,
        rating: true,
        passenger: { select: { name: true, phone: true, avatarUrl: true } },
      },
    });
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    res.json({ ride });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch ride" });
  }
};

// ── GET /api/rides/share/:token ──────────────────────────────
exports.getSharedRide = async (req, res) => {
  try {
    const ride = await prisma.ride.findUnique({
      where: { shareToken: req.params.token },
      select: {
        id: true, status: true,
        pickupAddress: true, pickupLat: true, pickupLng: true,
        dropoffAddress: true, dropoffLat: true, dropoffLng: true,
        totalFare: true, distanceKm: true,
        driver: { select: { latitude: true, longitude: true, user: { select: { name: true } } } },
      },
    });
    if (!ride) return res.status(404).json({ error: "Shared ride not found" });
    res.json({ ride });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch shared ride" });
  }
};

// ── POST /api/rides/:id/cancel ───────────────────────────────
exports.cancelRide = async (req, res) => {
  try {
    const ride = await prisma.ride.findUnique({ where: { id: req.params.id } });
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    if (!["REQUESTED", "DRIVER_ASSIGNED"].includes(ride.status)) {
      return res.status(400).json({ error: "Ride cannot be cancelled at this stage" });
    }

    // Refund wallet if was paid with wallet
    if (ride.paidWithWallet) {
      await prisma.wallet.update({
        where: { userId: ride.passengerId },
        data: { balanceZar: { increment: ride.totalFare } },
      });
    }

    await prisma.ride.update({
      where: { id: ride.id },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: req.body.reason },
    });

    res.json({ message: "Ride cancelled successfully" });
  } catch (err) {
    res.status(500).json({ error: "Could not cancel ride" });
  }
};

// ── POST /api/rides/:id/rate ─────────────────────────────────
exports.rateRide = async (req, res) => {
  const { stars, comment } = req.body;
  try {
    const ride = await prisma.ride.findUnique({
      where: { id: req.params.id },
      include: { rating: true, driver: true },
    });
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    if (ride.status !== "COMPLETED") return res.status(400).json({ error: "Can only rate completed rides" });
    if (ride.rating) return res.status(409).json({ error: "Ride already rated" });

    const isPassenger = ride.passengerId === req.user.id;
    const rateeId = isPassenger ? ride.driver?.userId : ride.passengerId;

    await prisma.rating.create({
      data: {
        rideId: ride.id,
        raterId: req.user.id,
        rateeId,
        stars: parseInt(stars),
        comment,
      },
    });

    // Update driver avg rating
    if (isPassenger && ride.driverId) {
      const ratings = await prisma.rating.findMany({
        where: { ratee: { driverProfile: { id: ride.driverId } } },
      });
      const avg = ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length;
      await prisma.driver.update({
        where: { id: ride.driverId },
        data: { rating: avg, ratingCount: ratings.length },
      });
    }

    res.json({ message: "Rating submitted. Thank you!" });
  } catch (err) {
    res.status(500).json({ error: "Could not submit rating" });
  }
};

// ── POST /api/rides/:id/accept (Driver) ──────────────────────
exports.acceptRide = async (req, res) => {
  try {
    const driver = req.user.driverProfile;
    if (!driver) return res.status(403).json({ error: "Not a driver" });

    const ride = await prisma.ride.findUnique({ where: { id: req.params.id } });
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    if (ride.status !== "DRIVER_ASSIGNED") return res.status(400).json({ error: "Ride no longer available" });

    await prisma.ride.update({
      where: { id: ride.id },
      data: { driverId: driver.id, status: "DRIVER_EN_ROUTE" },
    });
    await prisma.driver.update({ where: { id: driver.id }, data: { status: "ON_RIDE" } });

    const io = req.app.get("io");
    notifyPassenger(io, ride.passengerId, "ride:driver_en_route", { rideId: ride.id });

    res.json({ message: "Ride accepted", rideId: ride.id });
  } catch (err) {
    res.status(500).json({ error: "Could not accept ride" });
  }
};

// ── POST /api/rides/:id/status (Driver) ─────────────────────
exports.updateRideStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const ride = await prisma.ride.findUnique({ where: { id: req.params.id } });
    if (!ride) return res.status(404).json({ error: "Ride not found" });

    const updateData = { status };
    if (status === "IN_PROGRESS") updateData.rideStartedAt = new Date();
    if (status === "COMPLETED") {
      updateData.rideCompletedAt = new Date();
      // Update driver stats
      await prisma.driver.update({
        where: { id: ride.driverId },
        data: {
          totalRides: { increment: 1 },
          totalEarnings: { increment: ride.driverPayout },
          status: "ONLINE",
        },
      });
    }

    await prisma.ride.update({ where: { id: ride.id }, data: updateData });

    const io = req.app.get("io");
    notifyPassenger(io, ride.passengerId, "ride:status_changed", { rideId: ride.id, status });

    res.json({ message: `Ride status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ error: "Could not update ride status" });
  }
};
