// PROJO DATING — Seed demo/placeholder profiles
// These exist purely so Discover isn't empty while the app is new. They are
// marked isDemo:true and automatically stop appearing once enough real
// profiles exist (see DEMO_PHASEOUT_THRESHOLD in dating.controller.js) — no
// manual cleanup needed as real signups grow.
// Run once after migrating: node seed_dating_demo_profiles.js
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DEMO_PROFILES = [
  { name: "Naledi", age: 26, gender: "Woman", city: "Rustenburg",
    bio: "Adventurous soul who loves hiking the Magalies, braaing on weekends, and deep conversations under the stars.",
    interests: ["Hiking", "Braai", "Travel", "Music", "Yoga"], relationshipGoals: ["Serious Relationship", "Long-Term"], isVerified: true },
  { name: "Thabo", age: 30, gender: "Man", city: "Rustenburg",
    bio: "Engineer by day, chef by night. I believe food is love. Seeking genuine connection with someone who appreciates authenticity.",
    interests: ["Cooking", "Gym", "Soccer", "Reading"], relationshipGoals: ["Long-Term"], isVerified: true },
  { name: "Sasha", age: 24, gender: "Woman", city: "Brits",
    bio: "Passionate about education and dance. Love Sunday drives through the Hartbeespoort area and finding hidden gems.",
    interests: ["Dancing", "Reading", "Art", "Nature"], relationshipGoals: ["Dating", "Friendship"] },
  { name: "Lerato", age: 28, gender: "Woman", city: "Rustenburg",
    bio: "Building my empire one step at a time. Looking for someone ambitious to share the journey. Wine lover, travel addict.",
    interests: ["Travel", "Wine", "Movies"], relationshipGoals: ["Serious Relationship", "Marriage"], isVerified: true },
  { name: "Kagiso", age: 32, gender: "Man", city: "Phokeng",
    bio: "Healing hearts medically and hoping to find someone to complete mine. Jazz nights, country drives, and good conversation.",
    interests: ["Jazz", "Travel", "Cooking", "Fitness"], relationshipGoals: ["Marriage", "Serious Relationship"], isVerified: true },
  { name: "Amara", age: 25, gender: "Woman", city: "Rustenburg",
    bio: "I see beauty in everything. My ideal date? Sunset at Sun City followed by stargazing at Pilanesberg.",
    interests: ["Art", "Photography", "Music"], relationshipGoals: ["Dating", "Long-Term"] },
  { name: "Bongani", age: 29, gender: "Man", city: "Marikana",
    bio: "Mine engineer with a soft spot for old-school music and Sunday soccer. Looking for someone who laughs easily.",
    interests: ["Soccer", "Music", "Gym"], relationshipGoals: ["Long-Term", "Dating"] },
  { name: "Zanele", age: 27, gender: "Woman", city: "Rustenburg",
    bio: "Nurse who's seen enough of life to know what really matters. Braai, books, and a good laugh — that's my kind of Friday.",
    interests: ["Braai", "Reading", "Travel"], relationshipGoals: ["Serious Relationship"], isVerified: true },
  { name: "Sipho", age: 34, gender: "Man", city: "Rustenburg",
    bio: "Entrepreneur building something real. Gym in the morning, good wine in the evening. Let's see where this goes.",
    interests: ["Gym", "Wine", "Business"], relationshipGoals: ["Marriage", "Long-Term"] },
  { name: "Palesa", age: 23, gender: "Woman", city: "Sun City",
    bio: "Student, dreamer, hopeless romantic. I collect sunsets and good playlists. Tell me your favourite song.",
    interests: ["Music", "Dancing", "Photography"], relationshipGoals: ["Dating", "Friendship"] },
  { name: "Mpho", age: 31, gender: "Man", city: "Rustenburg",
    bio: "Civil servant, weekend hiker, and terrible singer (but I do it anyway). Looking for my co-pilot.",
    interests: ["Hiking", "Nature", "Music"], relationshipGoals: ["Long-Term", "Serious Relationship"] },
  { name: "Ayanda", age: 26, gender: "Woman", city: "Brits",
    bio: "Graphic designer with a caffeine addiction and a soft spot for rainy days. Let's talk about everything and nothing.",
    interests: ["Art", "Movies", "Yoga"], relationshipGoals: ["Dating", "Long-Term"], isVerified: true },
];

async function main() {
  let created = 0;
  for (let i = 0; i < DEMO_PROFILES.length; i++) {
    const d = DEMO_PROFILES[i];
    const phone = `0000000${String(i + 1).padStart(3, "0")}`; // guaranteed-unique placeholder numbers

    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: { phone, name: d.name, role: "PASSENGER", status: "ACTIVE" },
      });
    }

    const existingProfile = await prisma.datingProfile.findUnique({ where: { userId: user.id } });
    if (existingProfile) {
      console.log(`↻  Demo profile already exists: ${d.name}`);
      continue;
    }

    await prisma.datingProfile.create({
      data: {
        userId: user.id,
        displayName: d.name,
        age: d.age,
        gender: d.gender,
        interestedIn: ["Everyone"],
        city: d.city,
        bio: d.bio,
        interests: d.interests,
        relationshipGoals: d.relationshipGoals,
        isVerified: !!d.isVerified,
        isDemo: true,
      },
    });
    created++;
    console.log(`✅ Created demo profile: ${d.name}, ${d.age} (${d.city})`);
  }
  console.log(`Done. ${created} new demo profiles created.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
