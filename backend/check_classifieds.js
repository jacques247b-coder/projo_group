// PROJO GROUP — quick diagnostic: list all classifieds and their status
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const all = await prisma.classified.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });

  console.log(`Found ${all.length} classified(s) total:\n`);
  const now = new Date();
  for (const ad of all) {
    const expired = new Date(ad.expiresAt) < now;
    console.log(`- "${ad.title}" by ${ad.user?.name}`);
    console.log(`    status: ${ad.status} | expiresAt: ${ad.expiresAt} | ${expired ? "EXPIRED (past expiresAt)" : "not yet expired"}`);
    console.log(`    category: ${ad.category} | createdAt: ${ad.createdAt}`);
    console.log("");
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
