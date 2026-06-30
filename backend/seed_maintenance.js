// PROJO GROUP — Seed Maintenance category options
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedService(name, category, optionGroups) {
  let product = await prisma.product.findFirst({ where: { name, category } });
  if (!product) {
    console.log(`⚠️  Product not found: ${name} — skipping (create it first via admin)`);
    return;
  }
  console.log(`↻  Updating options for: ${name}`);

  await prisma.productOptionGroup.deleteMany({ where: { productId: product.id } });

  for (let i = 0; i < optionGroups.length; i++) {
    const og = optionGroups[i];
    const group = await prisma.productOptionGroup.create({
      data: {
        productId: product.id,
        name: og.name,
        type: og.type,
        required: !!og.required,
        sortOrder: i,
      },
    });
    if (og.choices && og.choices.length) {
      for (let j = 0; j < og.choices.length; j++) {
        const c = og.choices[j];
        await prisma.productOptionChoice.create({
          data: {
            groupId: group.id,
            label: c.label,
            priceModifier: c.priceModifier || 0,
            sortOrder: j,
          },
        });
      }
    }
  }
  console.log(`   → ${optionGroups.length} option groups added`);
}

async function main() {
  try {
    console.log("🔧 Seeding Maintenance category...\n");

    await seedService(
      "Maintenance Booking / Enquiry", "Maintenance",
      [
        { name: "Do you need an agent to come out to your property?", type: "MULTI", required: true,
          choices: [
            { label: "Yes, book me a Call Out!", priceModifier: 350 },
            { label: "No, just give Quotation only", priceModifier: 0 },
          ] },
        { name: "Describe your job requirements", type: "TEXT", required: true, choices: [] },
        { name: "Enter your address", type: "TEXT", required: true, choices: [] },
        { name: "Cell Number", type: "TEXT", required: true, choices: [] },
        { name: "Email", type: "TEXT", required: false, choices: [] },
      ]
    );

    console.log("\n🎉 Maintenance category seeded!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
