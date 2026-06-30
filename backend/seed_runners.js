// PROJO GROUP — Seed Runners & Deliveries category
// "Deliveries" removed (duplicate of Courier page — same R60/R7.50 zone pricing)
// "Personal Shopper" and "Runners" kept as text-form quote requests
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
    console.log("🏃 Seeding Runners & Deliveries category...\n");

    await createOrUpdateProduct(
      "Personal Shopper \"Runners\"", "Runners & Deliveries", 0,
      "Base Delivery Fee R60 (Rustenburg). Shopping Service Fee 12% of total till slip when we do your shopping for you. Click & Collect flat rate R60 (no shopping fee if order already pre-paid). We send official store till slip via WhatsApp. Pay items + service fee via EFT, Cash Send, eWallet. Delivered immediately upon payment confirmation.",
      [
        { name: "Shopping List Details (Shop Name - Product - Brand - Quantity)", type: "TEXT", required: true, choices: [] },
        { name: "Delivery Address", type: "TEXT", required: true, choices: [] },
        { name: "WhatsApp Number", type: "TEXT", required: true, choices: [] },
        { name: "Email Address", type: "TEXT", required: false, choices: [] },
        { name: "Special Instructions", type: "TEXT", required: false, choices: [] },
      ]
    );

    // "Runners" — same structure as Personal Shopper (errand running)
    await createOrUpdateProduct(
      "Runners (Errands & Shopping)", "Runners & Deliveries", 0,
      "We run errands and shop for you! Base fee R60 within Rustenburg. Shopping service fee 12% of total till slip when we do the shopping for you. Same day service after payment confirmation.",
      [
        { name: "Errand / Shopping List Details", type: "TEXT", required: true, choices: [] },
        { name: "Pick-Up / Errand Location", type: "TEXT", required: true, choices: [] },
        { name: "Delivery Address", type: "TEXT", required: true, choices: [] },
        { name: "WhatsApp Number", type: "TEXT", required: true, choices: [] },
        { name: "Special Instructions", type: "TEXT", required: false, choices: [] },
      ]
    );

    console.log("\n🎉 Runners & Deliveries category seeded!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
