const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { computeCompatScore } = require("../utils/datingMatch");

const FREE_DAILY_LIKES = 20;
const SUPER_LIKES_PER_DAY = 5; // premium only
const BOOST_MINUTES = 30;
// Once this many real (non-demo) active profiles exist, demo/placeholder
// profiles stop appearing in Discover — no manual cleanup needed.
const DEMO_PHASEOUT_THRESHOLD = 15;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getMyProfile(userId) {
  return prisma.datingProfile.findUnique({ where: { userId } });
}

// ── PROFILE ──────────────────────────────────────────────────────
// GET /api/dating/profiles — discover profiles (excludes liked/passed/blocked/matched)
exports.getProfiles = async (req, res) => {
  try {
    const myProfile = await getMyProfile(req.user.id);
    if (!myProfile) return res.status(404).json({ error: "Create your profile first" });

    const { ageMin = 18, ageMax = 60, city, maxDistanceKm, limit = 20 } = req.query;

    // Once enough real profiles exist, stop showing demo/placeholder ones —
    // no manual cleanup needed, this re-checks on every request.
    const realProfileCount = await prisma.datingProfile.count({ where: { isActive: true, isDemo: false } });
    const includeDemoProfiles = realProfileCount < DEMO_PHASEOUT_THRESHOLD;

    const [likes, passes, blocksA, blocksB] = await Promise.all([
      prisma.datingLike.findMany({ where: { fromId: myProfile.id }, select: { toId: true } }),
      prisma.datingPass.findMany({ where: { fromId: myProfile.id }, select: { toId: true } }),
      prisma.datingBlock.findMany({ where: { blockerId: myProfile.id }, select: { blockedId: true } }),
      prisma.datingBlock.findMany({ where: { blockedId: myProfile.id }, select: { blockerId: true } }),
    ]);
    const excludeIds = new Set([
      myProfile.id,
      ...likes.map((l) => l.toId),
      ...passes.map((p) => p.toId),
      ...blocksA.map((b) => b.blockedId),
      ...blocksB.map((b) => b.blockerId),
    ]);

    let profiles = await prisma.datingProfile.findMany({
      where: {
        id: { notIn: [...excludeIds] },
        isActive: true,
        isIncognito: false,
        age: { gte: parseInt(ageMin), lte: parseInt(ageMax) },
        ...(city ? { city } : {}),
        ...(includeDemoProfiles ? {} : { isDemo: false }),
      },
      take: parseInt(limit) * 3, // over-fetch, then rank/filter by distance in-memory
      orderBy: [{ isFeatured: "desc" }, { boostActive: "desc" }, { isVerified: "desc" }, { lastActive: "desc" }],
      include: { user: { select: { name: true } } },
    });

    // Distance filter (if both sides have coordinates)
    if (maxDistanceKm && myProfile.latitude && myProfile.longitude) {
      profiles = profiles.filter((p) => {
        if (!p.latitude || !p.longitude) return true; // don't punish profiles without location set
        const km = haversineKm(myProfile.latitude, myProfile.longitude, p.latitude, p.longitude);
        p._distanceKm = Math.round(km);
        return km <= parseFloat(maxDistanceKm);
      });
    }

    // Real compatibility score, replacing the old random placeholder
    profiles = profiles
      .map((p) => ({ ...p, compatScore: computeCompatScore(myProfile, p) }))
      .sort((a, b) => (b.boostActive - a.boostActive) || (b.compatScore - a.compatScore))
      .slice(0, parseInt(limit));

    res.json({ profiles });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/dating/profile — create/update profile
const ARRAY_FIELDS = ["interestedIn", "relationshipGoals", "languages", "interests", "music", "movies", "photos"];
exports.upsertProfile = async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.userId; delete data.id; // never let the client set these

    // Defensive coercion — protects against a stray type mismatch turning
    // into an opaque Prisma validation error for the user.
    if (data.age !== undefined) {
      const age = parseInt(data.age, 10);
      if (Number.isNaN(age)) return res.status(400).json({ error: "Age must be a number" });
      data.age = age;
    }
    for (const field of ARRAY_FIELDS) {
      if (data[field] !== undefined && !Array.isArray(data[field])) {
        data[field] = data[field] ? [data[field]] : [];
      }
    }

    const profile = await prisma.datingProfile.upsert({
      where: { userId: req.user.id },
      update: { ...data, updatedAt: new Date() },
      create: { ...data, userId: req.user.id },
    });
    res.json({ profile });
  } catch (err) {
    console.error("[upsertProfile] Prisma error:", err.message);
    res.status(500).json({ error: "Couldn't save your profile — " + err.message });
  }
};

// GET /api/dating/me — my own profile + daily usage counters
exports.getMyProfileWithStatus = async (req, res) => {
  try {
    const profile = await getMyProfile(req.user.id);
    if (!profile) return res.json({ profile: null });

    const today = startOfToday();
    const [likesToday, superLikesToday] = await Promise.all([
      prisma.datingLike.count({ where: { fromId: profile.id, createdAt: { gte: today } } }),
      prisma.datingLike.count({ where: { fromId: profile.id, isSuperLike: true, createdAt: { gte: today } } }),
    ]);

    res.json({
      profile,
      usage: {
        likesUsedToday: likesToday,
        likesLimit: profile.isPremium ? null : FREE_DAILY_LIKES,
        superLikesUsedToday: superLikesToday,
        superLikesLimit: profile.isPremium ? SUPER_LIKES_PER_DAY : 0,
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── LIKE / PASS / UNDO ───────────────────────────────────────────
// POST /api/dating/like/:toId  { isSuperLike }
exports.likeProfile = async (req, res) => {
  try {
    const myProfile = await getMyProfile(req.user.id);
    if (!myProfile) return res.status(404).json({ error: "Create your profile first" });
    const toProfile = await prisma.datingProfile.findUnique({ where: { id: req.params.toId } });
    if (!toProfile) return res.status(404).json({ error: "Profile not found" });

    const isSuperLike = !!req.body.isSuperLike;
    const today = startOfToday();

    if (isSuperLike) {
      if (!myProfile.isPremium) return res.status(403).json({ error: "Super Likes are a Premium feature" });
      const superToday = await prisma.datingLike.count({ where: { fromId: myProfile.id, isSuperLike: true, createdAt: { gte: today } } });
      if (superToday >= SUPER_LIKES_PER_DAY) {
        return res.status(429).json({ error: `You've used all ${SUPER_LIKES_PER_DAY} Super Likes for today` });
      }
    } else if (!myProfile.isPremium) {
      const likesToday = await prisma.datingLike.count({ where: { fromId: myProfile.id, createdAt: { gte: today } } });
      if (likesToday >= FREE_DAILY_LIKES) {
        return res.status(429).json({ error: `You've reached today's ${FREE_DAILY_LIKES} like limit — upgrade to Premium for unlimited likes` });
      }
    }

    await prisma.datingLike.upsert({
      where: { fromId_toId: { fromId: myProfile.id, toId: toProfile.id } },
      update: { isSuperLike },
      create: { fromId: myProfile.id, toId: toProfile.id, isSuperLike },
    });
    // A like un-does any earlier pass, so re-liking after a rewind works cleanly
    await prisma.datingPass.deleteMany({ where: { fromId: myProfile.id, toId: toProfile.id } });
    await prisma.datingProfile.update({ where: { id: toProfile.id }, data: { likesReceived: { increment: 1 } } });
    if (isSuperLike) {
      req.app.get("io")?.to(`dating_profile:${toProfile.id}`).emit("dating:super_liked", { fromCity: myProfile.city });
    }

    const mutualLike = await prisma.datingLike.findUnique({
      where: { fromId_toId: { fromId: toProfile.id, toId: myProfile.id } },
    });

    let match = null;
    if (mutualLike) {
      match = await prisma.datingMatch.upsert({
        where: { profile1Id_profile2Id: { profile1Id: myProfile.id, profile2Id: toProfile.id } },
        update: {},
        create: {
          profile1Id: myProfile.id, profile2Id: toProfile.id,
          compatScore: computeCompatScore(myProfile, toProfile),
        },
        include: { profile1: true, profile2: true },
      });
      await prisma.datingProfile.updateMany({
        where: { id: { in: [myProfile.id, toProfile.id] } },
        data: { matchCount: { increment: 1 } },
      });
      req.app.get("io")?.to(`dating_profile:${toProfile.id}`).emit("dating:new_match", match);
    }

    res.json({ liked: true, isSuperLike, matched: !!match, match });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/dating/pass/:toId — pass on a profile
exports.passProfile = async (req, res) => {
  try {
    const myProfile = await getMyProfile(req.user.id);
    if (!myProfile) return res.status(404).json({ error: "Create your profile first" });
    await prisma.datingPass.upsert({
      where: { fromId_toId: { fromId: myProfile.id, toId: req.params.toId } },
      update: {},
      create: { fromId: myProfile.id, toId: req.params.toId },
    });
    res.json({ passed: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/dating/undo-pass — Rewind (Premium): un-pass the most recent pass
exports.undoLastPass = async (req, res) => {
  try {
    const myProfile = await getMyProfile(req.user.id);
    if (!myProfile) return res.status(404).json({ error: "Create your profile first" });
    if (!myProfile.isPremium) return res.status(403).json({ error: "Rewind is a Premium feature" });

    const lastPass = await prisma.datingPass.findFirst({
      where: { fromId: myProfile.id },
      orderBy: { createdAt: "desc" },
    });
    if (!lastPass) return res.status(404).json({ error: "Nothing to undo" });

    await prisma.datingPass.delete({ where: { id: lastPass.id } });
    const restoredProfile = await prisma.datingProfile.findUnique({ where: { id: lastPass.toId } });
    res.json({ undone: true, profile: restoredProfile });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── WHO LIKED ME ─────────────────────────────────────────────────
// GET /api/dating/liked-me — Premium sees full profiles; free sees blurred count/cards
exports.getWhoLikedMe = async (req, res) => {
  try {
    const myProfile = await getMyProfile(req.user.id);
    if (!myProfile) return res.status(404).json({ error: "Create your profile first" });

    const likes = await prisma.datingLike.findMany({
      where: { toId: myProfile.id },
      orderBy: { createdAt: "desc" },
      include: { from: true },
    });

    if (!myProfile.isPremium) {
      // Blurred: enough to tease upgrade, nothing identifying
      return res.json({
        count: likes.length,
        premiumRequired: true,
        profiles: likes.slice(0, 6).map((l) => ({
          id: l.id, age: l.from.age, city: l.from.city, isSuperLike: l.isSuperLike, blurred: true,
        })),
      });
    }

    res.json({
      count: likes.length,
      premiumRequired: false,
      profiles: likes.map((l) => ({ ...l.from, isSuperLike: l.isSuperLike, likedAt: l.createdAt })),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── MATCHES & MESSAGES ───────────────────────────────────────────
// GET /api/dating/matches
exports.getMatches = async (req, res) => {
  try {
    const myProfile = await getMyProfile(req.user.id);
    if (!myProfile) return res.json({ matches: [] });
    const matches = await prisma.datingMatch.findMany({
      where: { OR: [{ profile1Id: myProfile.id }, { profile2Id: myProfile.id }], isActive: true },
      include: {
        profile1: true, profile2: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ matches });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/dating/message — send message (Premium only)
exports.sendMessage = async (req, res) => {
  try {
    const myProfile = await getMyProfile(req.user.id);
    if (!myProfile) return res.status(404).json({ error: "Profile not found" });
    if (!myProfile.isPremium) return res.status(403).json({ error: "Premium required to send messages" });
    const { matchId, content, type = "text", mediaUrl } = req.body;
    const match = await prisma.datingMatch.findUnique({ where: { id: matchId }, include: { profile1: true, profile2: true } });
    if (!match) return res.status(404).json({ error: "Match not found" });
    const toProfile = match.profile1Id === myProfile.id ? match.profile2 : match.profile1;
    const message = await prisma.datingMessage.create({
      data: { matchId, fromId: myProfile.id, toId: toProfile.id, content, type, mediaUrl },
    });
    req.app.get("io")?.to(`dating_profile:${toProfile.id}`).emit("dating:new_message", message);
    res.json({ message });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/dating/messages/:matchId — also marks incoming messages as read
exports.getMessages = async (req, res) => {
  try {
    const myProfile = await getMyProfile(req.user.id);
    const messages = await prisma.datingMessage.findMany({
      where: { matchId: req.params.matchId },
      orderBy: { createdAt: "asc" },
    });
    if (myProfile) {
      await prisma.datingMessage.updateMany({
        where: { matchId: req.params.matchId, toId: myProfile.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
    }
    res.json({ messages });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── BOOST & INCOGNITO ────────────────────────────────────────────
// POST /api/dating/boost — Premium only, temporary visibility boost
exports.activateBoost = async (req, res) => {
  try {
    const myProfile = await getMyProfile(req.user.id);
    if (!myProfile) return res.status(404).json({ error: "Create your profile first" });
    if (!myProfile.isPremium) return res.status(403).json({ error: "Boost is a Premium feature" });
    if (myProfile.boostActive && myProfile.boostExpiry && myProfile.boostExpiry > new Date()) {
      return res.status(400).json({ error: "Boost is already active", boostExpiry: myProfile.boostExpiry });
    }
    const boostExpiry = new Date(Date.now() + BOOST_MINUTES * 60000);
    const profile = await prisma.datingProfile.update({
      where: { id: myProfile.id },
      data: { boostActive: true, boostExpiry },
    });
    res.json({ profile, boostExpiry });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/dating/incognito  { enabled }
exports.setIncognito = async (req, res) => {
  try {
    const myProfile = await getMyProfile(req.user.id);
    if (!myProfile) return res.status(404).json({ error: "Create your profile first" });
    if (req.body.enabled && !myProfile.isPremium) return res.status(403).json({ error: "Incognito Mode is a Premium feature" });
    const profile = await prisma.datingProfile.update({
      where: { id: myProfile.id }, data: { isIncognito: !!req.body.enabled },
    });
    res.json({ profile });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── PHOTOS ───────────────────────────────────────────────────────
const MAX_PHOTOS = 6;
// POST /api/dating/photo  { dataUrl }
exports.addPhoto = async (req, res) => {
  try {
    const { dataUrl } = req.body;
    if (!dataUrl) return res.status(400).json({ error: "No image provided" });
    const myProfile = await getMyProfile(req.user.id);
    if (!myProfile) return res.status(404).json({ error: "Create your profile first" });
    if (myProfile.photos.length >= MAX_PHOTOS) {
      return res.status(400).json({ error: `Maximum ${MAX_PHOTOS} photos allowed` });
    }
    const photos = [...myProfile.photos, dataUrl];
    const profile = await prisma.datingProfile.update({ where: { id: myProfile.id }, data: { photos } });
    res.json({ profile });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/dating/photo/remove  { index }
exports.removePhoto = async (req, res) => {
  try {
    const { index } = req.body;
    const myProfile = await getMyProfile(req.user.id);
    if (!myProfile) return res.status(404).json({ error: "Create your profile first" });
    const photos = myProfile.photos.filter((_, i) => i !== index);
    const profile = await prisma.datingProfile.update({ where: { id: myProfile.id }, data: { photos } });
    res.json({ profile });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── BLOCK & REPORT ───────────────────────────────────────────────
// POST /api/dating/block/:profileId
exports.blockProfile = async (req, res) => {
  try {
    const myProfile = await getMyProfile(req.user.id);
    if (!myProfile) return res.status(404).json({ error: "Create your profile first" });
    await prisma.datingBlock.upsert({
      where: { blockerId_blockedId: { blockerId: myProfile.id, blockedId: req.params.profileId } },
      update: {},
      create: { blockerId: myProfile.id, blockedId: req.params.profileId },
    });
    res.json({ blocked: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/dating/unblock/:profileId
exports.unblockProfile = async (req, res) => {
  try {
    const myProfile = await getMyProfile(req.user.id);
    if (!myProfile) return res.status(404).json({ error: "Create your profile first" });
    await prisma.datingBlock.deleteMany({ where: { blockerId: myProfile.id, blockedId: req.params.profileId } });
    res.json({ unblocked: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/dating/blocked
exports.listBlocked = async (req, res) => {
  try {
    const myProfile = await getMyProfile(req.user.id);
    if (!myProfile) return res.json({ blocked: [] });
    const blocks = await prisma.datingBlock.findMany({
      where: { blockerId: myProfile.id },
      include: { blocked: true },
    });
    res.json({ blocked: blocks.map((b) => b.blocked) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/dating/report  { reportedId, reason, details }
exports.reportProfile = async (req, res) => {
  try {
    const myProfile = await getMyProfile(req.user.id);
    if (!myProfile) return res.status(404).json({ error: "Create your profile first" });
    const { reportedId, reason, details } = req.body;
    if (!reportedId || !reason) return res.status(400).json({ error: "reportedId and reason are required" });
    const report = await prisma.datingReport.create({
      data: { reporterId: myProfile.id, reportedId, reason, details: details || "" },
    });
    res.json({ report });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── VERIFICATION ─────────────────────────────────────────────────
// POST /api/dating/verify/request  { selfieUrl }
exports.requestVerification = async (req, res) => {
  try {
    const myProfile = await getMyProfile(req.user.id);
    if (!myProfile) return res.status(404).json({ error: "Create your profile first" });
    const { selfieUrl } = req.body;
    if (!selfieUrl) return res.status(400).json({ error: "A selfie photo is required" });
    const existing = await prisma.datingVerificationRequest.findFirst({
      where: { profileId: myProfile.id, status: "PENDING" },
    });
    if (existing) return res.status(400).json({ error: "You already have a verification request pending review" });
    const request = await prisma.datingVerificationRequest.create({
      data: { profileId: myProfile.id, selfieUrl },
    });
    res.json({ request });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/dating/verify/status
exports.getVerificationStatus = async (req, res) => {
  try {
    const myProfile = await getMyProfile(req.user.id);
    if (!myProfile) return res.json({ status: null });
    const latest = await prisma.datingVerificationRequest.findFirst({
      where: { profileId: myProfile.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ isVerified: myProfile.isVerified, latestRequest: latest });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── ADMIN: VERIFICATION REVIEW (requireAdmin) ───────────────────
// GET /api/dating/admin/verify/pending
exports.adminListPendingVerifications = async (req, res) => {
  try {
    const requests = await prisma.datingVerificationRequest.findMany({
      where: { status: "PENDING" },
      include: { profile: true },
      orderBy: { createdAt: "asc" },
    });
    res.json({ requests });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/dating/admin/verify/:id/approve
exports.adminApproveVerification = async (req, res) => {
  try {
    const request = await prisma.datingVerificationRequest.update({
      where: { id: req.params.id },
      data: { status: "APPROVED", reviewedBy: req.user.id, reviewedAt: new Date() },
    });
    await prisma.datingProfile.update({ where: { id: request.profileId }, data: { isVerified: true } });
    res.json({ request });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/dating/admin/verify/:id/reject  { reviewNote }
exports.adminRejectVerification = async (req, res) => {
  try {
    const request = await prisma.datingVerificationRequest.update({
      where: { id: req.params.id },
      data: { status: "REJECTED", reviewedBy: req.user.id, reviewedAt: new Date(), reviewNote: req.body.reviewNote || "" },
    });
    res.json({ request });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
