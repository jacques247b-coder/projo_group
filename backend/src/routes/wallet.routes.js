// ============================================================
// PROJO GROUP — Wallet Routes
// ZAR balance, PayFast top-up, transaction history
// Referral: R50 bonus | Loyalty points system
// ============================================================
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const walletController = require("../controllers/wallet.controller");

router.get("/", authenticate, walletController.getWallet);
router.get("/transactions", authenticate, walletController.getTransactions);
router.post("/topup", authenticate, walletController.initiateTopUp);
router.post("/topup/verify", walletController.verifyTopUp); // PayFast ITN webhook
router.post("/pay", authenticate, walletController.payWithWallet);

module.exports = router;
