// PROJO GROUP — Seed PC & Console Repair category
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
      data: { productId: product.id, name: og.name, type: og.type, required: !!og.required, sortOrder: i },
    });
    if (og.choices && og.choices.length) {
      for (let j = 0; j < og.choices.length; j++) {
        const c = og.choices[j];
        await prisma.productOptionChoice.create({
          data: { groupId: group.id, label: c.label, priceModifier: c.priceModifier || 0, sortOrder: j },
        });
      }
    }
  }
  console.log(`   → ${optionGroups.length} option group(s) added`);
}

async function main() {
  try {
    console.log("🖥️ Seeding PC & Console Repair category...\n");

    // ── 1. Collection & Diagnosis (R60 collection, no-fix-no-pay) ──
    await createOrUpdateProduct(
      "Computer & Console Repair - Collection & Diagnosis", "PC & Console Repair", 60,
      "We collect your computer or console (R60 within Rustenburg), inspect it, then send you a repair quote. " +
      "No Fix, No Pay — you only pay the R60 collection & delivery fee if we're unable to fix the item. " +
      "Repair costs are quoted separately once diagnosed.",
      [
        { name: "Item & Job Description (What's wrong with it?)", type: "TEXT", required: true, choices: [] },
        { name: "Collection Address", type: "TEXT", required: true, choices: [] },
        { name: "Contact Number", type: "TEXT", required: true, choices: [] },
      ]
    );

    // ── 2. IT Technician Callout (on-site visit) ──────────────────
    await createOrUpdateProduct(
      "IT Technician Callout", "PC & Console Repair", 450,
      "On-site IT technician visit. Callout fee R450, Labour charged at R380/hour after arrival.",
      [
        { name: "Issue Description", type: "TEXT", required: true, choices: [] },
        { name: "Property Address", type: "TEXT", required: true, choices: [] },
        { name: "Contact Number", type: "TEXT", required: true, choices: [] },
      ]
    );

    console.log("\n🎉 PC & Console Repair category seeded — 2 services!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
