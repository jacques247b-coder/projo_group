// PROJO GROUP — Track Your Loved Ones
// Consent is enforced here, not just in the UI: a connection only ever
// shares location while status is ACCEPTED. The invited person must
// explicitly accept before anything is shared, sees it's active in their
// own app the whole time, and can revoke it themselves at any moment —
// revoking immediately stops the subscriber from seeing anything new.
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── Subscription ───────────────────────────────────────────────

// GET /api/loved-ones/subscription
exports.getSubscription = async (req, res) => {
  try {
    const sub = await prisma.lovedOnesSubscription.findUnique({ where: { userId: req.user.id } });
    res.json({ subscription: sub });
  } catch (err) {
    res.status(500).json({ error: "Could not load subscription" });
  }
};

// POST /api/loved-ones/subscribe — pays the first month from the wallet
exports.subscribe = async (req, res) => {
  try {
    const existing = await prisma.lovedOnesSubscription.findUnique({ where: { userId: req.user.id } });
    if (existing && existing.status === "ACTIVE") return res.status(400).json({ error: "Already subscribed" });

    const PRICE = 49;
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
    if (!wallet || wallet.balanceZar < PRICE) {
      return res.status(400).json({ error: `Insufficient wallet balance. Track Your Loved Ones is R${PRICE}/month — top up your wallet and try again.` });
    }

    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + 1);

    const [, sub] = await prisma.$transaction([
      prisma.wallet.update({ where: { id: wallet.id }, data: { balanceZar: { decrement: PRICE } } }),
      prisma.lovedOnesSubscription.upsert({
        where: { userId: req.user.id },
        create: { userId: req.user.id, monthlyPriceZar: PRICE, renewsAt, status: "ACTIVE" },
        update: { status: "ACTIVE", renewsAt, cancelledAt: null },
      }),
      prisma.transaction.create({
        data: { walletId: wallet.id, type: "LOVED_ONES_SUBSCRIPTION", status: "COMPLETED", amountZar: -PRICE, description: "Track Your Loved Ones — monthly subscription" },
      }),
    ]);

    res.status(201).json({ subscription: sub });
  } catch (err) {
    res.status(500).json({ error: "Could not subscribe: " + err.message });
  }
};

// POST /api/loved-ones/cancel
exports.cancelSubscription = async (req, res) => {
  try {
    const sub = await prisma.lovedOnesSubscription.update({
      where: { userId: req.user.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    res.json({ subscription: sub });
  } catch (err) {
    res.status(500).json({ error: "Could not cancel subscription" });
  }
};

// ── Connections (consent-gated) ──────────────────────────────────

// POST /api/loved-ones/invite — invite by phone number. If that phone
// isn't a PROJO account yet, they need to sign up first — nothing is
// shared with a non-account, there's no way around that by design.
exports.inviteLovedOne = async (req, res) => {
  try {
    const { phone, label } = req.body;
    const sub = await prisma.lovedOnesSubscription.findUnique({ where: { userId: req.user.id } });
    if (!sub || sub.status !== "ACTIVE") return res.status(403).json({ error: "Active subscription required to invite loved ones" });

    const lovedOne = await prisma.user.findUnique({ where: { phone } });
    if (!lovedOne) return res.status(404).json({ error: "No PROJO account found with that phone number — they'll need to sign up first" });
    if (lovedOne.id === req.user.id) return res.status(400).json({ error: "You can't invite yourself" });

    const existing = await prisma.lovedOneConnection.findUnique({ where: { subscriberId_lovedOneId: { subscriberId: req.user.id, lovedOneId: lovedOne.id } } });
    if (existing && existing.status === "ACCEPTED") return res.status(400).json({ error: "Already connected with this person" });
    if (existing && existing.status === "PENDING") return res.status(400).json({ error: "Invite already sent, waiting on their response" });

    const connection = existing
      ? await prisma.lovedOneConnection.update({ where: { id: existing.id }, data: { status: "PENDING", label, invitedAt: new Date(), respondedAt: null } })
      : await prisma.lovedOneConnection.create({ data: { subscriberId: req.user.id, lovedOneId: lovedOne.id, label } });

    try {
      const { notifyUser } = require("./push.controller");
      await notifyUser(lovedOne.id, {
        title: "📍 Location Sharing Request",
        body: `${req.user.name} wants to add you to their Track Your Loved Ones circle. You choose whether to accept.`,
        data: { url: "/loved-ones/requests" },
      });
    } catch (e) { console.log("[PROJO LovedOnes] Invite push failed:", e.message); }

    res.status(201).json({ connection });
  } catch (err) {
    res.status(500).json({ error: "Could not send invite: " + err.message });
  }
};

// GET /api/loved-ones/connections — everyone this user is tracking (as
// subscriber) and everyone tracking this user (as the loved one)
exports.getConnections = async (req, res) => {
  try {
    const [asSubscriber, asLovedOne] = await Promise.all([
      prisma.lovedOneConnection.findMany({ where: { subscriberId: req.user.id }, include: { } }),
      prisma.lovedOneConnection.findMany({ where: { lovedOneId: req.user.id } }),
    ]);
    // Attach the other party's basic public info manually (no relation
    // defined both ways in the schema, since subscriberId/lovedOneId
    // both point at User without a named back-relation)
    const otherIds = [...new Set([...asSubscriber.map(c => c.lovedOneId), ...asLovedOne.map(c => c.subscriberId)])];
    const others = await prisma.user.findMany({ where: { id: { in: otherIds } }, select: { id: true, name: true, phone: true } });
    const byId = Object.fromEntries(others.map(u => [u.id, u]));

    res.json({
      tracking: asSubscriber.map(c => ({ ...c, lovedOne: byId[c.lovedOneId] })), // people I'm tracking
      trackedBy: asLovedOne.map(c => ({ ...c, subscriber: byId[c.subscriberId] })), // people tracking me
    });
  } catch (err) {
    res.status(500).json({ error: "Could not load connections" });
  }
};

// POST /api/loved-ones/connections/:id/respond — { accept: true|false }
// Only the invited person (lovedOneId) can respond to their own invite.
exports.respondToInvite = async (req, res) => {
  try {
    const { accept } = req.body;
    const connection = await prisma.lovedOneConnection.findUnique({ where: { id: req.params.id } });
    if (!connection) return res.status(404).json({ error: "Invite not found" });
    if (connection.lovedOneId !== req.user.id) return res.status(403).json({ error: "This invite isn't yours to respond to" });

    const updated = await prisma.lovedOneConnection.update({
      where: { id: req.params.id },
      data: { status: accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() },
    });

    try {
      const { notifyUser } = require("./push.controller");
      await notifyUser(connection.subscriberId, {
        title: accept ? "✅ Invite Accepted" : "Invite Declined",
        body: accept ? `${req.user.name} accepted your Track Your Loved Ones request` : `${req.user.name} declined your request`,
        data: { url: "/loved-ones" },
      });
    } catch (e) { console.log("[PROJO LovedOnes] Response push failed:", e.message); }

    res.json({ connection: updated });
  } catch (err) {
    res.status(500).json({ error: "Could not respond to invite" });
  }
};

// POST /api/loved-ones/connections/:id/revoke — either party can end
// sharing at any time, no exceptions. Consent that can be locked out by
// the other party isn't real consent — this used to have a
// "dependentMode" bypass letting the subscriber strip the loved one's
// ability to revoke; removed, since that's self-declared and
// unverified (no actual age/guardian check), which means anyone could
// have used it on anyone, not just parents on children. The other
// party gets notified when a revoke happens instead — accountability
// without taking away anyone's ability to stop.
exports.revokeConnection = async (req, res) => {
  try {
    const connection = await prisma.lovedOneConnection.findUnique({ where: { id: req.params.id } });
    if (!connection) return res.status(404).json({ error: "Connection not found" });
    if (connection.subscriberId !== req.user.id && connection.lovedOneId !== req.user.id) {
      return res.status(403).json({ error: "Not your connection" });
    }
    const updated = await prisma.lovedOneConnection.update({
      where: { id: req.params.id },
      data: { status: "REVOKED", lastLat: null, lastLng: null, lastLocationAt: null },
    });

    const otherPartyId = req.user.id === connection.subscriberId ? connection.lovedOneId : connection.subscriberId;
    try {
      const { notifyUser } = require("./push.controller");
      await notifyUser(otherPartyId, {
        title: "📍 Location Sharing Ended",
        body: `${req.user.name} has stopped location sharing with you`,
        data: { url: "/loved-ones" },
      });
    } catch (e) { console.log("[PROJO LovedOnes] Revoke notification failed:", e.message); }

    res.json({ connection: updated });
  } catch (err) {
    res.status(500).json({ error: "Could not revoke connection" });
  }
};

// ── Geofences ──────────────────────────────────────────────────

// GET /api/loved-ones/geofences
exports.getGeofences = async (req, res) => {
  try {
    const geofences = await prisma.lovedOneGeofence.findMany({ where: { subscriberId: req.user.id } });
    res.json({ geofences });
  } catch (err) {
    res.status(500).json({ error: "Could not load geofences" });
  }
};

// POST /api/loved-ones/geofences
exports.createGeofence = async (req, res) => {
  try {
    const { name, lat, lng, radiusMeters, lovedOneId, notifyOnEnter, notifyOnExit } = req.body;
    const geofence = await prisma.lovedOneGeofence.create({
      data: { subscriberId: req.user.id, name, lat, lng, radiusMeters: radiusMeters || 150, lovedOneId: lovedOneId || null, notifyOnEnter, notifyOnExit },
    });
    res.status(201).json({ geofence });
  } catch (err) {
    res.status(500).json({ error: "Could not create geofence" });
  }
};

// DELETE /api/loved-ones/geofences/:id
exports.deleteGeofence = async (req, res) => {
  try {
    const gf = await prisma.lovedOneGeofence.findUnique({ where: { id: req.params.id } });
    if (!gf || gf.subscriberId !== req.user.id) return res.status(403).json({ error: "Not your geofence" });
    await prisma.lovedOneGeofence.delete({ where: { id: req.params.id } });
    res.json({ message: "Removed" });
  } catch (err) {
    res.status(500).json({ error: "Could not remove geofence" });
  }
};
