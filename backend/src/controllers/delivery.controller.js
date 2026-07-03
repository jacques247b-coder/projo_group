// PROJO GROUP — Delivery Controller (with Loyalty Discount applied)
const { PrismaClient } = require("@prisma/client");
const { sendWhatsAppNotification } = require("../services/whatsapp.service");
const { applyLoyaltyDiscount, calculatePoints } = require("../services/loyalty.service");
const prisma = new PrismaClient();

function isInsideRustenburg(lat, lng) {
  return lat >= -25.75 && lat <= -25.58 && lng >= 27.18 && lng <= 27.35;
}

function calcDeliveryFare(pickupLat, pickupLng, dropoffLat, dropoffLng, distanceKm) {
  const inside = isInsideRustenburg(pickupLat, pickupLng) && isInsideRustenburg(dropoffLat, dropoffLng);
  if (inside) return { fare: 60, zone: "ZONE_1_FLAT" };
  const km = distanceKm || 10;
  return { fare: Math.max(60, km * 7.5), zone: "ZONE_2_PER_KM" };
}

async function getUserLoyaltyPoints(userId) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  return calculatePoints(wallet?.balanceZar || 0);
}

// POST /api/deliveries/book — applies loyalty discount
exports.bookDelivery = async (req, res) => {
  const {
    description, pickupAddress, pickupLat, pickupLng,
    recipientName, recipientPhone, dropoffAddress, dropoffLat, dropoffLng,
    distanceKm,
  } = req.body;

  try {
    const { fare: baseFare, zone } = calcDeliveryFare(pickupLat, pickupLng, dropoffLat, dropoffLng, distanceKm);

    // Apply loyalty discount
    const points = await getUserLoyaltyPoints(req.user.id);
    const discount = applyLoyaltyDiscount(baseFare, points);
    const finalFare = discount.finalFare;

    const delivery = await prisma.delivery.create({
      data: {
        senderId: req.user.id,
        description: description || "Package",
        pickupAddress,
        pickupLat,
        pickupLng,
        recipientName,
        recipientPhone,
        dropoffAddress,
        dropoffLat,
        dropoffLng,
        distanceKm: distanceKm || 0,
        fare: finalFare,
        status: "PENDING",
      },
    });

    // Auto-forward to WhatsApp Business
    try {
      const sender = await prisma.user.findUnique({ where: { id: req.user.id } }).catch(() => null);
      await sendWhatsAppNotification(
        `📦 NEW DELIVERY BOOKING - PROJO GROUP

` +
        `Customer: ${sender?.name || "Unknown"}
` +
        `Phone: ${sender?.phone || "N/A"}
` +
        `Item: ${description || "Package"}
` +
        `Pickup: ${pickupAddress}
` +
        `Dropoff: ${dropoffAddress}
` +
        `Recipient: ${recipientName} - ${recipientPhone}
` +
        `Fare: R${finalFare.toFixed(2)}
` +
        `Tracking: ${delivery.trackingNumber}
` +
        `Time: ${new Date().toLocaleString("en-ZA")}`
      );
    } catch (e) { console.log("[PROJO Delivery] WhatsApp notification failed:", e.message); }

    res.status(201).json({
      message: discount.discountApplied > 0
        ? `Delivery booked! ${discount.tierName} tier discount of ${discount.discountPct}% applied (R${discount.discountApplied} off)`
        : "Delivery booked!",
      delivery,
      loyaltyDiscount: discount.discountApplied,
      loyaltyTier: discount.tierName,
    });
  } catch (err) {
    console.error("[PROJO Delivery] Book error:", err.message);
    res.status(500).json({ error: "Could not book delivery: " + err.message });
  }
};

// GET /api/deliveries
exports.getDeliveries = async (req, res) => {
  try {
    const deliveries = await prisma.delivery.findMany({
      where: { senderId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json({ deliveries });
  } catch (err) {
    res.json({ deliveries: [] });
  }
};

// GET /api/deliveries/track/:trackingNumber
exports.trackDelivery = async (req, res) => {
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { trackingNumber: req.params.trackingNumber },
    });
    if (!delivery) return res.status(404).json({ error: "Delivery not found" });
    res.json({ delivery });
  } catch (err) {
    res.status(500).json({ error: "Could not track delivery" });
  }
};
