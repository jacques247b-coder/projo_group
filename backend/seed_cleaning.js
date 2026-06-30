// PROJO GROUP — Seed Cleaning Category with full Take.app option structure
// Run: node seed_cleaning.js
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Helper to build room/unit-count choices with linear pricing
function buildTiers(label, count, startPrice, step) {
  return Array.from({ length: count }, (_, i) => ({
    label: `${i + 1} ${label}${i === 0 && label.includes("Room") ? " (Studio)" : ""}`,
    priceModifier: startPrice + (step * i),
  }));
}

async function seedService(name, category, description, durationHours, optionGroups) {
  // Create or find the product
  let product = await prisma.product.findFirst({ where: { name, category } });
  if (!product) {
    product = await prisma.product.create({
      data: {
        name, category,
        priceZar: 0,
        description: description || `${name} service. ${durationHours}hr booking.`,
        isActive: true,
      },
    });
    console.log(`✅ Created product: ${name}`);
  } else {
    console.log(`↻  Product already exists: ${name} (updating options)`);
  }

  // Clear existing option groups for this product (clean re-seed)
  await prisma.productOptionGroup.deleteMany({ where: { productId: product.id } });

  // Create each option group with its choices
  for (let i = 0; i < optionGroups.length; i++) {
    const og = optionGroups[i];
    const group = await prisma.productOptionGroup.create({
      data: {
        productId: product.id,
        name: og.name,
        type: og.type, // SINGLE, MULTI, TEXT
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
    console.log("🧹 Seeding Cleaning category...\n");

    // ── 1. Standard Cleaning ──────────────────────────────────
    await seedService(
      "Standard Cleaning", "Cleaning",
      "Standard home or office cleaning. Select rooms and any extras.",
      3,
      [
        { name: "How many Rooms?", type: "SINGLE", required: true,
          choices: buildTiers("Room", 10, 530, 70) },
        { name: "How many Bathrooms?", type: "SINGLE", required: false,
          choices: buildTiers("Bathroom", 7, 70, 70) },
        { name: "Inside Cabinets", type: "SINGLE", required: false,
          choices: buildTiers("Cabinet", 7, 30, 30) },
        { name: "Inside Fridge", type: "SINGLE", required: false,
          choices: buildTiers("Fridge", 7, 30, 30) },
        { name: "Inside Oven", type: "SINGLE", required: false,
          choices: buildTiers("Oven", 7, 30, 30) },
        { name: "Interior Walls", type: "SINGLE", required: false,
          choices: buildTiers("Room Interior Walls", 7, 35, 35) },
        { name: "Interior Windows", type: "SINGLE", required: false,
          choices: buildTiers("Room Interior Windows", 7, 40, 40) },
        { name: "Special Instructions", type: "TEXT", required: false, choices: [] },
      ]
    );

    // ── 2. Deep Clean ──────────────────────────────────────────
    await seedService(
      "Deep Clean", "Cleaning",
      "Thorough deep cleaning service. Select rooms and extras.",
      5,
      [
        { name: "How many Rooms?", type: "SINGLE", required: true,
          choices: buildTiers("Room", 10, 1500, 400) },
        { name: "How many Bathrooms?", type: "SINGLE", required: false,
          choices: buildTiers("Bathroom", 7, 350, 350) },
        { name: "Balcony Clean", type: "SINGLE", required: false,
          choices: buildTiers("Balcony", 7, 150, 150) },
        { name: "Carpet", type: "SINGLE", required: false,
          choices: buildTiers("Carpet", 7, 150, 150) },
        { name: "Ceiling Clean", type: "SINGLE", required: false,
          choices: buildTiers("Room Ceiling", 7, 85, 85) },
        { name: "Couch Clean", type: "MULTI", required: false,
          choices: buildTiers("Couch", 7, 140, 140) },
        { name: "Garage Clean", type: "SINGLE", required: false,
          choices: [
            { label: "Single Garage", priceModifier: 115 },
            { label: "Double Garage", priceModifier: 230 },
            { label: "1.5 Double Garage", priceModifier: 345 },
            { label: "1+ Single Garage", priceModifier: 460 },
          ] },
        { name: "Mattress Clean", type: "SINGLE", required: false,
          choices: buildTiers("Mattress", 7, 140, 140) },
        { name: "Interior Windows", type: "SINGLE", required: false,
          choices: buildTiers("Room Interior Windows", 7, 75, 75) },
        { name: "Special Instructions", type: "TEXT", required: false, choices: [] },
      ]
    );

    // ── 3. Guest House / AirBnb Cleaning ───────────────────────
    await seedService(
      "Guest House / AirBnb Cleaning", "Cleaning",
      "Professional cleaning for guest houses and AirBnb properties. Quick turnaround.",
      3,
      [
        { name: "How many Rooms?", type: "SINGLE", required: false,
          choices: [
            { label: "Studio - 1 Room", priceModifier: 350 },
            { label: "2 Rooms", priceModifier: 420 },
            { label: "3 Rooms", priceModifier: 490 },
            { label: "4 Rooms", priceModifier: 560 },
            { label: "5 Rooms", priceModifier: 630 },
            { label: "6 Rooms", priceModifier: 700 },
            { label: "7 Rooms", priceModifier: 770 },
            { label: "8 Rooms", priceModifier: 840 },
            { label: "9 Rooms", priceModifier: 911 },
            { label: "10 Rooms", priceModifier: 979 },
          ] },
        { name: "How many Bathrooms?", type: "SINGLE", required: false,
          choices: buildTiers("Bathroom", 7, 85, 85) },
        { name: "Inside Cabinets", type: "SINGLE", required: false,
          choices: buildTiers("Cabinet", 7, 30, 30) },
        { name: "Inside Fridge", type: "SINGLE", required: false,
          choices: buildTiers("Fridge", 7, 35, 35) },
        { name: "Inside Oven", type: "SINGLE", required: false,
          choices: buildTiers("Oven", 7, 40, 40) },
        { name: "Interior Walls", type: "SINGLE", required: false,
          choices: buildTiers("Room Walls", 7, 40, 40) },
        { name: "Interior Windows", type: "SINGLE", required: false,
          choices: buildTiers("Room Windows", 7, 40, 40) },
        { name: "Special Instructions", type: "TEXT", required: false, choices: [] },
      ]
    );

    // ── 4. Move In/Out Cleaning ─────────────────────────────────
    await seedService(
      "Move In/Out Cleaning", "Cleaning",
      "Complete cleaning service for moving in or moving out.",
      5,
      [
        { name: "How many Rooms?", type: "SINGLE", required: true,
          choices: [
            { label: "Studio - 1 Room", priceModifier: 600 },
            { label: "2 Rooms", priceModifier: 720 },
            { label: "3 Rooms", priceModifier: 780 },
            { label: "4 Rooms", priceModifier: 860 },
            { label: "5 Rooms", priceModifier: 932 },
            { label: "6 Rooms", priceModifier: 1008 },
            { label: "7 Rooms", priceModifier: 1071 },
          ] },
        { name: "How many Bathrooms?", type: "SINGLE", required: false,
          choices: buildTiers("Bathroom", 7, 85, 85) },
        { name: "Balcony Cleaning", type: "SINGLE", required: false,
          choices: buildTiers("Balcony", 7, 150, 150) },
        { name: "Carpet Cleaning", type: "SINGLE", required: false,
          choices: buildTiers("Carpet", 7, 150, 150) },
        { name: "Ceiling Cleaning", type: "SINGLE", required: false,
          choices: buildTiers("Room Ceiling", 7, 85, 85) },
        { name: "Couch Cleaning", type: "SINGLE", required: false,
          choices: buildTiers("Couch", 7, 140, 140) },
        { name: "Garage Cleaning", type: "SINGLE", required: false,
          choices: [
            { label: "Single Garage", priceModifier: 115 },
            { label: "Double Garage", priceModifier: 230 },
            { label: "1.5 Double Garage", priceModifier: 345 },
            { label: "1+ Single Garage", priceModifier: 460 },
          ] },
        { name: "Mattress Cleaning", type: "SINGLE", required: false,
          choices: buildTiers("Mattress", 7, 140, 140) },
        { name: "Exterior Windows", type: "SINGLE", required: false,
          choices: buildTiers("Room Exterior Windows", 7, 125, 125) },
        { name: "Special Instructions", type: "TEXT", required: false, choices: [] },
      ]
    );

    // ── 5. Carpet/Upholstery Cleaning ───────────────────────────
    await seedService(
      "Carpet/Upholstery Cleaning", "Cleaning",
      "Professional carpet and upholstery cleaning. Removes stains, odours and bacteria.",
      3,
      [
        { name: "What type of Carpets do you have?", type: "MULTI", required: false,
          choices: [
            { label: "Fitted Carpets", priceModifier: 0 },
            { label: "Loose Carpets/Rugs", priceModifier: 0 },
          ] },
        { name: "Number of Rooms with Fitted Carpets", type: "SINGLE", required: false,
          choices: buildTiers("Room", 7, 400, 300) },
        { name: "Number of Loose Carpets/Rugs", type: "SINGLE", required: false,
          choices: [
            { label: "1 Carpet/Rug", priceModifier: 140 },
            { label: "2 Carpets/Rugs", priceModifier: 280 },
            { label: "3 Carpets/Rugs", priceModifier: 360 },
            { label: "4 Carpets/Rugs", priceModifier: 500 },
            { label: "5 Carpets/Rugs", priceModifier: 640 },
            { label: "6 Carpets/Rugs", priceModifier: 780 },
            { label: "7 Carpets/Rugs", priceModifier: 820 },
            { label: "8 Carpets/Rugs", priceModifier: 960 },
            { label: "9 Carpets/Rugs", priceModifier: 1100 },
            { label: "10 Carpets/Rugs", priceModifier: 1340 },
            { label: "11 Carpets/Rugs", priceModifier: 1480 },
            { label: "12 Carpets/Rugs", priceModifier: 1620 },
            { label: "13 Carpets/Rugs", priceModifier: 1560 },
            { label: "14 Carpets/Rugs", priceModifier: 1760 },
            { label: "15 Carpets/Rugs", priceModifier: 1900 },
            { label: "16 Carpets/Rugs", priceModifier: 2040 },
            { label: "17 Carpets/Rugs", priceModifier: 2180 },
            { label: "18 Carpets/Rugs", priceModifier: 2320 },
            { label: "19 Carpets/Rugs", priceModifier: 2460 },
            { label: "20 Carpets/Rugs", priceModifier: 2600 },
          ] },
        { name: "Room Status", type: "MULTI", required: false,
          choices: [
            { label: "Rooms is Empty", priceModifier: 0 },
            { label: "Has Property (Needs to be moved)", priceModifier: 0 },
          ] },
        { name: "Mattress Cleaning", type: "SINGLE", required: false,
          choices: buildTiers("Mattress", 7, 140, 140) },
        { name: "Couch Cleaning", type: "SINGLE", required: false,
          choices: [
            { label: "1 Seater Couch", priceModifier: 200 },
            { label: "2 Seater Couch", priceModifier: 320 },
            { label: "3 Seater Couch", priceModifier: 420 },
            { label: "4 Seater Couch", priceModifier: 500 },
            { label: "5 Seater Couch", priceModifier: 600 },
            { label: "6 Seater Couch", priceModifier: 700 },
          ] },
        { name: "Special Instructions", type: "TEXT", required: true, choices: [] },
      ]
    );

    console.log("\n🎉 Cleaning category fully seeded — 5 services with all options!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
