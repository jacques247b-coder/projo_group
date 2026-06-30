// PROJO GROUP — Remove duplicate products (keeps the one with options, removes empty duplicate)
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function cleanup() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "asc" },
    });

    const seen = new Map(); // name+category -> product
    const toDelete = [];

    for (const p of products) {
      const key = `${p.name}|${p.category}`;
      if (seen.has(key)) {
        // Check which one has option groups - keep that one
        const existing = seen.get(key);
        const existingGroups = await prisma.productOptionGroup.count({ where: { productId: existing.id } });
        const currentGroups = await prisma.productOptionGroup.count({ where: { productId: p.id } });

        if (currentGroups > existingGroups) {
          // Current has more options, delete the old one instead
          toDelete.push(existing.id);
          seen.set(key, p);
        } else {
          toDelete.push(p.id);
        }
      } else {
        seen.set(key, p);
      }
    }

    for (const id of toDelete) {
      await prisma.productOptionGroup.deleteMany({ where: { productId: id } });
      await prisma.product.delete({ where: { id } });
      console.log(`🗑️  Deleted duplicate product: ${id}`);
    }

    console.log(`\n✅ Cleanup done. Removed ${toDelete.length} duplicate(s).`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
