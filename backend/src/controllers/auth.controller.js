// ============================================================
// PROJO GROUP — Auth Controller
// Register, OTP, Login, JWT — SA phone numbers (+27)
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
// Works for both new AND existing users
// Returns isNewUser so frontend knows whether to collect name/role
exports.sendOTP = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { phone } = req.body;
  try {
    let user = await prisma.user.findUnique({ where: { phone } });
    const isNewUser = !user;

    if (!user) {
      // Create a placeholder user so OTP can be stored
      user = await prisma.user.create({
        data: {
          phone,
          name: "PROJO User",   // updated after OTP verify
          role: "PASSENGER",
          status: "PENDING_VERIFICATION",
        },
      });
      // Create wallet immediately
      await prisma.wallet.create({
        data: { userId: user.id, balanceZar: 0, loyaltyPoints: 0 },
      });
    }

    const otp = generateOTP();
    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otp, otpExpiresAt: getOTPExpiry() },
    });
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

    if (user.otpCode !== otp)
      return res.status(400).json({ error: "Incorrect OTP code" });
    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt)
      return res.status(400).json({ error: "OTP has expired. Request a new one." });

    // If new user, update their name and role
    const updateData = {
      status: "ACTIVE",
      otpCode: null,
      otpExpiresAt: null,
      lastLoginAt: new Date(),
    };
    if (name) updateData.name = name.trim();
    if (role && ["PASSENGER", "DRIVER"].includes(role)) updateData.role = role;

    await prisma.user.update({ where: { id: user.id }, data: updateData });

    // If registering as driver, create driver profile
    if (role === "DRIVER") {
      const existing = await prisma.driver.findUnique({ where: { userId: user.id } });
      if (!existing) {
        await prisma.driver.create({
          data: { userId: user.id, approvalStatus: "PENDING", status: "OFFLINE" },
        });
      }
    }

    const token = signToken(user.id);
    const refreshToken = signRefresh(user.id);

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { wallet: true, driverProfile: true },
    });

    res.json({
      message: "Verified successfully. Welcome to PROJO GROUP!",
      token,
      refreshToken,
      user: sanitizeUser(fullUser),
    });
  } catch (err) {
    console.error("[PROJO Auth] verifyOTP error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
};

// ── POST /api/auth/register ──────────────────────────────────
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { phone, name, role = "PASSENGER", referralCode } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing && existing.status !== "PENDING_VERIFICATION") {
      return res.status(409).json({ error: "Phone number already registered" });
    }

    let referredById = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode } });
      if (referrer) referredById = referrer.id;
    }

    const user = existing
      ? await prisma.user.update({ where: { id: existing.id },
          data: { name: name.trim(), role: role === "DRIVER" ? "DRIVER" : "PASSENGER", referredById } })
      : await prisma.user.create({
          data: { phone, name: name.trim(), role: role === "DRIVER" ? "DRIVER" : "PASSENGER",
            status: "PENDING_VERIFICATION", referredById },
        });

    // Wallet with referral bonus
    const walletExists = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!walletExists) {
      await prisma.wallet.create({
        data: { userId: user.id, balanceZar: referredById ? 50.0 : 0, loyaltyPoints: 0 },
      });
    }

    if (referredById) {
      await prisma.wallet.update({
        where: { userId: referredById },
        data: { balanceZar: { increment: 50 } },
      });
    }

    const otp = generateOTP();
    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otp, otpExpiresAt: getOTPExpiry() },
    });
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
    const user = await prisma.user.findUnique({ where: { phone },
      include: { wallet: true, driverProfile: true } });
    if (!user) return res.status(401).json({ error: "Phone number not found" });
    if (user.status === "BANNED") return res.status(403).json({ error: "Account banned" });

    if (password && user.passwordHash) {
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(401).json({ error: "Incorrect password" });
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      const token = signToken(user.id);
      const refreshToken = signRefresh(user.id);
      return res.json({ token, refreshToken, user: sanitizeUser(user) });
    }

    // Passwordless OTP flow
    const otp = generateOTP();
    await prisma.user.update({ where: { id: user.id },
      data: { otpCode: otp, otpExpiresAt: getOTPExpiry() } });
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
  await prisma.user.update({ where: { id: req.user.id }, data: { fcmToken: null } }).catch(() => {});
  res.json({ message: "Logged out successfully" });
};

// ── GET /api/auth/me ─────────────────────────────────────────
exports.getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { wallet: true, driverProfile: true },
  });
  res.json({ user: sanitizeUser(user) });
};

function sanitizeUser(user) {
  const { passwordHash, otpCode, otpExpiresAt, ...safe } = user;
  return safe;
}
