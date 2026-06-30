// PROJO GROUP — Seed Laundry Services category
// All prices = original Pressed In Time price list +15% markup
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

const serviceSpeedOption = {
  name: "Service Speed",
  type: "SINGLE",
  required: true,
  choices: [
    { label: "Standard Service", priceModifier: 0 },
    { label: "Express Service", priceModifier: 0 }, // handled per-item below where price differs
  ],
};

const pickupOption = { name: "Pickup/Dropoff Address", type: "TEXT", required: true, choices: [] };
const phoneOption = { name: "Contact Number", type: "TEXT", required: true, choices: [] };

async function main() {
  try {
    console.log("🧺 Seeding Laundry Services category...\n");

    // ── Laundry per Kg (weight-based, min 2kg) ──────────────────
    await createOrUpdateProduct(
      "Laundry - Wash, Dry & Fold (per Kg)", "Laundry Services", 24.09,
      "Per kg, minimum 2kg. Standard R24.09/kg, Express R33.29/kg (price shown is per kg — quantity = number of kg).",
      [
        { name: "Service Speed", type: "SINGLE", required: true,
          choices: [
            { label: "Standard Service (R24.09/kg)", priceModifier: 0 },
            { label: "Express Service (R33.29/kg)", priceModifier: 9.20 },
          ] },
        { name: "Weight in Kg (minimum 2kg)", type: "TEXT", required: true, choices: [] },
        pickupOption, phoneOption,
      ]
    );

    await createOrUpdateProduct(
      "Laundry - Wash, Dry & Iron (per Kg)", "Laundry Services", 26.57,
      "Per kg, minimum 2kg. Standard R26.57/kg, Express R36.57/kg.",
      [
        { name: "Service Speed", type: "SINGLE", required: true,
          choices: [
            { label: "Standard Service (R26.57/kg)", priceModifier: 0 },
            { label: "Express Service (R36.57/kg)", priceModifier: 10.00 },
          ] },
        { name: "Weight in Kg (minimum 2kg)", type: "TEXT", required: true, choices: [] },
        pickupOption, phoneOption,
      ]
    );

    await createOrUpdateProduct(
      "Laundry - Dry & Iron (per Kg)", "Laundry Services", 21.16,
      "Per kg, minimum 2kg. Standard R21.16/kg, Express R26.62/kg.",
      [
        { name: "Service Speed", type: "SINGLE", required: true,
          choices: [
            { label: "Standard Service (R21.16/kg)", priceModifier: 0 },
            { label: "Express Service (R26.62/kg)", priceModifier: 5.46 },
          ] },
        { name: "Weight in Kg (minimum 2kg)", type: "TEXT", required: true, choices: [] },
        pickupOption, phoneOption,
      ]
    );

    await createOrUpdateProduct(
      "Laundry - Dry Only (per Kg)", "Laundry Services", 19.21,
      "Per kg, minimum 2kg. Standard R19.21/kg, Express R25.30/kg.",
      [
        { name: "Service Speed", type: "SINGLE", required: true,
          choices: [
            { label: "Standard Service (R19.21/kg)", priceModifier: 0 },
            { label: "Express Service (R25.30/kg)", priceModifier: 6.09 },
          ] },
        { name: "Weight in Kg (minimum 2kg)", type: "TEXT", required: true, choices: [] },
        pickupOption, phoneOption,
      ]
    );

    await createOrUpdateProduct(
      "Laundry - Iron Only (per Kg)", "Laundry Services", 24.96,
      "Per kg, minimum 2kg. Standard R24.96/kg, Express R33.24/kg.",
      [
        { name: "Service Speed", type: "SINGLE", required: true,
          choices: [
            { label: "Standard Service (R24.96/kg)", priceModifier: 0 },
            { label: "Express Service (R33.24/kg)", priceModifier: 8.28 },
          ] },
        { name: "Weight in Kg (minimum 2kg)", type: "TEXT", required: true, choices: [] },
        pickupOption, phoneOption,
      ]
    );

    // ── Bathmats ──────────────────────────────────────────────
    await createOrUpdateProduct(
      "Bathmat Wash, Dry & Fold", "Laundry Services", 61.64,
      "Per bathmat. Standard R61.64, Express R79.69.",
      [
        { name: "Service Speed", type: "SINGLE", required: true,
          choices: [
            { label: "Standard Service", priceModifier: 0 },
            { label: "Express Service", priceModifier: 18.05 },
          ] },
        { name: "Number of Bathmats", type: "TEXT", required: true, choices: [] },
        pickupOption, phoneOption,
      ]
    );

    // ── Blankets and Duvets (no express option) ─────────────────
    await createOrUpdateProduct(
      "Blanket / Duvet Cleaning", "Laundry Services", 209.53,
      "Pricing varies by size. Single R209.53, Double R237.59, Queen R251.62, King R279.56.",
      [
        { name: "Size", type: "SINGLE", required: true,
          choices: [
            { label: "Single", priceModifier: 0 },
            { label: "Double", priceModifier: 28.06 },
            { label: "Queen", priceModifier: 42.09 },
            { label: "King", priceModifier: 70.03 },
          ] },
        pickupOption, phoneOption,
      ]
    );

    // ── Dry Clean ─────────────────────────────────────────────
    await createOrUpdateProduct(
      "Dry Clean - Pants", "Laundry Services", 153.64,
      "Standard R153.64, Express R206.42.",
      [
        { name: "Service Speed", type: "SINGLE", required: true,
          choices: [
            { label: "Standard Service", priceModifier: 0 },
            { label: "Express Service", priceModifier: 52.78 },
          ] },
        pickupOption, phoneOption,
      ]
    );

    await createOrUpdateProduct(
      "Dry Clean - Suit (2-piece)", "Laundry Services", 307.39,
      "Standard R307.39, Express R399.39.",
      [
        { name: "Service Speed", type: "SINGLE", required: true,
          choices: [
            { label: "Standard Service", priceModifier: 0 },
            { label: "Express Service", priceModifier: 92.00 },
          ] },
        pickupOption, phoneOption,
      ]
    );

    await createOrUpdateProduct(
      "Dry Clean - Suit (3-piece)", "Laundry Services", 332.81,
      "Standard R332.81, Express R465.98.",
      [
        { name: "Service Speed", type: "SINGLE", required: true,
          choices: [
            { label: "Standard Service", priceModifier: 0 },
            { label: "Express Service", priceModifier: 133.17 },
          ] },
        pickupOption, phoneOption,
      ]
    );

    await createOrUpdateProduct(
      "Dry Clean - Tuxedo (2-piece)", "Laundry Services", 349.48,
      "Standard R349.48, Express R465.98.",
      [
        { name: "Service Speed", type: "SINGLE", required: true,
          choices: [
            { label: "Standard Service", priceModifier: 0 },
            { label: "Express Service", priceModifier: 116.50 },
          ] },
        pickupOption, phoneOption,
      ]
    );

    await createOrUpdateProduct(
      "Dry Clean - Tuxedo (3-piece)", "Laundry Services", 377.43,
      "Standard R377.43, Express R532.45.",
      [
        { name: "Service Speed", type: "SINGLE", required: true,
          choices: [
            { label: "Standard Service", priceModifier: 0 },
            { label: "Express Service", priceModifier: 155.02 },
          ] },
        pickupOption, phoneOption,
      ]
    );

    await createOrUpdateProduct(
      "Dry Clean - Waistcoat", "Laundry Services", 125.81,
      "Standard R125.81, Express R186.30.",
      [
        { name: "Service Speed", type: "SINGLE", required: true,
          choices: [
            { label: "Standard Service", priceModifier: 0 },
            { label: "Express Service", priceModifier: 60.49 },
          ] },
        pickupOption, phoneOption,
      ]
    );

    // ── Jackets ───────────────────────────────────────────────
    await createOrUpdateProduct(
      "Jacket Cleaning - Blazer", "Laundry Services", 139.84,
      "Standard R139.84, Express R199.75.",
      [
        { name: "Service Speed", type: "SINGLE", required: true,
          choices: [
            { label: "Standard Service", priceModifier: 0 },
            { label: "Express Service", priceModifier: 59.91 },
          ] },
        pickupOption, phoneOption,
      ]
    );

    await createOrUpdateProduct(
      "Jacket Cleaning - Ordinary", "Laundry Services", 153.75,
      "Standard R153.75, Express R206.42.",
      [
        { name: "Service Speed", type: "SINGLE", required: true,
          choices: [
            { label: "Standard Service", priceModifier: 0 },
            { label: "Express Service", priceModifier: 52.67 },
          ] },
        pickupOption, phoneOption,
      ]
    );

    await createOrUpdateProduct(
      "Jacket Cleaning - Windbreaker", "Laundry Services", 167.78,
      "Standard R167.78, Express R226.20.",
      [
        { name: "Service Speed", type: "SINGLE", required: true,
          choices: [
            { label: "Standard Service", priceModifier: 0 },
            { label: "Express Service", priceModifier: 58.42 },
          ] },
        pickupOption, phoneOption,
      ]
    );

    // ── Coats ─────────────────────────────────────────────────
    await createOrUpdateProduct(
      "Coat Cleaning - Fur", "Laundry Services", 377.43,
      "Standard R377.43, Express R532.45.",
      [
        { name: "Service Speed", type: "SINGLE", required: true,
          choices: [
            { label: "Standard Service", priceModifier: 0 },
            { label: "Express Service", priceModifier: 155.02 },
          ] },
        pickupOption, phoneOption,
      ]
    );

    await createOrUpdateProduct(
      "Coat Cleaning - Knee Length", "Laundry Services", 237.64,
      "Standard R237.64, Express R279.56.",
      [
        { name: "Service Speed", type: "SINGLE", required: true,
          choices: [
            { label: "Standard Service", priceModifier: 0 },
            { label: "Express Service", priceModifier: 41.92 },
          ] },
        pickupOption, phoneOption,
      ]
    );

    await createOrUpdateProduct(
      "Coat Cleaning - Long", "Laundry Services", 251.62,
      "Standard R251.62, Express R332.81.",
      [
        { name: "Service Speed", type: "SINGLE", required: true,
          choices: [
            { label: "Standard Service", priceModifier: 0 },
            { label: "Express Service", priceModifier: 81.19 },
          ] },
        pickupOption, phoneOption,
      ]
    );

    await createOrUpdateProduct(
      "Coat Cleaning - Ordinary", "Laundry Services", 223.56,
      "Standard R223.56, Express R306.25.",
      [
        { name: "Service Speed", type: "SINGLE", required: true,
          choices: [
            { label: "Standard Service", priceModifier: 0 },
            { label: "Express Service", priceModifier: 82.69 },
          ] },
        pickupOption, phoneOption,
      ]
    );

    console.log("\n🎉 Laundry Services category seeded — 18 services!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
