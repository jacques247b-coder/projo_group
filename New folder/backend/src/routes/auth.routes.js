// PROJO GROUP — Auth Routes (Email OTP)
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const auth = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.post("/register", [
  body("phone").matches(/^\+27[0-9]{9}$/).withMessage("Use SA format: +27xxxxxxxxx"),
  body("name").notEmpty().trim().withMessage("Name required"),
], auth.register);

router.post("/send-otp", [
  body("phone").matches(/^\+27[0-9]{9}$/).withMessage("Use SA format: +27xxxxxxxxx"),
], auth.sendOTP);

router.post("/verify-otp", [
  body("phone").matches(/^\+27[0-9]{9}$/),
  body("otp").isLength({ min: 6, max: 6 }),
], auth.verifyOTP);

router.post("/login", auth.login);
router.post("/refresh", auth.refresh);
router.post("/logout", authenticate, auth.logout);
router.get("/me", authenticate, auth.getMe);

module.exports = router;
