// PROJO GROUP — Service Booking Routes (with options)
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const service = require("../controllers/service.controller");
const options = require("../controllers/productOptions.controller");

router.get("/products/:id/options", options.getProductOptions); // public
router.post("/quote", authenticate, service.getQuote);
router.post("/book", authenticate, service.bookService);
router.get("/orders", authenticate, service.getMyOrders);

module.exports = router;
