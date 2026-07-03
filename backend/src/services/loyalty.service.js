// PROJO GROUP — Loyalty Service (Full Points Ledger)
// Points awarded ONLY on completed rides/deliveries/services
// Points deducted on refunds/cancellations after payment

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const TIERS = [
  { name: "Starter", min: 500,  max: 1000,      discountPct: 5  },
  { name: "Growth",  min: 1000, max: 1500,       discountPct: 10 },
  { name: "Elite",   min: 1500, max: Infinity,   discountPct: 15 },
];

const POINTS_PER_RAND = 0.1; // 1 point per R10 spent

function getTier(points) {
  if (points < 500) return null;
  return TIERS.find(t => points >= t.min && points < t.max) || TIERS[TIERS.length - 1];
}

function calculatePoints(lifetimeSpend) {
  return Math.floor((lifetimeSpend || 0) * POINTS_PER_RAND);
}

function applyLoyaltyDiscount(fare, points) {
  const tier = getTier(points);
  if (!tier) {
    return { finalFare: parseFloat(fare.toFixed(2)), discountApplied: 0, discountPct: 0, tierName: "None" };
  }
  const discountAmount = fare * (tier.discountPct / 100);
  const finalFare = Math.max(0, fare - discountAmount);
  return {
    finalFare: parseFloat(finalFare.toFixed(2)),
    discountApplied: parseFloat(discountAmount.toFixed(2)),
    discountPct: tier.discountPct,
    tierName: tier.name,
  };
}

// Get user's ACTUAL loyalty points from wallet
async function getUserLoyaltyPoints(userId) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) return 0;
  // Use stored loyaltyPoints if available, fallback to lifetimeSpend calculation
  return wallet.loyaltyPoints || calculatePoints(wallet.lifetimeSpend || 0);
}

// Award points when a ride/service COMPLETES
async function awardPoints(userId, amountSpent, description) {
  try {
    const pointsToAward = Math.floor(amountSpent * POINTS_PER_RAND);
    if (pointsToAward <= 0) return;

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return;

    await prisma.wallet.update({
      where: { userId },
      data: {
        loyaltyPoints: { increment: pointsToAward },
        lifetimeSpend: { increment: amountSpent },
      },
    });

    // Log as transaction for history
    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: "LOYALTY_POINTS",
        status: "COMPLETED",
        amountZar: 0,
        description: `+${pointsToAward} pts — ${description}`,
        referenceId: `pts_${pointsToAward}`,
      },
    });

    console.log(`[PROJO Loyalty] Awarded ${pointsToAward} pts to user ${userId} (R${amountSpent} spent)`);
    return pointsToAward;
  } catch (err) {
    console.error("[PROJO Loyalty] Award error:", err.message);
  }
}

// Deduct points when a completed ride is cancelled/refunded
async function deductPoints(userId, amountRefunded, description) {
  try {
    const pointsToDeduct = Math.floor(amountRefunded * POINTS_PER_RAND);
    if (pointsToDeduct <= 0) return;

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return;

    const currentPoints = wallet.loyaltyPoints || 0;
    const actualDeduction = Math.min(pointsToDeduct, currentPoints); // can't go below 0

    await prisma.wallet.update({
      where: { userId },
      data: {
        loyaltyPoints: { decrement: actualDeduction },
        lifetimeSpend: { decrement: Math.min(amountRefunded, wallet.lifetimeSpend || 0) },
      },
    });

    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: "LOYALTY_POINTS",
        status: "COMPLETED",
        amountZar: 0,
        description: `-${actualDeduction} pts — ${description}`,
        referenceId: `pts_-${actualDeduction}`,
      },
    });

    console.log(`[PROJO Loyalty] Deducted ${actualDeduction} pts from user ${userId}`);
    return actualDeduction;
  } catch (err) {
    console.error("[PROJO Loyalty] Deduct error:", err.message);
  }
}

// Refund wallet balance for cancelled paid ride
async function refundWallet(userId, amountZar, description) {
  try {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return;

    await prisma.$transaction([
      prisma.wallet.update({
        where: { userId },
        data: { balanceZar: { increment: amountZar } },
      }),
      prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: "REFUND",
          status: "COMPLETED",
          amountZar: amountZar,
          description: `Refund — ${description}`,
        },
      }),
    ]);

    console.log(`[PROJO Loyalty] Refunded R${amountZar} to user ${userId}`);
  } catch (err) {
    console.error("[PROJO Loyalty] Refund error:", err.message);
  }
}

module.exports = {
  TIERS, getTier, calculatePoints,
  applyLoyaltyDiscount, getUserLoyaltyPoints,
  awardPoints, deductPoints, refundWallet,
};
