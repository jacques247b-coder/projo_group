const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { requireAdmin } = require("../middleware/requireAdmin");
const dating = require("../controllers/dating.controller");

// Profile
router.get("/profiles",           authenticate, dating.getProfiles);
router.post("/profile",           authenticate, dating.upsertProfile);
router.get("/me",                 authenticate, dating.getMyProfileWithStatus);

// Like / Pass / Undo
router.post("/like/:toId",        authenticate, dating.likeProfile);
router.post("/pass/:toId",        authenticate, dating.passProfile);
router.post("/undo-pass",         authenticate, dating.undoLastPass);

// Who liked me
router.get("/liked-me",           authenticate, dating.getWhoLikedMe);

// Matches & messages
router.get("/matches",            authenticate, dating.getMatches);
router.post("/message",           authenticate, dating.sendMessage);
router.get("/messages/:matchId",  authenticate, dating.getMessages);

// Boost & Incognito
router.post("/boost",             authenticate, dating.activateBoost);
router.post("/incognito",         authenticate, dating.setIncognito);

// Photos
router.post("/photo",             authenticate, dating.addPhoto);
router.post("/photo/remove",      authenticate, dating.removePhoto);

// Block & Report
router.post("/block/:profileId",  authenticate, dating.blockProfile);
router.post("/unblock/:profileId",authenticate, dating.unblockProfile);
router.get("/blocked",            authenticate, dating.listBlocked);
router.post("/report",            authenticate, dating.reportProfile);

// Verification
router.post("/verify/request",    authenticate, dating.requestVerification);
router.get("/verify/status",      authenticate, dating.getVerificationStatus);

// Admin — verification review
router.get("/admin/verify/pending",       authenticate, requireAdmin, dating.adminListPendingVerifications);
router.post("/admin/verify/:id/approve",  authenticate, requireAdmin, dating.adminApproveVerification);
router.post("/admin/verify/:id/reject",   authenticate, requireAdmin, dating.adminRejectVerification);

module.exports = router;
