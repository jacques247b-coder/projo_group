// PROJO GROUP — Promo Code Controller
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// POST /api/promo/validate — check if a code is valid and get discount
exports.validateCode = async (req, res) => {
  const { code, orderAmount } = req.body;
  if (!code) return res.status(400).json({ error: "Promo code required" });

  try {
    const promo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!promo) return res.status(404).json({ error: "Invalid promo code" });
    if (!promo.isActive) return res.status(400).json({ error: "This code is no longer active" });
    if (promo.expiresAt && new Date() > promo.expiresAt)
      return res.status(400).json({ error: "This code has expired" });
    if (promo.maxUses && promo.usedCount >= promo.maxUses)
      return res.status(400).json({ error: "This code has reached its usage limit" });
    if (promo.minOrderAmount && orderAmount < promo.minOrderAmount)
      return res.status(400).json({
        error: `Minimum order of R${promo.minOrderAmount} required for this code`
      });

    // Check if user already used this code (if one-time-per-user)
    if (promo.oneTimePerUser) {
      const used = await prisma.promoUsage.findFirst({
        where: { promoCodeId: promo.id, userId: req.user.id },
      });
      if (used) return res.status(400).json({ error: "You've already used this code" });
    }

    let discount = 0;
    if (promo.discountType === "PERCENTAGE") {
      discount = (orderAmount || 0) * (promo.discountValue / 100);
      if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
    } else {
      discount = promo.discountValue;
    }

    res.json({
      valid: true,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discount: parseFloat(discount.toFixed(2)),
      description: promo.description,
    });
  } catch (err) {
    res.status(500).json({ error: "Could not validate code" });
  }
};

// POST /api/promo/redeem — mark a promo as used (called after successful order/payment)
exports.redeemCode = async (req, res) => {
  const { code } = req.body;
  try {
    const promo = await prisma.promoCode.findUnique({ where: { code: code.toUpperCase().trim() } });
    if (!promo) return res.status(404).json({ error: "Promo code not found" });

    await prisma.$transaction([
      prisma.promoCode.update({
        where: { id: promo.id },
        data: { usedCount: { increment: 1 } },
      }),
      prisma.promoUsage.create({
        data: { promoCodeId: promo.id, userId: req.user.id },
      }),
    ]);

    res.json({ message: "Promo code redeemed" });
  } catch (err) {
    res.status(500).json({ error: "Could not redeem code" });
  }
};

// ── Admin endpoints ──────────────────────────────────────────

// GET /api/admin/promo-codes
exports.getAllCodes = async (req, res) => {
  try {
    const codes = await prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ codes });
  } catch (err) {
    res.status(500).json({ error: "Could not load promo codes" });
  }
};

// POST /api/admin/promo-codes
exports.createCode = async (req, res) => {
  const {
    code, description, discountType, discountValue,
    minOrderAmount, maxDiscount, maxUses, expiresAt, oneTimePerUser,
  } = req.body;

  if (!code || !discountType || !discountValue) {
    return res.status(400).json({ error: "Code, discount type and value are required" });
  }

  try {
    const promo = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase().trim(),
        description: description || "",
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        oneTimePerUser: !!oneTimePerUser,
        isActive: true,
        usedCount: 0,
      },
    });
    res.status(201).json({ message: "Promo code created", promo });
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "This code already exists" });
    res.status(500).json({ error: "Could not create promo code" });
  }
};

// PUT /api/admin/promo-codes/:id
exports.updateCode = async (req, res) => {
  const { isActive, description, maxUses, expiresAt } = req.body;
  try {
    const promo = await prisma.promoCode.update({
      where: { id: req.params.id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(description !== undefined && { description }),
        ...(maxUses !== undefined && { maxUses: maxUses ? parseInt(maxUses) : null }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      },
    });
    res.json({ message: "Promo code updated", promo });
  } catch (err) {
    res.status(500).json({ error: "Could not update promo code" });
  }
};

// DELETE /api/admin/promo-codes/:id
exports.deleteCode = async (req, res) => {
  try {
    await prisma.promoCode.delete({ where: { id: req.params.id } });
    res.json({ message: "Promo code deleted" });
  } catch (err) {
    res.status(500).json({ error: "Could not delete promo code" });
  }
};
