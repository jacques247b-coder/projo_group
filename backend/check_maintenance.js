require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  const product = await prisma.product.findFirst({
    where: { name: "Maintenance Booking / Enquiry" },
  });
  console.log("Product:", product);

  const groups = await prisma.productOptionGroup.findMany({
    where: { productId: product.id },
    include: { choices: true },
  });
  groups.forEach(g => {
    console.log(`\nGroup: ${g.name} (${g.type}, required: ${g.required})`);
    g.choices.forEach(c => console.log(`  - ${c.label}: +R${c.priceModifier}`));
  });
  await prisma.$disconnect();
}
check();
