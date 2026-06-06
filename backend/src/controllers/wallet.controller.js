// ============================================================
// PROJO GROUP — Wallet Controller
// ZAR balance, PayFast top-up, transactions, loyalty points
// Referral bonus: R50 | Loyalty: 1 point per R10 spent
// ============================================================
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

// ── GET /api/wallet ───────────────────────────────────────────
exports.getWallet = async (req, res) => {
  try {
    let wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: req.user.id, balanceZar: 0, loyaltyPoints: 0 },
      });
    }
    res.json({
      balanceZar: wallet.balanceZar,
      loyaltyPoints: wallet.loyaltyPoints,
      displayBalance: `R${wallet.balanceZar.toFixed(2)}`,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── GET /api/wallet/transactions ──────────────────────────────
exports.getTransactions = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 30;
  try {
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
    if (!wallet) return res.json({ transactions: [], total: 0 });

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where: { walletId: wallet.id } }),
    ]);
    res.json({ transactions, total, page, pages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── POST /api/wallet/topup — initiate PayFast payment ────────
exports.initiateTopUp = async (req, res) => {
  const { amountZar } = req.body;
  if (!amountZar || amountZar < 10)
    return res.status(400).json({ error: "Minimum top-up is R10" });

  try {
    const user = req.user;
    const merchantId = process.env.PAYFAST_MERCHANT_ID;
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
    const passphrase = process.env.PAYFAST_PASSPHRASE;
    const isSandbox = process.env.PAYFAST_SANDBOX === "true";
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const amount = parseFloat(amountZar).toFixed(2);

    // Build PayFast data object
    const data = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${baseUrl}/wallet?topup=success`,
      cancel_url: `${baseUrl}/wallet?topup=cancelled`,
      notify_url: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/wallet/topup/verify`,
      name_first: user.name.split(" ")[0] || "PROJO",
      name_last: user.name.split(" ").slice(1).join(" ") || "User",
      email_address: user.email || `${user.phone.replace("+","")}@projogroup.co.za`,
      cell_number: user.phone.replace("+27", "0"),
      m_payment_id: `${user.id}_${Date.now()}`,
      amount,
      item_name: `PROJO GROUP Wallet Top-Up R${amount}`,
      item_description: `Wallet credit for ${user.phone}`,
      custom_str1: user.id,
    };

    // Generate PayFast signature
    const paramStr = Object.entries(data)
      .filter(([, v]) => v !== "" && v !== undefined)
      .map(([k, v]) => `${k}=${encodeURIComponent(v.toString().trim())}`)
      .join("&");

    const signStr = passphrase ? `${paramStr}&passphrase=${encodeURIComponent(passphrase)}` : paramStr;
    data.signature = crypto.createHash("md5").update(signStr).digest("hex");

    const payfastUrl = isSandbox
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process";

    // Build redirect URL
    const query = Object.entries(data)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");
    const paymentUrl = `${payfastUrl}?${query}`;

    // Record pending transaction
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (wallet) {
      await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: "TOPUP",
          status: "PENDING",
          amountZar: parseFloat(amount),
          description: `Wallet top-up R${amount} via PayFast`,
          paymentRef: data.m_payment_id,
        },
      });
    }

    res.json({ paymentUrl, amount, paymentRef: data.m_payment_id });
  } catch (err) {
    console.error("[PROJO Wallet] PayFast initiate error:", err);
    res.status(500).json({ error: "Could not initiate payment" });
  }
};

// ── POST /api/wallet/topup/verify — PayFast ITN webhook ──────
exports.verifyTopUp = async (req, res) => {
  try {
    const { payment_status, m_payment_id, amount_gross, custom_str1: userId } = req.body;

    if (payment_status !== "COMPLETE") return res.sendStatus(200);

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return res.sendStatus(200);

    const amount = parseFloat(amount_gross);

    // Credit wallet
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balanceZar: { increment: amount } },
    });

    // Update transaction status
    await prisma.transaction.updateMany({
      where: { paymentRef: m_payment_id, walletId: wallet.id },
      data: { status: "COMPLETED" },
    });

    console.log(`[PROJO Wallet] Top-up confirmed: R${amount} for user ${userId}`);
    res.sendStatus(200);
  } catch (err) {
    console.error("[PROJO Wallet] ITN verify error:", err);
    res.sendStatus(200); // Always 200 to PayFast
  }
};

// ── POST /api/wallet/pay — deduct from wallet ─────────────────
exports.payWithWallet = async (req, res) => {
  const { amountZar, description, referenceId, type = "RIDE_PAYMENT" } = req.body;
  if (!amountZar || amountZar <= 0)
    return res.status(400).json({ error: "Invalid amount" });
  try {
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
    if (!wallet || wallet.balanceZar < amountZar)
      return res.status(402).json({ error: `Insufficient balance. Have R${wallet?.balanceZar?.toFixed(2) || "0.00"}` });

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balanceZar: { decrement: amountZar },
        loyaltyPoints: { increment: Math.floor(amountZar / 10) }, // 1 point per R10
      },
    });

    await prisma.transaction.create({
      data: {
        walletId: wallet.id, type, status: "COMPLETED",
        amountZar: parseFloat(amountZar),
        description: description || `Payment R${amountZar}`,
        referenceId,
      },
    });

    const updated = await prisma.wallet.findUnique({ where: { id: wallet.id } });
    res.json({ success: true, newBalance: updated.balanceZar });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
