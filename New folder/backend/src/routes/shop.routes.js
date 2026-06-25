// ============================================================
// PROJO GROUP — Shop Routes (Step 6)
// Product catalog, orders, checkout with Wallet
// Delivery within Rustenburg only
// ============================================================
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET /api/shop/products
router.get("/products", async (req, res) => {
  const { category } = req.query;
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, ...(category && { category }) },
      orderBy: { createdAt: "desc" },
    });
    const categories = [...new Set(products.map(p => p.category))];
    res.json({ products, categories });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/shop/products/:id
router.get("/products/:id", async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ product });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/shop/orders — place order (wallet or card)
router.post("/orders", authenticate, async (req, res) => {
  const { items, deliveryAddress, deliveryLat, deliveryLng, paidWithWallet } = req.body;
  if (!items?.length) return res.status(400).json({ error: "No items in order" });
  try {
    // Fetch product prices
    const productIds = items.map(i => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

    let subtotal = 0;
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (product.stockQty < item.quantity) throw new Error(`${product.name} out of stock`);
      const lineTotal = product.priceZar * item.quantity;
      subtotal += lineTotal;
      return { productId: item.productId, quantity: item.quantity, priceZar: product.priceZar };
    });

    const deliveryFee = 25; // R25 flat delivery within Rustenburg
    const total = subtotal + deliveryFee;

    // Wallet check
    if (paidWithWallet) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
      if (!wallet || wallet.balanceZar < total)
        return res.status(402).json({ error: `Insufficient wallet balance. Need R${total.toFixed(2)}` });
      await prisma.wallet.update({ where: { userId: req.user.id }, data: { balanceZar: { decrement: total } } });
    }

    const order = await prisma.order.create({
      data: {
        userId: req.user.id, subtotal, deliveryFee, total,
        deliveryAddress, deliveryLat, deliveryLng,
        status: "CONFIRMED", paidWithWallet,
        items: { create: orderItems },
      },
      include: { items: { include: { product: true } } },
    });

    // Reduce stock
    for (const item of items) {
      await prisma.product.update({ where: { id: item.productId },
        data: { stockQty: { decrement: item.quantity } } });
    }

    res.status(201).json({ order, message: "Order placed! Delivery within Rustenburg area." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/shop/orders — order history
router.get("/orders", authenticate, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: { items: { include: { product: true } } },
    });
    res.json({ orders });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
