// PROJO GROUP — Seed Pest Control category (quote-only, R0 options for form structure)
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedService(name, category, optionGroups) {
  let product = await prisma.product.findFirst({ where: { name, category } });
  if (!product) {
    console.log(`⚠️  Product not found: ${name} — skipping`);
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
    console.log("🐛 Seeding Pest Control category...\n");

    await seedService(
      "Pest Control - Request For Quotes", "Pest Control",
      [
        { name: "Get me quotes on", type: "MULTI", required: false,
          choices: [
            { label: "Fumigation and Spray (2 Treatments)", priceModifier: 0 },
            { label: "Fumigation and Spray (1 Treatment)", priceModifier: 0 },
            { label: "Spray Only", priceModifier: 0 },
            { label: "Supply and Install Bait Stations", priceModifier: 0 },
            { label: "Ceiling Treatment", priceModifier: 0 },
            { label: "Removal of Bees - New Nest", priceModifier: 0 },
            { label: "Removal of Bees - Old Nest", priceModifier: 0 },
          ] },
        { name: "Custom Request", type: "TEXT", required: false, choices: [] },
        { name: "Your Cell Number", type: "TEXT", required: true, choices: [] },
        { name: "Email Address", type: "TEXT", required: true, choices: [] },
        { name: "Address", type: "TEXT", required: true, choices: [] },
        { name: "Is the Property located in Rustenburg Town, East End, Safari Tuine, Protea Park?",
          type: "SINGLE", required: true,
          choices: [
            { label: "Yes", priceModifier: 0 },
            { label: "No, Outside of those Areas", priceModifier: 0 },
          ] },
      ]
    );

    console.log("\n🎉 Pest Control category seeded!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
