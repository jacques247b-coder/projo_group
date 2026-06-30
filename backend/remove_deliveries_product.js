// PROJO GROUP — Remove "Deliveries" shop product (duplicate of Courier page)
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function remove() {
  try {
    const old = await prisma.product.findFirst({
      where: { name: "Deliveries (Fast, Reliable & Secure)", category: "Runners & Deliveries" },
    });
    if (old) {
      await prisma.productOptionGroup.deleteMany({ where: { productId: old.id } });
      await prisma.product.delete({ where: { id: old.id } });
      console.log("✅ Removed 'Deliveries (Fast, Reliable & Secure)' from shop — use Courier page instead");
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
