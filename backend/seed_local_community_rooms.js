// PROJO GROUP — Seed PROJO Community rooms (open, real-identity, Rustenburg & surrounds)
// Unlike the Dating Lounge rooms (anonymous, contact-info blocked), these rooms
// use real names/photos and allow contact details & photos — just with
// English/Afrikaans/Zulu profanity filtering and standard chat safety features.
// Run once after migrating: node seed_local_community_rooms.js
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ROOMS = [
  { name: "Rustenburg General",       slug: "rustenburg-general",  icon: "🏘️", category: "Local", mode: "OPEN_LOCAL", isPinnedTop: true,
    description: "Chat with real neighbours across Rustenburg & surrounds." },
  { name: "Buy, Sell & Swap",         slug: "buy-sell-swap",       icon: "🛒", category: "Local", mode: "OPEN_LOCAL",
    description: "Post items for sale, swap, or wanted — photos and contact details welcome." },
  { name: "Events & Announcements",   slug: "events-announcements",icon: "📢", category: "Local", mode: "OPEN_LOCAL",
    description: "Local events, community news, and announcements." },
  { name: "Lost & Found",             slug: "lost-found",          icon: "🔍", category: "Local", mode: "OPEN_LOCAL",
    description: "Lost a pet or found something? Post here with photos and contact info." },
  { name: "Traffic & Local Alerts",   slug: "traffic-alerts",      icon: "🚧", category: "Local", mode: "OPEN_LOCAL",
    description: "Road closures, load shedding, and real-time local alerts." },
  { name: "Recommendations & Reviews",slug: "recommendations",     icon: "⭐", category: "Local", mode: "OPEN_LOCAL",
    description: "Ask for and share recommendations for local services and businesses." },
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
  console.log("Done seeding PROJO Community (open local) rooms.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
