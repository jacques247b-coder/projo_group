// PROJO GROUP — Community Chat Rooms Controller
// Anonymous, engagement-only chat rooms. Completely separate from Dating —
// no route here ever returns dating profile data, and no route in
// dating.controller.js should ever accept a communityIdentityId.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { generateDisplayName, generateAvatarKey, getAvatar, AVATAR_LIBRARY } = require("../utils/communityIdentity");
const { logModerationEvent, getActiveSanction } = require("../services/moderation.service");

// ── IDENTITY ─────────────────────────────────────────────────────
// GET /api/community/identity — get-or-create the caller's anonymous identity
exports.getOrCreateIdentity = async (req, res) => {
  try {
    let identity = await prisma.communityIdentity.findUnique({ where: { userId: req.user.id } });
    if (!identity) {
      // Ensure the generated display name is unique; retry a few times on collision
      for (let attempt = 0; attempt < 5 && !identity; attempt++) {
        try {
          identity = await prisma.communityIdentity.create({
            data: {
              userId: req.user.id,
              displayName: generateDisplayName(),
              avatarKey: generateAvatarKey(),
            },
          });
        } catch (e) {
          if (attempt === 4) throw e; // give up after a few collisions
        }
      }
    }
    res.json({ identity: { ...identity, avatar: getAvatar(identity.avatarKey) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/community/identity/reroll — get a fresh random name/avatar
exports.rerollIdentity = async (req, res) => {
  try {
    const identity = await prisma.communityIdentity.update({
      where: { userId: req.user.id },
      data: { displayName: generateDisplayName(), avatarKey: generateAvatarKey() },
    });
    res.json({ identity: { ...identity, avatar: getAvatar(identity.avatarKey) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/community/avatars — the built-in avatar library, for a picker UI
exports.listAvatars = async (_req, res) => {
  res.json({ avatars: AVATAR_LIBRARY });
};

// POST /api/community/identity/avatar — pick a specific avatar from the library
exports.setAvatar = async (req, res) => {
  try {
    const { avatarKey } = req.body;
    if (!AVATAR_LIBRARY.some((a) => a.key === avatarKey)) {
      return res.status(400).json({ error: "Unknown avatar key" });
    }
    const identity = await prisma.communityIdentity.update({
      where: { userId: req.user.id },
      data: { avatarKey },
    });
    res.json({ identity: { ...identity, avatar: getAvatar(identity.avatarKey) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── ROOMS ────────────────────────────────────────────────────────
// GET /api/community/rooms — list rooms (supports ?search=&sort=trending)
exports.listRooms = async (req, res) => {
  try {
    const { search, sort } = req.query;
    const rooms = await prisma.chatRoom.findMany({
      where: {
        isActive: true,
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      orderBy:
        sort === "trending"
          ? [{ lastActivityAt: "desc" }, { messageCount: "desc" }]
          : [{ isPinnedTop: "desc" }, { name: "asc" }],
    });
    res.json({ rooms });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/community/rooms/:slug — room detail + recent messages (paginated)
exports.getRoom = async (req, res) => {
  try {
    const { slug } = req.params;
    const { cursor, limit = 40 } = req.query;
    const room = await prisma.chatRoom.findUnique({ where: { slug } });
    if (!room) return res.status(404).json({ error: "Room not found" });

    const messages = await prisma.chatMessage.findMany({
      where: { roomId: room.id, status: "VISIBLE" },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit),
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: { reactions: true },
    });

    const pinned = await prisma.chatMessage.findFirst({
      where: { roomId: room.id, isPinned: true, status: "VISIBLE" },
    });

    // Never expose userId to the client — anon identity only
    const sanitize = (m) => {
      const { userId, ...rest } = m;
      return rest;
    };

    res.json({
      room,
      messages: messages.reverse().map(sanitize),
      pinned: pinned ? sanitize(pinned) : null,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/community/rooms/:slug/join — join a room (ensures identity + membership)
exports.joinRoom = async (req, res) => {
  try {
    const { slug } = req.params;
    const room = await prisma.chatRoom.findUnique({ where: { slug } });
    if (!room) return res.status(404).json({ error: "Room not found" });

    const sanction = await getActiveSanction(req.user.id, room.id);
    if (sanction) {
      return res.status(403).json({
        error: sanction.type === "BAN" ? "You've been banned from Community Chat." : "You're currently muted.",
      });
    }

    let identity = await prisma.communityIdentity.findUnique({ where: { userId: req.user.id } });
    if (!identity) {
      identity = await prisma.communityIdentity.create({
        data: { userId: req.user.id, displayName: generateDisplayName(), avatarKey: generateAvatarKey() },
      });
    }

    const existing = await prisma.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId: room.id, userId: req.user.id } },
    });
    if (!existing) {
      await prisma.chatRoomMember.create({ data: { roomId: room.id, userId: req.user.id } });
      await prisma.chatRoom.update({ where: { id: room.id }, data: { memberCount: { increment: 1 } } });
    } else {
      await prisma.chatRoomMember.update({
        where: { roomId_userId: { roomId: room.id, userId: req.user.id } },
        data: { lastSeenAt: new Date() },
      });
    }

    res.json({ room, identity: { ...identity, avatar: getAvatar(identity.avatarKey) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── REACTIONS ────────────────────────────────────────────────────
// POST /api/community/messages/:id/react  { emoji }
exports.reactToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const reaction = await prisma.chatReaction.upsert({
      where: { messageId_userId: { messageId: id, userId: req.user.id } },
      update: { emoji },
      create: { messageId: id, userId: req.user.id, emoji },
    });
    res.json({ reaction });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── POLLS ────────────────────────────────────────────────────────
// POST /api/community/rooms/:slug/polls  { question, options: [...], closesInMinutes }
exports.createPoll = async (req, res) => {
  try {
    const { slug } = req.params;
    const { question, options, closesInMinutes } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: "A poll needs a question and at least 2 options" });
    }
    const room = await prisma.chatRoom.findUnique({ where: { slug } });
    if (!room) return res.status(404).json({ error: "Room not found" });

    const poll = await prisma.chatPoll.create({
      data: {
        roomId: room.id,
        question,
        options,
        createdBy: req.user.id,
        closesAt: closesInMinutes ? new Date(Date.now() + closesInMinutes * 60000) : null,
      },
    });
    res.json({ poll });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/community/polls/:id/vote  { optionIndex }
exports.voteOnPoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { optionIndex } = req.body;
    const poll = await prisma.chatPoll.findUnique({ where: { id } });
    if (!poll) return res.status(404).json({ error: "Poll not found" });
    if (poll.closesAt && new Date() > poll.closesAt) return res.status(400).json({ error: "This poll is closed" });

    const vote = await prisma.chatPollVote.upsert({
      where: { pollId_userId: { pollId: id, userId: req.user.id } },
      update: { optionIndex },
      create: { pollId: id, userId: req.user.id, optionIndex },
    });

    const votes = await prisma.chatPollVote.findMany({ where: { pollId: id } });
    const tally = poll.options.map((_, i) => votes.filter((v) => v.optionIndex === i).length);

    res.json({ vote, tally, totalVotes: votes.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/community/polls/:id
exports.getPoll = async (req, res) => {
  try {
    const { id } = req.params;
    const poll = await prisma.chatPoll.findUnique({ where: { id }, include: { votes: true } });
    if (!poll) return res.status(404).json({ error: "Poll not found" });
    const tally = poll.options.map((_, i) => poll.votes.filter((v) => v.optionIndex === i).length);
    const myVote = poll.votes.find((v) => v.userId === req.user.id);
    res.json({ poll, tally, totalVotes: poll.votes.length, myVoteIndex: myVote ? myVote.optionIndex : null });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── REPORTS ──────────────────────────────────────────────────────
// POST /api/community/report  { messageId?, roomId?, reason, details? }
exports.reportContent = async (req, res) => {
  try {
    const { messageId, roomId, reason, details } = req.body;
    if (!reason) return res.status(400).json({ error: "A reason is required" });
    const report = await prisma.chatReport.create({
      data: { reporterId: req.user.id, messageId, roomId, reason, details: details || "" },
    });
    // Auto-flag the message so moderators see it faster
    if (messageId) {
      await prisma.chatMessage.update({ where: { id: messageId }, data: { isFlagged: true } }).catch(() => {});
    }
    res.json({ report });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── MODERATOR DASHBOARD (requireAdmin) ──────────────────────────
// GET /api/community/mod/reports?status=PENDING
exports.modListReports = async (req, res) => {
  try {
    const { status = "PENDING" } = req.query;
    const reports = await prisma.chatReport.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      include: { message: true },
      take: 100,
    });
    res.json({ reports });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/community/mod/held-messages — messages auto-held by moderation.service
exports.modHeldMessages = async (req, res) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { status: "HELD_FOR_REVIEW" },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ messages });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/community/mod/events — moderation audit log
exports.modEvents = async (req, res) => {
  try {
    const events = await prisma.chatModerationEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json({ events });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/community/mod/messages/:id/approve
exports.modApproveMessage = async (req, res) => {
  try {
    const message = await prisma.chatMessage.update({
      where: { id: req.params.id },
      data: { status: "VISIBLE", isFlagged: false },
    });
    await logModerationEvent({ userId: message.userId, roomId: message.roomId, messageId: message.id, action: "MESSAGE_APPROVED", detail: `by admin ${req.user.id}` });
    res.json({ message });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/community/mod/messages/:id/remove
exports.modRemoveMessage = async (req, res) => {
  try {
    const message = await prisma.chatMessage.update({
      where: { id: req.params.id },
      data: { status: "REMOVED" },
    });
    await logModerationEvent({ userId: message.userId, roomId: message.roomId, messageId: message.id, action: "MESSAGE_REMOVED", detail: `by admin ${req.user.id}` });
    res.json({ message });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/community/mod/messages/:id/pin
exports.modPinMessage = async (req, res) => {
  try {
    const existing = await prisma.chatMessage.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Message not found" });
    // Unpin any currently pinned message in this room first
    await prisma.chatMessage.updateMany({ where: { roomId: existing.roomId, isPinned: true }, data: { isPinned: false } });
    const message = await prisma.chatMessage.update({ where: { id: req.params.id }, data: { isPinned: true } });
    res.json({ message });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/community/mod/users/:userId/mute  { roomId?, minutes, reason }
exports.modMuteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roomId, minutes = 60, reason } = req.body;
    const sanction = await prisma.chatSanction.create({
      data: {
        userId, roomId: roomId || null, type: "MUTE",
        reason: reason || "", issuedBy: req.user.id,
        expiresAt: new Date(Date.now() + minutes * 60000),
      },
    });
    await logModerationEvent({ userId, roomId, action: "MUTED", reason, detail: `by admin ${req.user.id}, ${minutes}min` });
    res.json({ sanction });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/community/mod/users/:userId/ban  { roomId?, reason, permanent, days }
exports.modBanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roomId, reason, permanent = true, days } = req.body;
    const sanction = await prisma.chatSanction.create({
      data: {
        userId, roomId: roomId || null, type: "BAN",
        reason: reason || "", issuedBy: req.user.id,
        expiresAt: permanent ? null : new Date(Date.now() + (days || 7) * 86400000),
      },
    });
    await logModerationEvent({ userId, roomId, action: "BANNED", reason, detail: `by admin ${req.user.id}` });
    res.json({ sanction });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/community/mod/users/:userId/unban
exports.modUnbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await prisma.chatSanction.updateMany({
      where: { userId, isActive: true, type: { in: ["BAN", "MUTE"] } },
      data: { isActive: false },
    });
    await logModerationEvent({ userId, action: "UNBANNED", detail: `by admin ${req.user.id}` });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/community/mod/rooms — create a new room
exports.modCreateRoom = async (req, res) => {
  try {
    const { name, slug, description, category, icon, isPinnedTop } = req.body;
    const room = await prisma.chatRoom.create({
      data: { name, slug, description: description || "", category: category || "General", icon: icon || "💬", isPinnedTop: !!isPinnedTop },
    });
    res.json({ room });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
