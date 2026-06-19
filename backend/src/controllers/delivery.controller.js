// PROJO GROUP — Delivery Controller (Fixed)
const { PrismaClient } = require("@prisma/client");
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

// POST /api/deliveries/book
exports.bookDelivery = async (req, res) => {
  const {
    description, pickupAddress, pickupLat, pickupLng,
    recipientName, recipientPhone, dropoffAddress, dropoffLat, dropoffLng,
    distanceKm,
  } = req.body;

  try {
    const { fare } = calcDeliveryFare(pickupLat, pickupLng, dropoffLat, dropoffLng, distanceKm);

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
        fare,
        status: "PENDING",
      },
    });

    res.status(201).json({ message: "Delivery booked!", delivery });
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
