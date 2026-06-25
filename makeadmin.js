// PROJO GROUP — Make a user an Admin
// SECURITY FIX: Database URL now loaded from environment variable, NOT hardcoded.
//
// Usage:
//   DATABASE_URL="postgresql://..." node makeadmin.js +27620901372
//   OR set DATABASE_URL in backend/.env and run from backend/
//
// Never commit real credentials to this file.

require("dotenv").config({ path: "./backend/.env" }); // loads backend/.env if run from root
const { Client } = require("pg");

// Accept phone as CLI argument, or fall back to env var
const YOUR_PHONE = process.argv[2] || process.env.ADMIN_PHONE;

if (!YOUR_PHONE) {
  console.error("❌ No phone number provided.");
  console.error("Usage: node makeadmin.js +27XXXXXXXXX");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set.");
  console.error("Make sure backend/.env exists with DATABASE_URL, or prefix the command:");
  console.error('  DATABASE_URL="postgresql://..." node makeadmin.js +27XXXXXXXXX');
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function makeAdmin() {
  try {
    await client.connect();
    const result = await client.query(
      `UPDATE "User" SET role = 'ADMIN' WHERE phone = $1 RETURNING name, phone, role`,
      [YOUR_PHONE]
    );
    if (result.rows.length === 0) {
      console.log(`❌ No user found with phone ${YOUR_PHONE}`);
    } else {
      console.log("✅ Updated to ADMIN:", result.rows[0]);
    }
    await client.end();
  } catch (err) {
    console.error("❌ Error:", err.message);
    await client.end();
    process.exit(1);
  }
}

makeAdmin();
