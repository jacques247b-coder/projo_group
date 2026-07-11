// PROJO GROUP — promote a user to ADMIN role
// Usage: node make_admin.js +27620901372
//    or: node make_admin.js jacques247b@gmail.com
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const identifier = process.argv[2];
  if (!identifier) {
    console.log("Usage: node make_admin.js <phone or email>");
    return;
  }

  const isEmail = identifier.includes("@");
  const user = await prisma.user.findUnique({
    where: isEmail ? { email: identifier } : { phone: identifier },
  });

  if (!user) {
    console.log(`No user found with ${isEmail ? "email" : "phone"} "${identifier}".`);
    console.log("Make sure you've signed in at least once first, so the account exists.");
    return;
  }

  if (user.role === "ADMIN") {
    console.log(`${user.name} (${user.phone}) is already an ADMIN.`);
  } else {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
    });
    console.log(`✓ Promoted ${updated.name} (${updated.phone}) from ${user.role} to ADMIN.`);
    console.log("Log out and back in on the app for the change to take effect.");
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
