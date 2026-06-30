// PROJO GROUP — Remove the old single "Painting Services" product (replaced by 7 specific ones)
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function remove() {
  try {
    const old = await prisma.product.findFirst({ where: { name: "Painting Services", category: "Painting" } });
    if (old) {
      await prisma.productOptionGroup.deleteMany({ where: { productId: old.id } });
      await prisma.product.delete({ where: { id: old.id } });
      console.log("✅ Removed old 'Painting Services' product");
    } else {
      console.log("ℹ️  Old 'Painting Services' product not found (already removed)");
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
remove();
