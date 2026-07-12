// PROJO GROUP — Poker lobby routes
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const poker = require("../controllers/poker.controller");

router.use(authenticate);
router.get("/poker/tables", poker.listTables);
router.post("/poker/tables", poker.createTable);
router.get("/poker/chips", poker.getChipBalance);
router.get("/poker/leaderboard", poker.getLeaderboard);

module.exports = router;
