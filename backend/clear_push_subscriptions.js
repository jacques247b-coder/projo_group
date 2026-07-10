// PROJO GROUP — clear all push subscriptions (utility)
// Use this to wipe accumulated stale/orphaned subscriptions (e.g. from
// testing across many browser profiles) and start fresh. Safe to run —
// this only affects notification delivery, no other data is touched.
// Usage: node clear_push_subscriptions.js           (clears ALL)
//        node clear_push_subscriptions.js +27620901... (clears just one user's, by phone)
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const phone = process.argv[2];

  if (phone) {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) { console.log(`No user found with phone ${phone}`); return; }
    const result = await prisma.pushSubscription.deleteMany({ where: { userId: user.id } });
    console.log(`Cleared ${result.count} subscription(s) for ${user.name} (${phone})`);
  } else {
    const result = await prisma.pushSubscription.deleteMany({});
    console.log(`Cleared ALL ${result.count} subscription(s) across every user.`);
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
