// PROJO GROUP — Entertainment Controller
// Handles local business ads (submit, approve, list)
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET /api/entertainment/ads — get approved ads
exports.getAds = async (req, res) => {
  try {
    const ads = await prisma.localAd.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    });
    res.json({ ads });
  } catch (err) {
    res.status(500).json({ error: "Could not load ads" });
  }
};

// POST /api/entertainment/ads — submit new ad
exports.submitAd = async (req, res) => {
  try {
    const { businessName, category, offer, description, phone, website } = req.body;
    if (!businessName || !offer) return res.status(400).json({ error: "Business name and offer required" });

    const ad = await prisma.localAd.create({
      data: {
        businessName, category, offer,
        description: description || "",
        phone: phone || "",
        website: website || "",
        submittedById: req.user.id,
        status: "PENDING",
      },
    });

    // Notify admin via WhatsApp
    try {
      const { sendWhatsAppNotification } = require("../services/whatsapp.service");
      await sendWhatsAppNotification(
        `🏪 NEW AD SUBMISSION — PROJO ENTERTAINMENT\n\n` +
        `Business: ${businessName}\n` +
        `Category: ${category}\n` +
        `Offer: ${offer}\n` +
        `Phone: ${phone || "N/A"}\n\n` +
        `Login to admin to approve: app.projogroup.co.za/admin`
      );
    } catch {}

    res.json({ message: "Ad submitted for approval", ad });
  } catch (err) {
    res.status(500).json({ error: "Could not submit ad" });
  }
};

// GET /api/admin/entertainment/ads — get all ads for admin
exports.adminGetAds = async (req, res) => {
  try {
    const ads = await prisma.localAd.findMany({
      orderBy: { createdAt: "desc" },
      include: { submittedBy: { select: { name: true, phone: true } } },
    });
    res.json({ ads });
  } catch (err) {
    res.status(500).json({ error: "Could not load ads" });
  }
};

// PUT /api/admin/entertainment/ads/:id — approve or reject
exports.adminUpdateAd = async (req, res) => {
  try {
    const { status } = req.body;
    const ad = await prisma.localAd.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ message: `Ad ${status.toLowerCase()}`, ad });
  } catch (err) {
    res.status(500).json({ error: "Could not update ad" });
  }
};

// POST /api/admin/entertainment/ads — admin adds ad directly (approved immediately)
exports.adminCreateAd = async (req, res) => {
  try {
    const { businessName, category, offer, description, phone, website } = req.body;
    const ad = await prisma.localAd.create({
      data: {
        businessName, category: category || "Other", offer,
        description: description || "",
        phone: phone || "",
        website: website || "",
        submittedById: req.user.id,
        status: "APPROVED",
      },
    });
    res.json({ message: "Ad created and approved", ad });
  } catch (err) {
    res.status(500).json({ error: "Could not create ad" });
  }
};

// DELETE /api/admin/entertainment/ads/:id
exports.adminDeleteAd = async (req, res) => {
  try {
    await prisma.localAd.delete({ where: { id: req.params.id } });
    res.json({ message: "Ad deleted" });
  } catch (err) {
    res.status(500).json({ error: "Could not delete ad" });
  }
};

// ── CLASSIFIEDS ──────────────────────────────────────────────

// GET /api/entertainment/classifieds
exports.getClassifieds = async (req, res) => {
  try {
    const { category, search } = req.query;
    const where = { status: "ACTIVE" };
    if (category && category !== "All") where.category = category;
    if (search) where.title = { contains: search, mode: "insensitive" };
    const classifieds = await prisma.classified.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    });
    res.json({ classifieds });
  } catch (err) { res.status(500).json({ error: "Could not load classifieds" }); }
};

// POST /api/entertainment/classifieds
exports.postClassified = async (req, res) => {
  try {
    const { title, description, category, price, location, phone, mediaData, mediaType } = req.body;
    if (!title || !description) return res.status(400).json({ error: "Title and description required" });
    const classified = await prisma.classified.create({
      data: { title, description, category: category || "General", price: price || "", location: location || "", phone: phone || "", mediaData: mediaData || null, mediaType: mediaType || "", userId: req.user.id, status: "ACTIVE" },
    });
    res.json({ message: "Ad posted!", classified });
  } catch (err) { res.status(500).json({ error: "Could not post classified" }); }
};

// PUT /api/entertainment/classifieds/:id/mark-sold
exports.markSold = async (req, res) => {
  try {
    const classified = await prisma.classified.findUnique({ where: { id: req.params.id } });
    if (!classified) return res.status(404).json({ error: "Ad not found" });
    if (classified.userId !== req.user.id && req.user.role !== "ADMIN") return res.status(403).json({ error: "Not authorized" });
    await prisma.classified.update({ where: { id: req.params.id }, data: { status: "SOLD" } });
    res.json({ message: "Marked as sold" });
  } catch (err) { res.status(500).json({ error: "Could not update" }); }
};

// DELETE /api/entertainment/classifieds/:id
exports.deleteClassified = async (req, res) => {
  try {
    const classified = await prisma.classified.findUnique({ where: { id: req.params.id } });
    if (!classified) return res.status(404).json({ error: "Ad not found" });
    if (classified.userId !== req.user.id && req.user.role !== "ADMIN") return res.status(403).json({ error: "Not authorized" });
    await prisma.classified.delete({ where: { id: req.params.id } });
    res.json({ message: "Ad deleted" });
  } catch (err) { res.status(500).json({ error: "Could not delete" }); }
};

// GET /api/entertainment/classifieds/mine
exports.myClassifieds = async (req, res) => {
  try {
    const classifieds = await prisma.classified.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ classifieds });
  } catch (err) { res.status(500).json({ error: "Could not load your ads" }); }
};
