// PROJO DATING — Socket.io real-time layer
// Message delivery, new-match, and super-like notifications are emitted
// directly from dating.controller.js (via req.app.get("io")) since those
// happen inside REST request handlers. This file only handles the
// connection-scoped concerns: joining a personal room and typing indicators.

function registerDatingSocket(io) {
  io.on("connection", (socket) => {
    // Each profile joins a room keyed by their own profile id, so the
    // controller can push events straight to them regardless of which
    // match/conversation is open.
    socket.on("dating:join", ({ profileId }) => {
      if (!profileId) return;
      socket.join(`dating_profile:${profileId}`);
    });

    socket.on("dating:leave", ({ profileId }) => {
      if (!profileId) return;
      socket.leave(`dating_profile:${profileId}`);
    });

    // { matchId, toProfileId }
    socket.on("dating:typing", ({ matchId, toProfileId }) => {
      if (!toProfileId || !matchId) return;
      socket.to(`dating_profile:${toProfileId}`).emit("dating:user_typing", { matchId });
    });
  });
}

module.exports = { registerDatingSocket };
