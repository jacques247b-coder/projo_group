// PROJO GROUP — Texas Hold'em Poker Engine
// Pure game logic, no dependencies — hand evaluation, deck management.
// Kept separate from the controller/socket layer so this can be tested
// in isolation, since correctness here matters more than almost anything
// else in the whole feature (a wrong hand evaluation ruins the game).

const SUITS = ["H", "D", "C", "S"]; // Hearts, Diamonds, Clubs, Spades
const RANK_NAMES = { 11: "J", 12: "Q", 13: "K", 14: "A" };

function rankName(rank) {
  return RANK_NAMES[rank] || String(rank);
}

function cardName(card) {
  return `${rankName(card.rank)}${card.suit}`;
}

function freshDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (let rank = 2; rank <= 14; rank++) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

function shuffle(deck) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// Evaluates exactly 5 cards, returns a comparable score array:
// [category, tiebreaker1, tiebreaker2, ...] — higher compares as better.
// Category: 9=Straight/Royal Flush, 8=Four of a Kind, 7=Full House,
// 6=Flush, 5=Straight, 4=Three of a Kind, 3=Two Pair, 2=Pair, 1=High Card
function evaluateFive(cards) {
  const ranks = cards.map(c => c.rank).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const isFlush = suits.every(s => s === suits[0]);

  const uniqueRanks = [...new Set(ranks)];
  let isStraight = false;
  let straightHigh = 0;
  if (uniqueRanks.length === 5) {
    if (uniqueRanks[0] - uniqueRanks[4] === 4) {
      isStraight = true;
      straightHigh = uniqueRanks[0];
    } else if (uniqueRanks.join(",") === "14,5,4,3,2") {
      // Ace-low straight (wheel) — Ace counts as 1, straight is 5-high
      isStraight = true;
      straightHigh = 5;
    }
  }

  const counts = {};
  for (const r of ranks) counts[r] = (counts[r] || 0) + 1;
  const countEntries = Object.entries(counts)
    .map(([r, c]) => [parseInt(r), c])
    .sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const pattern = countEntries.map(e => e[1]);

  if (isStraight && isFlush) return [9, straightHigh];
  if (pattern[0] === 4) return [8, countEntries[0][0], countEntries[1][0]];
  if (pattern[0] === 3 && pattern[1] === 2) return [7, countEntries[0][0], countEntries[1][0]];
  if (isFlush) return [6, ...ranks];
  if (isStraight) return [5, straightHigh];
  if (pattern[0] === 3) {
    const kickers = countEntries.slice(1).map(e => e[0]).sort((a, b) => b - a);
    return [4, countEntries[0][0], ...kickers];
  }
  if (pattern[0] === 2 && pattern[1] === 2) {
    const pairs = [countEntries[0][0], countEntries[1][0]].sort((a, b) => b - a);
    return [3, ...pairs, countEntries[2][0]];
  }
  if (pattern[0] === 2) {
    const kickers = countEntries.slice(1).map(e => e[0]).sort((a, b) => b - a);
    return [2, countEntries[0][0], ...kickers];
  }
  return [1, ...ranks];
}

function compareScores(a, b) {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const av = a[i] ?? 0, bv = b[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

const HAND_NAMES = {
  9: "Straight Flush", 8: "Four of a Kind", 7: "Full House", 6: "Flush",
  5: "Straight", 4: "Three of a Kind", 3: "Two Pair", 2: "Pair", 1: "High Card",
};

// Best 5-card hand out of up to 7 cards (2 hole + 5 community)
function bestHand(cards) {
  if (cards.length < 5) throw new Error("Need at least 5 cards to evaluate a hand");
  const combos = [];
  (function combine(start, chosen) {
    if (chosen.length === 5) { combos.push([...chosen]); return; }
    for (let i = start; i < cards.length; i++) {
      chosen.push(cards[i]);
      combine(i + 1, chosen);
      chosen.pop();
    }
  })(0, []);

  let best = null, bestScore = null;
  for (const combo of combos) {
    const score = evaluateFive(combo);
    if (!bestScore || compareScores(score, bestScore) > 0) {
      bestScore = score;
      best = combo;
    }
  }
  return { cards: best, score: bestScore, name: HAND_NAMES[bestScore[0]] };
}

// Returns the winning player index(es) among candidates — array in case
// of a tied pot split
function determineWinners(playerHands) {
  // playerHands: [{ index, score }]
  let bestScore = null;
  for (const p of playerHands) {
    if (!bestScore || compareScores(p.score, bestScore) > 0) bestScore = p.score;
  }
  return playerHands.filter(p => compareScores(p.score, bestScore) === 0).map(p => p.index);
}

// Builds side pots when one or more players are all-in for less than
// others — standard layered-pot algorithm. contributions: array of
// { index, amount } — each player's TOTAL contribution across the whole
// hand. Returns an array of { amount, eligibleIndexes } layers, smallest
// contribution level first.
function buildSidePots(contributions) {
  const active = contributions.filter(c => c.amount > 0);
  if (active.length === 0) return [];
  const levels = [...new Set(active.map(c => c.amount))].sort((a, b) => a - b);
  const pots = [];
  let previousLevel = 0;
  for (const level of levels) {
    const layerAmount = level - previousLevel;
    const eligible = active.filter(c => c.amount >= level).map(c => c.index);
    const contributingToThisLayer = active.filter(c => c.amount > previousLevel);
    const potSize = layerAmount * contributingToThisLayer.length;
    if (potSize > 0) pots.push({ amount: potSize, eligibleIndexes: eligible });
    previousLevel = level;
  }
  return pots;
}

module.exports = { freshDeck, shuffle, bestHand, evaluateFive, compareScores, determineWinners, buildSidePots, cardName, rankName, HAND_NAMES };
