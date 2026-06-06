// ============================================================
// PROJO GROUP — Auth Controller (Fixed)
// Removed referredById from register — not in simplified schema
// ============================================================
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { generateOTP, sendOTPSms, getOTPExpiry } = require("../services/otp.service");

const prisma = new PrismaClient();

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}
function signRefresh(userId) {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  });
}

// ── POST /api/auth/send-otp ──────────────────────────────────
exports.sendOTP = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { phone } = req.body;
  try {
    let user = await prisma.user.findUnique({ where: { phone } });
    const isNewUser = !user;
    if (!user) {
      user = await prisma.user.create({
        data: { phone, name: "PROJO User", role: "PASSENGER", status: "PENDING_VERIFICATION" },
      });
      await prisma.wallet.create({ data: { userId: user.id, balanceZar: 0, loyaltyPoints: 0 } });
    }
    const otp = generateOTP();
    await prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiresAt: getOTPExpiry() } });
    await sendOTPSms(phone, otp);
    res.json({ message: `OTP sent to ${phone}`, isNewUser, phone });
  } catch (err) {
    console.error("[PROJO Auth] sendOTP error:", err);
    res.status(500).json({ error: err.message || "Failed to send OTP" });
  }
};

// ── POST /api/auth/verify-otp ────────────────────────────────
exports.verifyOTP = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { phone, otp, name, role } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.otpCode !== otp) return res.status(400).json({ error: "Incorrect OTP code" });
    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt)
      return res.status(400).json({ error: "OTP has expired. Request a new one." });

    const updateData = { status: "ACTIVE", otpCode: null, otpExpiresAt: null, lastLoginAt: new Date() };
    if (name) updateData.name = name.trim();
    if (role && ["PASSENGER", "DRIVER"].includes(role)) updateData.role = role;
    await prisma.user.update({ where: { id: user.id }, data: updateData });

    const token = signToken(user.id);
    const refreshToken = signRefresh(user.id);
    const fullUser = await prisma.user.findUnique({ where: { id: user.id }, include: { wallet: true } });
    res.json({ message: "Verified successfully. Welcome to PROJO GROUP!", token, refreshToken, user: sanitizeUser(fullUser) });
  } catch (err) {
    console.error("[PROJO Auth] verifyOTP error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
};

// ── POST /api/auth/register ──────────────────────────────────
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { phone, name, role = "PASSENGER" } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing && existing.status !== "PENDING_VERIFICATION") {
      return res.status(409).json({ error: "Phone number already registered" });
    }

    const user = existing
      ? await prisma.user.update({ where: { id: existing.id },
          data: { name: name.trim(), role: role === "DRIVER" ? "DRIVER" : "PASSENGER" } })
      : await prisma.user.create({
          data: { phone, name: name.trim(), role: role === "DRIVER" ? "DRIVER" : "PASSENGER", status: "PENDING_VERIFICATION" },
        });

    const walletExists = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!walletExists) {
      await prisma.wallet.create({ data: { userId: user.id, balanceZar: 0, loyaltyPoints: 0 } });
    }

    const otp = generateOTP();
    await prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiresAt: getOTPExpiry() } });
    await sendOTPSms(phone, otp);

    res.status(201).json({ message: "OTP sent. Verify your phone.", userId: user.id, phone });
  } catch (err) {
    console.error("[PROJO Auth] register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
};

// ── POST /api/auth/login ─────────────────────────────────────
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { phone, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { phone }, include: { wallet: true } });
    if (!user) return res.status(401).json({ error: "Phone number not found" });
    if (user.status === "BANNED") return res.status(403).json({ error: "Account banned" });

    if (password && user.passwordHash) {
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(401).json({ error: "Incorrect password" });
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      return res.json({ token: signToken(user.id), refreshToken: signRefresh(user.id), user: sanitizeUser(user) });
    }

    const otp = generateOTP();
    await prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiresAt: getOTPExpiry() } });
    await sendOTPSms(phone, otp);
    res.json({ requiresOTP: true, message: "OTP sent to your phone", isNewUser: false });
  } catch (err) {
    console.error("[PROJO Auth] login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};

// ── POST /api/auth/refresh ───────────────────────────────────
exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: "No refresh token" });
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ error: "User not found" });
    res.json({ token: signToken(user.id) });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

// ── POST /api/auth/logout ────────────────────────────────────
exports.logout = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};

// ── GET /api/auth/me ─────────────────────────────────────────
exports.getMe = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { wallet: true } });
  res.json({ user: sanitizeUser(user) });
};

function sanitizeUser(user) {
  const { passwordHash, otpCode, otpExpiresAt, ...safe } = user;
  return safe;
}
