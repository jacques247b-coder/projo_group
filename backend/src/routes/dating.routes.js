const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const dating = require("../controllers/dating.controller");

router.get("/profiles",           authenticate, dating.getProfiles);
router.post("/profile",           authenticate, dating.upsertProfile);
router.post("/like/:toId",        authenticate, dating.likeProfile);
router.get("/matches",            authenticate, dating.getMatches);
router.post("/message",           authenticate, dating.sendMessage);
router.get("/messages/:matchId",  authenticate, dating.getMessages);

module.exports = router;
