// ============================================================
// PROJO GROUP — Auth Controller
// Email OTP — free forever + collects emails for marketing
// ============================================================
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { generateOTP, getOTPExpiry } = require("../services/otp.service");
const { sendOTPEmail, sendWelcomeEmail } = require("../services/email.service");

const prisma = new PrismaClient();

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}
function signRefresh(userId) {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: "30d" });
}
function sanitizeUser(user) {
  const { passwordHash, otpCode, otpExpiresAt, ...safe } = user;
  return safe;
}

// Register
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { phone, name, role = "PASSENGER", email } = req.body;
  try {
    let user = await prisma.user.findUnique({ where: { phone } });
    if (user && user.status !== "PENDING_VERIFICATION") {
      return res.status(409).json({ error: "Phone number already registered. Please sign in." });
    }
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          name: name.trim(),
          role: role === "DRIVER" ? "DRIVER" : "PASSENGER",
          status: "PENDING_VERIFICATION",
          email: email || null,
        },
      });
      await prisma.wallet.create({ data: { userId: user.id, balanceZar: 0 } });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name.trim(),
          role: role === "DRIVER" ? "DRIVER" : "PASSENGER",
          email: email || user.email,
        }
      });
    }

    const otp = generateOTP();
    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otp, otpExpiresAt: getOTPExpiry() }
    });

    // Send OTP via email if provided, else via SMS fallback
    if (email) {
      await sendOTPEmail(email, otp, name);
      res.status(201).json({ message: `OTP sent to ${email}`, userId: user.id, phone, via: "email" });
    } else {
      // SMS fallback
      const { sendOTPSms } = require("../services/otp.service");
      await sendOTPSms(phone, otp);
      res.status(201).json({ message: "OTP sent to your phone", userId: user.id, phone, via: "sms" });
    }
  } catch (err) {
    console.error("[PROJO Auth] register error:", err.message);
    res.status(500).json({ error: "Registration failed: " + err.message });
  }
};

// Send OTP
exports.sendOTP = async (req, res) => {
  const { phone, email } = req.body;
  try {
    let user = await prisma.user.findUnique({ where: { phone } });
    const isNewUser = !user;
    if (!user) {
      user = await prisma.user.create({
        data: { phone, name: "PROJO User", role: "PASSENGER", status: "PENDING_VERIFICATION", email: email || null }
      });
      await prisma.wallet.create({ data: { userId: user.id, balanceZar: 0 } });
    } else if (email && !user.email) {
      // Update email if not set
      user = await prisma.user.update({ where: { id: user.id }, data: { email } });
    }

    const otp = generateOTP();
    await prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiresAt: getOTPExpiry() } });

    const contactEmail = email || user.email;
    if (contactEmail) {
      await sendOTPEmail(contactEmail, otp, user.name);
      res.json({ message: `OTP sent to ${contactEmail}`, isNewUser, phone, via: "email" });
    } else {
      const { sendOTPSms } = require("../services/otp.service");
      await sendOTPSms(phone, otp);
      res.json({ message: "OTP sent to your phone", isNewUser, phone, via: "sms" });
    }
  } catch (err) {
    console.error("[PROJO Auth] sendOTP error:", err.message);
    res.status(500).json({ error: "Failed to send OTP: " + err.message });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  const { phone, otp, name, role, email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.otpCode !== otp) return res.status(400).json({ error: "Incorrect OTP code" });
    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) return res.status(400).json({ error: "OTP expired. Request a new one." });

    const updateData = { status: "ACTIVE", otpCode: null, otpExpiresAt: null, lastLoginAt: new Date() };
    if (name) updateData.name = name.trim();
    if (role && ["PASSENGER", "DRIVER"].includes(role)) updateData.role = role;
    if (email) updateData.email = email;
    await prisma.user.update({ where: { id: user.id }, data: updateData });

    // Send welcome email to new users
    const isNewUser = user.status === "PENDING_VERIFICATION";
    const contactEmail = email || user.email;
    if (isNewUser && contactEmail) {
      sendWelcomeEmail(contactEmail, name || user.name).catch(() => {});
    }

    const fullUser = await prisma.user.findUnique({ where: { id: user.id }, include: { wallet: true } });
    res.json({
      message: "Welcome to PROJO GROUP!",
      token: signToken(user.id),
      refreshToken: signRefresh(user.id),
      user: sanitizeUser(fullUser)
    });
  } catch (err) {
    console.error("[PROJO Auth] verifyOTP error:", err.message);
    res.status(500).json({ error: "Verification failed: " + err.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { phone, email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { phone }, include: { wallet: true } });
    if (!user) return res.status(401).json({ error: "Phone number not found. Please register first." });

    const otp = generateOTP();
    await prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiresAt: getOTPExpiry() } });

    const contactEmail = email || user.email;
    if (contactEmail) {
      await sendOTPEmail(contactEmail, otp, user.name);
      res.json({ requiresOTP: true, message: `OTP sent to ${contactEmail}`, isNewUser: false, via: "email" });
    } else {
      const { sendOTPSms } = require("../services/otp.service");
      await sendOTPSms(phone, otp);
      res.json({ requiresOTP: true, message: "OTP sent to your phone", isNewUser: false, via: "sms" });
    }
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
};

// Refresh
exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: "No refresh token" });
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    res.json({ token: signToken(decoded.userId) });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

exports.logout = async (req, res) => res.json({ message: "Logged out successfully" });

exports.getMe = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { wallet: true } });
  res.json({ user: sanitizeUser(user) });
};
