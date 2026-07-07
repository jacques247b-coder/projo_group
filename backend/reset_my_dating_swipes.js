// PROJO DATING — Dev utility: reset your own swipe history
// Clears your DatingLike and DatingPass rows so previously-seen profiles
// (including demo ones) reappear in Discover. Safe to run anytime during
// testing — it only touches the profile matching the phone number you pass.
//
// Usage: node reset_my_dating_swipes.js 0821234567
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const phone = process.argv[2];
  if (!phone) {
    console.log("Usage: node reset_my_dating_swipes.js <your-phone-number>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) { console.log(`No user found with phone ${phone}`); return; }

  const profile = await prisma.datingProfile.findUnique({ where: { userId: user.id } });
  if (!profile) { console.log(`No dating profile found for ${phone}`); return; }

  const [likes, passes] = await Promise.all([
    prisma.datingLike.deleteMany({ where: { fromId: profile.id } }),
    prisma.datingPass.deleteMany({ where: { fromId: profile.id } }),
  ]);

  console.log(`Cleared ${likes.count} likes and ${passes.count} passes for ${profile.displayName}.`);
  console.log("Discover will now show previously-seen profiles again.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
