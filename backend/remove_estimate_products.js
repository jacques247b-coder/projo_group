// PROJO GROUP — Remove the earlier "estimate-only" console products
// (replaced by real fixed-price platform-based products)
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function remove() {
  try {
    const toRemove = [
      "Console Diagnostic & Collection",
      "HDMI Port Repair (Estimate)",
      "Disc Drive Repair (Estimate)",
      "Power Supply Repair (Estimate)",
      "Overheating & Full Service (Estimate)",
      "Board-Level / Motherboard Repair (Estimate)",
      "Computer & Console Repair - Collection & Diagnosis",
      "IT Technician Callout",
    ];
    for (const name of toRemove) {
      const old = await prisma.product.findFirst({
        where: { name, category: "PC & Console Repair" },
      });
      if (old) {
        await prisma.productOptionGroup.deleteMany({ where: { productId: old.id } });
        await prisma.product.delete({ where: { id: old.id } });
        console.log(`✅ Removed: ${name}`);
      } else {
        console.log(`ℹ️  Not found (skip): ${name}`);
      }
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
remove();
