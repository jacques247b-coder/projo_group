// PROJO GROUP — Driver Application Controller
// Handles document uploads and pending activation
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// POST /api/drivers/apply — submit driver application
exports.applyAsDriver = async (req, res) => {
  try {
    const {
      idNumber,
      vehicleMake, vehicleModel, vehicleYear,
      vehicleColor, vehicleRegistration, vehicleType,
      documents,
    } = req.body;

    // Update user with driver details and set status to PENDING_VERIFICATION.
    // Previously only role/status were saved here — idNumber and every
    // vehicle field were silently dropped despite the frontend sending
    // them correctly and the schema already having columns for them.
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        role: "DRIVER",
        status: "PENDING_VERIFICATION",
        idNumber: idNumber || undefined,
        vehicleMake: vehicleMake || undefined,
        vehicleModel: vehicleModel || undefined,
        vehicleYear: vehicleYear || undefined,
        vehicleColor: vehicleColor || undefined,
        vehicleRegistration: vehicleRegistration || undefined,
        vehicleType: vehicleType || undefined,
      },
    });

    // Save each uploaded document. Previously this looked for req.files
    // (multer's format) — but no multer middleware was ever configured on
    // this route, so req.files was always undefined and NOTHING was ever
    // saved, regardless of what the driver actually uploaded. The frontend
    // already sends real base64 data in req.body.documents; store each one
    // in the DriverDocument table (already existed in the schema, just
    // never actually used anywhere).
    const uploadedDocs = {};
    if (documents && typeof documents === "object") {
      for (const [docType, dataUrl] of Object.entries(documents)) {
        if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) continue;
        // Replace any existing document of this type (e.g. a resubmission)
        // rather than accumulating duplicates
        await prisma.driverDocument.deleteMany({ where: { userId: req.user.id, docType } });
        await prisma.driverDocument.create({ data: { userId: req.user.id, docType, dataUrl } });
        uploadedDocs[docType] = true;
      }
    }

    console.log(`[PROJO Driver] New application from ${req.user.name} (${req.user.phone})`);
    console.log(`[PROJO Driver] Vehicle: ${vehicleYear} ${vehicleMake} ${vehicleModel} - ${vehicleRegistration}`);
    console.log(`[PROJO Driver] Documents saved:`, Object.keys(uploadedDocs));

    // Send WhatsApp notification to PROJO admin
    const uploadedDocsList = Object.keys(uploadedDocs).length > 0
      ? Object.keys(uploadedDocs).join(", ")
      : "No documents uploaded yet";

    const missingDocs = ["operatorCard","vehiclePapers","idCopy","personPhoto","vehicleInside","vehicleOutside"]
      .filter(d => !uploadedDocs[d]);

    const waMsg = encodeURIComponent(
      `🚗 *NEW DRIVER APPLICATION — PROJO GROUP*\n\n` +
      `*Name:* ${req.user.name}\n` +
      `*Phone:* ${req.user.phone}\n` +
      `*Email:* ${req.user.email || "N/A"}\n\n` +
      `*Vehicle:* ${vehicleYear} ${vehicleMake} ${vehicleModel}\n` +
      `*Color:* ${vehicleColor}\n` +
      `*Registration:* ${vehicleRegistration}\n` +
      `*Type:* ${vehicleType}\n\n` +
      `*Docs Uploaded:* ${uploadedDocsList}\n` +
      (missingDocs.length > 0 ? `*Missing Docs:* ${missingDocs.join(", ")}\n` : "") +
      `\n📱 Review in Admin Panel: app.projogroup.co.za/admin`
    );

    const ADMIN_WHATSAPP = "27766147386";
    const waUrl = `https://api.whatsapp.com/send?phone=${ADMIN_WHATSAPP}&text=${waMsg}`;

    // Use node-fetch or https to send — for now log the URL for manual use
    // In production integrate with WhatsApp Business API
    console.log(`[PROJO Driver] WhatsApp notification URL: ${waUrl}`);

    // Try to send via fetch if available
    try {
      const https = require("https");
      const fetch = (...args) => import("node-fetch").then(({default: f}) => f(...args));
      // Note: Direct WhatsApp API requires approved WhatsApp Business API account
      // For now we notify via Resend email as backup
      const { Resend } = require("resend");
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "noreply@projogroup.co.za",
          to: "jacquesb247@gmail.com",
          subject: `🚗 New Driver Application — ${req.user.name}`,
          html: `
            <h2>New Driver Application</h2>
            <p><strong>Name:</strong> ${req.user.name}</p>
            <p><strong>Phone:</strong> ${req.user.phone}</p>
            <p><strong>Email:</strong> ${req.user.email || "N/A"}</p>
            <hr/>
            <p><strong>Vehicle:</strong> ${vehicleYear} ${vehicleMake} ${vehicleModel}</p>
            <p><strong>Color:</strong> ${vehicleColor}</p>
            <p><strong>Registration:</strong> ${vehicleRegistration}</p>
            <p><strong>Type:</strong> ${vehicleType}</p>
            <hr/>
            <p><strong>Docs Uploaded:</strong> ${uploadedDocsList}</p>
            ${missingDocs.length > 0 ? `<p><strong>Missing Docs:</strong> ${missingDocs.join(", ")}</p>` : ""}
            <hr/>
            <p><a href="https://app.projogroup.co.za/admin">Review in Admin Panel</a></p>
          `,
        });
        console.log(`[PROJO Driver] Email notification sent`);
      }
    } catch (notifyErr) {
      console.log(`[PROJO Driver] Notification error (non-fatal):`, notifyErr.message);
    }

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
      data: { status: "ACTIVE", role: "DRIVER" },
    });
    console.log(`[PROJO Admin] Driver approved: ${driver.name} (${driver.phone})`);

    // Notify driver via Socket.io — triggers auto-redirect on their device
    const io = req.app.get("io");
    if (io) {
      io.to(`driver_pending:${driver.id}`).emit("driver:approved", {
        message: "Your driver application has been approved! Welcome to PROJO GROUP.",
        driverId: driver.id,
      });
    }

    // Send approval WhatsApp via CallMeBot
    try {
      const { sendWhatsAppNotification } = require("../services/whatsapp.service");
      await sendWhatsAppNotification(
        `✅ *DRIVER APPROVED — PROJO GROUP*

` +
        `Congratulations ${driver.name}!
` +
        `Your driver application has been approved.
` +
        `Open the PROJO app to start driving.

` +
        `app.projogroup.co.za`
      );
    } catch (e) { console.log("[PROJO Driver] Approval notification failed:", e.message); }

    // Send approval email
    try {
      const { Resend } = require("resend");
      if (process.env.RESEND_API_KEY && driver.email) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "noreply@projogroup.co.za",
          to: driver.email,
          subject: "✅ Your PROJO Driver Application is Approved!",
          html: `
            <h2>Welcome to PROJO GROUP, ${driver.name}!</h2>
            <p>Your driver application has been approved. You can now log in and start accepting rides.</p>
            <p><a href="https://app.projogroup.co.za">Open PROJO App</a></p>
          `,
        });
      }
    } catch (e) { console.log("[PROJO Driver] Email failed:", e.message); }

    res.json({ message: "Driver approved and activated", driver });
  } catch (err) {
    console.error("[PROJO Driver] Approve error:", err.message);
    res.status(500).json({ error: "Could not approve driver: " + err.message });
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
