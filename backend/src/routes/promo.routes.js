// PROJO GROUP — Promo Code Routes
const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth.middleware");
const promo = require("../controllers/promo.controller");

// User-facing
router.post("/validate", authenticate, promo.validateCode);
router.post("/redeem",   authenticate, promo.redeemCode);

module.exports = router;
