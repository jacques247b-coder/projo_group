// PROJO GROUP — Seed Web & App Development category (11 separate services)
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

const customRequestOption = {
  name: "Custom Request",
  type: "TEXT",
  required: false,
  choices: [],
};

async function main() {
  try {
    console.log("💻 Seeding Web & App Development category (11 services)...\n");

    // ── Website Development variants ──────────────────────────
    await createOrUpdateProduct(
      "Website - Small Business / Starter", "Web & App Development", 2200,
      "Best for: Startups, local tradesmen, and service professionals. Domain R200/yr, Hosting R800/yr.",
      [ customRequestOption ]
    );

    await createOrUpdateProduct(
      "Website - Professional", "Web & App Development", 5700,
      "Best for: Growing companies needing a robust online presence.",
      [ customRequestOption ]
    );

    await createOrUpdateProduct(
      "Website - E-Commerce (20 uploads, 100 products)", "Web & App Development", 2700,
      "Best for: Retailers and brands selling online. 20 picture uploads, 100 products.",
      [ customRequestOption ]
    );

    await createOrUpdateProduct(
      "Website - E-Commerce (Unlimited uploads/products)", "Web & App Development", 3550,
      "Best for: Retailers and brands selling online. Unlimited picture uploads, unlimited products.",
      [ customRequestOption ]
    );

    await createOrUpdateProduct(
      "Landing Page Design (Each)", "Web & App Development", 225,
      "High-converting, single-purpose landing page design and development.",
      [ customRequestOption ]
    );

    await createOrUpdateProduct(
      "Website - Custom Request", "Web & App Development", 0,
      "N/A — Custom website request. Contact us for a tailored quote.",
      [ customRequestOption ]
    );

    // ── Mobile App Development variants ───────────────────────
    await createOrUpdateProduct(
      "App - E-Commerce & Retail", "Web & App Development", 3250,
      "We build a Mobile Shopping App for your Online Store.",
      [ customRequestOption ]
    );

    await createOrUpdateProduct(
      "App - Content & Blog", "Web & App Development", 2800,
      "We convert any WordPress site or Dynamic website into a native mobile app.",
      [ customRequestOption ]
    );

    await createOrUpdateProduct(
      "App - Niche & Custom", "Web & App Development", 2800,
      "We build apps for Education, Real Estate, Grocery Delivery, Pharmacy and more.",
      [ customRequestOption ]
    );

    await createOrUpdateProduct(
      "App - Web-to-App", "Web & App Development", 2100,
      "We transform almost any website (including those built with PHP, Laravel, and more) into a native app.",
      [ customRequestOption ]
    );

    await createOrUpdateProduct(
      "App - Email Us for Custom Solutions", "Web & App Development", 0,
      "We build Apps from scratch without connecting a Website. Custom quote required.",
      [ customRequestOption ]
    );

    console.log("\n🎉 Web & App Development category seeded — 11 services!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
