// ============================================================
// PROJO GROUP — Database Seed
// Initial data: surge zones, promo codes, admin user
// Rustenburg, North West Province
// ============================================================

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding PROJO GROUP database...");

  // ── Admin user ──────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("ProjoAdmin2024!", 12);
  const admin = await prisma.user.upsert({
    where: { phone: "+27000000000" },
    update: {},
    create: {
      phone: "+27000000000",
      email: "info@projogroup.co.za",
      name: "PROJO GROUP Admin",
      role: "ADMIN",
      status: "ACTIVE",
      passwordHash: adminPassword,
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // ── Surge zones (Rustenburg suburbs) ────────────────────────
  const surgeZones = [
    {
      name: "Rustenburg CBD",
      multiplier: 1.0,
      isActive: false,
      swLat: -25.685, swLng: 27.225, neLat: -25.655, neLng: 27.265,
    },
    {
      name: "Waterfall East",
      multiplier: 1.0,
      isActive: false,
      swLat: -25.665, swLng: 27.248, neLat: -25.638, neLng: 27.278,
    },
    {
      name: "Boitekong",
      multiplier: 1.0,
      isActive: false,
      swLat: -25.702, swLng: 27.196, neLat: -25.678, neLng: 27.224,
    },
    {
      name: "Tlhabane",
      multiplier: 1.0,
      isActive: false,
      swLat: -25.709, swLng: 27.256, neLat: -25.685, neLng: 27.284,
    },
    {
      name: "Cashan",
      multiplier: 1.0,
      isActive: false,
      swLat: -25.668, swLng: 27.206, neLat: -25.644, neLng: 27.236,
    },
    {
      name: "Protea Park",
      multiplier: 1.0,
      isActive: false,
      swLat: -25.655, swLng: 27.223, neLat: -25.625, neLng: 27.247,
    },
    {
      name: "Rustenburg Industrial",
      multiplier: 1.0,
      isActive: false,
      swLat: -25.693, swLng: 27.238, neLat: -25.667, neLng: 27.262,
    },
    {
      name: "Phokeng",
      multiplier: 1.0,
      isActive: false,
      swLat: -25.726, swLng: 27.178, neLat: -25.694, neLng: 27.202,
    },
  ];

  for (const zone of surgeZones) {
    await prisma.surgeZone.upsert({
      where: { name: zone.name },
      update: {},
      create: zone,
    });
  }
  console.log(`✅ ${surgeZones.length} surge zones created`);

  // ── Promo codes ─────────────────────────────────────────────
  const promoCodes = [
    {
      code: "PROJO10",
      description: "R10 off your first ride",
      discountZar: 10,
      maxUses: 1000,
      isActive: true,
    },
    {
      code: "RUSTENBURG",
      description: "Welcome to PROJO GROUP — R15 off",
      discountZar: 15,
      maxUses: 500,
      isActive: true,
    },
    {
      code: "WELCOME50",
      description: "New passenger R50 wallet credit",
      discountZar: 50,
      maxUses: 200,
      isActive: true,
    },
  ];

  for (const promo of promoCodes) {
    await prisma.promoCode.upsert({
      where: { code: promo.code },
      update: {},
      create: promo,
    });
  }
  console.log(`✅ ${promoCodes.length} promo codes created`);

  // ── Sample products ─────────────────────────────────────────
  const products = [
    {
      name: "PROJO GROUP Cap",
      description: "Official gold and black cap",
      category: "Merchandise",
      priceZar: 199,
      stockQty: 50,
      isActive: true,
    },
    {
      name: "PROJO GROUP T-Shirt",
      description: "Premium cotton tee with gold print",
      category: "Merchandise",
      priceZar: 299,
      stockQty: 30,
      isActive: true,
    },
    {
      name: "Rustenburg City Tote Bag",
      description: "Reusable tote with Rustenburg skyline",
      category: "Merchandise",
      priceZar: 149,
      stockQty: 100,
      isActive: true,
    },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product }).catch(() => {});
  }
  console.log(`✅ ${products.length} sample products created`);

  console.log("╔════════════════════════════════════════╗");
  console.log("║   PROJO GROUP seed complete! 🏆        ║");
  console.log("║   Admin: info@projogroup.co.za         ║");
  console.log("║   Pass:  ProjoAdmin2024!               ║");
  console.log("╚════════════════════════════════════════╝");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
