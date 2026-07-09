// PROJO GROUP — one-time migration: copy any existing User.pushSubscription
// values into the new PushSubscription table, so nobody who already
// subscribed loses their notification setup when this deploys.
// Run once after `db push`: node migrate_push_subscriptions.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { pushSubscription: { not: null } },
    select: { id: true, name: true, pushSubscription: true },
  });

  console.log(`Found ${users.length} user(s) with an existing single subscription to migrate...`);

  let migrated = 0, skipped = 0;
  for (const user of users) {
    try {
      const parsed = JSON.parse(user.pushSubscription);
      if (!parsed?.endpoint) { skipped++; continue; }
      await prisma.pushSubscription.upsert({
        where: { endpoint: parsed.endpoint },
        update: { userId: user.id, subscriptionJson: user.pushSubscription },
        create: { userId: user.id, endpoint: parsed.endpoint, subscriptionJson: user.pushSubscription },
      });
      migrated++;
      console.log(`  ✓ Migrated subscription for ${user.name}`);
    } catch (e) {
      skipped++;
      console.log(`  ✗ Skipped ${user.name} — invalid subscription data: ${e.message}`);
    }
  }

  console.log(`\nDone. Migrated: ${migrated}, Skipped (invalid): ${skipped}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
