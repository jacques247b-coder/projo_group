require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fix() {
  try {
    const product = await prisma.product.findFirst({
      where: { name: "Maintenance Booking / Enquiry" },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        description: "Call out fee R450. Includes expenses, an hour, and any minor fixes or emergency call outs. For emergencies contact us directly on Call or WhatsApp.",
      },
    });
    console.log("✅ Description updated to R450");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
fix();
