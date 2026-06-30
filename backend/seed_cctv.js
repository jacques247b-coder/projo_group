// PROJO GROUP — Seed CCTV category
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
    console.log("📷 Seeding CCTV category...\n");

    // ── 1. CCTV Installation Quote Request ──────────────────────
    await createOrUpdateProduct(
      "CCTV Installation - Request a Quote", "CCTV",
      0,
      "Full CCTV installation quote request. Tell us about your property and requirements — we'll get back to you with a tailored quote and recommendation.",
      [
        { name: "Property Type", type: "SINGLE", required: true,
          choices: [
            { label: "House", priceModifier: 0 },
            { label: "Apartment", priceModifier: 0 },
            { label: "Shop", priceModifier: 0 },
            { label: "Office", priceModifier: 0 },
            { label: "Warehouse", priceModifier: 0 },
            { label: "Farm", priceModifier: 0 },
            { label: "School", priceModifier: 0 },
            { label: "Factory", priceModifier: 0 },
            { label: "Other", priceModifier: 0 },
          ] },
        { name: "Installation Address (Full address, Area/Suburb, Landmark)", type: "TEXT", required: true, choices: [] },
        { name: "Number of Cameras Required", type: "TEXT", required: true, choices: [] },
        { name: "Areas to be Covered (e.g. Front gate, Driveway, Reception, Warehouse)", type: "TEXT", required: true, choices: [] },
        { name: "Indoor or Outdoor Cameras", type: "SINGLE", required: true,
          choices: [
            { label: "Indoor only", priceModifier: 0 },
            { label: "Outdoor only", priceModifier: 0 },
            { label: "Both", priceModifier: 0 },
          ] },
        { name: "Camera Type Preference", type: "MULTI", required: false,
          choices: [
            { label: "Wired CCTV", priceModifier: 0 },
            { label: "Wireless CCTV", priceModifier: 0 },
            { label: "Solar Cameras", priceModifier: 0 },
            { label: "PTZ Cameras (rotating)", priceModifier: 0 },
            { label: "Night Vision Cameras", priceModifier: 0 },
            { label: "AI / Human Detection Cameras", priceModifier: 0 },
            { label: "Not sure — recommend for me", priceModifier: 0 },
          ] },
        { name: "Remote Viewing on Phone?", type: "SINGLE", required: true,
          choices: [
            { label: "Yes - Android", priceModifier: 0 },
            { label: "Yes - iPhone", priceModifier: 0 },
            { label: "No", priceModifier: 0 },
          ] },
        { name: "Existing CCTV System?", type: "SINGLE", required: true,
          choices: [
            { label: "No existing system (new install)", priceModifier: 0 },
            { label: "Yes - needs repairs", priceModifier: 0 },
            { label: "Yes - needs upgrade", priceModifier: 0 },
            { label: "Yes - needs additional cameras", priceModifier: 0 },
            { label: "Yes - needs DVR/NVR replacement", priceModifier: 0 },
          ] },
        { name: "Internet / WiFi Available on Site?", type: "SINGLE", required: true,
          choices: [
            { label: "Yes", priceModifier: 0 },
            { label: "No", priceModifier: 0 },
            { label: "Not sure", priceModifier: 0 },
          ] },
        { name: "Recording Storage Duration", type: "SINGLE", required: false,
          choices: [
            { label: "7 days", priceModifier: 0 },
            { label: "14 days", priceModifier: 0 },
            { label: "30+ days", priceModifier: 0 },
          ] },
        { name: "Recording Type", type: "SINGLE", required: false,
          choices: [
            { label: "Continuous recording", priceModifier: 0 },
            { label: "Motion detection only", priceModifier: 0 },
          ] },
        { name: "Power Points Available Near Installation Areas?", type: "SINGLE", required: true,
          choices: [
            { label: "Yes", priceModifier: 0 },
            { label: "No", priceModifier: 0 },
          ] },
        { name: "Load Shedding Backup Required?", type: "SINGLE", required: false,
          choices: [
            { label: "No backup needed", priceModifier: 0 },
            { label: "UPS", priceModifier: 0 },
            { label: "Inverter", priceModifier: 0 },
            { label: "Solar Backup", priceModifier: 0 },
          ] },
        { name: "Preferred Installation Date / Urgency", type: "TEXT", required: true, choices: [] },
        { name: "Budget Range (Optional)", type: "SINGLE", required: false,
          choices: [
            { label: "Entry level", priceModifier: 0 },
            { label: "Mid-range", priceModifier: 0 },
            { label: "Premium security system", priceModifier: 0 },
          ] },
        { name: "Contact Number", type: "TEXT", required: true, choices: [] },
      ]
    );

    // ── 2. CCTV Callout / Maintenance ──────────────────────────
    await createOrUpdateProduct(
      "CCTV Callout / Maintenance", "CCTV", 450,
      "On-site CCTV callout for repairs, maintenance or troubleshooting. Callout fee R450 includes the first hour. Additional time charged at R380/hour.",
      [
        { name: "Issue Description", type: "TEXT", required: true, choices: [] },
        { name: "Property Address", type: "TEXT", required: true, choices: [] },
        { name: "Contact Number", type: "TEXT", required: true, choices: [] },
      ]
    );

    console.log("\n🎉 CCTV category seeded — 2 services!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
