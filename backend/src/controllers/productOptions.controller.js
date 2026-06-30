// PROJO GROUP — Product Options Controller
// Admin: create/edit option groups and choices per service
// Customer: fetch product with all options for checkout
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET /api/shop/products/:id/options — public, used in checkout
exports.getProductOptions = async (req, res) => {
  try {
    const groups = await prisma.productOptionGroup.findMany({
      where: { productId: req.params.id },
      include: { choices: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    });
    res.json({ groups });
  } catch (err) {
    res.status(500).json({ error: "Could not load options" });
  }
};

// ── Admin endpoints ──────────────────────────────────────────

// POST /api/admin/products/:productId/option-groups
exports.createOptionGroup = async (req, res) => {
  const { name, type, required, sortOrder } = req.body;
  if (!name) return res.status(400).json({ error: "Group name required" });
  try {
    const group = await prisma.productOptionGroup.create({
      data: {
        productId: req.params.productId,
        name,
        type: type === "MULTI" ? "MULTI" : "SINGLE",
        required: !!required,
        sortOrder: sortOrder || 0,
      },
    });
    res.status(201).json({ group });
  } catch (err) {
    res.status(500).json({ error: "Could not create option group" });
  }
};

// PUT /api/admin/option-groups/:id
exports.updateOptionGroup = async (req, res) => {
  const { name, type, required, sortOrder } = req.body;
  try {
    const group = await prisma.productOptionGroup.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(required !== undefined && { required }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });
    res.json({ group });
  } catch (err) {
    res.status(500).json({ error: "Could not update option group" });
  }
};

// DELETE /api/admin/option-groups/:id
exports.deleteOptionGroup = async (req, res) => {
  try {
    await prisma.productOptionGroup.delete({ where: { id: req.params.id } });
    res.json({ message: "Option group deleted" });
  } catch (err) {
    res.status(500).json({ error: "Could not delete option group" });
  }
};

// POST /api/admin/option-groups/:groupId/choices
exports.createChoice = async (req, res) => {
  const { label, priceModifier, sortOrder } = req.body;
  if (!label) return res.status(400).json({ error: "Choice label required" });
  try {
    const choice = await prisma.productOptionChoice.create({
      data: {
        groupId: req.params.groupId,
        label,
        priceModifier: parseFloat(priceModifier) || 0,
        sortOrder: sortOrder || 0,
      },
    });
    res.status(201).json({ choice });
  } catch (err) {
    res.status(500).json({ error: "Could not create choice" });
  }
};

// PUT /api/admin/choices/:id
exports.updateChoice = async (req, res) => {
  const { label, priceModifier, sortOrder } = req.body;
  try {
    const choice = await prisma.productOptionChoice.update({
      where: { id: req.params.id },
      data: {
        ...(label !== undefined && { label }),
        ...(priceModifier !== undefined && { priceModifier: parseFloat(priceModifier) }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });
    res.json({ choice });
  } catch (err) {
    res.status(500).json({ error: "Could not update choice" });
  }
};

// DELETE /api/admin/choices/:id
exports.deleteChoice = async (req, res) => {
  try {
    await prisma.productOptionChoice.delete({ where: { id: req.params.id } });
    res.json({ message: "Choice deleted" });
  } catch (err) {
    res.status(500).json({ error: "Could not delete choice" });
  }
};

// GET /api/admin/products/:productId/options — admin view (same data, used in admin UI)
exports.getOptionsForAdmin = async (req, res) => {
  try {
    const groups = await prisma.productOptionGroup.findMany({
      where: { productId: req.params.productId },
      include: { choices: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    });
    res.json({ groups });
  } catch (err) {
    res.status(500).json({ error: "Could not load options" });
  }
};
