// PROJO GROUP — Full Computer & Console Technicians pricing
// Real fixed pricing +15% markup. Replaces earlier estimate-based seed.
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function m(price) { return Math.round(price * 1.15); }

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

const addressOption = { name: "Collection / Drop-off Address", type: "TEXT", required: true, choices: [] };
const phoneOption = { name: "Contact Number", type: "TEXT", required: true, choices: [] };
const issueOption = { name: "Describe the Issue (optional)", type: "TEXT", required: false, choices: [] };
const collectionOption = {
  name: "How would you like to send it in?",
  type: "SINGLE", required: true,
  choices: [
    { label: "Collect from me (R60, Rustenburg)", priceModifier: 60 },
    { label: "I'll drop it off myself", priceModifier: 0 },
  ],
};

// Build a platform-price service: base = first platform price, others as modifiers
function platformChoices(platformPrices) {
  const entries = Object.entries(platformPrices);
  const basePrice = m(entries[0][1]);
  return {
    basePrice,
    choices: entries.map(([label, price]) => ({
      label,
      priceModifier: m(price) - basePrice,
    })),
  };
}

async function main() {
  try {
    console.log("🎮💻 Seeding Computer & Console Technicians — full pricing...\n");

    // ════════════════════════════════════════════════════════
    // PLAYSTATION
    // ════════════════════════════════════════════════════════
    const psPlatforms = ["PS2","PS3","PS4 Fat","PS4 Slim","PS4 Pro","PS5"];

    const psServices = [
      ["General Diagnostic Service", [150,200,250,250,250,350]],
      ["Controller Repair", [150,150,150,150,150,250]],
      ["Software Installation", [350,350,350,350,350,350]],
      ["Internal Power Supply Replacement", [200,250,250,250,250,350]],
      ["Motherboard Repair", [450,600,650,650,650,750]],
      ["Motherboard GPU/CPU Repair", [550,850,900,900,900,1200]],
      ["HDMI Port Replacement", [450,600,650,650,650,750]],
      ["Laser Replacement", [150,200,250,250,250,350]],
      ["DVD/Blue-Ray ROM Replacement", [150,200,250,250,250,350]],
      ["Fan Replacement Service", [150,200,250,250,250,350]],
    ];

    for (const [serviceName, prices] of psServices) {
      const priceMap = {};
      psPlatforms.forEach((p, i) => priceMap[p] = prices[i]);
      const { basePrice, choices } = platformChoices(priceMap);
      await createOrUpdateProduct(
        `PlayStation - ${serviceName}`, "PC & Console Repair", basePrice,
        `Select your PlayStation model for accurate pricing.`,
        [
          { name: "PlayStation Model", type: "SINGLE", required: true, choices },
          collectionOption, addressOption, phoneOption, issueOption,
        ]
      );
    }

    // ════════════════════════════════════════════════════════
    // PLAYSTATION PORTABLE
    // ════════════════════════════════════════════════════════
    const pspPlatforms = ["PSP Go","PSP","PS Vita"];
    const pspServices = [
      ["General Diagnostic Service", [200,200,250]],
      ["Button/Analog/Trigger Repair", [150,150,150]],
      ["Software Installation", [200,200,200]],
      ["Charging Port Repair", [200,200,250]],
      ["Motherboard Repair", [300,300,350]],
      ["Motherboard GPU/CPU Repair", [350,350,450]],
      ["Video Ports Repair", [350,350,450]],
      ["Memory Card Reader Repair", [350,350,450]],
      ["Card Reader Repair", [350,350,450]],
    ];
    for (const [serviceName, prices] of pspServices) {
      const priceMap = {};
      pspPlatforms.forEach((p, i) => priceMap[p] = prices[i]);
      const { basePrice, choices } = platformChoices(priceMap);
      await createOrUpdateProduct(
        `PlayStation Portable - ${serviceName}`, "PC & Console Repair", basePrice,
        `Select your PSP/Vita model for accurate pricing.`,
        [
          { name: "Device Model", type: "SINGLE", required: true, choices },
          collectionOption, addressOption, phoneOption, issueOption,
        ]
      );
    }

    // ════════════════════════════════════════════════════════
    // XBOX
    // ════════════════════════════════════════════════════════
    const xboxPlatforms = ["Xbox 360","Xbox One","Xbox One S","Xbox One X","Xbox Series S","Xbox Series X"];
    const xboxServices = [
      ["General Diagnostic Service", [250,250,250,350,350,350]],
      ["Controller Repair", [150,150,150,150,150,150]],
      ["Software Installation", [350,350,350,350,350,350]],
      ["Internal Power Supply Replacement", [250,250,250,300,300,300]],
      ["Motherboard Repair", [600,650,650,650,750,750]],
      ["Motherboard GPU/CPU Repair", [850,900,900,900,1200,1200]],
      ["Fan Replacement Service", [250,250,250,350,350,350]],
      ["HDMI Port Replacement", [600,650,650,650,750,750]],
      ["Laser Replacement", [250,250,250,350,350,350]],
      ["DVD/Blue-Ray ROM Replacement", [250,250,250,350,350,350]],
    ];
    for (const [serviceName, prices] of xboxServices) {
      const priceMap = {};
      xboxPlatforms.forEach((p, i) => priceMap[p] = prices[i]);
      const { basePrice, choices } = platformChoices(priceMap);
      await createOrUpdateProduct(
        `Xbox - ${serviceName}`, "PC & Console Repair", basePrice,
        `Select your Xbox model for accurate pricing.`,
        [
          { name: "Xbox Model", type: "SINGLE", required: true, choices },
          collectionOption, addressOption, phoneOption, issueOption,
        ]
      );
    }

    // ════════════════════════════════════════════════════════
    // NINTENDO
    // ════════════════════════════════════════════════════════
    const nintendoPlatforms = ["Wii","WiiU","Switch","Switch Lite"];
    const nintendoServices = [
      ["General Diagnostic Service", [250,250,250,350]],
      ["Controller Repair", [150,150,150,150]],
      ["Software Installation", [350,350,350,350]],
      ["Internal Power Supply Replacement", [250,250,250,300]],
      ["Motherboard Repair", [600,650,650,650]],
      ["Fan Replacement Service", [850,900,900,900]],
      ["HDMI Port Replacement", [250,250,250,350]],
      ["Laser Replacement", [600,650,650,650]],
      ["DVD/Blue-Ray ROM Replacement", [250,250,250,350]],
    ];
    for (const [serviceName, prices] of nintendoServices) {
      const priceMap = {};
      nintendoPlatforms.forEach((p, i) => priceMap[p] = prices[i]);
      const { basePrice, choices } = platformChoices(priceMap);
      await createOrUpdateProduct(
        `Nintendo - ${serviceName}`, "PC & Console Repair", basePrice,
        `Select your Nintendo model for accurate pricing.`,
        [
          { name: "Nintendo Model", type: "SINGLE", required: true, choices },
          collectionOption, addressOption, phoneOption, issueOption,
        ]
      );
    }

    // ════════════════════════════════════════════════════════
    // LAPTOP REPAIR (flat prices, no platform variants)
    // ════════════════════════════════════════════════════════
    const laptopServices = [
      ["Laptop General Diagnostic Service", 250],
      ["Laptop Keyboard Replacement (External)", 150],
      ["Laptop Keyboard Replacement (Internal)", 250],
      ["Laptop Screen Replacement (without Glass)", 250],
      ["Laptop Screen Replacement (with Glass)", 300],
      ["Laptop Battery Replacement", 200],
      ["Laptop Power DC Jack Replacement", 250],
      ["Laptop Motherboard Repair/Replacement", 850],
      ["Laptop Charger Test Evaluation", 100],
      ["Laptop HDMI Port Replacement", 350],
      ["Laptop DVD/Blue-Ray ROM Replacement", 100],
    ];
    for (const [name, price] of laptopServices) {
      await createOrUpdateProduct(
        name, "PC & Console Repair", m(price),
        `Professional laptop repair service.`,
        [ collectionOption, addressOption, phoneOption, issueOption ]
      );
    }

    // ════════════════════════════════════════════════════════
    // DESKTOP REPAIR
    // ════════════════════════════════════════════════════════
    const desktopServices = [
      ["Desktop General Diagnostic Service", 250],
      ["Desktop Power Supply Replacement", 150],
      ["Desktop DVD/Blue-Ray ROM / RAM / HDD Replacement", 150],
      ["Desktop Sound/Graphic Card Replacement", 150],
      ["Desktop Motherboard Repair/Replacement", 850],
    ];
    for (const [name, price] of desktopServices) {
      await createOrUpdateProduct(
        name, "PC & Console Repair", m(price),
        `Professional desktop computer repair service.`,
        [ collectionOption, addressOption, phoneOption, issueOption ]
      );
    }

    // ════════════════════════════════════════════════════════
    // SOFTWARE INSTALLATION & UPGRADE
    // ════════════════════════════════════════════════════════
    const softwareServices = [
      ["Microsoft Windows Installation & Upgrade", 250],
      ["Microsoft Windows 10/11 Installation & Upgrade", 350],
      ["Microsoft Office Installation & Upgrade", 300],
      ["Anti-Virus Installation & Removal", 200],
    ];
    for (const [name, price] of softwareServices) {
      await createOrUpdateProduct(
        name, "PC & Console Repair", m(price),
        `Software service for laptop or desktop.`,
        [ collectionOption, addressOption, phoneOption, issueOption ]
      );
    }

    console.log("\n🎉 Computer & Console Technicians fully seeded with real pricing!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
