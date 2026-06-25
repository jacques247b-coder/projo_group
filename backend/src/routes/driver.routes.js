// ============================================================
// PROJO GROUP — Driver Routes (FIXED)
// Now uses driver.controller.js — clean separation
// ============================================================
const express = require("express");
const router  = express.Router();
const { authenticate, requireRole } = require("../middleware/auth.middleware");
const driver = require("../controllers/driver.controller");

// Profile
router.get("/me",            authenticate, requireRole("DRIVER"), driver.getProfile);

// Status toggle (online/offline)
router.post("/status",       authenticate, requireRole("DRIVER"), driver.updateStatus);

// Earnings
router.get("/earnings",      authenticate, requireRole("DRIVER"), driver.getEarnings);

// Pending ride requests
router.get("/pending-rides", authenticate, requireRole("DRIVER"), driver.getPendingRides);

// Register as driver (any authenticated user)
router.post("/register",     authenticate, driver.register);

module.exports = router;
