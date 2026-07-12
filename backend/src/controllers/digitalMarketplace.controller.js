// PROJO GROUP — Digital Marketplace
// Admin uploads digital products (templates, ebooks, music, software,
// etc). Customers browse, pay from their PROJO Wallet (already fully
// working, including PayFast top-ups), and the file unlocks for download
// immediately. Direct PayFast checkout for a single purchase is a
// planned addition, not built yet — wallet payment makes this fully
// usable in the meantime.
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── Admin ──────────────────────────────────────────────────────

// POST /api/admin/digital-products
exports.adminCreateDigitalProduct = async (req, res) => {
  try {
    const { name, description, category, priceZar, coverImageUrl, fileDataUrl, fileName } = req.body;
    if (!name || !description || !priceZar || !fileDataUrl || !fileName) {
      return res.status(400).json({ error: "name, description, priceZar, fileDataUrl, and fileName are all required" });
    }
    // Base64 grows a file to ~1.33x its real size — this keeps the actual
    // uploaded file under a reasonable ~15MB before that inflation
    const approxBytes = fileDataUrl.length * 0.75;
    if (approxBytes > 15 * 1024 * 1024) {
      return res.status(400).json({ error: "File is too large — please keep digital products under 15MB for now" });
    }
    const product = await prisma.digitalProduct.create({
      data: { name, description, category: category || null, priceZar: parseFloat(priceZar), coverImageUrl: coverImageUrl || null, fileDataUrl, fileName },
    });
    res.status(201).json({ product: { ...product, fileDataUrl: undefined } });
  } catch (err) {
    res.status(500).json({ error: "Could not create product: " + err.message });
  }
};

// GET /api/admin/digital-products — every product, including inactive,
// without the (potentially large) file data
exports.adminGetDigitalProducts = async (req, res) => {
  try {
    const products = await prisma.digitalProduct.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, description: true, category: true, priceZar: true,
        coverImageUrl: true, fileName: true, isActive: true, createdAt: true,
        _count: { select: { purchases: true } },
      },
    });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: "Could not load products" });
  }
};

// PUT /api/admin/digital-products/:id
exports.adminUpdateDigitalProduct = async (req, res) => {
  try {
    const { name, description, category, priceZar, coverImageUrl, isActive } = req.body;
    const product = await prisma.digitalProduct.update({
      where: { id: req.params.id },
      data: {
        name: name || undefined,
        description: description || undefined,
        category: category !== undefined ? category : undefined,
        priceZar: priceZar !== undefined ? parseFloat(priceZar) : undefined,
        coverImageUrl: coverImageUrl !== undefined ? coverImageUrl : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });
    res.json({ product: { ...product, fileDataUrl: undefined } });
  } catch (err) {
    res.status(500).json({ error: "Could not update product" });
  }
};

// DELETE /api/admin/digital-products/:id
exports.adminDeleteDigitalProduct = async (req, res) => {
  try {
    await prisma.digitalPurchase.deleteMany({ where: { productId: req.params.id } });
    await prisma.digitalProduct.delete({ where: { id: req.params.id } });
    res.json({ message: "Product removed" });
  } catch (err) {
    res.status(500).json({ error: "Could not remove product" });
  }
};

// ── Customer-facing ────────────────────────────────────────────

// GET /api/entertainment/digital-products — browse active products,
// with whether the current user already owns each one
exports.getDigitalProducts = async (req, res) => {
  try {
    const products = await prisma.digitalProduct.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, description: true, category: true, priceZar: true, coverImageUrl: true, fileName: true, createdAt: true },
    });
    const owned = req.user
      ? await prisma.digitalPurchase.findMany({ where: { userId: req.user.id }, select: { productId: true } })
      : [];
    const ownedIds = new Set(owned.map(o => o.productId));
    res.json({ products: products.map(p => ({ ...p, owned: ownedIds.has(p.id) })) });
  } catch (err) {
    res.status(500).json({ error: "Could not load products" });
  }
};

// POST /api/entertainment/digital-products/:id/purchase — pays from the
// PROJO Wallet (top-ups already work via PayFast) and unlocks the
// download immediately
exports.purchaseDigitalProduct = async (req, res) => {
  try {
    const product = await prisma.digitalProduct.findUnique({ where: { id: req.params.id } });
    if (!product || !product.isActive) return res.status(404).json({ error: "Product not found" });

    const existing = await prisma.digitalPurchase.findUnique({
      where: { productId_userId: { productId: product.id, userId: req.user.id } },
    });
    if (existing) return res.status(400).json({ error: "You already own this — check your purchases to download it" });

    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
    if (!wallet || wallet.balanceZar < product.priceZar) {
      return res.status(400).json({ error: `Insufficient wallet balance. You need R${product.priceZar.toFixed(2)}, top up your wallet and try again.` });
    }

    const [, , purchase] = await prisma.$transaction([
      prisma.wallet.update({ where: { id: wallet.id }, data: { balanceZar: { decrement: product.priceZar } } }),
      prisma.transaction.create({
        data: { walletId: wallet.id, type: "DIGITAL_PURCHASE", status: "COMPLETED", amountZar: -product.priceZar, description: `Purchased: ${product.name}`, referenceId: product.id },
      }),
      prisma.digitalPurchase.create({ data: { productId: product.id, userId: req.user.id, pricePaid: product.priceZar } }),
    ]);

    res.status(201).json({ message: "Purchase successful — ready to download!", purchase });
  } catch (err) {
    res.status(500).json({ error: "Could not complete purchase: " + err.message });
  }
};

// GET /api/entertainment/digital-products/:id/download — only for
// someone who's actually purchased it
exports.downloadDigitalProduct = async (req, res) => {
  try {
    const purchase = await prisma.digitalPurchase.findUnique({
      where: { productId_userId: { productId: req.params.id, userId: req.user.id } },
    });
    if (!purchase) return res.status(403).json({ error: "You haven't purchased this product" });

    const product = await prisma.digitalProduct.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const match = product.fileDataUrl.match(/^data:(.+?);base64,(.+)$/);
    if (!match) return res.status(500).json({ error: "Invalid stored file" });
    const [, mimeType, base64Data] = match;
    res.set("Content-Type", mimeType);
    res.set("Content-Disposition", `attachment; filename="${product.fileName}"`);
    res.send(Buffer.from(base64Data, "base64"));
  } catch (err) {
    res.status(500).json({ error: "Could not download file" });
  }
};

// GET /api/entertainment/my-purchases
exports.getMyPurchases = async (req, res) => {
  try {
    const purchases = await prisma.digitalPurchase.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: { product: { select: { id: true, name: true, coverImageUrl: true, fileName: true, category: true } } },
    });
    res.json({ purchases });
  } catch (err) {
    res.status(500).json({ error: "Could not load purchases" });
  }
};
