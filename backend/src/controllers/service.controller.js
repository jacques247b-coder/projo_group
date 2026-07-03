// PROJO GROUP — Service Checkout Controller (Fixed quote logic)
// FIX: requiresQuote now checks if product HAS option groups before
// flagging price=0 as "needs quote" — products with options aren't quote-only
const { PrismaClient } = require("@prisma/client");
const { applyLoyaltyDiscount, calculatePoints } = require("../services/loyalty.service");
const { sendWhatsAppNotification } = require("../services/whatsapp.service");
const prisma = new PrismaClient();

async function getUserLoyaltyPoints(userId) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  return calculatePoints(wallet?.balanceZar || 0);
}

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

// POST /api/services/book
exports.bookService = async (req, res) => {
  const { productId, scheduledFor, address, phone, notes, paidWithWallet, selectedChoiceIds } = req.body;

  if (!productId || !address || !phone) {
    return res.status(400).json({ error: "Service, address and phone are required" });
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: "Service not found" });
    if (!product.isActive) return res.status(400).json({ error: "This service is currently unavailable" });

    const groups = await prisma.productOptionGroup.findMany({
      where: { productId },
      include: { choices: true },
    });

    // Check required groups (skip TEXT groups here — validated client-side via notes)
    const requiredGroups = groups.filter(g => g.required && g.type !== "TEXT");
    for (const group of requiredGroups) {
      const hasSelection = group.choices.some(c => (selectedChoiceIds || []).includes(c.id));
      if (!hasSelection) {
        return res.status(400).json({ error: `Please select an option for "${group.name}"` });
      }
    }

    const { total: optionsTotal, selections } = await calculateOptionsTotal(productId, selectedChoiceIds || []);
    const basePrice = product.priceZar + optionsTotal;

    // Only a true quote-only product if it has NO option groups AND price is 0
    const hasOptions = groups.length > 0;
    if (basePrice <= 0 && !hasOptions) {
      return res.status(400).json({
        error: "This service requires a custom quote. Please book via WhatsApp.",
      });
    }

    const points = await getUserLoyaltyPoints(req.user.id);
    const discount = applyLoyaltyDiscount(basePrice, points);
    const finalPrice = discount.finalFare;

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

    // Auto-forward to WhatsApp Business
    try {
      const customer = await prisma.user.findUnique({ where: { id: req.user.id } }).catch(() => null);
      const optionsSummary = selections.map(s => `${s.groupName}: ${s.choiceLabel}`).join(", ");
      await sendWhatsAppNotification(
        `🛠️ NEW SERVICE BOOKING - PROJO GROUP

` +
        `Service: ${product.name}
` +
        `Category: ${product.category}
` +
        `Customer: ${customer?.name || "Unknown"}
` +
        `Phone: ${phone}
` +
        `Address: ${address}
` +
        (scheduledFor ? "Scheduled: " + new Date(scheduledFor).toLocaleString("en-ZA") + "\n" : "") +
        (optionsSummary ? "Options: " + optionsSummary + "\n" : "") +
        (notes ? "Notes: " + notes + "\n" : "") +
        `Fare: R${finalPrice.toFixed(2)}
` +
        `Payment: ${paidWithWallet ? "PROJO Wallet" : "Pending"}
` +
        `Time: ${new Date().toLocaleString("en-ZA")}`
      );
    } catch (e) { console.log("[PROJO Service] WhatsApp notification failed:", e.message); }

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

// POST /api/services/quote — FIXED: respects presence of option groups
exports.getQuote = async (req, res) => {
  const { productId, selectedChoiceIds } = req.body;
  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: "Service not found" });

    const groups = await prisma.productOptionGroup.findMany({
      where: { productId },
    });
    const hasOptions = groups.length > 0;

    const { total: optionsTotal, selections } = await calculateOptionsTotal(productId, selectedChoiceIds || []);
    const basePrice = product.priceZar + optionsTotal;

    // Only flag as "requires quote" if there are truly no options to configure
    // AND base price is 0 (a genuine quote-only service like Pest Control)
    if (!hasOptions && basePrice <= 0) {
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
