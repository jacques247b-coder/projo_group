require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  const products = await prisma.product.findMany({ orderBy: { category: "asc" } });
  console.log(`Total products: ${products.length}\n`);
  products.forEach(p => console.log(`- ${p.name} (${p.category}) - R${p.priceZar}`));
  await prisma.$disconnect();
}
check();
