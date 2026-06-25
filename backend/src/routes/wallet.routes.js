// PROJO GROUP — Wallet Routes
const express = require("express");
const router  = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const wallet = require("../controllers/wallet.controller");

// Protected routes
router.get("/",               authenticate, wallet.getWallet);
router.post("/topup",         authenticate, wallet.topUp);
router.get("/transactions",   authenticate, wallet.getTransactions);

// PayFast ITN — NO auth (PayFast calls this directly)
// Must be raw body for signature verification
router.post("/payfast-itn",   wallet.payfastITN);

module.exports = router;
