// PROJO GROUP — Seed Shop Products from Take.app
// Run: node seedshop.js

const { Client } = require("pg");

const client = new Client({
  connectionString: "postgresql://postgres:lqdqAezjJAxcJhWdtIbeANdyZfgPSpyb@zephyr.proxy.rlwy.net:36878/railway",
  ssl: { rejectUnauthorized: false },
});

const products = [
  // ── CLEANING ─────────────────────────────────────────────
  {
    name: "Standard Cleaning",
    category: "Cleaning",
    priceZar: 0,
    description: "Standard home or office cleaning service. Contact us for a quote based on your property size.",
    isActive: true,
  },
  {
    name: "Deep Clean",
    category: "Cleaning",
    priceZar: 0,
    description: "Thorough deep cleaning service for homes and offices. Includes all surfaces, appliances and more.",
    isActive: true,
  },
  {
    name: "Guest House / AirBnb Cleaning",
    category: "Cleaning",
    priceZar: 0,
    description: "Professional cleaning for guest houses and AirBnb properties. Quick turnaround between guests.",
    isActive: true,
  },
  {
    name: "Move In/Out Cleaning",
    category: "Cleaning",
    priceZar: 0,
    description: "Complete cleaning service for moving in or moving out. Leave the property spotless.",
    isActive: true,
  },
  {
    name: "Carpet/Upholstery Cleaning",
    category: "Cleaning",
    priceZar: 0,
    description: "Professional carpet and upholstery cleaning. Removes stains, odours and bacteria.",
    isActive: true,
  },

  // ── MAINTENANCE ───────────────────────────────────────────
  {
    name: "Maintenance Booking / Enquiry",
    category: "Maintenance",
    priceZar: 350,
    description: "Call out fee R350. Includes expenses, an hour, and any minor fixes or emergency call outs. For emergencies contact us directly on Call or WhatsApp.",
    isActive: true,
  },

  // ── PAINTING ─────────────────────────────────────────────
  {
    name: "Painting Services",
    category: "Painting",
    priceZar: 28,
    description: "Professional painting for residential, commercial and industrial properties. High quality workmanship. Building/Wall/House painting from R28/sqm. Roof painting also available. Curb residential number from R350. Price is Paint & Labour included.",
    isActive: true,
  },

  // ── PEST CONTROL ─────────────────────────────────────────
  {
    name: "Pest Control - Request For Quotes",
    category: "Pest Control",
    priceZar: 0,
    description: "Fumigation & Spray (2 Treatments) R1000. Fumigation & Spray (Once Off) R950. Spray Only (Once Off) R800. Supply & Install Bat Station R300. Ceiling Treatment Against Rats & Bats R150. Removal of Bees (New Nest) R150. Removal of Bees (Old Nest) R2950. R350 fee for properties outside Rustenburg. Turnaround 12-24 hours.",
    isActive: true,
  },

  // ── WEB & APP DEVELOPMENT ─────────────────────────────────
  {
    name: "Website Development",
    category: "Web & App Development",
    priceZar: 2200,
    description: "Professional website development for your business. Small Business/Starter from R2200. Professional websites from R5700. E-Commerce from R2700. Ongoing costs: Domain R200/year, Hosting R800/year. PROJO GROUP your Trusted Development Partner. Clients contacted within 12-24 hours.",
    isActive: true,
  },
  {
    name: "Mobile App Development",
    category: "Web & App Development",
    priceZar: 2100,
    description: "iOS and Android app development. E-Commerce & Retail Apps from R3250. Content & Blog Apps from R2800. Niche & Custom Apps from R2800. Web-to-App from R2100. Cross-platform solutions. PROJO GROUP your Trusted Development Partner.",
    isActive: true,
  },

  // ── RUNNERS & DELIVERIES ──────────────────────────────────
  {
    name: "Personal Shopper",
    category: "Runners & Deliveries",
    priceZar: 60,
    description: "We shop for you! Base delivery fee R60 (Rustenburg flat rate). Shopping service fee 12% of total till slip. Click & Collect pick-up also available. Boot capacity rule applies. Items delivered same day after payment confirmation. Enter shopping list, delivery address and WhatsApp number.",
    isActive: true,
  },
  {
    name: "Deliveries (Fast, Reliable & Secure)",
    category: "Runners & Deliveries",
    priceZar: 60,
    description: "Same day deliveries. After hour bookings available. Click & Collect pick-up available. R60 flat rate within Rustenburg (Tlhabane/Boitekong/Waterfall Mall). 15km outer Rustenburg R140 (Phokeng/Kroondal). 30km R210 (Boshoek/Buffelspoort). Custom boot deliveries for parcels and bulky items also available.",
    isActive: true,
  },
];

async function seedProducts() {
  try {
    await client.connect();
    console.log("✅ Connected to database!");

    // Create products table with category column if needed
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        "priceZar" FLOAT NOT NULL DEFAULT 0,
        "stockQty" INT NOT NULL DEFAULT 999,
        "imageUrl" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Clear existing products
    await client.query(`DELETE FROM products`);
    console.log("✅ Cleared existing products");

    // Insert all products
    for (const p of products) {
      await client.query(`
        INSERT INTO products (name, description, category, "priceZar", "stockQty", "isActive")
        VALUES ($1, $2, $3, $4, 999, $5)
      `, [p.name, p.description, p.category, p.priceZar, p.isActive]);
      console.log(`✅ Added: ${p.name} (${p.category})`);
    }

    console.log("");
    console.log("╔════════════════════════════════════════╗");
    console.log(`║  ${products.length} products added to PROJO GROUP! 🎉 ║`);
    console.log("╚════════════════════════════════════════╝");

    await client.end();
  } catch (err) {
    console.error("❌ Error:", err.message);
    await client.end();
  }
}

seedProducts();
