// PROJO GROUP — Migrate existing users: calculate their loyalty points from past spend
// Run ONCE after db push adds loyaltyPoints column
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function migrate() {
  try {
    const wallets = await prisma.wallet.findMany({
      include: { transactions: true }
    });

    console.log(`Migrating ${wallets.length} wallets...`);

    for (const wallet of wallets) {
      // Calculate lifetime spend from completed payment transactions
      const lifetimeSpend = wallet.transactions
        .filter(t => ["RIDE_PAYMENT","DELIVERY_PAYMENT","SHOP_PAYMENT"].includes(t.type) && t.status === "COMPLETED")
        .reduce((sum, t) => sum + t.amountZar, 0);

      const loyaltyPoints = Math.floor(lifetimeSpend / 10);

      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { loyaltyPoints, lifetimeSpend },
      });

      if (loyaltyPoints > 0) {
        console.log(`✅ ${wallet.userId}: R${lifetimeSpend} spend → ${loyaltyPoints} points`);
      }
    }

    console.log("🎉 Migration complete!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
migrate();
