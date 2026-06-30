// PROJO GROUP — Remove duplicate "Computer & Console Technicians" category
// PC & Console Repair is the correct category, this was created by mistake
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function remove() {
  try {
    const products = await prisma.product.findMany({
      where: { category: "Computer & Console Technicians" },
    });

    console.log(`Found ${products.length} product(s) in 'Computer & Console Technicians'`);

    for (const p of products) {
      await prisma.productOptionGroup.deleteMany({ where: { productId: p.id } });
      await prisma.product.delete({ where: { id: p.id } });
      console.log(`✅ Removed: ${p.name}`);
    }

    console.log("\n🎉 Duplicate category fully removed!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
remove();
