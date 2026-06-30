// PROJO GROUP — Service Checkout Controller
// Handles in-app booking + payment for services (Cleaning, Painting, etc.)
// Applies loyalty discount and awards points, same as rides/deliveries
const { PrismaClient } = require("@prisma/client");
const { applyLoyaltyDiscount, calculatePoints } = require("../services/loyalty.service");
const prisma = new PrismaClient();

async function getUserLoyaltyPoints(userId) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  return calculatePoints(wallet?.balanceZar || 0);
}

// POST /api/services/book — book a service with in-app payment
exports.bookService = async (req, res) => {
  const { productId, scheduledFor, address, phone, notes, paidWithWallet } = req.body;

  if (!productId || !address || !phone) {
    return res.status(400).json({ error: "Service, address and phone are required" });
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: "Service not found" });
    if (!product.isActive) return res.status(400).json({ error: "This service is currently unavailable" });

    // Quote-only services (priceZar = 0) can't be paid in-app
    if (product.priceZar === 0) {
      return res.status(400).json({
        error: "This service requires a custom quote. Please book via WhatsApp.",
      });
    }

    // Apply loyalty discount
    const points = await getUserLoyaltyPoints(req.user.id);
    const discount = applyLoyaltyDiscount(product.priceZar, points);
    const finalPrice = discount.finalFare;

    // Handle wallet payment
    if (paidWithWallet) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
      if (!wallet || wallet.balanceZar < finalPrice) {
        return res.status(402).json({
          error: `Insufficient wallet balance. Need R${finalPrice.toFixed(2)}, you have R${(wallet?.balanceZar || 0).toFixed(2)}`,
        });
      }

      // Deduct from wallet and record transaction
      await prisma.$transaction([
        prisma.wallet.update({
          where: { userId: req.user.id },
          data: { balanceZar: { decrement: finalPrice } },
        }),
        prisma.transaction.create({
          data: {
            walletId: wallet.id,
            type: "SHOP_PAYMENT",
            status: "COMPLETED",
            amountZar: finalPrice,
            description: `${product.name} booking`,
          },
        }),
      ]);
    }

    const order = await prisma.serviceOrder.create({
      data: {
        userId: req.user.id,
        productId: product.id,
        productName: product.name,
        category: product.category,
        basePrice: product.priceZar,
        finalPrice,
        loyaltyDiscount: discount.discountApplied,
        loyaltyTier: discount.tierName,
        paidWithWallet: !!paidWithWallet,
        status: paidWithWallet ? "CONFIRMED" : "PENDING_PAYMENT",
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        address,
        phone,
        notes: notes || "",
      },
    });

    res.status(201).json({
      message: discount.discountApplied > 0
        ? `Booked! ${discount.tierName} tier discount of ${discount.discountPct}% applied (R${discount.discountApplied} off)`
        : "Service booked!",
      order,
      loyaltyDiscount: discount.discountApplied,
      loyaltyTier: discount.tierName,
    });
  } catch (err) {
    console.error("[PROJO Service] Book error:", err.message);
    res.status(500).json({ error: "Could not book service: " + err.message });
  }
};

// GET /api/services/orders — user's service order history
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.serviceOrder.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json({ orders });
  } catch (err) {
    res.json({ orders: [] });
  }
};

// GET /api/services/quote/:productId — estimate price with loyalty discount applied
exports.getQuote = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.productId } });
    if (!product) return res.status(404).json({ error: "Service not found" });

    if (product.priceZar === 0) {
      return res.json({ requiresQuote: true, product });
    }

    const points = await getUserLoyaltyPoints(req.user.id);
    const discount = applyLoyaltyDiscount(product.priceZar, points);

    res.json({
      requiresQuote: false,
      product,
      basePrice: product.priceZar,
      finalPrice: discount.finalFare,
      loyaltyDiscount: discount.discountApplied,
      loyaltyDiscountPct: discount.discountPct,
      loyaltyTier: discount.tierName,
    });
  } catch (err) {
    res.status(500).json({ error: "Could not get quote" });
  }
};

// ── Admin endpoints ──────────────────────────────────────────

// GET /api/admin/service-orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.serviceOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: "Could not load orders" });
  }
};

// PUT /api/admin/service-orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const order = await prisma.serviceOrder.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ message: "Order status updated", order });
  } catch (err) {
    res.status(500).json({ error: "Could not update order" });
  }
};
