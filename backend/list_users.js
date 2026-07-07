require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, phone: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  if (users.length === 0) { console.log("No users found."); return; }
  for (const u of users) {
    console.log(`${u.phone}  |  ${u.name}  |  ${u.role}  |  ${u.createdAt.toISOString()}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());