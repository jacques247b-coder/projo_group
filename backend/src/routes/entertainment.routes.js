// PROJO GROUP — Entertainment Routes
const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth.middleware");
const entertainment = require("../controllers/entertainment.controller");

// Public (auth required)
router.get("/ads",  authenticate, entertainment.getAds);
router.post("/ads", authenticate, entertainment.submitAd);

module.exports = router;
