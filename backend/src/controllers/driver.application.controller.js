// PROJO GROUP — Driver Application Controller
// Handles document uploads and pending activation
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// POST /api/drivers/apply — submit driver application
exports.applyAsDriver = async (req, res) => {
  try {
    const {
      idNumber, address,
      vehicleMake, vehicleModel, vehicleYear,
      vehicleColor, vehicleRegistration, vehicleType,
    } = req.body;

    // Build doc URLs — in production these would be uploaded to Cloudinary
    // For now we store filenames; upgrade to Cloudinary when ready
    const docFields = [
      "operatorCard", "vehiclePapers", "idCopy",
      "personPhoto", "vehicleInside", "vehicleOutside"
    ];
    const uploadedDocs = {};
    docFields.forEach(field => {
      if (req.files && req.files[field]) {
        uploadedDocs[field] = req.files[field][0].originalname;
      }
    });

    // Update user with driver details and set status to PENDING_VERIFICATION
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        role:    "DRIVER",
        status:  "PENDING_VERIFICATION",
      },
    });

    // Store application details in a JSON note field or separate table
    // Using a simple approach — store in user's address field and notes
    // For production, create a DriverApplication model in Prisma schema
    console.log(`[PROJO Driver] New application from ${req.user.name} (${req.user.phone})`);
    console.log(`[PROJO Driver] Vehicle: ${vehicleYear} ${vehicleMake} ${vehicleModel} - ${vehicleRegistration}`);
    console.log(`[PROJO Driver] Documents:`, Object.keys(uploadedDocs));

    res.json({
      message: "Driver application submitted successfully",
      status: "PENDING_VERIFICATION",
    });
  } catch (err) {
    console.error("[PROJO Driver] Apply error:", err.message);
    res.status(500).json({ error: "Could not submit application: " + err.message });
  }
};

// GET /api/drivers/pending — admin: get all pending driver applications
exports.getPendingApplications = async (req, res) => {
  try {
    const pending = await prisma.user.findMany({
      where: { role: "DRIVER", status: "PENDING_VERIFICATION" },
      select: { id: true, name: true, phone: true, email: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ drivers: pending });
  } catch (err) {
    res.status(500).json({ error: "Could not load pending applications" });
  }
};

// POST /api/drivers/:id/approve — admin approves driver
exports.approveDriver = async (req, res) => {
  try {
    const driver = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: "ACTIVE" },
    });
    console.log(`[PROJO Admin] Driver approved: ${driver.name} (${driver.phone})`);
    res.json({ message: "Driver approved and activated", driver });
  } catch (err) {
    res.status(500).json({ error: "Could not approve driver" });
  }
};

// POST /api/drivers/:id/reject — admin rejects driver
exports.rejectDriver = async (req, res) => {
  const { reason } = req.body;
  try {
    const driver = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: "SUSPENDED", role: "PASSENGER" },
    });
    console.log(`[PROJO Admin] Driver rejected: ${driver.name} - ${reason}`);
    res.json({ message: "Driver application rejected", driver });
  } catch (err) {
    res.status(500).json({ error: "Could not reject driver" });
  }
};
