// ============================================================
// PROJO GROUP — Auth Routes
// Phone-first auth with SMS OTP (South Africa +27)
// ============================================================

const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
const rateLimit = require("express-rate-limit");

// Rate limit OTP requests (prevent abuse)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: "Too many OTP requests. Try again in 15 minutes." },
});

// ── POST /api/auth/register ───────────────────────────────────
// Register new user (passenger or driver)
router.post(
  "/register",
  [
    body("phone")
      .matches(/^\+27[0-9]{9}$/)
      .withMessage("Phone must be in South African format: +27xxxxxxxxx"),
    body("name").notEmpty().trim().isLength({ min: 2 }).withMessage("Name required"),
    body("role")
      .optional()
      .isIn(["PASSENGER", "DRIVER"])
      .withMessage("Invalid role"),
  ],
  authController.register
);

// ── POST /api/auth/send-otp ───────────────────────────────────
// Send SMS OTP to a SA phone number
router.post(
  "/send-otp",
  otpLimiter,
  [
    body("phone")
      .matches(/^\+27[0-9]{9}$/)
      .withMessage("Phone must be in South African format: +27xxxxxxxxx"),
  ],
  authController.sendOTP
);

// ── POST /api/auth/verify-otp ────────────────────────────────
// Verify OTP and issue JWT
router.post(
  "/verify-otp",
  [
    body("phone").matches(/^\+27[0-9]{9}$/).withMessage("Invalid phone"),
    body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),
  ],
  authController.verifyOTP
);

// ── POST /api/auth/login ──────────────────────────────────────
// Login with phone + password (optional — some users only use OTP)
router.post(
  "/login",
  [
    body("phone").matches(/^\+27[0-9]{9}$/).withMessage("Invalid phone"),
    body("password").optional().isLength({ min: 6 }),
  ],
  authController.login
);

// ── POST /api/auth/refresh ────────────────────────────────────
router.post("/refresh", authController.refresh);

// ── POST /api/auth/logout ─────────────────────────────────────
router.post("/logout", authenticate, authController.logout);

// ── GET /api/auth/me ─────────────────────────────────────────
// Get current user profile
router.get("/me", authenticate, authController.getMe);

module.exports = router;
