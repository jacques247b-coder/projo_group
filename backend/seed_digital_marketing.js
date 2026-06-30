// PROJO GROUP — Seed Digital Marketing category
// Base prices +20%, then Growth tier +50%, Premium tier +50% on top
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function tier1(base) { return Math.round(base * 1.20); }
function tier2(p1) { return Math.round(p1 * 1.50); }
function tier3(p2) { return Math.round(p2 * 1.50); }

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

function platformTierOption(basicPrice) {
  const basic   = tier1(basicPrice);
  const growth  = tier2(basic);
  const premium = tier3(growth);
  return {
    name: "Platform Tier",
    type: "SINGLE",
    required: true,
    choices: [
      { label: `Basic (1 Platform) — R${basic}/month`, priceModifier: 0 },
      { label: `Growth (2-3 Platforms) — R${growth}/month`, priceModifier: growth - basic },
      { label: `Premium (All Platforms, advanced design + community management + strategy) — R${premium}/month`, priceModifier: premium - basic },
    ],
  };
}

const businessNameOption = { name: "Business / Brand Name", type: "TEXT", required: true, choices: [] };
const phoneOption = { name: "Contact Number", type: "TEXT", required: true, choices: [] };
const notesOption = { name: "Tell us about your business & goals", type: "TEXT", required: false, choices: [] };

async function main() {
  try {
    console.log("📣 Seeding Digital Marketing category...\n");

    // ── Social Media & Online (posting only) ────────────────────
    await createOrUpdateProduct(
      "Social Media & Online (2x per week)", "Digital Marketing",
      tier1(200),
      "2 social media posts per week. Choose your platform tier — pricing scales with reach and platforms covered. Billed monthly.",
      [ platformTierOption(200), businessNameOption, phoneOption, notesOption ]
    );

    await createOrUpdateProduct(
      "Social Media & Online (4x per week)", "Digital Marketing",
      tier1(300),
      "4 social media posts per week. Choose your platform tier — pricing scales with reach and platforms covered. Billed monthly.",
      [ platformTierOption(300), businessNameOption, phoneOption, notesOption ]
    );

    await createOrUpdateProduct(
      "Social Media & Online (6x per week)", "Digital Marketing",
      tier1(460),
      "6 social media posts per week. Choose your platform tier — pricing scales with reach and platforms covered. Billed monthly.",
      [ platformTierOption(460), businessNameOption, phoneOption, notesOption ]
    );

    // ── Digital Marketing including Graphic Design + Branding ───
    await createOrUpdateProduct(
      "Digital Marketing + Graphic Design + Branding (2x per week)", "Digital Marketing",
      tier1(400),
      "2 posts per week, fully designed with brand-consistent graphics. Choose your platform tier. Billed monthly.",
      [ platformTierOption(400), businessNameOption, phoneOption, notesOption ]
    );

    await createOrUpdateProduct(
      "Digital Marketing + Graphic Design + Branding (4x per week)", "Digital Marketing",
      tier1(600),
      "4 posts per week, fully designed with brand-consistent graphics. Choose your platform tier. Billed monthly.",
      [ platformTierOption(600), businessNameOption, phoneOption, notesOption ]
    );

    await createOrUpdateProduct(
      "Digital Marketing + Graphic Design + Branding (6x per week)", "Digital Marketing",
      tier1(780),
      "6 posts per week, fully designed with brand-consistent graphics. Choose your platform tier. Billed monthly.",
      [ platformTierOption(780), businessNameOption, phoneOption, notesOption ]
    );

    // ── Quote-only services ──────────────────────────────────────
    await createOrUpdateProduct(
      "Print Marketing & Design", "Digital Marketing", 0,
      "Flyers, brochures, banners and print-ready marketing material. Custom quote based on your requirements.",
      [ businessNameOption, phoneOption, notesOption ]
    );

    await createOrUpdateProduct(
      "Branding", "Digital Marketing", 0,
      "Full brand identity development — logo, colour palette, typography, brand guidelines. Custom quote.",
      [ businessNameOption, phoneOption, notesOption ]
    );

    await createOrUpdateProduct(
      "Graphic Design", "Digital Marketing", 0,
      "Standalone graphic design work — social graphics, marketing assets, presentations. Custom quote.",
      [ businessNameOption, phoneOption, notesOption ]
    );

    await createOrUpdateProduct(
      "Marketplace Advertising", "Digital Marketing", 0,
      "Paid advertising on Facebook, Instagram, Google and other marketplaces. Custom quote based on budget and goals.",
      [ businessNameOption, phoneOption, notesOption ]
    );

    console.log("\n🎉 Digital Marketing category seeded — 10 services!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
