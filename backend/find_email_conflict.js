// PROJO GROUP — find (and optionally remove) an abandoned registration
// that's holding onto an email address, blocking a new signup from using it.
// Usage: node find_email_conflict.js koekoeb@gmail.com
//        node find_email_conflict.js koekoeb@gmail.com --delete-if-pending
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const shouldDelete = process.argv.includes("--delete-if-pending");
  if (!email) { console.log("Usage: node find_email_conflict.js someone@email.com [--delete-if-pending]"); return; }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) { console.log(`No user found with email ${email} — it's actually free to use.`); return; }

  console.log(`Found: ${user.name} | phone: ${user.phone} | status: ${user.status} | role: ${user.role} | created: ${user.createdAt}`);

  if (user.status === "PENDING_VERIFICATION") {
    console.log("\nThis is an INCOMPLETE registration (never finished OTP verification) — safe to remove if it's blocking a new signup.");
    if (shouldDelete) {
      await prisma.wallet.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
      console.log(`✓ Removed. "${email}" is now free to use for a new registration.`);
    } else {
      console.log(`Re-run with --delete-if-pending to remove it: node find_email_conflict.js ${email} --delete-if-pending`);
    }
  } else {
    console.log("\nThis is an ACTIVE account — not touching it automatically. If this really should be freed up, handle it manually.");
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
