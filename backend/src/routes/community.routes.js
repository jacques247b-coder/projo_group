const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { requireAdmin } = require("../middleware/requireAdmin");
const c = require("../controllers/community.controller");

// Identity (anonymous — never linked to DatingProfile in any response)
router.get("/identity",              authenticate, c.getOrCreateIdentity);
router.post("/identity/reroll",      authenticate, c.rerollIdentity);
router.post("/identity/avatar",      authenticate, c.setAvatar);
router.get("/avatars",               authenticate, c.listAvatars);

// Rooms
router.get("/rooms",                 authenticate, c.listRooms);
router.get("/rooms/:slug",           authenticate, c.getRoom);
router.post("/rooms/:slug/join",     authenticate, c.joinRoom);

// Reactions
router.post("/messages/:id/react",   authenticate, c.reactToMessage);

// Polls
router.post("/rooms/:slug/polls",    authenticate, c.createPoll);
router.get("/polls/:id",             authenticate, c.getPoll);
router.post("/polls/:id/vote",       authenticate, c.voteOnPoll);

// Reports (any user)
router.post("/report",               authenticate, c.reportContent);

// ── Moderator dashboard — admin only ──
router.get("/mod/reports",           authenticate, requireAdmin, c.modListReports);
router.get("/mod/held-messages",     authenticate, requireAdmin, c.modHeldMessages);
router.get("/mod/events",            authenticate, requireAdmin, c.modEvents);
router.post("/mod/messages/:id/approve", authenticate, requireAdmin, c.modApproveMessage);
router.post("/mod/messages/:id/remove",  authenticate, requireAdmin, c.modRemoveMessage);
router.post("/mod/messages/:id/pin",     authenticate, requireAdmin, c.modPinMessage);
router.post("/mod/users/:userId/mute",   authenticate, requireAdmin, c.modMuteUser);
router.post("/mod/users/:userId/ban",    authenticate, requireAdmin, c.modBanUser);
router.post("/mod/users/:userId/unban",  authenticate, requireAdmin, c.modUnbanUser);
router.post("/mod/rooms",                authenticate, requireAdmin, c.modCreateRoom);

module.exports = router;
