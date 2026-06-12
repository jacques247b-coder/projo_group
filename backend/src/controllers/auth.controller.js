// PROJO GROUP — Auth Controller (Debug version)
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { generateOTP, getOTPExpiry } = require("../services/otp.service");

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

async function sendEmail(email, otp, name) {
  console.log(`[PROJO EMAIL] Attempting to send OTP to ${email}`);
  console.log(`[PROJO EMAIL] GMAIL_USER: ${process.env.GMAIL_USER ? "SET" : "NOT SET"}`);
  console.log(`[PROJO EMAIL] GMAIL_APP_PASSWORD: ${process.env.GMAIL_APP_PASSWORD ? "SET" : "NOT SET"}`);
  
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log(`[PROJO EMAIL] DEV MODE - OTP for ${email}: ${otp}`);
    return;
  }
  
  try {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    
    await transporter.sendMail({
      from: `"PROJO GROUP" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your PROJO GROUP Verification Code",
      html: `
        <div style="background:#0d0505;padding:40px;font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
          <h1 style="color:#e8b84b;text-align:center;">PROJO GROUP</h1>
          <div style="background:#120808;border:1px solid rgba(232,184,75,0.2);border-radius:16px;padding:32px;text-align:center;">
            <p style="color:#b8a09a;font-size:16px;">${name ? `Hi ${name},` : "Hi there,"}<br/>Your verification code is:</p>
            <div style="background:#1c0f0f;border:2px solid #e8b84b;border-radius:12px;padding:20px;margin:16px 0;">
              <span style="font-size:42px;font-weight:800;color:#e8b84b;letter-spacing:12px;">${otp}</span>
            </div>
            <p style="color:#7a5a55;font-size:14px;">Expires in 10 minutes</p>
          </div>
          <p style="color:#3d1a1a;font-size:11px;text-align:center;margin-top:24px;">
            © PROJO GROUP · Rustenburg · <a href="https://wa.me/27766147986" style="color:#e8b84b;">WhatsApp</a>
          </p>
        </div>
      `,
    });
    console.log(`[PROJO EMAIL] ✅ OTP sent successfully to ${email}`);
  } catch (err) {
    console.error(`[PROJO EMAIL] ❌ Failed to send email: ${err.message}`);
    console.log(`[PROJO EMAIL] Fallback OTP for ${email}: ${otp}`);
  }
}

// Send OTP
exports.sendOTP = async (req, res) => {
  console.log("[PROJO Auth] sendOTP called with:", { phone: req.body.phone, email: req.body.email });
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
      user = await prisma.user.update({ where: { id: user.id }, data: { email } });
    }

    const otp = generateOTP();
    await prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiresAt: getOTPExpiry() } });

    const contactEmail = email || user.email;
    if (contactEmail) {
      await sendEmail(contactEmail, otp, user.name);
      res.json({ message: `OTP sent to ${contactEmail}`, isNewUser, phone, via: "email" });
    } else {
      const { sendOTPSms } = require("../services/otp.service");
      await sendOTPSms(phone, otp);
      res.json({ message: "OTP sent to your phone", isNewUser, phone, via: "sms" });
    }
  } catch (err) {
    console.error("[PROJO Auth] sendOTP error:", err.message);
    console.error("[PROJO Auth] sendOTP stack:", err.stack);
    res.status(500).json({ error: "Failed to send OTP: " + err.message });
  }
};

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
        data: { phone, name: name.trim(), role: role === "DRIVER" ? "DRIVER" : "PASSENGER", status: "PENDING_VERIFICATION", email: email || null },
      });
      await prisma.wallet.create({ data: { userId: user.id, balanceZar: 0 } });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: name.trim(), role: role === "DRIVER" ? "DRIVER" : "PASSENGER", email: email || user.email }
      });
    }
    const otp = generateOTP();
    await prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiresAt: getOTPExpiry() } });
    const contactEmail = email || user.email;
    if (contactEmail) {
      await sendEmail(contactEmail, otp, name);
      res.status(201).json({ message: `OTP sent to ${contactEmail}`, userId: user.id, phone, via: "email" });
    } else {
      const { sendOTPSms } = require("../services/otp.service");
      await sendOTPSms(phone, otp);
      res.status(201).json({ message: "OTP sent to your phone", userId: user.id, phone, via: "sms" });
    }
  } catch (err) {
    console.error("[PROJO Auth] register error:", err.message);
    res.status(500).json({ error: "Registration failed: " + err.message });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  const { phone, otp, name, role, email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.otpCode !== otp) return res.status(400).json({ error: "Incorrect OTP code" });
    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) return res.status(400).json({ error: "OTP expired" });
    const updateData = { status: "ACTIVE", otpCode: null, otpExpiresAt: null, lastLoginAt: new Date() };
    if (name) updateData.name = name.trim();
    if (role && ["PASSENGER", "DRIVER"].includes(role)) updateData.role = role;
    if (email) updateData.email = email;
    await prisma.user.update({ where: { id: user.id }, data: updateData });
    const fullUser = await prisma.user.findUnique({ where: { id: user.id }, include: { wallet: true } });
    res.json({ message: "Welcome to PROJO GROUP!", token: signToken(user.id), refreshToken: signRefresh(user.id), user: sanitizeUser(fullUser) });
  } catch (err) {
    console.error("[PROJO Auth] verifyOTP error:", err.message);
    res.status(500).json({ error: "Verification failed: " + err.message });
  }
};

exports.login = async (req, res) => {
  const { phone, email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { phone }, include: { wallet: true } });
    if (!user) return res.status(401).json({ error: "Phone number not found. Please register first." });
    const otp = generateOTP();
    await prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiresAt: getOTPExpiry() } });
    const contactEmail = email || user.email;
    if (contactEmail) {
      await sendEmail(contactEmail, otp, user.name);
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

exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: "No refresh token" });
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    res.json({ token: signToken(decoded.userId) });
  } catch { res.status(401).json({ error: "Invalid refresh token" }); }
};

exports.logout = async (req, res) => res.json({ message: "Logged out successfully" });

exports.getMe = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { wallet: true } });
  res.json({ user: sanitizeUser(user) });
};
