// PROJO GROUP — Admin Controller
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const [totalUsers, totalDrivers, totalRides, totalDeliveries, completedRides, pendingDeliveries] =
      await Promise.all([
        prisma.user.count({ where: { role: "PASSENGER" } }),
        prisma.user.count({ where: { role: "DRIVER" } }),
        prisma.ride.count(),
        prisma.delivery.count(),
        prisma.ride.count({ where: { status: "COMPLETED" } }),
        prisma.delivery.count({ where: { status: "PENDING" } }),
      ]);

    const revenueResult = await prisma.ride.aggregate({
      _sum: { totalFare: true },
      where: { status: "COMPLETED" },
    });
    const deliveryRevenue = await prisma.delivery.aggregate({
      _sum: { fare: true },
    });

    const totalRevenue = (revenueResult._sum.totalFare || 0) + (deliveryRevenue._sum.fare || 0);

    res.json({
      stats: {
        totalUsers,
        totalDrivers,
        totalRides,
        totalDeliveries,
        completedRides,
        pendingDeliveries,
        totalRevenue: totalRevenue.toFixed(2),
        driverEarnings: (totalRevenue * 0.8).toFixed(2),
        projoCommission: (totalRevenue * 0.2).toFixed(2),
      },
    });
  } catch (err) {
    console.error("[PROJO Admin] stats error:", err.message);
    res.status(500).json({ error: "Could not load stats" });
  }
};

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { wallet: true },
    });
    const total = await prisma.user.count();
    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: "Could not load users" });
  }
};

// GET /api/admin/drivers
exports.getDrivers = async (req, res) => {
  try {
    const drivers = await prisma.user.findMany({
      where: { role: "DRIVER" },
      orderBy: { createdAt: "desc" },
      include: { wallet: true },
    });
    res.json({ drivers });
  } catch (err) {
    res.status(500).json({ error: "Could not load drivers" });
  }
};

// GET /api/admin/rides
exports.getAllRides = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const rides = await prisma.ride.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    const total = await prisma.ride.count();
    res.json({ rides, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: "Could not load rides" });
  }
};

// GET /api/admin/deliveries
exports.getAllDeliveries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const deliveries = await prisma.delivery.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    const total = await prisma.delivery.count();
    res.json({ deliveries, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: "Could not load deliveries" });
  }
};

// PUT /api/admin/users/:id/status
exports.updateUserStatus = async (req, res) => {
  const { status } = req.body;
  if (!["ACTIVE", "SUSPENDED", "BANNED", "PENDING_VERIFICATION"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ message: "User status updated", user });
  } catch (err) {
    res.status(500).json({ error: "Could not update user" });
  }
};

// PUT /api/admin/rides/:id/status
exports.updateRideStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const ride = await prisma.ride.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ message: "Ride status updated", ride });
  } catch (err) {
    res.status(500).json({ error: "Could not update ride" });
  }
};

// PUT /api/admin/deliveries/:id/status
exports.updateDeliveryStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const delivery = await prisma.delivery.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ message: "Delivery status updated", delivery });
  } catch (err) {
    res.status(500).json({ error: "Could not update delivery" });
  }
};

// GET /api/admin/products
exports.getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: "Could not load products" });
  }
};

// POST /api/admin/products
exports.createProduct = async (req, res) => {
  const { name, description, category, priceZar } = req.body;
  try {
    const product = await prisma.product.create({
      data: { name, description, category, priceZar: parseFloat(priceZar) || 0, isActive: true },
    });
    res.status(201).json({ message: "Product created", product });
  } catch (err) {
    res.status(500).json({ error: "Could not create product" });
  }
};

// PUT /api/admin/products/:id
exports.updateProduct = async (req, res) => {
  const { name, description, category, priceZar, isActive } = req.body;
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { name, description, category, priceZar: parseFloat(priceZar), isActive },
    });
    res.json({ message: "Product updated", product });
  } catch (err) {
    res.status(500).json({ error: "Could not update product" });
  }
};

// DELETE /api/admin/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: "Could not delete product" });
  }
};

// GET /api/admin/export/emails — export all user emails to Excel (MailerLite format)
exports.exportEmailsExcel = async (req, res) => {
  try {
    const ExcelJS = require("exceljs");

    const users = await prisma.user.findMany({
      where: { email: { not: null }, status: { not: "SUSPENDED" } },
      select: {
        name: true, email: true, phone: true,
        role: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = "PROJO GROUP";
    wb.created = new Date();

    const ws = wb.addWorksheet("PROJO Subscribers");

    // MailerLite-compatible columns
    ws.columns = [
      { header: "Email",      key: "email",     width: 35 },
      { header: "Name",       key: "name",      width: 25 },
      { header: "Phone",      key: "phone",     width: 18 },
      { header: "Role",       key: "role",      width: 12 },
      { header: "Signup Date",key: "date",      width: 20 },
    ];

    // Style header row
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FF1A0808" }, size: 11 };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8B84B" } };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 22;

    // Add data
    users.forEach(u => {
      const row = ws.addRow({
        email: u.email,
        name:  u.name,
        phone: u.phone,
        role:  u.role,
        date:  u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-ZA") : "",
      });
      row.font = { size: 10 };
    });

    // Totals row
    ws.addRow([]);
    const totalRow = ws.addRow([`Total Subscribers: ${users.length}`]);
    totalRow.font = { bold: true, size: 10, color: { argb: "FFC49A2F" } };

    // Set response headers for download
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=PROJO_Subscribers_${new Date().toISOString().slice(0,10)}.xlsx`);

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("[PROJO Admin] Export error:", err.message);
    res.status(500).json({ error: "Could not export emails: " + err.message });
  }
};
