// ============================================================
// PROJO GROUP — Ride Routes
// Book, track, and manage rides in Rustenburg
// ============================================================

const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const rideController = require("../controllers/ride.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

// ── POST /api/rides/estimate ──────────────────────────────────
// Get fare estimate (no auth required — used on landing page)
router.post(
  "/estimate",
  [
    body("pickupLat").isFloat(),
    body("pickupLng").isFloat(),
    body("dropoffLat").isFloat(),
    body("dropoffLng").isFloat(),
    body("vehicleType").optional().isIn(["ECONOMY", "COMFORT", "XL", "LUXURY", "BIKE", "VAN", "BUSINESS"]),
  ],
  rideController.estimateFare
);

// ── POST /api/rides/book ──────────────────────────────────────
// Book a ride (immediate or scheduled)
router.post(
  "/book",
  authenticate,
  requireRole("PASSENGER", "ADMIN"),
  [
    body("pickupAddress").notEmpty(),
    body("pickupLat").isFloat(),
    body("pickupLng").isFloat(),
    body("dropoffAddress").notEmpty(),
    body("dropoffLat").isFloat(),
    body("dropoffLng").isFloat(),
    body("vehicleType").isIn(["ECONOMY", "COMFORT", "XL", "LUXURY", "BIKE", "VAN", "BUSINESS"]),
    body("scheduledFor").optional().isISO8601(),
    body("paidWithWallet").optional().isBoolean(),
  ],
  rideController.bookRide
);

// ── POST /api/rides/street-pickup ────────────────────────────
// Driver creates a ride for a walk-up passenger (no app/account needed)
router.post(
  "/street-pickup",
  authenticate,
  requireRole("DRIVER"),
  [
    body("pickupAddress").notEmpty(),
    body("pickupLat").isFloat(),
    body("pickupLng").isFloat(),
    body("dropoffAddress").notEmpty(),
    body("dropoffLat").isFloat(),
    body("dropoffLng").isFloat(),
    body("vehicleType").isIn(["ECONOMY", "COMFORT", "XL", "LUXURY", "BIKE", "VAN", "BUSINESS"]),
  ],
  rideController.streetPickup
);

// ── GET /api/rides/active ─────────────────────────────────────
// Get passenger's current active ride
router.get("/active", authenticate, rideController.getActiveRide);

// ── GET /api/rides/history ────────────────────────────────────
// Ride history for passenger or driver
router.get("/history", authenticate, rideController.getRideHistory);

// ── GET /api/rides/:id ────────────────────────────────────────
router.get("/:id", authenticate, rideController.getRideById);

// ── GET /api/rides/share/:token ───────────────────────────────
// Public share link — no auth (show live ride location)
router.get("/share/:token", rideController.getSharedRide);

// ── POST /api/rides/:id/cancel ────────────────────────────────
router.post(
  "/:id/cancel",
  authenticate,
  [body("reason").optional().isString()],
  rideController.cancelRide
);

// ── POST /api/rides/:id/rate ──────────────────────────────────
// Rate a completed ride
router.post(
  "/:id/rate",
  authenticate,
  [
    body("stars").isInt({ min: 1, max: 5 }),
    body("comment").optional().isString().isLength({ max: 500 }),
  ],
  rideController.rateRide
);

// ── Driver actions ────────────────────────────────────────────

// Accept a ride request
router.post(
  "/:id/accept",
  authenticate,
  requireRole("DRIVER"),
  rideController.acceptRide
);

// Update ride status (arrived, started, completed)
router.post(
  "/:id/status",
  authenticate,
  requireRole("DRIVER"),
  [body("status").isIn(["ARRIVED_AT_PICKUP", "IN_PROGRESS", "COMPLETED"])],
  rideController.updateRideStatus
);

module.exports = router;
