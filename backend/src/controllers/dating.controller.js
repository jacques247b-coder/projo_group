const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET /api/dating/profiles — discover profiles
exports.getProfiles = async (req, res) => {
  try {
    const { userId } = req.user;
    const { ageMin=18, ageMax=60, city, goals, distance=50, limit=20 } = req.query;
    const profiles = await prisma.datingProfile.findMany({
      where: {
        userId: { not: req.user.id },
        isActive: true,
        isIncognito: false,
        age: { gte: parseInt(ageMin), lte: parseInt(ageMax) },
        ...(city ? { city } : {}),
      },
      take: parseInt(limit),
      orderBy: [{ isFeatured:"desc" }, { boostActive:"desc" }, { isVerified:"desc" }, { lastActive:"desc" }],
      include: { user: { select: { name:true, email:true } } },
    });
    res.json({ profiles });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/dating/profile — create/update profile
exports.upsertProfile = async (req, res) => {
  try {
    const data = req.body;
    const profile = await prisma.datingProfile.upsert({
      where: { userId: req.user.id },
      update: { ...data, updatedAt: new Date() },
      create: { ...data, userId: req.user.id },
    });
    res.json({ profile });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/dating/like/:toId — like a profile
exports.likeProfile = async (req, res) => {
  try {
    const myProfile = await prisma.datingProfile.findUnique({ where: { userId: req.user.id } });
    if (!myProfile) return res.status(404).json({ error: "Create your profile first" });
    const toProfile = await prisma.datingProfile.findUnique({ where: { id: req.params.toId } });
    if (!toProfile) return res.status(404).json({ error: "Profile not found" });

    await prisma.datingLike.upsert({
      where: { fromId_toId: { fromId: myProfile.id, toId: toProfile.id } },
      update: { isSuperLike: req.body.isSuperLike || false },
      create: { fromId: myProfile.id, toId: toProfile.id, isSuperLike: req.body.isSuperLike || false },
    });

    // Check for mutual like = match!
    const mutualLike = await prisma.datingLike.findUnique({
      where: { fromId_toId: { fromId: toProfile.id, toId: myProfile.id } }
    });

    let match = null;
    if (mutualLike) {
      match = await prisma.datingMatch.upsert({
        where: { profile1Id_profile2Id: { profile1Id: myProfile.id, profile2Id: toProfile.id } },
        update: {},
        create: {
          profile1Id: myProfile.id, profile2Id: toProfile.id,
          compatScore: Math.floor(Math.random() * 20 + 75),
        },
      });
    }

    res.json({ liked: true, matched: !!match, match });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/dating/matches — get my matches
exports.getMatches = async (req, res) => {
  try {
    const myProfile = await prisma.datingProfile.findUnique({ where: { userId: req.user.id } });
    if (!myProfile) return res.json({ matches: [] });
    const matches = await prisma.datingMatch.findMany({
      where: { OR: [{ profile1Id: myProfile.id }, { profile2Id: myProfile.id }], isActive: true },
      include: {
        profile1: true, profile2: true,
        messages: { orderBy: { createdAt:"desc" }, take:1 },
      },
      orderBy: { createdAt:"desc" },
    });
    res.json({ matches });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/dating/message — send message (premium only)
exports.sendMessage = async (req, res) => {
  try {
    const myProfile = await prisma.datingProfile.findUnique({ where: { userId: req.user.id } });
    if (!myProfile) return res.status(404).json({ error: "Profile not found" });
    if (!myProfile.isPremium) return res.status(403).json({ error: "Premium required to send messages" });
    const { matchId, content, type="text", mediaUrl } = req.body;
    const match = await prisma.datingMatch.findUnique({ where: { id: matchId }, include: { profile1:true, profile2:true } });
    if (!match) return res.status(404).json({ error: "Match not found" });
    const toProfile = match.profile1Id === myProfile.id ? match.profile2 : match.profile1;
    const message = await prisma.datingMessage.create({
      data: { matchId, fromId: myProfile.id, toId: toProfile.id, content, type, mediaUrl },
    });
    res.json({ message });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/dating/messages/:matchId
exports.getMessages = async (req, res) => {
  try {
    const messages = await prisma.datingMessage.findMany({
      where: { matchId: req.params.matchId },
      orderBy: { createdAt:"asc" },
    });
    res.json({ messages });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
