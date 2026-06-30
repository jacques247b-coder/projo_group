// PROJO GROUP — Remove old 2 single products (replaced by 11 specific ones)
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function remove() {
  try {
    const names = ["Website Development", "Mobile App Development"];
    for (const name of names) {
      const old = await prisma.product.findFirst({ where: { name, category: "Web & App Development" } });
      if (old) {
        await prisma.productOptionGroup.deleteMany({ where: { productId: old.id } });
        await prisma.product.delete({ where: { id: old.id } });
        console.log(`✅ Removed old '${name}' product`);
      } else {
        console.log(`ℹ️  Old '${name}' not found (already removed)`);
      }
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
remove();
