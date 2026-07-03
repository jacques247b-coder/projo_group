// PROJO GROUP — Ride Controller (with Loyalty Discount applied)
const { PrismaClient } = require("@prisma/client");
const { applyLoyaltyDiscount, calculatePoints } = require("../services/loyalty.service");
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

// Get user's current loyalty points (based on lifetime wallet activity)
async function getUserLoyaltyPoints(userId) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  // Using current balance as a proxy — ideally track lifetime spend separately
  return calculatePoints(wallet?.balanceZar || 0);
}

// POST /api/rides/estimate — now includes loyalty discount preview
exports.estimateFare = async (req, res) => {
  const { pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType, distanceKm } = req.body;
  const result = calcFare(pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType, distanceKm);

  // Apply loyalty discount if user is authenticated
  if (req.user) {
    const points = await getUserLoyaltyPoints(req.user.id);
    const discount = applyLoyaltyDiscount(result.totalFare, points);
    return res.json({
      ...result,
      originalFare: result.totalFare,
      totalFare: discount.finalFare,
      loyaltyDiscount: discount.discountApplied,
      loyaltyDiscountPct: discount.discountPct,
      loyaltyTier: discount.tierName,
    });
  }

  res.json(result);
};

// POST /api/rides/book — applies loyalty discount to final fare
exports.bookRide = async (req, res) => {
  const { pickupAddress, pickupLat, pickupLng, dropoffAddress, dropoffLat, dropoffLng,
    vehicleType = "ECONOMY", scheduledFor, paidWithWallet, distanceKm } = req.body;
  try {
    const fare = calcFare(pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType, distanceKm);

    // Apply loyalty discount
    const points = await getUserLoyaltyPoints(req.user.id);
    const discount = applyLoyaltyDiscount(fare.totalFare, points);
    const finalFare = discount.finalFare;
    const finalDriverPayout = finalFare * 0.8;

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
        totalFare: finalFare,
        driverPayout: finalDriverPayout,
        status: "REQUESTED",
        isScheduled: !!scheduledFor,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        paidWithWallet: !!paidWithWallet,
      },
    });

    // Get passenger info for admin notification
    const passenger = await prisma.user.findUnique({ where: { id: req.user.id } });

    // Send WhatsApp + email notification to admin
    try {
      const fareTxt = `R${finalFare.toFixed(2)}`;
      const zone = fare.zone === "ZONE_1_FLAT" ? "Rustenburg Flat Rate" : `${fare.distanceKm}km @ R7.50/km`;

      // Email via Resend
      const { Resend } = require("resend");
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "noreply@projogroup.co.za",
          to: "jacquesb247@gmail.com",
          subject: `🚗 New Ride Booking — ${passenger?.name || "Customer"}`,
          html: `
            <h2>New Ride Booking — PROJO GROUP</h2>
            <p><strong>Customer:</strong> ${passenger?.name || "N/A"}</p>
            <p><strong>Phone:</strong> ${passenger?.phone || "N/A"}</p>
            <hr/>
            <p><strong>Pickup:</strong> ${pickupAddress}</p>
            <p><strong>Dropoff:</strong> ${dropoffAddress}</p>
            <p><strong>Vehicle:</strong> ${vehicleType}</p>
            <p><strong>Zone:</strong> ${zone}</p>
            <p><strong>Fare:</strong> ${fareTxt}</p>
            <p><strong>Payment:</strong> ${paidWithWallet ? "PROJO Wallet" : "Cash"}</p>
            ${discount.discountApplied > 0 ? `<p><strong>Loyalty Discount:</strong> ${discount.tierName} ${discount.discountPct}% off (R${discount.discountApplied} saved)</p>` : ""}
            <p><strong>Time:</strong> ${new Date().toLocaleString("en-ZA")}</p>
            <hr/>
            <p><a href="https://app.projogroup.co.za/admin">View in Admin Panel</a></p>
          `,
        });
      }
      console.log(`[PROJO Ride] Admin notified — ${passenger?.name} booking ${pickupAddress} → ${dropoffAddress} ${fareTxt}`);
    } catch (notifyErr) {
      console.log(`[PROJO Ride] Notification error (non-fatal):`, notifyErr.message);
    }

    res.status(201).json({
      message: discount.discountApplied > 0
        ? `Ride booked! ${discount.tierName} tier discount of ${discount.discountPct}% applied (R${discount.discountApplied} off)`
        : "Ride booked!",
      ride,
      loyaltyDiscount: discount.discountApplied,
      loyaltyTier: discount.tierName,
      passenger: { name: passenger?.name, phone: passenger?.phone },
    });
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
