// PROJO GROUP — Texas Hold'em real-time layer
// Server is fully authoritative — every action is validated here, hole
// cards are only ever sent to the player who owns them (getPublicState
// strips them; getPrivateState includes them for one specific player).
// Free-to-play only — chips are User.pokerChips, never real money.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { freshDeck, shuffle, bestHand, determineWinners, buildSidePots, cardName } = require("../services/pokerEngine");

const TURN_TIMEOUT_MS = 25000;
const turnTimers = {}; // tableId -> Timeout handle

function room(tableId) { return `poker:${tableId}`; }

async function broadcastTableState(io, tableId) {
  const table = await prisma.pokerTable.findUnique({ where: { id: tableId }, include: { players: { include: { user: { select: { name: true } } }, orderBy: { seat: "asc" } } } });
  if (!table) return;
  const sockets = await io.in(room(tableId)).fetchSockets();
  for (const socket of sockets) {
    const viewerUserId = socket.data?.userId;
    io.to(socket.id).emit("poker:state", buildStateFor(table, viewerUserId));
  }
}

function buildStateFor(table, viewerUserId) {
  return {
    id: table.id,
    name: table.name,
    status: table.status,
    round: table.currentRound,
    pot: table.pot,
    currentBet: table.currentBet,
    dealerSeat: table.dealerSeat,
    currentTurnSeat: table.currentTurnSeat,
    communityCards: JSON.parse(table.communityCards || "[]"),
    smallBlind: table.smallBlind,
    bigBlind: table.bigBlind,
    players: table.players.map(p => ({
      seat: p.seat,
      userId: p.userId,
      name: p.user?.name,
      chips: p.chips,
      status: p.status,
      currentBet: p.currentBet,
      hasActed: p.hasActed,
      // Only this specific viewer ever sees their own hole cards — everyone
      // else sees a card-back placeholder until showdown reveals them
      holeCards: (p.userId === viewerUserId || table.currentRound === "SHOWDOWN")
        ? JSON.parse(p.holeCards || "[]")
        : (JSON.parse(p.holeCards || "[]").length ? ["back", "back"] : []),
    })),
  };
}

function activePlayers(players) {
  return players.filter(p => p.status === "ACTIVE" || p.status === "ALL_IN");
}

function nextSeat(players, fromSeat) {
  const seats = players.map(p => p.seat).sort((a, b) => a - b);
  const idx = seats.indexOf(fromSeat);
  for (let i = 1; i <= seats.length; i++) {
    const candidate = seats[(idx + i) % seats.length];
    const p = players.find(pl => pl.seat === candidate);
    if (p.status === "ACTIVE") return candidate; // only players who can still act
  }
  return null;
}

async function startHand(io, tableId) {
  const table = await prisma.pokerTable.findUnique({ where: { id: tableId }, include: { players: true } });
  if (!table) return;
  const seated = table.players.filter(p => p.status !== "SITTING_OUT" && p.chips > 0);
  if (seated.length < 2) return;

  let deck = shuffle(freshDeck());
  const updates = [];
  for (const p of seated) {
    const hole = [deck.pop(), deck.pop()];
    updates.push(prisma.pokerPlayer.update({ where: { id: p.id }, data: { holeCards: JSON.stringify(hole), status: "ACTIVE", currentBet: 0, totalBet: 0, hasActed: false } }));
  }
  // Anyone sitting out keeps their existing (empty) hand
  await prisma.$transaction(updates);

  const seats = seated.map(p => p.seat).sort((a, b) => a - b);
  const dealerIdx = seats.indexOf(table.dealerSeat) >= 0 ? seats.indexOf(table.dealerSeat) : -1;
  const newDealerSeat = seats[(dealerIdx + 1) % seats.length];
  const dealerPos = seats.indexOf(newDealerSeat);
  const sbSeat = seats[(dealerPos + 1) % seats.length];
  const bbSeat = seats[(dealerPos + 2) % seats.length];
  const firstToAct = seats.length === 2 ? sbSeat : seats[(dealerPos + 3) % seats.length];

  const sb = seated.find(p => p.seat === sbSeat);
  const bb = seated.find(p => p.seat === bbSeat);
  const sbAmount = Math.min(sb.chips, table.smallBlind);
  const bbAmount = Math.min(bb.chips, table.bigBlind);

  await prisma.$transaction([
    prisma.pokerPlayer.update({ where: { id: sb.id }, data: { chips: { decrement: sbAmount }, currentBet: sbAmount, totalBet: sbAmount, status: sbAmount < table.smallBlind ? "ALL_IN" : "ACTIVE" } }),
    prisma.pokerPlayer.update({ where: { id: bb.id }, data: { chips: { decrement: bbAmount }, currentBet: bbAmount, totalBet: bbAmount, status: bbAmount < table.bigBlind ? "ALL_IN" : "ACTIVE" } }),
    prisma.pokerTable.update({
      where: { id: tableId },
      data: {
        status: "PLAYING", currentRound: "PREFLOP", communityCards: "[]", deck: JSON.stringify(deck),
        pot: sbAmount + bbAmount, currentBet: bbAmount, dealerSeat: newDealerSeat, currentTurnSeat: firstToAct,
      },
    }),
  ]);

  await broadcastTableState(io, tableId);
  armTurnTimer(io, tableId);
}

function armTurnTimer(io, tableId) {
  clearTimeout(turnTimers[tableId]);
  turnTimers[tableId] = setTimeout(() => autoFold(io, tableId), TURN_TIMEOUT_MS);
}

async function autoFold(io, tableId) {
  const table = await prisma.pokerTable.findUnique({ where: { id: tableId }, include: { players: true } });
  if (!table || table.status !== "PLAYING") return;
  const current = table.players.find(p => p.seat === table.currentTurnSeat);
  if (!current) return;
  await handleAction(io, tableId, current.userId, "fold", 0);
}

async function handleAction(io, tableId, userId, action, amount) {
  const table = await prisma.pokerTable.findUnique({ where: { id: tableId }, include: { players: true } });
  if (!table || table.status !== "PLAYING") return;
  const player = table.players.find(p => p.userId === userId);
  if (!player || player.seat !== table.currentTurnSeat) return; // not your turn

  const toCall = table.currentBet - player.currentBet;

  if (action === "fold") {
    await prisma.pokerPlayer.update({ where: { id: player.id }, data: { status: "FOLDED", hasActed: true } });
  } else if (action === "check") {
    if (toCall > 0) return; // can't check facing a bet
    await prisma.pokerPlayer.update({ where: { id: player.id }, data: { hasActed: true } });
  } else if (action === "call") {
    const callAmount = Math.min(toCall, player.chips);
    await prisma.$transaction([
      prisma.pokerPlayer.update({ where: { id: player.id }, data: { chips: { decrement: callAmount }, currentBet: { increment: callAmount }, totalBet: { increment: callAmount }, hasActed: true, status: callAmount < toCall ? "ALL_IN" : "ACTIVE" } }),
      prisma.pokerTable.update({ where: { id: tableId }, data: { pot: { increment: callAmount } } }),
    ]);
  } else if (action === "raise" || action === "allin") {
    const raiseTo = action === "allin" ? player.currentBet + player.chips : amount;
    const addAmount = Math.min(raiseTo - player.currentBet, player.chips);
    const isAllIn = addAmount === player.chips;
    await prisma.$transaction([
      prisma.pokerPlayer.update({ where: { id: player.id }, data: { chips: { decrement: addAmount }, currentBet: { increment: addAmount }, totalBet: { increment: addAmount }, hasActed: true, status: isAllIn ? "ALL_IN" : "ACTIVE" } }),
      prisma.pokerTable.update({ where: { id: tableId }, data: { pot: { increment: addAmount }, currentBet: Math.max(table.currentBet, player.currentBet + addAmount) } }),
      // A raise reopens the action — everyone else needs to act again
      ...table.players.filter(p => p.id !== player.id && p.status === "ACTIVE").map(p => prisma.pokerPlayer.update({ where: { id: p.id }, data: { hasActed: false } })),
    ]);
  }

  await progressGame(io, tableId);
}

async function progressGame(io, tableId) {
  clearTimeout(turnTimers[tableId]);
  const table = await prisma.pokerTable.findUnique({ where: { id: tableId }, include: { players: true } });
  if (!table) return;

  const inHand = table.players.filter(p => p.status === "ACTIVE" || p.status === "ALL_IN");
  const stillActive = table.players.filter(p => p.status === "ACTIVE");

  // Everyone but one folded — instant win, no showdown needed
  if (inHand.length === 1) {
    await awardPot(io, tableId, [inHand[0]]);
    return;
  }

  // Round complete when every non-folded, non-all-in player has acted and
  // matched the current bet (all-in players can't act further either way)
  const roundComplete = stillActive.every(p => p.hasActed && p.currentBet === table.currentBet);

  if (!roundComplete) {
    const next = nextSeat(table.players, table.currentTurnSeat);
    await prisma.pokerTable.update({ where: { id: tableId }, data: { currentTurnSeat: next } });
    await broadcastTableState(io, tableId);
    armTurnTimer(io, tableId);
    return;
  }

  // If everyone remaining is all-in, run out the rest of the board with no
  // more betting, straight to showdown
  const canStillBet = stillActive.length >= 2;

  const rounds = ["PREFLOP", "FLOP", "TURN", "RIVER"];
  const idx = rounds.indexOf(table.currentRound);
  const deck = JSON.parse(table.deck || "[]");
  const community = JSON.parse(table.communityCards || "[]");

  if (idx < rounds.length - 1) {
    const dealCount = table.currentRound === "PREFLOP" ? 3 : 1;
    for (let i = 0; i < dealCount; i++) community.push(deck.pop());
    await prisma.$transaction([
      prisma.pokerTable.update({ where: { id: tableId }, data: { currentRound: rounds[idx + 1], communityCards: JSON.stringify(community), deck: JSON.stringify(deck), currentBet: 0 } }),
      ...table.players.map(p => prisma.pokerPlayer.update({ where: { id: p.id }, data: { currentBet: 0, hasActed: p.status !== "ACTIVE" } })),
    ]);
    if (canStillBet) {
      const firstSeat = nextSeat(table.players, table.dealerSeat);
      await prisma.pokerTable.update({ where: { id: tableId }, data: { currentTurnSeat: firstSeat } });
      await broadcastTableState(io, tableId);
      armTurnTimer(io, tableId);
    } else {
      // Nobody left who can act — deal straight through to showdown
      await progressGame(io, tableId);
    }
    return;
  }

  // River betting is done — showdown
  await awardPot(io, tableId, inHand);
}

async function awardPot(io, tableId, contenders) {
  const table = await prisma.pokerTable.findUnique({ where: { id: tableId }, include: { players: true } });
  if (!table) return;

  let payouts = {}; // playerId -> amount won

  if (contenders.length === 1) {
    payouts[contenders[0].id] = table.pot;
  } else {
    const community = JSON.parse(table.communityCards || "[]");
    const hands = contenders.map((p, i) => {
      const hole = JSON.parse(p.holeCards || "[]");
      const { score } = bestHand([...hole, ...community]);
      return { index: i, playerId: p.id, score };
    });
    // No side pots needed in the common case (nobody went all-in for less
    // than others) — award the whole pot directly to the best hand(s).
    // Side-pot layering only kicks in when stack sizes actually diverged.
    const allInPlayers = table.players.filter(p => p.status === "ALL_IN");
    if (allInPlayers.length === 0) {
      const winners = determineWinners(hands);
      const share = Math.floor(table.pot / winners.length);
      for (const w of winners) payouts[hands[w].playerId] = (payouts[hands[w].playerId] || 0) + share;
    } else {
      // Contribution-based side pots — totalBet accumulates across the
      // WHOLE hand (all betting rounds), unlike currentBet which resets
      // every round and would be wrong to use here
      const contributions = table.players.map((p, i) => ({ index: i, amount: p.totalBet }));
      const pots = buildSidePots(contributions);
      for (const pot of pots) {
        const eligibleHands = hands.filter(h => pot.eligibleIndexes.includes(table.players.findIndex(p => p.id === h.playerId)));
        if (eligibleHands.length === 0) continue;
        const winners = determineWinners(eligibleHands);
        const share = Math.floor(pot.amount / winners.length);
        for (const w of winners) {
          const pid = eligibleHands[w].playerId;
          payouts[pid] = (payouts[pid] || 0) + share;
        }
      }
    }
  }

  await prisma.$transaction(
    Object.entries(payouts).map(([playerId, amount]) =>
      prisma.pokerPlayer.update({ where: { id: playerId }, data: { chips: { increment: amount } } })
    )
  );
  await prisma.pokerTable.update({ where: { id: tableId }, data: { currentRound: "SHOWDOWN", currentTurnSeat: null, pot: 0 } });
  await broadcastTableState(io, tableId);

  setTimeout(async () => {
    // Remove anyone who busted out (0 chips) back to the lobby, sync their
    // real pokerChips balance, and start the next hand automatically
    const t = await prisma.pokerTable.findUnique({ where: { id: tableId }, include: { players: true } });
    if (!t) return;
    for (const p of t.players) {
      if (p.chips <= 0) {
        await prisma.user.update({ where: { id: p.userId }, data: { pokerChips: { increment: 0 } } }).catch(() => {});
        await prisma.pokerPlayer.delete({ where: { id: p.id } }).catch(() => {});
      }
    }
    await broadcastTableState(io, tableId);
    startHand(io, tableId);
  }, 6000); // pause so players can see the showdown result before the next hand
}

function registerPokerSocket(io) {
  io.on("connection", (socket) => {
    socket.on("poker:join_table", async ({ tableId, userId }) => {
      socket.data.userId = userId;
      socket.join(room(tableId));
      const table = await prisma.pokerTable.findUnique({ where: { id: tableId }, include: { players: true } });
      if (!table) return;
      const already = table.players.find(p => p.userId === userId);
      if (!already) {
        const usedSeats = table.players.map(p => p.seat);
        let seat = 0;
        while (usedSeats.includes(seat) && seat < table.maxPlayers) seat++;
        if (seat >= table.maxPlayers) return; // table full
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const buyIn = Math.min(user.pokerChips, table.bigBlind * 50); // standard 50x big blind buy-in cap
        if (buyIn < table.bigBlind * 2) {
          io.to(socket.id).emit("poker:error", { error: "Not enough poker chips to join this table" });
          return;
        }
        await prisma.$transaction([
          prisma.user.update({ where: { id: userId }, data: { pokerChips: { decrement: buyIn } } }),
          prisma.pokerPlayer.create({ data: { tableId, userId, seat, chips: buyIn } }),
        ]);
      }
      await broadcastTableState(io, tableId);
      const updated = await prisma.pokerTable.findUnique({ where: { id: tableId }, include: { players: true } });
      if (updated.status === "WAITING" && updated.players.length >= 2) startHand(io, tableId);
    });

    socket.on("poker:leave_table", async ({ tableId, userId }) => {
      const player = await prisma.pokerPlayer.findUnique({ where: { tableId_userId: { tableId, userId } } });
      if (player) {
        await prisma.user.update({ where: { id: userId }, data: { pokerChips: { increment: player.chips } } });
        await prisma.pokerPlayer.delete({ where: { id: player.id } });
      }
      socket.leave(room(tableId));
      await broadcastTableState(io, tableId);
    });

    socket.on("poker:action", async ({ tableId, userId, action, amount }) => {
      await handleAction(io, tableId, userId, action, amount);
    });

    socket.on("disconnect", () => {
      // Deliberately doesn't auto-remove the player — a dropped connection
      // shouldn't instantly forfeit their seat/chips; the turn timer
      // already handles them timing out on their own turn.
    });
  });
}

module.exports = { registerPokerSocket };
