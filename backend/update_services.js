// PROJO GROUP — Update services: remove Pet Care, add Locksmith, Runners, PC Repair
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function update() {
  try {
    // Remove Pet Care
    await prisma.product.deleteMany({ where: { name: { contains: "Pet Care" } } });
    console.log("✅ Removed Pet Care");

    // Add new services
    await prisma.product.createMany({
      skipDuplicates: true,
      data: [
        {
          name: "Locksmith Service",
          category: "Locksmith",
          priceZar: 0,
          description: "Professional locksmith services. Lock repairs, replacements, key cutting and emergency lockouts. Contact us for a quote.",
          isActive: true,
        },
        {
          name: "Runners (Errands & Shopping)",
          category: "Runners & Deliveries",
          priceZar: 60,
          description: "We run errands and shop for you! Base fee R60 within Rustenburg. Shopping service fee 12% of total till slip. Same day service after payment confirmation.",
          isActive: true,
        },
        {
          name: "Computer & Console Repair",
          category: "PC & Console Repair",
          priceZar: 0,
          description: "Professional computer and gaming console repair services. Laptops, desktops, PlayStation, Xbox and more. Contact us for a quote.",
          isActive: true,
        },
      ],
    });
    console.log("✅ Added Locksmith, Runners, PC & Console Repair");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
update();
