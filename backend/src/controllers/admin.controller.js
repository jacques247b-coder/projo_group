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

// POST /api/admin/push/broadcast — send push notification to all or targeted users
exports.broadcastPush = async (req, res) => {
  try {
    const { title, body, icon, url, target, role } = req.body;
    // target: "all" | "passengers" | "drivers"

    if (!title || !body) return res.status(400).json({ error: "Title and body required" });

    const { sendPushNotification } = require("../services/push.service");

    // Filter users based on target
    let whereClause = { pushSubscription: { not: null } };
    if (target === "passengers") whereClause.role = "PASSENGER";
    if (target === "drivers")    whereClause.role = "DRIVER";

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { id: true, name: true, pushSubscription: true },
    });

    const payload = {
      title,
      body,
      icon: icon || "/assets/logo/PROJO_LOGO.png",
      badge: "/assets/logo/PROJO_LOGO.png",
      image: req.body.image || null,  // base64 or URL
      data: { url: url || "/home", image: req.body.image || null },
    };

    let sent = 0, failed = 0;
    for (const user of users) {
      try {
        const subscription = JSON.parse(user.pushSubscription);
        await sendPushNotification(subscription, payload);
        sent++;
      } catch {
        failed++;
        // Remove expired subscriptions
        await prisma.user.update({
          where: { id: user.id },
          data: { pushSubscription: null },
        }).catch(() => {});
      }
    }

    // Log notification in DB
    await prisma.notification.createMany({
      data: users.map(u => ({
        userId: u.id,
        title,
        body,
        type: "BROADCAST",
      })),
      skipDuplicates: true,
    }).catch(() => {});

    console.log(`[PROJO Push] Broadcast: ${sent} sent, ${failed} failed`);
    res.json({
      message: `Notification sent to ${sent} device${sent !== 1 ? "s" : ""}`,
      sent, failed, total: users.length,
    });
  } catch (err) {
    console.error("[PROJO Push] Broadcast error:", err.message);
    res.status(500).json({ error: "Could not send notification: " + err.message });
  }
};

// GET /api/admin/push/stats — get push subscription stats
exports.pushStats = async (req, res) => {
  try {
    const total = await prisma.user.count({ where: { pushSubscription: { not: null } } });
    const passengers = await prisma.user.count({ where: { pushSubscription: { not: null }, role: "PASSENGER" } });
    const drivers = await prisma.user.count({ where: { pushSubscription: { not: null }, role: "DRIVER" } });
    res.json({ total, passengers, drivers });
  } catch {
    res.status(500).json({ error: "Could not get stats" });
  }
};

// GET /api/admin/analytics — comprehensive business growth data
exports.getAnalytics = async (req, res) => {
  try {
    const { period = "30" } = req.query;
    const days = parseInt(period);
    const now = new Date();
    const startDate = new Date(now - days * 24 * 60 * 60 * 1000);
    const prevStart = new Date(startDate - days * 24 * 60 * 60 * 1000);

    // ── Revenue & Rides ──────────────────────────────────────
    const [rides, prevRides, deliveries, prevDeliveries, serviceOrders, users, newUsers] = await Promise.all([
      prisma.ride.findMany({
        where: { createdAt: { gte: startDate }, status: "COMPLETED" },
        select: { totalFare: true, createdAt: true, paidWithWallet: true },
      }),
      prisma.ride.findMany({
        where: { createdAt: { gte: prevStart, lt: startDate }, status: "COMPLETED" },
        select: { totalFare: true },
      }),
      prisma.delivery.findMany({
        where: { createdAt: { gte: startDate }, status: "DELIVERED" },
        select: { fare: true, createdAt: true },
      }),
      prisma.delivery.findMany({
        where: { createdAt: { gte: prevStart, lt: startDate }, status: "DELIVERED" },
        select: { fare: true },
      }),
      prisma.serviceOrder.findMany({
        where: { createdAt: { gte: startDate }, status: "COMPLETED" },
        select: { finalPrice: true, createdAt: true, category: true },
      }).catch(() => []),
      prisma.user.count({ where: { role: "PASSENGER" } }),
      prisma.user.count({ where: { createdAt: { gte: startDate } } }),
    ]);

    // ── Revenue calculations ─────────────────────────────────
    const rideRevenue = rides.reduce((s, r) => s + (r.totalFare || 0), 0);
    const deliveryRevenue = deliveries.reduce((s, d) => s + (d.fare || 60), 0);
    const serviceRevenue = serviceOrders.reduce((s, o) => s + (o.finalPrice || 0), 0);
    const totalRevenue = rideRevenue + deliveryRevenue + serviceRevenue;

    const prevRideRevenue = prevRides.reduce((s, r) => s + (r.totalFare || 0), 0);
    const prevDeliveryRevenue = prevDeliveries.reduce((s, d) => s + (d.fare || 60), 0);
    const prevTotalRevenue = prevRideRevenue + prevDeliveryRevenue;

    // PROJO share (80/20 split on rides)
    const projoRideShare = rideRevenue * 0.2;
    const projoDeliveryShare = deliveryRevenue * 0.2;
    const projoServiceShare = serviceRevenue * 0.3;
    const totalProjoRevenue = projoRideShare + projoDeliveryShare + projoServiceShare + serviceRevenue;

    // Growth %
    const revenueGrowth = prevTotalRevenue > 0
      ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue * 100).toFixed(1)
      : 100;

    // ── Daily revenue for chart (last N days) ────────────────
    const dailyData = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayStr = day.toLocaleDateString("en-ZA", { day: "2-digit", month: "short" });
      const dayRides = rides.filter(r => new Date(r.createdAt).toDateString() === day.toDateString());
      const dayDeliveries = deliveries.filter(d => new Date(d.createdAt).toDateString() === day.toDateString());
      const dayServices = serviceOrders.filter(o => new Date(o.createdAt).toDateString() === day.toDateString());
      dailyData.push({
        date: dayStr,
        rides: dayRides.reduce((s, r) => s + (r.totalFare || 0), 0),
        deliveries: dayDeliveries.reduce((s, d) => s + (d.fare || 60), 0),
        services: dayServices.reduce((s, o) => s + (o.finalPrice || 0), 0),
        total: dayRides.reduce((s, r) => s + (r.totalFare || 0), 0) +
               dayDeliveries.reduce((s, d) => s + (d.fare || 60), 0) +
               dayServices.reduce((s, o) => s + (o.finalPrice || 0), 0),
      });
    }

    // ── Revenue by category ──────────────────────────────────
    const categoryRevenue = {};
    serviceOrders.forEach(o => {
      categoryRevenue[o.category] = (categoryRevenue[o.category] || 0) + (o.finalPrice || 0);
    });

    // ── Payment method split ─────────────────────────────────
    const walletRides = rides.filter(r => r.paidWithWallet).length;
    const cashRides = rides.length - walletRides;

    // ── Drivers & active stats ───────────────────────────────
    const [totalDrivers, onlineDrivers, totalRidesAll, cancelledRides] = await Promise.all([
      prisma.user.count({ where: { role: "DRIVER", status: "ACTIVE" } }),
      prisma.user.count({ where: { role: "DRIVER", driverStatus: "ONLINE" } }).catch(() => 0),
      prisma.ride.count({ where: { createdAt: { gte: startDate } } }),
      prisma.ride.count({ where: { createdAt: { gte: startDate }, status: "CANCELLED" } }),
    ]);

    const completionRate = totalRidesAll > 0
      ? ((rides.length / totalRidesAll) * 100).toFixed(1)
      : 0;

    const avgFare = rides.length > 0
      ? (rideRevenue / rides.length).toFixed(2)
      : 0;

    // ── Products stats ──────────────────────────────────────
    const productOrders = await prisma.serviceOrder.findMany({
      where: { createdAt: { gte: startDate }, category: "Products" },
      select: { productName: true, finalPrice: true, createdAt: true, status: true },
    }).catch(() => []);

    // Top selling products
    const productSales = {};
    productOrders.forEach(o => {
      if (!productSales[o.productName]) productSales[o.productName] = { name: o.productName, orders: 0, revenue: 0 };
      productSales[o.productName].orders++;
      productSales[o.productName].revenue += o.finalPrice || 0;
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Product inventory
    const lowStockProducts = await prisma.product.findMany({
      where: { isActive: true, trackInventory: true, stockQty: { lte: 5 } },
      select: { name: true, category: true, stockQty: true, priceZar: true },
    }).catch(() => []);

    const totalProducts = await prisma.product.count({ where: { isActive: true } }).catch(() => 0);
    const productRevenue = productOrders.reduce((s, o) => s + (o.finalPrice || 0), 0);

    res.json({
      period: days,
      summary: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        projoRevenue: parseFloat(totalProjoRevenue.toFixed(2)),
        rideRevenue: parseFloat(rideRevenue.toFixed(2)),
        deliveryRevenue: parseFloat(deliveryRevenue.toFixed(2)),
        serviceRevenue: parseFloat(serviceRevenue.toFixed(2)),
        revenueGrowth: parseFloat(revenueGrowth),
        totalRides: rides.length,
        totalDeliveries: deliveries.length,
        totalServices: serviceOrders.length,
        newUsers,
        totalUsers: users,
        totalDrivers,
        onlineDrivers,
        avgFare: parseFloat(avgFare),
        completionRate: parseFloat(completionRate),
        walletRides,
        cashRides,
        cancelledRides,
        totalProducts,
        productOrders: productOrders.length,
        productRevenue: parseFloat(productRevenue.toFixed(2)),
      },
      dailyData,
      categoryRevenue,
      topProducts,
      lowStockProducts,
    });
  } catch (err) {
    console.error("[PROJO Analytics]", err.message);
    res.status(500).json({ error: "Could not load analytics" });
  }
};

// GET /api/admin/analytics/export — download full report as Excel
exports.exportAnalytics = async (req, res) => {
  try {
    const ExcelJS = require("exceljs");
    const { period = "30" } = req.query;
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [rides, deliveries, users] = await Promise.all([
      prisma.ride.findMany({
        where: { createdAt: { gte: startDate } },
        select: { totalFare: true, status: true, createdAt: true, paidWithWallet: true, pickupAddress: true, dropoffAddress: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.delivery.findMany({
        where: { createdAt: { gte: startDate } },
        select: { fare: true, status: true, createdAt: true, description: true, trackingNumber: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { name: true, phone: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const wb = new ExcelJS.Workbook();
    wb.creator = "PROJO GROUP";
    wb.created = new Date();

    const GOLD = "FFE8B84B";
    const DARK = "FF1A0808";

    function styleHeader(row) {
      row.font = { bold: true, color: { argb: DARK }, size: 11 };
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } };
      row.alignment = { horizontal: "center", vertical: "middle" };
      row.height = 22;
    }

    // ── Summary Sheet ────────────────────────────────────────
    const ws1 = wb.addWorksheet("Summary");
    ws1.columns = [{ width: 30 }, { width: 20 }];
    styleHeader(ws1.addRow(["PROJO GROUP — Business Report", `Last ${days} Days`]));
    ws1.addRow([]);
    const completedRides = rides.filter(r => r.status === "COMPLETED");
    const completedDeliveries = deliveries.filter(d => d.status === "DELIVERED");
    const rideRev = completedRides.reduce((s, r) => s + (r.totalFare || 0), 0);
    const delRev = completedDeliveries.reduce((s, d) => s + (d.fare || 60), 0);
    [
      ["Total Revenue", `R${(rideRev + delRev).toFixed(2)}`],
      ["PROJO Share (20%)", `R${((rideRev + delRev) * 0.2).toFixed(2)}`],
      ["Ride Revenue", `R${rideRev.toFixed(2)}`],
      ["Delivery Revenue", `R${delRev.toFixed(2)}`],
      ["Completed Rides", completedRides.length],
      ["Completed Deliveries", completedDeliveries.length],
      ["Total Trips", rides.length + deliveries.length],
      ["Cancelled Rides", rides.filter(r => r.status === "CANCELLED").length],
      ["New Customers", users.filter(u => u.role === "PASSENGER").length],
      ["New Drivers", users.filter(u => u.role === "DRIVER").length],
      ["Avg Fare", `R${completedRides.length > 0 ? (rideRev / completedRides.length).toFixed(2) : "0"}`],
      ["Wallet Payments", rides.filter(r => r.paidWithWallet).length],
      ["Cash Payments", rides.filter(r => !r.paidWithWallet).length],
    ].forEach(([k, v]) => ws1.addRow([k, v]));

    // ── Rides Sheet ──────────────────────────────────────────
    const ws2 = wb.addWorksheet("Rides");
    ws2.columns = [
      { header: "Date", key: "date", width: 18 },
      { header: "Pickup", key: "pickup", width: 30 },
      { header: "Dropoff", key: "dropoff", width: 30 },
      { header: "Fare (R)", key: "fare", width: 12 },
      { header: "Status", key: "status", width: 15 },
      { header: "Payment", key: "payment", width: 15 },
    ];
    styleHeader(ws2.getRow(1));
    rides.forEach(r => ws2.addRow({
      date: new Date(r.createdAt).toLocaleDateString("en-ZA"),
      pickup: r.pickupAddress,
      dropoff: r.dropoffAddress,
      fare: r.totalFare || 0,
      status: r.status,
      payment: r.paidWithWallet ? "Wallet" : "Cash",
    }));

    // ── Deliveries Sheet ─────────────────────────────────────
    const ws3 = wb.addWorksheet("Deliveries");
    ws3.columns = [
      { header: "Date", key: "date", width: 18 },
      { header: "Tracking #", key: "tracking", width: 20 },
      { header: "Item", key: "item", width: 25 },
      { header: "Fare (R)", key: "fare", width: 12 },
      { header: "Status", key: "status", width: 15 },
    ];
    styleHeader(ws3.getRow(1));
    deliveries.forEach(d => ws3.addRow({
      date: new Date(d.createdAt).toLocaleDateString("en-ZA"),
      tracking: d.trackingNumber,
      item: d.description,
      fare: d.fare || 60,
      status: d.status,
    }));

    // ── New Users Sheet ──────────────────────────────────────
    const ws4 = wb.addWorksheet("New Users");
    ws4.columns = [
      { header: "Name", key: "name", width: 25 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Role", key: "role", width: 12 },
      { header: "Joined", key: "joined", width: 18 },
    ];
    styleHeader(ws4.getRow(1));
    users.forEach(u => ws4.addRow({
      name: u.name,
      phone: u.phone,
      role: u.role,
      joined: new Date(u.createdAt).toLocaleDateString("en-ZA"),
    }));

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=PROJO_Analytics_${days}days_${new Date().toISOString().slice(0,10)}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("[PROJO Analytics Export]", err.message);
    res.status(500).json({ error: "Could not export: " + err.message });
  }
};

// POST /api/admin/rides/:id/mark-paid — admin marks ride as paid + sends paid invoice
exports.markRidePaid = async (req, res) => {
  try {
    const ride = await prisma.ride.findUnique({
      where: { id: req.params.id },
      include: { passenger: true },
    });
    if (!ride) return res.status(404).json({ error: "Ride not found" });

    // Generate paid invoice
    const { generateAndSendInvoice } = require("../services/invoice.service");
    const result = await generateAndSendInvoice({
      type: "ride",
      data: { ...ride, isPaid: true, paymentConfirmedAt: new Date() },
      user: ride.passenger,
      paid: true,
    });

    res.json({ message: `Paid invoice sent to ${ride.passenger?.email || "customer"}`, invoiceNumber: result?.invoiceNumber });
  } catch (err) {
    res.status(500).json({ error: "Could not mark as paid: " + err.message });
  }
};

// POST /api/admin/deliveries/:id/mark-paid
exports.markDeliveryPaid = async (req, res) => {
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
      include: { sender: true },
    });
    if (!delivery) return res.status(404).json({ error: "Delivery not found" });

    const { generateAndSendInvoice } = require("../services/invoice.service");
    const result = await generateAndSendInvoice({
      type: "delivery",
      data: { ...delivery, isPaid: true },
      user: delivery.sender,
      paid: true,
    });

    res.json({ message: `Paid invoice sent`, invoiceNumber: result?.invoiceNumber });
  } catch (err) {
    res.status(500).json({ error: "Could not mark as paid: " + err.message });
  }
};

// POST /api/admin/service-orders/:id/mark-paid
exports.markServicePaid = async (req, res) => {
  try {
    const order = await prisma.serviceOrder.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const { generateAndSendInvoice } = require("../services/invoice.service");
    const result = await generateAndSendInvoice({
      type: "service",
      data: { ...order, isPaid: true },
      user: order.user,
      paid: true,
    });

    res.json({ message: `Paid invoice sent`, invoiceNumber: result?.invoiceNumber });
  } catch (err) {
    res.status(500).json({ error: "Could not mark as paid: " + err.message });
  }
};

// ── ENTERTAINMENT / LOCAL ADS ────────────────────────────────
exports.adminGetAds = async (req, res) => {
  try {
    const ads = await prisma.localAd.findMany({
      orderBy: { createdAt: "desc" },
      include: { submittedBy: { select: { name: true, phone: true } } },
    });
    res.json({ ads });
  } catch { res.status(500).json({ error: "Could not load ads" }); }
};

exports.adminUpdateAd = async (req, res) => {
  try {
    const { status } = req.body;
    const ad = await prisma.localAd.update({ where: { id: req.params.id }, data: { status } });
    res.json({ message: `Ad ${status.toLowerCase()}`, ad });
  } catch { res.status(500).json({ error: "Could not update ad" }); }
};

exports.adminCreateAd = async (req, res) => {
  try {
    const { businessName, category, offer, description, phone, website } = req.body;
    const ad = await prisma.localAd.create({
      data: { businessName, category: category || "Other", offer, description: description || "", phone: phone || "", website: website || "", submittedById: req.user.id, status: "APPROVED" },
    });
    res.json({ message: "Ad created", ad });
  } catch { res.status(500).json({ error: "Could not create ad" }); }
};

exports.adminDeleteAd = async (req, res) => {
  try {
    await prisma.localAd.delete({ where: { id: req.params.id } });
    res.json({ message: "Ad deleted" });
  } catch { res.status(500).json({ error: "Could not delete ad" }); }
};
