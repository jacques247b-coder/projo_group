// PROJO GROUP — Auth Controller (Resend Email OTP)
// SECURITY FIX: Added OTP brute-force protection + attempt tracking
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { generateOTP, getOTPExpiry } = require("../services/otp.service");

const prisma = new PrismaClient();

// ─── OTP Brute-Force Protection ─────────────────────────────────────────────
// In-memory store (use Redis in production for multi-instance support)
const otpAttempts = new Map(); // key: phone, value: { count, firstAttempt, lockedUntil }

const MAX_OTP_ATTEMPTS = 5;       // max wrong attempts before lockout
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;   // reset attempt count after 10 min

function checkOTPRateLimit(phone) {
  const now = Date.now();
  const record = otpAttempts.get(phone);

  if (!record) return { allowed: true };

  // Locked out?
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingMs = record.lockedUntil - now;
    const remainingMin = Math.ceil(remainingMs / 60000);
    return { allowed: false, lockedFor: remainingMin };
  }

  // Reset if window has passed
  if (now - record.firstAttempt > ATTEMPT_WINDOW_MS) {
    otpAttempts.delete(phone);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordFailedOTPAttempt(phone) {
  const now = Date.now();
  const record = otpAttempts.get(phone) || { count: 0, firstAttempt: now };

  record.count += 1;

  if (record.count >= MAX_OTP_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    console.warn(`[PROJO SECURITY] OTP lockout triggered for phone: ${phone}`);
  }

  otpAttempts.set(phone, record);
}

function clearOTPAttempts(phone) {
  otpAttempts.delete(phone);
}

// ─── Token Helpers ───────────────────────────────────────────────────────────
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

// ─── Email via Resend ────────────────────────────────────────────────────────
async function sendOTPEmail(email, otp, name = "", retries = 2) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  if (!apiKey) {
    console.log(`[PROJO EMAIL] DEV MODE - OTP for ${email}: ${otp}`);
    return;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        from: `PROJO GROUP <${fromEmail}>`,
        to: [email],
        subject: "Your PROJO GROUP Verification Code",
        html: `
          <div style="background:#0d0505;padding:40px;font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
            <h1 style="color:#e8b84b;text-align:center;letter-spacing:2px;">PROJO GROUP</h1>
            <p style="color:#7a5a55;text-align:center;font-size:12px;">Rustenburg's Own. Ride. Shop. Deliver & Services.</p>
            <div style="background:#120808;border:1px solid rgba(232,184,75,0.2);border-radius:16px;padding:32px;text-align:center;margin:24px 0;">
              <p style="color:#b8a09a;font-size:16px;">${name ? `Hi ${name},` : "Hi there,"}<br/>Your verification code is:</p>
              <div style="background:#1c0f0f;border:2px solid #e8b84b;border-radius:12px;padding:20px;margin:16px 0;">
                <span style="font-size:42px;font-weight:800;color:#e8b84b;letter-spacing:12px;">${otp}</span>
              </div>
              <p style="color:#7a5a55;font-size:14px;">This code expires in <strong style="color:#e8b84b;">10 minutes</strong></p>
            </div>
            <div style="background:#120808;border:1px solid rgba(139,26,26,0.3);border-radius:12px;padding:16px;margin-bottom:24px;">
              <p style="color:#b8a09a;font-size:13px;margin:0;line-height:1.6;">
                🚗 <strong style="color:#e8b84b;">R60 flat rate</strong> rides within Rustenburg<br/>
                📦 Same-day deliveries available<br/>
                🛍️ Book all services directly in the app
              </p>
            </div>
            <p style="color:#3d1a1a;font-size:11px;text-align:center;">
              © PROJO GROUP · Rustenburg · <a href="https://wa.me/27766147986" style="color:#e8b84b;">WhatsApp: +27 76 614 7986</a>
            </p>
          </div>
        `,
      }),
    });

      const data = await response.json();
      if (response.ok) {
        console.log(`[PROJO EMAIL] ✅ OTP sent to ${email} via Resend (attempt ${attempt})`);
        return; // Success — exit retry loop
      } else {
        console.error(`[PROJO EMAIL] ❌ Resend error (attempt ${attempt}):`, data);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * attempt)); // wait 1s then 2s
          continue;
        }
        throw new Error(`Resend failed after ${retries} attempts: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      console.error(`[PROJO EMAIL] ❌ Failed (attempt ${attempt}): ${err.message}`);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }
      throw err; // Re-throw on final attempt so caller gets the error
    }
  }
}

// ─── Send OTP ────────────────────────────────────────────────────────────────
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

// ─── Register ────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { phone, name, role = "PASSENGER", email } = req.body;
  try {
    let user = await prisma.user.findUnique({ where: { phone } });
    if (user && user.status !== "PENDING_VERIFICATION") {
      return res.status(409).json({ error: "Phone number already registered. Please sign in." });
    }
    // Same conflict this could hit: an email already tied to a different
    // account (e.g. an earlier abandoned signup with a different/typo'd
    // phone number, using this same email).
    if (email) {
      const emailOwner = await prisma.user.findUnique({ where: { email } });
      if (emailOwner && emailOwner.id !== user?.id) {
        return res.status(409).json({ error: "That email is already registered to another account. Try signing in instead, or use a different email." });
      }
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
      await sendOTPEmail(contactEmail, otp, name);
      res.status(201).json({ message: `OTP sent to ${contactEmail}`, userId: user.id, phone, via: "email" });
    } else {
      const { sendOTPSms } = require("../services/otp.service");
      await sendOTPSms(phone, otp);
      res.status(201).json({ message: "OTP sent to your phone", userId: user.id, phone, via: "sms" });
    }
  } catch (err) {
    console.error("[PROJO Auth] register error:", err.message);
    if (err.code === "P2002") {
      const field = err.meta?.target?.[0] || "a field";
      return res.status(409).json({ error: `That ${field} is already in use by another account.` });
    }
    res.status(500).json({ error: "Registration failed — please try again." });
  }
};

// ─── Verify OTP — SECURITY FIX: Rate limiting + lockout ─────────────────────
exports.verifyOTP = async (req, res) => {
  const { phone, otp, name, role, email } = req.body;

  // Check lockout BEFORE hitting the database
  const rateCheck = checkOTPRateLimit(phone);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: `Too many incorrect attempts. Try again in ${rateCheck.lockedFor} minute(s).`
    });
  }

  try {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Wrong OTP — record the failed attempt
    if (user.otpCode !== otp) {
      recordFailedOTPAttempt(phone);
      const record = otpAttempts.get(phone);
      const attemptsLeft = MAX_OTP_ATTEMPTS - (record?.count || 0);
      return res.status(400).json({
        error: "Incorrect OTP code",
        attemptsLeft: Math.max(0, attemptsLeft)
      });
    }

    // OTP expired
    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
      return res.status(400).json({ error: "OTP expired. Please request a new one." });
    }

    // ✅ Success — clear the attempt counter
    clearOTPAttempts(phone);

    // Check for an email conflict BEFORE attempting the update — this is
    // exactly what was crashing with a raw, user-facing database error
    // ("Unique constraint failed on the fields: (`email`)") whenever
    // someone re-registered with an email already tied to a different
    // account (e.g. an earlier abandoned signup attempt with a typo'd
    // phone number, using the same email).
    if (email) {
      const emailOwner = await prisma.user.findUnique({ where: { email } });
      if (emailOwner && emailOwner.id !== user.id) {
        return res.status(409).json({ error: "That email is already registered to another account. Try signing in instead, or use a different email." });
      }
    }

    const updateData = { status: "ACTIVE", otpCode: null, otpExpiresAt: null, lastLoginAt: new Date() };
    if (name) updateData.name = name.trim();
    if (role && ["PASSENGER", "DRIVER"].includes(role)) updateData.role = role;
    if (email) updateData.email = email;
    await prisma.user.update({ where: { id: user.id }, data: updateData });
    const fullUser = await prisma.user.findUnique({ where: { id: user.id }, include: { wallet: true } });
    res.json({
      message: "Welcome to PROJO GROUP!",
      token: signToken(user.id),
      refreshToken: signRefresh(user.id),
      user: sanitizeUser(fullUser)
    });
  } catch (err) {
    console.error("[PROJO Auth] verifyOTP error:", err.message);
    // Never leak raw database errors to the user (e.g. "Invalid
    // prisma.user.update() invocation..."). Translate the common case
    // (a unique constraint conflict) into something actionable; anything
    // else gets a generic, safe message.
    if (err.code === "P2002") {
      const field = err.meta?.target?.[0] || "a field";
      return res.status(409).json({ error: `That ${field} is already in use by another account.` });
    }
    res.status(500).json({ error: "Verification failed — please try again." });
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
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

// ─── Refresh Token ───────────────────────────────────────────────────────────
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
