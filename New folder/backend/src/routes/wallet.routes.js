const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const wallet = require("../controllers/wallet.controller");

router.get("/", authenticate, wallet.getWallet);
router.post("/topup", authenticate, wallet.topUp);
router.get("/transactions", authenticate, wallet.getTransactions);

module.exports = router;
