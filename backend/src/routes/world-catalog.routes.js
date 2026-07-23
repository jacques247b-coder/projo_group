// PROJO WORLD — Catalog, Cinema, Login Streak, Coin Purchase
const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── CATALOG ───────────────────────────────────────────────────

// Public catalog
router.get("/catalog", authenticate, async (req, res) => {
  try {
    const { category } = req.query;
    const where = { isActive: true };
    if (category) where.category = category;
    const items = await prisma.worldCatalogItem.findMany({
      where, orderBy: [{ isSpecialOffer: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }]
    });
    // Get user's purchases
    const purchases = await prisma.worldItemPurchase.findMany({
      where: { userId: req.user.id }, select: { itemId: true }
    });
    const ownedIds = new Set(purchases.map(p => p.itemId));
    res.json({ items: items.map(i => ({ ...i, owned: ownedIds.has(i.id) })) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Buy catalog item with coins
router.post("/catalog/:id/buy", authenticate, async (req, res) => {
  try {
    const item = await prisma.worldCatalogItem.findUnique({ where: { id: req.params.id } });
    if (!item || !item.isActive) return res.status(404).json({ error: "Item not found" });
    if (!item.coinCost) return res.status(400).json({ error: "This item requires real payment" });

    // Check already owned
    const owned = await prisma.worldItemPurchase.findFirst({ where: { userId: req.user.id, itemId: item.id } });
    if (owned) return res.status(409).json({ error: "Already owned" });

    // Check balance
    const coins = await prisma.worldCoins.findUnique({ where: { userId: req.user.id } });
    if (!coins || coins.balance < item.coinCost) return res.status(400).json({ error: "Not enough coins" });

    await Promise.all([
      prisma.worldItemPurchase.create({ data: { userId: req.user.id, itemId: item.id, paidCoins: item.coinCost } }),
      prisma.worldCoins.update({ where: { userId: req.user.id }, data: { balance: { decrement: item.coinCost }, lifetimeSpent: { increment: item.coinCost } } }),
      prisma.worldCoinTransaction.create({ data: { userId: req.user.id, amount: -item.coinCost, reason: "CATALOG_PURCHASE", referenceId: item.id } })
    ]);
    res.json({ success: true, item, coinsSpent: item.coinCost });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Buy coin pack (real money — integrate with existing payment)
router.post("/catalog/:id/buy-coins", authenticate, async (req, res) => {
  try {
    const { paymentRef } = req.body;
    const item = await prisma.worldCatalogItem.findUnique({ where: { id: req.params.id } });
    if (!item || item.category !== "COIN_PACK") return res.status(400).json({ error: "Not a coin pack" });

    // Check not already redeemed
    if (paymentRef) {
      const existing = await prisma.worldItemPurchase.findFirst({ where: { paymentRef } });
      if (existing) return res.status(409).json({ error: "Payment already redeemed" });
    }

    const total = (item.coinsGranted || 0) + (item.bonusCoins || 0);
    await Promise.all([
      prisma.worldItemPurchase.create({ data: { userId: req.user.id, itemId: item.id, paidZar: item.realPriceZar, paymentRef } }),
      prisma.worldCoins.upsert({
        where: { userId: req.user.id },
        create: { userId: req.user.id, balance: total, lifetimeEarned: total },
        update: { balance: { increment: total }, lifetimeEarned: { increment: total } }
      }),
      prisma.worldCoinTransaction.create({ data: { userId: req.user.id, amount: total, reason: "COIN_PURCHASE", referenceId: item.id } })
    ]);
    res.json({ success: true, coinsAdded: total, item });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── ADMIN CATALOG MANAGEMENT ──────────────────────────────────

function adminOnly(req, res, next) {
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Admin only" });
  next();
}

router.post("/catalog", authenticate, adminOnly, async (req, res) => {
  try {
    const item = await prisma.worldCatalogItem.create({
      data: { ...req.body, addedById: req.user.id,
        offerEndsAt: req.body.offerEndsAt ? new Date(req.body.offerEndsAt) : null,
        coinCost: req.body.coinCost ? parseInt(req.body.coinCost) : null,
        coinsGranted: req.body.coinsGranted ? parseInt(req.body.coinsGranted) : null,
        bonusCoins: req.body.bonusCoins ? parseInt(req.body.bonusCoins) : null,
        realPriceZar: req.body.realPriceZar ? parseFloat(req.body.realPriceZar) : null,
      }
    });
    // Send push notification to all users
    if (req.body.notify !== false) {
      const subs = await prisma.pushSubscription.findMany({ take: 500 });
      // Fire-and-forget push to all (reuse existing push service if available)
      try {
        const pushService = require("../services/push.service");
        await pushService.sendToAll({
          title: item.isSpecialOffer ? "🔥 Special Offer in PROJO World!" : "🌍 New item in PROJO World!",
          body: `${item.icon} ${item.name} is now available${item.isSpecialOffer ? " — limited time!" : ""}`,
          url: "/world"
        });
      } catch {}
      await prisma.worldCatalogItem.update({ where: { id: item.id }, data: { notified: true } });
    }
    res.json({ item });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put("/catalog/:id", authenticate, adminOnly, async (req, res) => {
  try {
    const item = await prisma.worldCatalogItem.update({
      where: { id: req.params.id },
      data: { ...req.body, offerEndsAt: req.body.offerEndsAt ? new Date(req.body.offerEndsAt) : null }
    });
    res.json({ item });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete("/catalog/:id", authenticate, adminOnly, async (req, res) => {
  try {
    await prisma.worldCatalogItem.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── DAILY LOGIN STREAK ────────────────────────────────────────

router.post("/login-check", authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    let streak = await prisma.worldLoginStreak.findUnique({ where: { userId: req.user.id } });

    if (!streak) {
      streak = await prisma.worldLoginStreak.create({
        data: { userId: req.user.id, currentStreak: 1, todayProgress: 1, lastLoginDate: today, totalDaysLogged: 1 }
      });
      return res.json({ streak, coinEarned: false, message: "Day 1 of 5 — 20% progress!" });
    }

    // Already logged in today
    if (streak.lastLoginDate === today) {
      return res.json({ streak, coinEarned: false, alreadyChecked: true });
    }

    const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const consecutive = streak.lastLoginDate === yesterdayStr;

    const newProgress = consecutive ? (streak.todayProgress % 5) + 1 : 1;
    const coinEarned = newProgress === 5 || (streak.todayProgress === 4);
    const newStreak = consecutive ? streak.currentStreak + 1 : 1;

    const updateData = {
      currentStreak: newStreak,
      todayProgress: coinEarned ? 0 : newProgress,
      lastLoginDate: today,
      totalDaysLogged: streak.totalDaysLogged + 1,
      ...(coinEarned ? { coinsFromLogins: { increment: 1 } } : {})
    };

    streak = await prisma.worldLoginStreak.update({ where: { userId: req.user.id }, data: updateData });

    if (coinEarned) {
      await Promise.all([
        prisma.worldCoins.upsert({
          where: { userId: req.user.id },
          create: { userId: req.user.id, balance: 1, lifetimeEarned: 1 },
          update: { balance: { increment: 1 }, lifetimeEarned: { increment: 1 } }
        }),
        prisma.worldCoinTransaction.create({ data: { userId: req.user.id, amount: 1, reason: "DAILY_LOGIN" } })
      ]);
    }

    res.json({
      streak,
      coinEarned,
      message: coinEarned ? "🎉 You earned 1 World Coin! Keep it up!" : `Day ${newProgress} of 5 — ${newProgress * 20}% progress`
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get("/login-streak", authenticate, async (req, res) => {
  try {
    const streak = await prisma.worldLoginStreak.findUnique({ where: { userId: req.user.id } });
    res.json({ streak: streak || { currentStreak: 0, todayProgress: 0, totalDaysLogged: 0, coinsFromLogins: 0 } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── WATCH PARTY ───────────────────────────────────────────────

router.post("/cinema/party", authenticate, async (req, res) => {
  try {
    const { videoUrl, videoTitle, channelName } = req.body;
    if (!videoUrl) return res.status(400).json({ error: "Video URL required" });
    // End any existing party by this host
    await prisma.watchParty.updateMany({ where: { hostId: req.user.id, isLive: true }, data: { isLive: false, endedAt: new Date() } });
    const party = await prisma.watchParty.create({
      data: { hostId: req.user.id, videoUrl, videoTitle: videoTitle || "Watch Party", channelName, isLive: true,
        members: { create: { userId: req.user.id } } }
    });
    res.json({ party });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get("/cinema/party/active", authenticate, async (req, res) => {
  try {
    const parties = await prisma.watchParty.findMany({
      where: { isLive: true },
      include: {
        host: { select: { name: true } },
        _count: { select: { members: true } }
      },
      orderBy: { startedAt: "desc" },
      take: 10
    });
    res.json({ parties: parties.map(p => ({ ...p, memberCount: p._count.members })) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post("/cinema/party/:id/join", authenticate, async (req, res) => {
  try {
    await prisma.watchPartyMember.upsert({
      where: { partyId_userId: { partyId: req.params.id, userId: req.user.id } },
      create: { partyId: req.params.id, userId: req.user.id },
      update: {}
    });
    const party = await prisma.watchParty.findUnique({
      where: { id: req.params.id },
      include: { host: { select: { name: true } }, members: { include: { user: { select: { name: true } } } }, messages: { orderBy: { createdAt: "desc" }, take: 30, include: { user: { select: { name: true } } } } }
    });
    res.json({ party });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post("/cinema/party/:id/message", authenticate, async (req, res) => {
  try {
    const msg = await prisma.watchPartyMessage.create({
      data: { partyId: req.params.id, userId: req.user.id, body: req.body.body, reaction: req.body.reaction },
      include: { user: { select: { name: true } } }
    });
    res.json({ message: msg });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post("/cinema/party/:id/end", authenticate, async (req, res) => {
  try {
    await prisma.watchParty.update({ where: { id: req.params.id, hostId: req.user.id }, data: { isLive: false, endedAt: new Date() } });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
