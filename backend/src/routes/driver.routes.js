// PROJO GROUP — Driver Routes (Updated with application flow)
const express = require("express");
const router  = express.Router();
const { authenticate, requireRole } = require("../middleware/auth.middleware");
const driver = require("../controllers/driver.controller");
const driverApp = require("../controllers/driver.application.controller");

// ── Existing driver routes ────────────────────────────────────
router.get("/me",            authenticate, requireRole("DRIVER"), driver.getProfile);
router.get("/:id/photo",     authenticate, driver.getDriverPhoto);
router.post("/status",       authenticate, requireRole("DRIVER"), driver.updateStatus);
router.get("/earnings",      authenticate, requireRole("DRIVER"), driver.getEarnings);
router.get("/pending-rides",    authenticate, requireRole("DRIVER"), driver.getPendingRides);
router.post("/rides/:id/accept", authenticate, requireRole("DRIVER"), driver.acceptRide);
router.post("/location",         authenticate, requireRole("DRIVER"), driver.updateLocation);
router.post("/shift-end",        authenticate, requireRole("DRIVER"), driver.shiftEnd);

// ── Driver application routes ─────────────────────────────────
// Submit application (any authenticated user)
router.post("/apply", authenticate, driverApp.applyAsDriver);

// Admin only — view pending, approve, reject
router.get("/pending",       authenticate, requireRole("ADMIN"), driverApp.getPendingApplications);
router.post("/:id/approve",  authenticate, requireRole("ADMIN"), driverApp.approveDriver);
router.post("/:id/reject",   authenticate, requireRole("ADMIN"), driverApp.rejectDriver);

module.exports = router;
