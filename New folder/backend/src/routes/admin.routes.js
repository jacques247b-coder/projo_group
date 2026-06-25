// PROJO GROUP — Admin Routes
const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth.middleware");
const admin = require("../controllers/admin.controller");

// All routes require ADMIN role
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

module.exports = router;
