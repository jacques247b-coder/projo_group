// PROJO GROUP — Restore deleted Cleaning products
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function buildTiers(label, count, startPrice, step) {
  return Array.from({ length: count }, (_, i) => ({
    label: `${i + 1} ${label}`,
    priceModifier: startPrice + (step * i),
  }));
}

async function createProduct(name, category, description, optionGroups) {
  const existing = await prisma.product.findFirst({ where: { name, category } });
  if (existing) {
    console.log(`⏭️  Already exists: ${name}`);
    return;
  }

  const product = await prisma.product.create({
    data: { name, category, priceZar: 0, description, isActive: true },
  });

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
  console.log(`✅ Restored: ${name} (${optionGroups.length} option groups)`);
}

async function main() {
  try {
    console.log("🧹 Restoring deleted Cleaning products...\n");

    // Deep Clean
    await createProduct("Deep Clean", "Cleaning",
      "Thorough deep cleaning service for homes and offices. Includes all surfaces, appliances and more.",
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

    // Guest House / AirBnb Cleaning
    await createProduct("Guest House / AirBnb Cleaning", "Cleaning",
      "Professional cleaning for guest houses and AirBnb properties. Quick turnaround between guests.",
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

    // Carpet/Upholstery Cleaning
    await createProduct("Carpet/Upholstery Cleaning", "Cleaning",
      "Professional carpet and upholstery cleaning. Removes stains, odours and bacteria.",
      [
        { name: "What type of Carpets do you have?", type: "MULTI", required: false,
          choices: [
            { label: "Fitted Carpets", priceModifier: 0 },
            { label: "Loose Carpets/Rugs", priceModifier: 0 },
          ] },
        { name: "Number of Rooms with Fitted Carpets", type: "SINGLE", required: false,
          choices: buildTiers("Room", 7, 400, 300) },
        { name: "Number of Loose Carpets/Rugs", type: "SINGLE", required: false,
          choices: Array.from({ length: 20 }, (_, i) => ({
            label: `${i + 1} Carpet/Rug${i > 0 ? "s" : ""}`,
            priceModifier: 140 + (i * 140),
          })) },
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

    console.log("\n🎉 Cleaning products restored!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
