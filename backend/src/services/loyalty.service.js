// PROJO GROUP — Loyalty Tier Service
// Single source of truth for tier thresholds and discounts
// Used by ride, delivery, and shop checkout to apply automatic discounts

const TIERS = [
  { name: "Starter", min: 500,  max: 1000,     discountPct: 5  },
  { name: "Growth",  min: 1000, max: 1500,     discountPct: 10 },
  { name: "Elite",   min: 1500, max: Infinity, discountPct: 15 },
];

/**
 * Get a user's loyalty tier based on their points.
 * Returns null if below 500 points (no tier reached yet, no discount).
 * @param {number} points - user's current loyalty points
 * @returns {{name: string, discountPct: number} | null}
 */
function getTier(points) {
  if (points < 500) return null; // Not yet in any tier
  return TIERS.find(t => points >= t.min && points < t.max) || TIERS[TIERS.length - 1];
}

/**
 * Calculate loyalty points from wallet balance (1pt per R10 spent historically)
 */
function calculatePoints(lifetimeSpend) {
  return Math.floor((lifetimeSpend || 0) / 10);
}

/**
 * Apply the user's loyalty discount to a fare amount.
 * No discount below 500 points. 5% at Starter (500-999), 10% at Growth (1000-1499),
 * 15% at Elite (1500+).
 * @param {number} fare - original fare before discount
 * @param {number} points - user's loyalty points
 * @returns {{ finalFare: number, discountApplied: number, discountPct: number, tierName: string }}
 */
function applyLoyaltyDiscount(fare, points) {
  const tier = getTier(points);

  if (!tier) {
    return {
      finalFare: parseFloat(fare.toFixed(2)),
      discountApplied: 0,
      discountPct: 0,
      tierName: "None",
    };
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

module.exports = { TIERS, getTier, calculatePoints, applyLoyaltyDiscount };
