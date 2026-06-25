// PROJO GROUP — Seed Products (Prisma version)
// Run from backend folder: node seedproducts.js

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const products = [
  { name: "Standard Cleaning", category: "Cleaning", priceZar: 0, description: "Standard home or office cleaning service. Contact us for a quote based on your property size.", isActive: true },
  { name: "Deep Clean", category: "Cleaning", priceZar: 0, description: "Thorough deep cleaning service for homes and offices. Includes all surfaces, appliances and more.", isActive: true },
  { name: "Guest House / AirBnb Cleaning", category: "Cleaning", priceZar: 0, description: "Professional cleaning for guest houses and AirBnb properties. Quick turnaround between guests.", isActive: true },
  { name: "Move In/Out Cleaning", category: "Cleaning", priceZar: 0, description: "Complete cleaning service for moving in or moving out. Leave the property spotless.", isActive: true },
  { name: "Carpet/Upholstery Cleaning", category: "Cleaning", priceZar: 0, description: "Professional carpet and upholstery cleaning. Removes stains, odours and bacteria.", isActive: true },
  { name: "Maintenance Booking / Enquiry", category: "Maintenance", priceZar: 350, description: "Call out fee R350. Includes expenses, an hour, and any minor fixes or emergency call outs.", isActive: true },
  { name: "Painting Services", category: "Painting", priceZar: 28, description: "Professional painting from R28/sqm. Price is Paint and Labour included.", isActive: true },
  { name: "Pest Control - Request For Quotes", category: "Pest Control", priceZar: 0, description: "Fumigation and Spray (2 Treatments) R1000. Once Off R950. Spray Only R800. Turnaround 12-24 hours.", isActive: true },
  { name: "Website Development", category: "Web & App Development", priceZar: 2200, description: "Small Business from R2200. Professional from R5700. E-Commerce from R2700. Domain R200/year, Hosting R800/year.", isActive: true },
  { name: "Mobile App Development", category: "Web & App Development", priceZar: 2100, description: "Web-to-App from R2100. E-Commerce and Retail from R3250. Custom Apps from R2800. Cross-platform solutions.", isActive: true },
  { name: "Personal Shopper", category: "Runners & Deliveries", priceZar: 60, description: "Base delivery fee R60. Shopping service fee 12% of total till slip. Same day after payment confirmation.", isActive: true },
  { name: "Deliveries (Fast, Reliable & Secure)", category: "Runners & Deliveries", priceZar: 60, description: "R60 flat rate within Rustenburg. After hour bookings available. Click and Collect also available.", isActive: true },
];

async function seed() {
  try {
    const result = await prisma.product.createMany({
      data: products,
      skipDuplicates: true,
    });
    console.log("✅ Done:", result.count, "products added to database!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
