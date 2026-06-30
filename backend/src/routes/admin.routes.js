// PROJO GROUP — Admin Routes (Updated with service orders)
const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth.middleware");
const admin = require("../controllers/admin.controller");
const promo = require("../controllers/promo.controller");
const service = require("../controllers/service.controller");

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
router.put("/service-orders/:id/status", service.updateOrderStatus);

module.exports = router;
