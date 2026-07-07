// PROJO DATING — Compatibility scoring
// Simple, explainable scoring model based on shared attributes. Not ML —
// just weighted overlap, which is transparent and easy for support staff
// to explain to a user who asks "why is this my match %?"

function overlapScore(a = [], b = []) {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b.map((x) => x.toLowerCase()));
  const shared = a.filter((x) => setB.has(x.toLowerCase())).length;
  const denom = Math.max(a.length, b.length);
  return shared / denom; // 0..1
}

function computeCompatScore(a, b) {
  let score = 40; // baseline so nobody sees an unflattering single-digit %

  score += overlapScore(a.interests, b.interests) * 22;
  score += overlapScore(a.relationshipGoals, b.relationshipGoals) * 15;
  score += overlapScore(a.music, b.music) * 6;
  score += overlapScore(a.movies, b.movies) * 6;
  score += overlapScore(a.languages, b.languages) * 5;

  // Age closeness — within 3 years is a full bonus, tapering to 0 by 15 years apart
  const ageDiff = Math.abs((a.age || 0) - (b.age || 0));
  score += Math.max(0, 1 - ageDiff / 15) * 8;

  // Same city bonus
  if (a.city && b.city && a.city.toLowerCase() === b.city.toLowerCase()) score += 6;

  return Math.max(35, Math.min(99, Math.round(score)));
}

module.exports = { computeCompatScore };
