const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { generateOTP, sendOTPSms, getOTPExpiry } = require("../services/otp.service");

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
  const { phone, name, role = "PASSENGER" } = req.body;
  try {
    let user = await prisma.user.findUnique({ where: { phone } });
    if (user && user.status !== "PENDING_VERIFICATION") {
      return res.status(409).json({ error: "Phone number already registered. Please sign in." });
    }
    if (!user) {
      user = await prisma.user.create({
        data: { phone, name: name.trim(), role: role === "DRIVER" ? "DRIVER" : "PASSENGER", status: "PENDING_VERIFICATION" },
      });
      await prisma.wallet.create({ data: { userId: user.id, balanceZar: 0 } });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: name.trim(), role: role === "DRIVER" ? "DRIVER" : "PASSENGER" }
      });
    }
    const otp = generateOTP();
    await prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiresAt: getOTPExpiry() } });
    await sendOTPSms(phone, otp);
    res.status(201).json({ message: "OTP sent. Check your phone.", userId: user.id, phone });
  } catch (err) {
    console.error("[PROJO Auth] register error:", err.message);
    res.status(500).json({ error: "Registration failed: " + err.message });
  }
};

// Send OTP
exports.sendOTP = async (req, res) => {
  const { phone } = req.body;
  try {
    let user = await prisma.user.findUnique({ where: { phone } });
    const isNewUser = !user;
    if (!user) {
      user = await prisma.user.create({
        data: { phone, name: "PROJO User", role: "PASSENGER", status: "PENDING_VERIFICATION" }
      });
      await prisma.wallet.create({ data: { userId: user.id, balanceZar: 0 } });
    }
    const otp = generateOTP();
    await prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiresAt: getOTPExpiry() } });
    await sendOTPSms(phone, otp);
    res.json({ message: "OTP sent", isNewUser, phone });
  } catch (err) {
    console.error("[PROJO Auth] sendOTP error:", err.message);
    res.status(500).json({ error: "Failed to send OTP: " + err.message });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  const { phone, otp, name, role } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.otpCode !== otp) return res.status(400).json({ error: "Incorrect OTP" });
    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) return res.status(400).json({ error: "OTP expired" });
    const updateData = { status: "ACTIVE", otpCode: null, otpExpiresAt: null, lastLoginAt: new Date() };
    if (name) updateData.name = name.trim();
    if (role && ["PASSENGER", "DRIVER"].includes(role)) updateData.role = role;
    await prisma.user.update({ where: { id: user.id }, data: updateData });
    const fullUser = await prisma.user.findUnique({ where: { id: user.id }, include: { wallet: true } });
    res.json({ message: "Welcome to PROJO GROUP!", token: signToken(user.id), refreshToken: signRefresh(user.id), user: sanitizeUser(fullUser) });
  } catch (err) {
    console.error("[PROJO Auth] verifyOTP error:", err.message);
    res.status(500).json({ error: "Verification failed: " + err.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { phone } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { phone }, include: { wallet: true } });
    if (!user) return res.status(401).json({ error: "Phone number not found" });
    const otp = generateOTP();
    await prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiresAt: getOTPExpiry() } });
    await sendOTPSms(phone, otp);
    res.json({ requiresOTP: true, message: "OTP sent", isNewUser: false });
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

exports.logout = async (req, res) => res.json({ message: "Logged out" });

exports.getMe = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { wallet: true } });
  res.json({ user: sanitizeUser(user) });
};
