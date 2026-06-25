// PROJO GROUP — Make a user an Admin
// Edit YOUR_PHONE below then run: node makeadmin.js

const { Client } = require("pg");

const YOUR_PHONE = "+27620901372"; // <-- CHANGE THIS to your registered phone

const client = new Client({
  connectionString: "postgresql://postgres:lqdqAezjJAxcJhWdtIbeANdyZfgPSpyb@zephyr.proxy.rlwy.net:36878/railway",
  ssl: { rejectUnauthorized: false },
});

async function makeAdmin() {
  try {
    await client.connect();
    const result = await client.query(
      `UPDATE users SET role = 'ADMIN' WHERE phone = $1 RETURNING name, phone, role`,
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
  }
}

makeAdmin();
