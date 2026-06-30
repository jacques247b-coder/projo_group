// PROJO GROUP — Clean up duplicate Prisma-shadow tables
require("dotenv").config();
const { Client } = require("pg");

// Strip sslmode from URL and set SSL manually to avoid cert chain issues
const rawUrl = process.env.DATABASE_URL;
const cleanUrl = rawUrl.split("?")[0]; // remove ?sslmode=require etc.

const client = new Client({
  connectionString: cleanUrl,
  ssl: { rejectUnauthorized: false },
});

async function cleanup() {
  try {
    await client.connect();
    console.log("✅ Connected to database");

    const tablesToDrop = ["User", "Wallet", "Ride", "Delivery", "Transaction", "Notification"];

    for (const table of tablesToDrop) {
      try {
        await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        console.log(`✅ Dropped duplicate table: "${table}"`);
      } catch (err) {
        console.log(`⚠️  Could not drop "${table}":`, err.message);
      }
    }

    console.log("\n🎉 Cleanup complete! Your real tables (users, wallets, rides, etc.) are untouched.");
    await client.end();
  } catch (err) {
    console.error("❌ Error:", err.message);
    await client.end();
    process.exit(1);
  }
}

cleanup();
