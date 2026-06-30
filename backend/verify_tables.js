// PROJO GROUP — Verify which tables actually exist in the database
require("dotenv").config();
const { Client } = require("pg");

const rawUrl = process.env.DATABASE_URL;
const cleanUrl = rawUrl.split("?")[0];

const client = new Client({
  connectionString: cleanUrl,
  ssl: { rejectUnauthorized: false },
});

async function verify() {
  try {
    await client.connect();
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log("📋 Tables currently in database:");
    result.rows.forEach(r => console.log("  -", r.table_name));
    await client.end();
  } catch (err) {
    console.error("❌ Error:", err.message);
    await client.end();
  }
}
verify();
