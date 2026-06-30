// PROJO GROUP — Seed Locksmith category with real pricing
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

const callOutOption = {
  name: "Callout Type",
  type: "SINGLE",
  required: true,
  choices: [
    { label: "Business Hours Callout (8am-5pm)", priceModifier: 450 },
    { label: "Emergency / After Hours Callout", priceModifier: 750 },
  ],
};

const addressOption = { name: "Property Address", type: "TEXT", required: true, choices: [] };
const phoneOption = { name: "Contact Number", type: "TEXT", required: true, choices: [] };
const notesOption = { name: "Additional Details", type: "TEXT", required: false, choices: [] };

async function main() {
  try {
    console.log("🔑 Seeding Locksmith category (real pricing)...\n");

    await createOrUpdateProduct(
      "Standard Home Lockout", "Locksmith", 500,
      "Locked out of your home? Fast response standard lockout service.",
      [ callOutOption, addressOption, phoneOption, notesOption ]
    );

    await createOrUpdateProduct(
      "Lock Replacement and Repair", "Locksmith", 650,
      "Full lock replacement or repair service for residential and commercial properties.",
      [ callOutOption, addressOption, phoneOption, notesOption ]
    );

    await createOrUpdateProduct(
      "High Security Locks", "Locksmith", 0,
      "High security lock installation. Requires custom quote based on specifications.",
      [ addressOption, phoneOption, notesOption ]
    );

    await createOrUpdateProduct(
      "Rekeying (Per Lock Cylinder)", "Locksmith", 300,
      "Rekey an existing lock cylinder — price is per cylinder.",
      [
        { name: "Number of Cylinders", type: "SINGLE", required: true,
          choices: [
            { label: "1 Cylinder", priceModifier: 0 },
            { label: "2 Cylinders", priceModifier: 300 },
            { label: "3 Cylinders", priceModifier: 600 },
            { label: "4 Cylinders", priceModifier: 900 },
            { label: "5 Cylinders", priceModifier: 1200 },
          ] },
        callOutOption, addressOption, phoneOption, notesOption,
      ]
    );

    await createOrUpdateProduct(
      "Home Key Cutting", "Locksmith", 200,
      "Professional key cutting service for residential keys.",
      [
        { name: "Number of Keys", type: "SINGLE", required: true,
          choices: [
            { label: "1 Key", priceModifier: 0 },
            { label: "2 Keys", priceModifier: 200 },
            { label: "3 Keys", priceModifier: 400 },
            { label: "4 Keys", priceModifier: 600 },
            { label: "5 Keys", priceModifier: 800 },
          ] },
        addressOption, phoneOption, notesOption,
      ]
    );

    await createOrUpdateProduct(
      "Car Unlocking", "Locksmith", 500,
      "Locked out of your car? Fast automotive lockout assistance.",
      [ callOutOption, addressOption, phoneOption, notesOption ]
    );

    await createOrUpdateProduct(
      "Car Key Replacement", "Locksmith", 650,
      "Replacement car key cutting service.",
      [ callOutOption, addressOption, phoneOption, notesOption ]
    );

    await createOrUpdateProduct(
      "Car Key Programming", "Locksmith", 1250,
      "Program a new or replacement car key to your vehicle's immobilizer system.",
      [ callOutOption, addressOption, phoneOption, notesOption ]
    );

    console.log("\n🎉 Locksmith category seeded — 8 services!");
    console.log("ℹ️  Note: Labor @ R380/hour and Callout fees are baked into the Callout Type option on relevant services.");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
