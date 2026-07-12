// PROJO GROUP — Texas Hold'em lobby (REST)
// Actual gameplay happens over the socket layer (poker.socket.js) — this
// is just for browsing/creating tables and checking your chip balance.
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET /api/games/poker/tables
exports.listTables = async (req, res) => {
  try {
    const tables = await prisma.pokerTable.findMany({
      where: { status: { in: ["WAITING", "PLAYING"] } },
      orderBy: { createdAt: "desc" },
      include: { players: { select: { id: true } } },
    });
    res.json({
      tables: tables.map(t => ({
        id: t.id, name: t.name, status: t.status, maxPlayers: t.maxPlayers,
        smallBlind: t.smallBlind, bigBlind: t.bigBlind, playerCount: t.players.length,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Could not load tables" });
  }
};

// POST /api/games/poker/tables
exports.createTable = async (req, res) => {
  try {
    const { name, smallBlind = 10, bigBlind = 20, maxPlayers = 6 } = req.body;
    const table = await prisma.pokerTable.create({
      data: { name: name || `${req.user.name}'s Table`, smallBlind, bigBlind, maxPlayers: Math.min(Math.max(maxPlayers, 2), 6) },
    });
    res.status(201).json({ table });
  } catch (err) {
    res.status(500).json({ error: "Could not create table" });
  }
};

// GET /api/games/poker/chips
exports.getChipBalance = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { pokerChips: true } });
    res.json({ pokerChips: user?.pokerChips || 0 });
  } catch (err) {
    res.status(500).json({ error: "Could not load balance" });
  }
};

// GET /api/games/poker/leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const top = await prisma.user.findMany({
      orderBy: { pokerChips: "desc" },
      take: 20,
      select: { id: true, name: true, pokerChips: true },
    });
    res.json({ leaderboard: top });
  } catch (err) {
    res.status(500).json({ error: "Could not load leaderboard" });
  }
};
