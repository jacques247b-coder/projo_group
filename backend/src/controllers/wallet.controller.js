// ============================================================
// PROJO GROUP — Wallet Controller (PayFast Integration)
// Handles: balance, top-up via PayFast, ITN callback, transactions
// ============================================================
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

// ─── PayFast Config ───────────────────────────────────────────
const PF = {
  merchantId:  process.env.PAYFAST_MERCHANT_ID  || "21297782",
  merchantKey: process.env.PAYFAST_MERCHANT_KEY || "ydqnuyty9ndei",
  passphrase:  process.env.PAYFAST_PASSPHRASE   || "",
  // Use sandbox for testing, live for production
  host: process.env.PAYFAST_SANDBOX === "true"
    ? "sandbox.payfast.co.za"
    : "www.payfast.co.za",
};

const FRONTEND_URL = process.env.FRONTEND_URL || "https://projo-group.onrender.com";
const BACKEND_URL  = process.env.BACKEND_URL  || "https://projo-group-backend.onrender.com";

// Generate PayFast signature
function generateSignature(data, passphrase = "") {
  let pfOutput = "";
  // Sort keys alphabetically and build query string
  const keys = Object.keys(data).sort();
  keys.forEach(key => {
    if (data[key] !== "" && data[key] !== undefined && data[key] !== null) {
      pfOutput += `${key}=${encodeURIComponent(String(data[key]).trim()).replace(/%20/g, "+")}&`;
    }
  });
  // Remove trailing &
  pfOutput = pfOutput.slice(0, -1);
  if (passphrase) pfOutput += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`;
  return crypto.createHash("md5").update(pfOutput).digest("hex");
}

// ─── GET /api/wallet ─────────────────────────────────────────
exports.getWallet = async (req, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.id },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
    if (!wallet) {
      // Create wallet if missing
      const newWallet = await prisma.wallet.create({
        data: { userId: req.user.id, balanceZar: 0 },
        include: { transactions: true },
      });
      return res.json({ wallet: { ...newWallet, loyaltyPoints: 0 } });
    }
    const loyaltyPoints = Math.floor((wallet.balanceZar || 0) / 10);
    res.json({ wallet: { ...wallet, loyaltyPoints } });
  } catch (err) {
    res.status(500).json({ error: "Could not get wallet" });
  }
};

// ─── POST /api/wallet/topup — Initiate PayFast payment ───────
exports.topUp = async (req, res) => {
  const { amountZar } = req.body;
  if (!amountZar || amountZar < 10) {
    return res.status(400).json({ error: "Minimum top-up is R10" });
  }

  try {
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
    if (!wallet) return res.status(404).json({ error: "Wallet not found" });

    // Create a pending transaction to track this payment
    const tx = await prisma.transaction.create({
      data: {
        walletId:    wallet.id,
        type:        "TOPUP",
        status:      "PENDING",
        amountZar:   parseFloat(amountZar),
        description: `Wallet top up of R${amountZar}`,
      },
    });

    // Build PayFast payment data
    const pfData = {
      merchant_id:   PF.merchantId,
      merchant_key:  PF.merchantKey,
      return_url:    `${FRONTEND_URL}/wallet?topup=success`,
      cancel_url:    `${FRONTEND_URL}/wallet?topup=cancelled`,
      notify_url:    `${BACKEND_URL}/api/wallet/payfast-itn`,
      name_first:    req.user.name?.split(" ")[0] || "PROJO",
      name_last:     req.user.name?.split(" ").slice(1).join(" ") || "User",
      email_address: req.user.email || "",
      m_payment_id:  tx.id,           // our transaction ID
      amount:        parseFloat(amountZar).toFixed(2),
      item_name:     "PROJO GROUP Wallet Top Up",
      item_description: `Top up R${amountZar} to PROJO GROUP Wallet`,
      custom_str1:   wallet.id,       // store wallet ID for ITN
      custom_str2:   req.user.id,     // store user ID for ITN
    };

    // Generate signature
    pfData.signature = generateSignature(pfData, PF.passphrase);

    // Build PayFast payment URL
    const queryString = Object.entries(pfData)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join("&");

    const paymentUrl = `https://${PF.host}/eng/process?${queryString}`;

    res.json({ paymentUrl, transactionId: tx.id });
  } catch (err) {
    console.error("[PROJO Wallet] topUp error:", err.message);
    res.status(500).json({ error: "Could not initiate payment" });
  }
};

// ─── POST /api/wallet/payfast-itn — PayFast Callback ─────────
// PayFast calls this URL when payment is complete
exports.payfastITN = async (req, res) => {
  try {
    const pfData = req.body;

    console.log("[PROJO PayFast] ITN received:", pfData);

    // 1. Verify payment status
    if (pfData.payment_status !== "COMPLETE") {
      console.log("[PROJO PayFast] Payment not complete:", pfData.payment_status);
      return res.status(200).send("OK"); // Always return 200 to PayFast
    }

    // 2. Verify signature
    const receivedSignature = pfData.signature;
    const dataToVerify = { ...pfData };
    delete dataToVerify.signature;
    const expectedSignature = generateSignature(dataToVerify, PF.passphrase);

    if (receivedSignature !== expectedSignature) {
      console.error("[PROJO PayFast] Signature mismatch!");
      return res.status(200).send("OK");
    }

    // 3. Get transaction and wallet IDs from custom fields
    const transactionId = pfData.m_payment_id;
    const walletId      = pfData.custom_str1;
    const amountZar     = parseFloat(pfData.amount_gross);

    // 4. Check transaction isn't already processed (prevent duplicate processing)
    const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!tx || tx.status === "COMPLETED") {
      return res.status(200).send("OK");
    }

    // 5. Update wallet balance and mark transaction complete
    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: walletId },
        data: { balanceZar: { increment: amountZar } },
      }),
      prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "COMPLETED" },
      }),
    ]);

    console.log(`[PROJO PayFast] ✅ Wallet ${walletId} topped up R${amountZar}`);
    res.status(200).send("OK");
  } catch (err) {
    console.error("[PROJO PayFast] ITN error:", err.message);
    res.status(200).send("OK"); // Always return 200 to PayFast
  }
};

// ─── GET /api/wallet/transactions ────────────────────────────
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
