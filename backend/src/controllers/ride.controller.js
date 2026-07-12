// PROJO GROUP — Ride Controller (Full Loyalty Points Ledger)
const { PrismaClient } = require("@prisma/client");
const {
  applyLoyaltyDiscount, getUserLoyaltyPoints,
  awardPoints, deductPoints, refundWallet
} = require("../services/loyalty.service");
const { Resend } = require("resend");
const { sendWhatsAppNotification } = require("../services/whatsapp.service");
const prisma = new PrismaClient();

// Attaches driver name/phone/vehicle/photo to a ride once assigned, so
// this survives a page refresh — previously this info only ever arrived
// via the transient ride:accepted socket event, which meant reloading the
// tracking page after a driver accepted lost all of it permanently.
async function enrichRideWithDriverInfo(ride) {
  if (!ride || !ride.driverId) return ride;
  const driver = await prisma.user.findUnique({
    where: { id: ride.driverId },
    select: { id: true, name: true, phone: true, vehicleMake: true, vehicleModel: true, vehicleColor: true, vehicleRegistration: true, vehicleType: true },
  });
  if (!driver) return ride;
  const base = process.env.PROJO_API_BASE_URL || "https://projo-group-backend.onrender.com";
  return {
    ...ride,
    driverInfo: {
      name: driver.name,
      phone: driver.phone,
      vehicle: [driver.vehicleColor, driver.vehicleMake, driver.vehicleModel].filter(Boolean).join(" "),
      vehicleType: driver.vehicleType,
      vehicleRegistration: driver.vehicleRegistration,
      photoUrl: `${base}/api/drivers/${driver.id}/photo`,
    },
  };
}

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

// POST /api/rides/book
exports.bookRide = async (req, res) => {
  const { pickupAddress, pickupLat, pickupLng, dropoffAddress, dropoffLat, dropoffLng,
    vehicleType = "ECONOMY", scheduledFor, paidWithWallet, distanceKm } = req.body;
  try {
    const fare = calcFare(pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType, distanceKm);
    const points = await getUserLoyaltyPoints(req.user.id);
    const discount = applyLoyaltyDiscount(fare.totalFare, points);
    const finalFare = discount.finalFare;
    const finalDriverPayout = finalFare * 0.8;

    const ride = await prisma.ride.create({
      data: {
        passengerId: req.user.id,
        pickupAddress, pickupLat, pickupLng,
        dropoffAddress, dropoffLat, dropoffLng,
        zone: fare.zone, distanceKm: fare.distanceKm,
        baseFare: fare.baseFare, totalFare: finalFare,
        driverPayout: finalDriverPayout,
        status: "REQUESTED",
        isScheduled: !!scheduledFor,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        paidWithWallet: !!paidWithWallet,
      },
    });

    // Send admin email notification
    try {
      const passenger = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "noreply@projogroup.co.za",
          to: "jacquesb247@gmail.com",
          subject: `🚗 New Ride Booking — ${passenger?.name}`,
          html: `<h2>New Ride Booking</h2>
            <p><strong>Customer:</strong> ${passenger?.name} | ${passenger?.phone}</p>
            <p><strong>Pickup:</strong> ${pickupAddress}</p>
            <p><strong>Dropoff:</strong> ${dropoffAddress}</p>
            <p><strong>Vehicle:</strong> ${vehicleType} | <strong>Fare:</strong> R${finalFare}</p>
            <p><strong>Payment:</strong> ${paidWithWallet ? "PROJO Wallet" : "Cash"}</p>
            ${discount.discountApplied > 0 ? `<p><strong>Loyalty Discount:</strong> ${discount.tierName} ${discount.discountPct}% (R${discount.discountApplied} off)</p>` : ""}
            <p><a href="https://app.projogroup.co.za/admin">View in Admin Panel</a></p>`,
        });
      }
    } catch (e) { console.log("[PROJO Ride] Email notification failed:", e.message); }

    // Auto-forward to WhatsApp Business
    try {
      const passenger = await prisma.user.findUnique({ where: { id: req.user.id } }).catch(() => null);
      await sendWhatsAppNotification(
        `🚗 NEW RIDE BOOKING - PROJO GROUP

` +
        `Customer: ${passenger?.name || "Unknown"}
` +
        `Phone: ${passenger?.phone || "N/A"}
` +
        `Pickup: ${pickupAddress}
` +
        `Dropoff: ${dropoffAddress}
` +
        `Vehicle: ${vehicleType}
` +
        `Fare: R${finalFare.toFixed(2)}
` +
        `Payment: ${paidWithWallet ? "PROJO Wallet" : "Cash"}
` +
        `Time: ${new Date().toLocaleString("en-ZA")}`
      );
    } catch (e) { console.log("[PROJO Ride] WhatsApp notification failed:", e.message); }

    // Notify every online driver — both via live socket (instant, works
    // when the app is actively open) AND push notification (reliable even
    // when the app is backgrounded or the screen is locked, which a
    // WebSocket connection alone can never guarantee — this is exactly how
    // real ride-hailing apps handle it, socket for speed, push for
    // reliability). No geo-matching yet (first online driver to accept
    // wins) — proper nearest-driver matching is a larger feature to build
    // separately if wanted later.
    try {
      const onlineDrivers = await prisma.user.findMany({
        where: { role: "DRIVER", driverStatus: "ONLINE" },
        select: { id: true, name: true },
      });
      const io = req.app.get("io");
      const { notifyUser } = require("./push.controller");
      for (const driver of onlineDrivers) {
        io?.to(`driver:${driver.id}`).emit("ride:new_request", ride);
        notifyUser(driver.id, {
          title: "🚗 New Ride Request",
          body: `${pickupAddress} → ${dropoffAddress} · R${finalFare.toFixed(2)}`,
          data: { url: "/driver" },
        }).catch(() => {});
      }
      console.log(`[PROJO Ride] Notified ${onlineDrivers.length} online driver(s) of new ride ${ride.id}`);
    } catch (e) { console.log("[PROJO Ride] Driver notification failed:", e.message); }

    res.status(201).json({
      message: discount.discountApplied > 0
        ? `Ride booked! ${discount.tierName} tier discount of ${discount.discountPct}% applied (R${discount.discountApplied} off)`
        : "Ride booked! A driver will be assigned shortly.",
      ride,
      loyaltyDiscount: discount.discountApplied,
      loyaltyTier: discount.tierName,
    });
  } catch (err) {
    console.error("[PROJO Ride] Book error:", err.message);
    res.status(500).json({ error: "Could not book ride: " + err.message });
  }
};

// POST /api/rides/:id/cancel — customer cancels
// POST /api/rides/street-pickup — driver creates a ride on behalf of a
// walk-up/street passenger who doesn't have the app open (or an account
// at all). Skips the broadcast-to-online-drivers step entirely, since
// this driver is already physically with the passenger and is assigned
// immediately — cash payment only, no wallet option, since there's no
// real passenger account to charge.
exports.streetPickup = async (req, res) => {
  const { pickupAddress, pickupLat, pickupLng, dropoffAddress, dropoffLat, dropoffLng,
    vehicleType = "ECONOMY", distanceKm, passengerEmail } = req.body;
  try {
    const fare = calcFare(pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType, distanceKm);

    const ride = await prisma.ride.create({
      data: {
        // No real passenger account exists for a street pickup — the
        // driver's own account fills this required field. This ride will
        // still show correctly on the driver's own trip history; it just
        // won't appear in anyone else's "my rides" list, which is correct
        // since there is no "anyone else" here.
        passengerId: req.user.id,
        driverId: req.user.id,
        pickupAddress, pickupLat, pickupLng,
        dropoffAddress, dropoffLat, dropoffLng,
        zone: fare.zone, distanceKm: fare.distanceKm,
        baseFare: fare.baseFare, totalFare: fare.totalFare,
        driverPayout: fare.totalFare, // driver collects the full cash fare directly
        status: "DRIVER_ASSIGNED",
        paidWithWallet: false,
        isStreetPickup: true,
        streetPickupEmail: passengerEmail || null,
      },
    });

    console.log(`[PROJO Ride] Street pickup created by driver ${req.user.name} (${req.user.phone})`);
    res.status(201).json({ message: "Street pickup started", ride });
  } catch (err) {
    console.error("[PROJO Ride] Street pickup error:", err.message);
    res.status(500).json({ error: "Could not start street pickup: " + err.message });
  }
};

exports.cancelRide = async (req, res) => {
  try {
    const ride = await prisma.ride.findUnique({ where: { id: req.params.id } });
    if (!ride) return res.status(404).json({ error: "Ride not found" });

    // Only allow cancellation of non-completed rides
    if (ride.status === "COMPLETED") {
      return res.status(400).json({ error: "Cannot cancel a completed ride." });
    }

    await prisma.ride.update({
      where: { id: req.params.id },
      data: { status: "CANCELLED" },
    });

    // If ride was wallet-paid, refund and deduct any awarded points
    if (ride.paidWithWallet) {
      await refundWallet(ride.passengerId, ride.totalFare, `Cancelled ride refund`);
      // Points only awarded on completion so nothing to deduct here
    }

    // This never actually told anyone — the driver (if one was already
    // assigned) kept showing the ride as current indefinitely, even after
    // a refresh, since nothing ever cleared it client-side. Passenger
    // gets this too, in case admin is the one cancelling.
    const io = req.app.get("io");
    io?.to(`ride:${ride.id}`).emit("ride:cancelled", { rideId: ride.id });
    if (ride.driverId) {
      io?.to(`driver:${ride.driverId}`).emit("ride:cancelled", { rideId: ride.id });
    }

    res.json({ message: "Ride cancelled. Wallet refunded if applicable.", ride: { ...ride, status: "CANCELLED" } });
  } catch (err) {
    res.status(500).json({ error: "Could not cancel ride" });
  }
};

// POST /api/rides/:id/status — driver/admin updates status
exports.updateRideStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ride = await prisma.ride.findUnique({ where: { id: req.params.id } });
    if (!ride) return res.status(404).json({ error: "Ride not found" });

    const updated = await prisma.ride.update({
      where: { id: req.params.id },
      data: { status },
    });

    // Invoice sends on every completed ride, including street pickups —
    // it's a real receipt/record either way. Loyalty points are the one
    // thing that must never apply to street pickups, since passengerId
    // there is just the driver's own account (a placeholder, not a real
    // customer) and would otherwise incorrectly earn the driver points on
    // their own cash pickups.
    if (status === "COMPLETED") {
      if (!ride.isStreetPickup) {
        await awardPoints(ride.passengerId, ride.totalFare, `Ride completed`);
        console.log(`[PROJO Ride] Points awarded for completed ride ${ride.id}`);
      }
      try {
        const { generateAndSendInvoice } = require("../services/invoice.service");
        const passenger = await prisma.user.findUnique({ where: { id: ride.passengerId } });
        if (passenger) {
          const invoiceRecipient = ride.streetPickupEmail
            ? { ...passenger, email: ride.streetPickupEmail, name: "Street Pickup Passenger" }
            : passenger;
          await generateAndSendInvoice({ type: "ride", data: ride, user: invoiceRecipient });
        }
      } catch (e) { console.log("[PROJO Invoice] Ride:", e.message); }
    }

    // Driver/admin cancels — refund wallet if paid, no points deducted (never awarded yet)
    if (status === "CANCELLED" && ride.status !== "COMPLETED") {
      if (ride.paidWithWallet) {
        await refundWallet(ride.passengerId, ride.totalFare, `Ride cancelled by ${req.user?.role || "system"}`);
      }
    }

    // Push notification for the most time-sensitive moment — the
    // passenger needs to know the driver has arrived even if their app
    // isn't open right now. The live socket toast (sent separately from
    // the driver's frontend) only ever reaches an actively-open app.
    if (status === "ARRIVED_AT_PICKUP") {
      try {
        const { notifyUser } = require("./push.controller");
        await notifyUser(ride.passengerId, { title: "📍 Your Driver Has Arrived", body: "Your driver is waiting at the pickup point", data: { url: `/ride/${ride.id}` } });
      } catch (e) { console.log("[PROJO Ride] Arrived push notification failed:", e.message); }
    }

    res.json({ message: "Status updated", ride: updated });
  } catch (err) {
    res.status(500).json({ error: "Could not update status" });
  }
};

// GET /api/rides/active
exports.getActiveRide = async (req, res) => {
  try {
    const ride = await prisma.ride.findFirst({
      where: { passengerId: req.user.id, status: { in: ["REQUESTED", "DRIVER_ASSIGNED", "DRIVER_EN_ROUTE", "ARRIVED_AT_PICKUP", "IN_PROGRESS"] } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ ride: await enrichRideWithDriverInfo(ride) });
  } catch { res.json({ ride: null }); }
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
  } catch { res.json({ rides: [] }); }
};

// GET /api/rides/:id
exports.getRideById = async (req, res) => {
  try {
    const ride = await prisma.ride.findUnique({ where: { id: req.params.id } });
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    res.json({ ride: await enrichRideWithDriverInfo(ride) });
  } catch { res.status(500).json({ error: "Could not get ride" }); }
};

// GET /api/rides/share/:token
exports.getSharedRide = async (req, res) => {
  try {
    const ride = await prisma.ride.findUnique({ where: { shareToken: req.params.token } });
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    res.json({ ride: await enrichRideWithDriverInfo(ride) });
  } catch { res.status(500).json({ error: "Could not get ride" }); }
};

// POST /api/rides/:id/rate
// GET /api/rides/:id/messages — chat history for a ride, restricted to
// the ride's actual passenger or driver
exports.getRideMessages = async (req, res) => {
  try {
    const ride = await prisma.ride.findUnique({ where: { id: req.params.id }, select: { passengerId: true, driverId: true } });
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    if (req.user.id !== ride.passengerId && req.user.id !== ride.driverId) {
      return res.status(403).json({ error: "Not your ride" });
    }
    const messages = await prisma.rideMessage.findMany({
      where: { rideId: req.params.id },
      orderBy: { createdAt: "asc" },
    });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: "Could not load messages" });
  }
};

// POST /api/rides/:id/messages — send + persist a chat message, also
// pushed live via socket so the other party sees it instantly without
// needing to poll or refresh
exports.sendRideMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: "Message required" });
    const ride = await prisma.ride.findUnique({ where: { id: req.params.id }, select: { passengerId: true, driverId: true } });
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    if (req.user.id !== ride.passengerId && req.user.id !== ride.driverId) {
      return res.status(403).json({ error: "Not your ride" });
    }
    const saved = await prisma.rideMessage.create({
      data: { rideId: req.params.id, senderId: req.user.id, message: message.trim() },
    });
    const io = req.app.get("io");
    io?.to(`ride:${req.params.id}`).emit("ride:chat_message", {
      id: saved.id, rideId: req.params.id, senderId: req.user.id, senderName: req.user.name, message: saved.message, createdAt: saved.createdAt,
    });
    res.status(201).json({ message: saved });
  } catch (err) {
    res.status(500).json({ error: "Could not send message" });
  }
};

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

    // Push notification to the passenger — the live socket event (sent
    // separately, from the driver's own frontend) only reaches an
    // actively-open app; this reaches them even backgrounded/closed,
    // same reasoning as ride dispatch to drivers.
    try {
      const { notifyUser } = require("./push.controller");
      await notifyUser(ride.passengerId, {
        title: "🚗 Driver On The Way",
        body: `${req.user.name} is heading to your pickup`,
        data: { url: `/ride/${ride.id}` },
      });
    } catch (e) { console.log("[PROJO Ride] Passenger push notification failed:", e.message); }

    res.json({ message: "Ride accepted", ride });
  } catch (err) {
    console.error("[PROJO Ride] acceptRide error:", err.message, "| rideId:", req.params.id, "| driverId:", req.user?.id);
    res.status(500).json({ error: "Could not accept ride: " + err.message });
  }
};
