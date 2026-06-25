// ============================================================
// PROJO GROUP — Admin Routes (FIXED)
// FIX: Uses requireRole("ADMIN") from auth.middleware
//      (replaces the standalone requireAdmin.js from security fix)
// ============================================================
const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth.middleware");
const admin = require("../controllers/admin.controller");

// All admin routes require authentication AND ADMIN role
router.use(authenticate, requireRole("ADMIN"));

// Dashboard stats
router.get("/stats",       admin.getStats);

// Users
router.get("/users",               admin.getUsers);
router.put("/users/:id/status",    admin.updateUserStatus);

// Drivers
router.get("/drivers",             admin.getDrivers);

// Rides
router.get("/rides",               admin.getAllRides);
router.put("/rides/:id/status",    admin.updateRideStatus);

// Deliveries
router.get("/deliveries",          admin.getAllDeliveries);
router.put("/deliveries/:id/status", admin.updateDeliveryStatus);

// Products (admin manage)
router.get("/products",            admin.getProducts);
router.post("/products",           admin.createProduct);
router.put("/products/:id",        admin.updateProduct);
router.delete("/products/:id",     admin.deleteProduct);

module.exports = router;
