// PROJO GROUP — Delivery Routes
const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth.middleware");
const delivery = require("../controllers/delivery.controller");

router.post("/book", authenticate, delivery.bookDelivery);
router.get("/", authenticate, delivery.getDeliveries);
router.get("/track/:trackingNumber", delivery.trackDelivery);
router.post("/:id/accept", authenticate, requireRole("DRIVER"), delivery.acceptDelivery);
router.post("/:id/status", authenticate, requireRole("DRIVER"), delivery.updateDriverDeliveryStatus);

module.exports = router;
