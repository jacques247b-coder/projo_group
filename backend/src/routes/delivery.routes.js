// PROJO GROUP — Delivery Routes
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const delivery = require("../controllers/delivery.controller");

router.post("/book", authenticate, delivery.bookDelivery);
router.get("/", authenticate, delivery.getDeliveries);
router.get("/track/:trackingNumber", delivery.trackDelivery);

module.exports = router;
