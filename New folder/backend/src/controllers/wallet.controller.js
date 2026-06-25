const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get wallet balance and transactions
exports.getWallet = async (req, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.id },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
    // Loyalty points: 1 per R10 spent
    const loyaltyPoints = Math.floor((wallet?.balanceZar || 0) / 10);
    res.json({ wallet: { ...wallet, loyaltyPoints } });
  } catch (err) {
    res.status(500).json({ error: "Could not get wallet" });
  }
};

// Top up wallet
exports.topUp = async (req, res) => {
  const { amountZar } = req.body;
  if (!amountZar || amountZar < 10) return res.status(400).json({ error: "Minimum top up is R10" });
  try {
    const wallet = await prisma.wallet.update({
      where: { userId: req.user.id },
      data: { balanceZar: { increment: amountZar } },
    });
    await prisma.transaction.create({
      data: { walletId: wallet.id, type: "TOPUP", status: "COMPLETED",
        amountZar, description: `Wallet top up of R${amountZar}` },
    });
    res.json({ message: `R${amountZar} added to wallet`, wallet });
  } catch (err) {
    res.status(500).json({ error: "Top up failed" });
  }
};

// Get transactions
exports.getTransactions = async (req, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
    if (!wallet) return res.json({ transactions: [] });
    const transactions = await prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ transactions });
  } catch (err) {
    res.json({ transactions: [] });
  }
};
