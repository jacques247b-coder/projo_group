require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fix() {
  try {
    const product = await prisma.product.findFirst({
      where: { name: "Maintenance Booking / Enquiry" },
    });

    // Set base price to R0
    await prisma.product.update({
      where: { id: product.id },
      data: { priceZar: 0 },
    });

    // Fix callout choice to R450
    const groups = await prisma.productOptionGroup.findMany({
      where: { productId: product.id },
      include: { choices: true },
    });

    for (const group of groups) {
      for (const choice of group.choices) {
        if (choice.label.includes("Call Out")) {
          await prisma.productOptionChoice.update({
            where: { id: choice.id },
            data: { priceModifier: 450 },
          });
          console.log(`✅ Updated "${choice.label}" to R450`);
        }
      }
    }

    console.log("✅ Base price set to R0");
    console.log("🎉 Done — Maintenance: No callout = R0, Yes callout = R450");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
fix();
