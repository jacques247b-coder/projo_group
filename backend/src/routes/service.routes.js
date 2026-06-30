// PROJO GROUP — Service Booking Routes
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const service = require("../controllers/service.controller");

router.get("/quote/:productId", authenticate, service.getQuote);
router.post("/book", authenticate, service.bookService);
router.get("/orders", authenticate, service.getMyOrders);

module.exports = router;
