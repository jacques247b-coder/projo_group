// PROJO WORLD — Backend Routes
// Coins sync from real spend, gifts, friends
const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── COINS ─────────────────────────────────────────────────────

// Get my coin balance + sync from real loyalty points
router.get("/coins", authenticate, async (req, res) => {
  try {
    // Get or create coin wallet
    let coins = await prisma.worldCoins.findUnique({ where: { userId: req.user.id } });
    if (!coins) {
      coins = await prisma.worldCoins.create({ data: { userId: req.user.id, balance: 0 } });
    }

    // Sync from real loyalty points (1 coin per R100 spend = loyaltyPoints/100 rounded)
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
    const loyaltyDerived = wallet ? Math.floor(wallet.lifetimeSpend / 100) : 0;

    res.json({
      worldCoins: coins.balance,
      lifetimeEarned: coins.lifetimeEarned,
      lifetimeSpent: coins.lifetimeSpent,
      loyaltyPoints: wallet?.loyaltyPoints || 0,
      loyaltyDerivedCoins: loyaltyDerived, // coins earned from real spend
      lifetimeSpendZar: wallet?.lifetimeSpend || 0,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Add coins (called from in-app actions: move, chat, dance etc.)
router.post("/coins/earn", authenticate, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    if (!amount || amount < 0 || amount > 100) return res.status(400).json({ error: "Invalid amount" });
    const [coins] = await Promise.all([
      prisma.worldCoins.upsert({
        where: { userId: req.user.id },
        create: { userId: req.user.id, balance: amount, lifetimeEarned: amount },
        update: { balance: { increment: amount }, lifetimeEarned: { increment: amount } }
      }),
      prisma.worldCoinTransaction.create({ data: { userId: req.user.id, amount, reason: reason || "ACTION" } })
    ]);
    res.json({ balance: coins.balance, earned: amount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Sync coins from real spend — called when a ride/delivery completes
// Rule: 1 world coin per R100 spent (matches loyaltyPoints logic)
router.post("/coins/sync-spend", authenticate, async (req, res) => {
  try {
    const { amountZar, referenceId } = req.body;
    const coinsEarned = Math.floor(amountZar / 100);
    if (coinsEarned <= 0) return res.json({ earned: 0 });

    // Check not already synced for this reference
    if (referenceId) {
      const existing = await prisma.worldCoinTransaction.findFirst({ where: { userId: req.user.id, referenceId, reason: "REAL_SPEND" } });
      if (existing) return res.json({ earned: 0, alreadySynced: true });
    }

    const [coins] = await Promise.all([
      prisma.worldCoins.upsert({
        where: { userId: req.user.id },
        create: { userId: req.user.id, balance: coinsEarned, lifetimeEarned: coinsEarned },
        update: { balance: { increment: coinsEarned }, lifetimeEarned: { increment: coinsEarned } }
      }),
      prisma.worldCoinTransaction.create({ data: { userId: req.user.id, amount: coinsEarned, reason: "REAL_SPEND", referenceId } })
    ]);
    res.json({ balance: coins.balance, earned: coinsEarned, amountZar });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── FRIENDS ───────────────────────────────────────────────────

router.get("/friends", authenticate, async (req, res) => {
  try {
    const friends = await prisma.worldFriend.findMany({
      where: { OR: [{ userId: req.user.id, status: "ACCEPTED" }, { friendId: req.user.id, status: "ACCEPTED" }] },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        friend: { select: { id: true, name: true, phone: true } }
      }
    });
    // Return the "other person" in each pair
    const list = friends.map(f => f.userId === req.user.id ? { ...f.friend, friendshipId: f.id } : { ...f.user, friendshipId: f.id });
    res.json({ friends: list });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/friends/requests", authenticate, async (req, res) => {
  try {
    const requests = await prisma.worldFriend.findMany({
      where: { friendId: req.user.id, status: "PENDING" },
      include: { user: { select: { id: true, name: true } } }
    });
    res.json({ requests });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/friends/add", authenticate, async (req, res) => {
  try {
    const { friendId } = req.body;
    if (friendId === req.user.id) return res.status(400).json({ error: "Cannot add yourself" });
    const existing = await prisma.worldFriend.findFirst({ where: { OR: [{ userId: req.user.id, friendId }, { userId: friendId, friendId: req.user.id }] } });
    if (existing) return res.status(409).json({ error: "Already friends or pending" });
    const request = await prisma.worldFriend.create({ data: { userId: req.user.id, friendId, status: "PENDING" } });
    res.json({ request });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/friends/:id/accept", authenticate, async (req, res) => {
  try {
    const friend = await prisma.worldFriend.update({ where: { id: req.params.id, friendId: req.user.id }, data: { status: "ACCEPTED" } });
    res.json({ friend });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/friends/:id", authenticate, async (req, res) => {
  try {
    await prisma.worldFriend.deleteMany({ where: { id: req.params.id, OR: [{ userId: req.user.id }, { friendId: req.user.id }] } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Search users to add as friends
router.get("/friends/search", authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ users: [] });
    const users = await prisma.user.findMany({
      where: { AND: [{ id: { not: req.user.id } }, { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] }] },
      select: { id: true, name: true, phone: true },
      take: 10
    });
    res.json({ users });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GIFTS ─────────────────────────────────────────────────────

const GIFT_COSTS = { PARCEL: 20, FLOWERS: 15, CAKE: 25, BALLOON: 10, TROPHY: 50, MYSTERY: 30 };
const GIFT_ICONS = { PARCEL: "📦", FLOWERS: "💐", CAKE: "🎂", BALLOON: "🎈", TROPHY: "🏆", MYSTERY: "🎁" };

router.post("/gifts/send", authenticate, async (req, res) => {
  try {
    const { toUserId, giftType, message } = req.body;
    const cost = GIFT_COSTS[giftType];
    if (!cost) return res.status(400).json({ error: "Invalid gift type" });

    // Check balance
    const coins = await prisma.worldCoins.findUnique({ where: { userId: req.user.id } });
    if (!coins || coins.balance < cost) return res.status(400).json({ error: "Not enough coins" });

    // Check friend
    const areFriends = await prisma.worldFriend.findFirst({
      where: { status: "ACCEPTED", OR: [{ userId: req.user.id, friendId: toUserId }, { userId: toUserId, friendId: req.user.id }] }
    });
    if (!areFriends) return res.status(403).json({ error: "You can only send gifts to friends" });

    // Deduct coins + send gift + recipient gets bonus coins
    const [gift] = await Promise.all([
      prisma.worldGift.create({ data: { fromUserId: req.user.id, toUserId, giftType, message, coinCost: cost } }),
      prisma.worldCoins.update({ where: { userId: req.user.id }, data: { balance: { decrement: cost }, lifetimeSpent: { increment: cost } } }),
      prisma.worldCoinTransaction.create({ data: { userId: req.user.id, amount: -cost, reason: "GIFT_SENT" } }),
      // Recipient gets 5 bonus coins on opening
      prisma.worldCoins.upsert({ where: { userId: toUserId }, create: { userId: toUserId, balance: 5, lifetimeEarned: 5 }, update: {} }),
    ]);

    const sender = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } });
    res.json({ gift, icon: GIFT_ICONS[giftType], senderName: sender.name, cost });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get my received gifts
router.get("/gifts/inbox", authenticate, async (req, res) => {
  try {
    const gifts = await prisma.worldGift.findMany({
      where: { toUserId: req.user.id },
      include: { fromUser: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20
    });
    res.json({ gifts: gifts.map(g => ({ ...g, icon: GIFT_ICONS[g.giftType] })) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get my sent gifts
router.get("/gifts/sent", authenticate, async (req, res) => {
  try {
    const gifts = await prisma.worldGift.findMany({
      where: { fromUserId: req.user.id },
      include: { toUser: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20
    });
    res.json({ gifts: gifts.map(g => ({ ...g, icon: GIFT_ICONS[g.giftType] })) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Open a gift (earn +5 coins)
router.post("/gifts/:id/open", authenticate, async (req, res) => {
  try {
    const gift = await prisma.worldGift.findFirst({ where: { id: req.params.id, toUserId: req.user.id, opened: false } });
    if (!gift) return res.status(404).json({ error: "Gift not found or already opened" });
    await Promise.all([
      prisma.worldGift.update({ where: { id: gift.id }, data: { opened: true, openedAt: new Date() } }),
      prisma.worldCoins.update({ where: { userId: req.user.id }, data: { balance: { increment: 5 }, lifetimeEarned: { increment: 5 } } }),
      prisma.worldCoinTransaction.create({ data: { userId: req.user.id, amount: 5, reason: "GIFT_RECEIVED" } })
    ]);
    res.json({ success: true, coinsEarned: 5, icon: GIFT_ICONS[gift.giftType] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── LEADERBOARD ───────────────────────────────────────────────
router.get("/leaderboard", authenticate, async (req, res) => {
  try {
    const top = await prisma.worldCoins.findMany({
      orderBy: { lifetimeEarned: "desc" },
      take: 20,
      include: { user: { select: { name: true } } }
    });
    res.json({ leaderboard: top.map((e, i) => ({ rank: i + 1, name: e.user.name, coins: e.balance, lifetime: e.lifetimeEarned })) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
