// PROJO GROUP — Community Chat Rooms: Socket.io real-time layer
// Every message passes through moderation.service BEFORE it is persisted as
// visible or broadcast. Blocked/held messages never reach other members.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { moderateMessage } = require("../services/moderation.service");
const { getAvatar } = require("../utils/communityIdentity");

function sanitize(message, roomMode) {
  if (roomMode === "ANONYMOUS") {
    const { userId, ...rest } = message;
    return rest;
  }
  return message; // OPEN_LOCAL: real identity is already public, keep userId for "is this me" checks
}

function registerCommunitySocket(io) {
  io.on("connection", (socket) => {
    // Join a room's live channel (after the REST /join call has run)
    socket.on("community:join_room", ({ roomId }) => {
      if (!roomId) return;
      socket.join(`community_room:${roomId}`);
    });

    socket.on("community:leave_room", ({ roomId }) => {
      if (!roomId) return;
      socket.leave(`community_room:${roomId}`);
    });

    socket.on("community:typing", ({ roomId, displayName }) => {
      if (!roomId) return;
      socket.to(`community_room:${roomId}`).emit("community:user_typing", { displayName });
    });

    // { roomId, userId, type, content, mediaUrl }
    socket.on("community:send_message", async (payload, ack) => {
      const respond = (data) => { if (typeof ack === "function") ack(data); };
      try {
        const { roomId, userId, type = "text", content = "", mediaUrl } = payload || {};
        if (!roomId || !userId) return respond({ ok: false, error: "Missing roomId or userId" });

        const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
        if (!room || !room.isActive) return respond({ ok: false, error: "Room not available" });

        // Resolve identity: real name/photo for OPEN_LOCAL, masked alias for ANONYMOUS
        let identityId = null, displayName, avatarKey = null, avatarUrl = null;
        if (room.mode === "OPEN_LOCAL") {
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (!user) return respond({ ok: false, error: "User not found" });
          displayName = user.name;
          avatarUrl = user.avatarUrl || null;
        } else {
          const identity = await prisma.communityIdentity.findUnique({ where: { userId } });
          if (!identity) return respond({ ok: false, error: "No community identity — join the room first" });
          identityId = identity.id;
          displayName = identity.displayName;
          avatarKey = identity.avatarKey;
        }

        const result = await moderateMessage({ userId, roomId, type, content, roomMode: room.mode });

        if (!result.allowed) {
          // Held-for-review messages are persisted but invisible to everyone else
          if (result.heldForReview) {
            await prisma.chatMessage.create({
              data: {
                roomId, userId, identityId, displayName, avatarKey, avatarUrl,
                type, content, mediaUrl,
                status: "HELD_FOR_REVIEW", isFlagged: true, flagReason: result.flagReason,
              },
            });
          }
          socket.emit("community:message_blocked", { reason: result.publicReason });
          return respond({ ok: false, blocked: true, reason: result.publicReason });
        }

        const message = await prisma.chatMessage.create({
          data: {
            roomId, userId, identityId, displayName, avatarKey, avatarUrl,
            type, content: result.content ?? content, mediaUrl,
            status: "VISIBLE", isFlagged: !!result.isFlagged, flagReason: result.flagReason || null,
          },
        });

        await prisma.chatRoom.update({
          where: { id: roomId },
          data: { messageCount: { increment: 1 }, lastActivityAt: new Date() },
        });

        const outgoing = { ...sanitize(message, room.mode), avatar: message.avatarKey ? getAvatar(message.avatarKey) : null };
        io.to(`community_room:${roomId}`).emit("community:new_message", outgoing);
        respond({ ok: true, message: outgoing });
      } catch (err) {
        console.error("[Community Socket] send_message error:", err.message);
        respond({ ok: false, error: "Failed to send message" });
      }
    });

    // { messageId, roomId, userId, emoji }
    socket.on("community:react", async ({ messageId, roomId, userId, emoji }) => {
      try {
        if (!messageId || !userId || !emoji) return;
        await prisma.chatReaction.upsert({
          where: { messageId_userId: { messageId, userId } },
          update: { emoji },
          create: { messageId, userId, emoji },
        });
        if (roomId) {
          io.to(`community_room:${roomId}`).emit("community:reaction_update", { messageId, emoji });
        }
      } catch (err) {
        console.error("[Community Socket] react error:", err.message);
      }
    });
  });
}

module.exports = { registerCommunitySocket };
