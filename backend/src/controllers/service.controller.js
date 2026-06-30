// PROJO GROUP — Service Checkout Controller (with configurable options)
const { PrismaClient } = require("@prisma/client");
const { applyLoyaltyDiscount, calculatePoints } = require("../services/loyalty.service");
const prisma = new PrismaClient();

async function getUserLoyaltyPoints(userId) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  return calculatePoints(wallet?.balanceZar || 0);
}

// Calculate base price + selected option modifiers
async function calculateOptionsTotal(productId, selectedChoiceIds = []) {
  if (!selectedChoiceIds.length) return { total: 0, selections: [] };

  const choices = await prisma.productOptionChoice.findMany({
    where: { id: { in: selectedChoiceIds } },
    include: { group: true },
  });

  const total = choices.reduce((sum, c) => sum + c.priceModifier, 0);
  const selections = choices.map(c => ({
    groupName: c.group.name,
    choiceLabel: c.label,
    priceModifier: c.priceModifier,
  }));

  return { total, selections };
}

// POST /api/services/book — book with selected options + loyalty discount
exports.bookService = async (req, res) => {
  const { productId, scheduledFor, address, phone, notes, paidWithWallet, selectedChoiceIds } = req.body;

  if (!productId || !address || !phone) {
    return res.status(400).json({ error: "Service, address and phone are required" });
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: "Service not found" });
    if (!product.isActive) return res.status(400).json({ error: "This service is currently unavailable" });

    // Check for required option groups
    const groups = await prisma.productOptionGroup.findMany({
      where: { productId },
      include: { choices: true },
    });
    const requiredGroups = groups.filter(g => g.required);
    for (const group of requiredGroups) {
      const hasSelection = group.choices.some(c => (selectedChoiceIds || []).includes(c.id));
      if (!hasSelection) {
        return res.status(400).json({ error: `Please select an option for "${group.name}"` });
      }
    }

    // Calculate price: base + options
    const { total: optionsTotal, selections } = await calculateOptionsTotal(productId, selectedChoiceIds || []);
    const basePrice = product.priceZar + optionsTotal;

    if (basePrice <= 0) {
      return res.status(400).json({
        error: "This service requires a custom quote. Please book via WhatsApp.",
      });
    }

    // Apply loyalty discount
    const points = await getUserLoyaltyPoints(req.user.id);
    const discount = applyLoyaltyDiscount(basePrice, points);
    const finalPrice = discount.finalFare;

    // Handle wallet payment
    if (paidWithWallet) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
      if (!wallet || wallet.balanceZar < finalPrice) {
        return res.status(402).json({
          error: `Insufficient wallet balance. Need R${finalPrice.toFixed(2)}, you have R${(wallet?.balanceZar || 0).toFixed(2)}`,
        });
      }

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
        basePrice,
        finalPrice,
        loyaltyDiscount: discount.discountApplied,
        loyaltyTier: discount.tierName,
        paidWithWallet: !!paidWithWallet,
        status: paidWithWallet ? "CONFIRMED" : "PENDING_PAYMENT",
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        address,
        phone,
        notes: notes || "",
        selectedOptions: JSON.stringify(selections),
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

// POST /api/services/quote — calculate live price preview with options + loyalty
exports.getQuote = async (req, res) => {
  const { productId, selectedChoiceIds } = req.body;
  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: "Service not found" });

    const { total: optionsTotal, selections } = await calculateOptionsTotal(productId, selectedChoiceIds || []);
    const basePrice = product.priceZar + optionsTotal;

    if (basePrice <= 0) {
      return res.json({ requiresQuote: true, product, optionsTotal: 0, selections: [] });
    }

    const points = await getUserLoyaltyPoints(req.user.id);
    const discount = applyLoyaltyDiscount(basePrice, points);

    res.json({
      requiresQuote: false,
      product,
      baseProductPrice: product.priceZar,
      optionsTotal,
      selections,
      subtotal: basePrice,
      finalPrice: discount.finalFare,
      loyaltyDiscount: discount.discountApplied,
      loyaltyDiscountPct: discount.discountPct,
      loyaltyTier: discount.tierName,
    });
  } catch (err) {
    res.status(500).json({ error: "Could not get quote" });
  }
};

// GET /api/services/orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.serviceOrder.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const parsed = orders.map(o => ({
      ...o,
      selectedOptions: o.selectedOptions ? JSON.parse(o.selectedOptions) : [],
    }));
    res.json({ orders: parsed });
  } catch (err) {
    res.json({ orders: [] });
  }
};

// ── Admin endpoints ──────────────────────────────────────────

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.serviceOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const parsed = orders.map(o => ({
      ...o,
      selectedOptions: o.selectedOptions ? JSON.parse(o.selectedOptions) : [],
    }));
    res.json({ orders: parsed });
  } catch (err) {
    res.status(500).json({ error: "Could not load orders" });
  }
};

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
