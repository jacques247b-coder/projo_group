// PROJO GROUP — Seed default Dating Lounge rooms (anonymous, contact-info blocked)
// These are the Community rooms accessed from inside PROJO Dating — masked
// identity, no contact-info sharing, purely for engagement around dating/
// relationships topics. For the open, real-identity Rustenburg community
// rooms, see seed_local_community_rooms.js instead.
// Run once after migrating: node seed_community_rooms.js
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ROOMS = [
  { name: "General Chat",        slug: "general",        icon: "💬", category: "General",       isPinnedTop: true,
    description: "Say hi, meet the community, talk about anything." },
  { name: "Relationship Talk",   slug: "relationships",  icon: "💞", category: "Relationships",
    description: "Discuss dating, relationships, and connection — no profiles, just conversation." },
  { name: "Advice & Support",    slug: "advice",          icon: "🫶", category: "Advice",
    description: "Ask for advice or lend an ear. Be kind." },
  { name: "Fun & Games",         slug: "fun-games",       icon: "🎉", category: "Fun",
    description: "Icebreakers, polls, games, and lighthearted chat." },
  { name: "Wellness & Mindset",  slug: "wellness",        icon: "🧘", category: "Support",
    description: "Self-care, motivation, and mental wellness chat." },
];

async function main() {
  for (const room of ROOMS) {
    const existing = await prisma.chatRoom.findUnique({ where: { slug: room.slug } });
    if (existing) {
      console.log(`↻  Room already exists: ${room.name}`);
      continue;
    }
    await prisma.chatRoom.create({ data: room });
    console.log(`✅ Created room: ${room.name}`);
  }
  console.log("Done seeding Community Chat rooms.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
