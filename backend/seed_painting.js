// PROJO GROUP — Seed Painting category as 7 separate services
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createOrUpdateProduct(name, category, priceZar, description, optionGroups) {
  let product = await prisma.product.findFirst({ where: { name, category } });
  if (!product) {
    product = await prisma.product.create({
      data: { name, category, priceZar, description, isActive: true },
    });
    console.log(`✅ Created: ${name}`);
  } else {
    product = await prisma.product.update({
      where: { id: product.id },
      data: { priceZar, description },
    });
    console.log(`↻  Updated: ${name}`);
  }

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
  console.log(`   → ${optionGroups.length} option group(s) added`);
}

// Shared "Surface Preparation" option used across most painting services
const surfacePrepOption = {
  name: "Does the Surface need Preparation?",
  type: "SINGLE",
  required: true,
  choices: [
    { label: "Yes, needs Preparation", priceModifier: 30 },
    { label: "No, just Painting", priceModifier: 0 },
  ],
};

async function main() {
  try {
    console.log("🎨 Seeding Painting category (7 separate services)...\n");

    await createOrUpdateProduct(
      "Building/House/Wall Painting", "Painting", 28,
      "Priced per square meter — adjust quantity to required square meters. Paint & Labour included.",
      [
        { name: "Square Meters", type: "TEXT", required: true, choices: [] },
        surfacePrepOption,
      ]
    );

    await createOrUpdateProduct(
      "Roof Painting", "Painting", 28,
      "Priced per square meter — adjust quantity to required square meters. Paint & Labour included.",
      [
        { name: "Square Meters", type: "TEXT", required: true, choices: [] },
        surfacePrepOption,
      ]
    );

    await createOrUpdateProduct(
      "Artefact & Decorative Painting", "Painting", 15,
      "Priced per 100mm — adjust quantity to the required 100mm units.",
      [
        { name: "Quantity (100mm units)", type: "TEXT", required: true, choices: [] },
        surfacePrepOption,
      ]
    );

    await createOrUpdateProduct(
      "Curb Residential Number Painting (No Design)", "Painting", 350,
      "Residential curb number painting, number only — no extra design.",
      [ surfacePrepOption ]
    );

    await createOrUpdateProduct(
      "Curb Residential Number Painting (With Design)", "Painting", 420,
      "Residential curb number painting with special design.",
      [ surfacePrepOption ]
    );

    await createOrUpdateProduct(
      "Home Exterior Number Painting (Number Only)", "Painting", 80,
      "Home exterior house number painting, number only.",
      [ surfacePrepOption ]
    );

    await createOrUpdateProduct(
      "Home Exterior Number Painting (Number + Design)", "Painting", 120,
      "Home exterior house number painting with design.",
      [ surfacePrepOption ]
    );

    console.log("\n🎉 Painting category seeded — 7 services!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

// Note: run remove_old_painting.js separately to delete the old "Painting Services" product
