// PROJO GROUP — One-off: deactivate the old anonymous "Rustenburg Local" room
// (slug: local-rustenburg), now superseded by the real-identity local
// community rooms in seed_local_community_rooms.js.
// Run once: node deactivate_old_local_room.js
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const room = await prisma.chatRoom.findUnique({ where: { slug: "local-rustenburg" } });
  if (!room) {
    console.log("No 'local-rustenburg' room found — nothing to do.");
    return;
  }
  await prisma.chatRoom.update({ where: { slug: "local-rustenburg" }, data: { isActive: false } });
  console.log("Deactivated old 'Rustenburg Local' anonymous room.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
