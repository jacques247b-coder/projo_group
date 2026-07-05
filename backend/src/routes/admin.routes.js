// PROJO GROUP — Admin Routes (Updated with product options management)
const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth.middleware");
const admin = require("../controllers/admin.controller");
const promo = require("../controllers/promo.controller");
const service = require("../controllers/service.controller");
const options = require("../controllers/productOptions.controller");

router.use(authenticate, requireRole("ADMIN"));

router.get("/stats", admin.getStats);
router.get("/users", admin.getUsers);
router.get("/drivers", admin.getDrivers);
router.get("/rides", admin.getAllRides);
router.get("/deliveries", admin.getAllDeliveries);

router.put("/users/:id/status", admin.updateUserStatus);
router.put("/rides/:id/status", admin.updateRideStatus);
router.put("/deliveries/:id/status", admin.updateDeliveryStatus);

router.get("/products", admin.getProducts);
router.post("/products", admin.createProduct);
router.put("/products/:id", admin.updateProduct);
router.delete("/products/:id", admin.deleteProduct);

// Promo codes
router.get("/promo-codes", promo.getAllCodes);
router.post("/promo-codes", promo.createCode);
router.put("/promo-codes/:id", promo.updateCode);
router.delete("/promo-codes/:id", promo.deleteCode);

// Service orders
router.get("/service-orders", service.getAllOrders);

// Email export for MailerLite
router.get("/export/emails", admin.exportEmailsExcel);

// Mark as paid + send paid invoice
router.post("/rides/:id/mark-paid",          admin.markRidePaid);
router.post("/deliveries/:id/mark-paid",     admin.markDeliveryPaid);
router.post("/service-orders/:id/mark-paid", admin.markServicePaid);

// Business analytics
router.get("/analytics",        admin.getAnalytics);
router.get("/analytics/export", admin.exportAnalytics);

// Entertainment / Local Ads
router.get("/entertainment/ads",        admin.adminGetAds);
router.put("/entertainment/ads/:id",    admin.adminUpdateAd);
router.post("/entertainment/ads",       admin.adminCreateAd);
router.delete("/entertainment/ads/:id", admin.adminDeleteAd);

// Push notifications
router.post("/push/broadcast", admin.broadcastPush);
router.get("/push/stats",      admin.pushStats);
router.put("/service-orders/:id/status", service.updateOrderStatus);

// Product options (configurable pricing)
router.get("/products/:productId/options", options.getOptionsForAdmin);
router.post("/products/:productId/option-groups", options.createOptionGroup);
router.put("/option-groups/:id", options.updateOptionGroup);
router.delete("/option-groups/:id", options.deleteOptionGroup);
router.post("/option-groups/:groupId/choices", options.createChoice);
router.put("/choices/:id", options.updateChoice);
router.delete("/choices/:id", options.deleteChoice);

module.exports = router;
