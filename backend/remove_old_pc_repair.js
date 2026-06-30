require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function remove() {
  try {
    const old = await prisma.product.findFirst({
      where: { name: "Computer & Console Repair", category: "PC & Console Repair" },
    });
    if (old) {
      await prisma.productOptionGroup.deleteMany({ where: { productId: old.id } });
      await prisma.product.delete({ where: { id: old.id } });
      console.log("✅ Removed old generic 'Computer & Console Repair' product");
    } else {
      console.log("ℹ️  Already removed");
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
remove();
