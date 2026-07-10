// PROJO GROUP — Push Notification Routes
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const push = require("../controllers/push.controller");

router.get("/vapid-key",  push.getVapidKey);
router.get("/image/:id", push.servePushImage);
router.post("/subscribe", authenticate, push.subscribe);
router.post("/unsubscribe", authenticate, push.unsubscribe);

module.exports = router;
