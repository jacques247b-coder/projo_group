// PROJO GROUP — Panic / Emergency Alert System
//
// IMPORTANT — read this before assuming any channel below is guaranteed:
// - SMS (Twilio): the most reliable channel here — works on any phone,
//   no app/internet needed on the recipient's end. Requires
//   TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_PHONE_NUMBER.
// - WhatsApp (Twilio): requires TWILIO_WHATSAPP_FROM + recipient opt-in.
//   WhatsApp's official API CANNOT post into a WhatsApp Group — only to
//   individual numbers. Each security contact is messaged individually,
//   which achieves the same "multiple people see it" outcome without
//   relying on unofficial/ToS-violating group-posting hacks.
// - WhatsApp (CallMeBot): free fallback, but 1:1 only and each recipient
//   must personally activate their own API key with CallMeBot first.
// - The Live Alerts admin dashboard (Socket.io) is the one channel that
//   is 100% within our control and doesn't depend on any third party —
//   treat it as the backbone, not a nice-to-have.
// None of the above replaces an actual contracted armed-response/security
// company with their own dispatch protocol — this is software plumbing,
// not a substitute for that relationship.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const twilioService = require("./twilio.service");
const { sendWhatsAppNotification } = require("../services/whatsapp.service"); // CallMeBot fallback

const MAX_PERSONAL_CONTACTS = 2;

function buildAlertMessage(user, alert) {
  const mapsLink = (alert.latitude && alert.longitude)
    ? `https://maps.google.com/?q=${alert.latitude},${alert.longitude}`
    : "Location not available";
  return (
    `🚨 PROJO PANIC ALERT 🚨\n` +
    `${user.name} (${user.phone}) has triggered an emergency alert.\n` +
    `Time: ${alert.createdAt.toLocaleString ? alert.createdAt.toLocaleString() : new Date(alert.createdAt).toLocaleString()}\n` +
    `Location: ${mapsLink}\n` +
    `Please respond immediately.`
  );
}

async function dispatchAlert(alert, user) {
  const message = buildAlertMessage(user, alert);

  const [personalContacts, securityContacts] = await Promise.all([
    user ? prisma.panicContact.findMany({ where: { userId: user.id } }) : Promise.resolve([]),
    prisma.securityMonitorContact.findMany({ where: { isActive: true } }),
  ]);

  // PROJO Group's own number always gets notified too — a guaranteed backup
  // so someone at PROJO can personally forward/escalate even if every other
  // configured contact somehow misses it. Set PROJO_BACKUP_WHATSAPP in env
  // (E.164 format, e.g. +27821234567); falls back to the CallMeBot number
  // already configured for other admin notifications if not set separately.
  const projoBackupPhone = process.env.PROJO_BACKUP_WHATSAPP || process.env.CALLMEBOT_PHONE;
  const allPhones = [
    ...personalContacts.map((c) => ({ phone: c.phone, label: c.label || "Personal contact" })),
    ...securityContacts.map((c) => ({ phone: c.phone, label: c.companyName })),
    ...(projoBackupPhone ? [{ phone: projoBackupPhone, label: "PROJO Group (backup)" }] : []),
  ];

  const dispatchResults = [];
  for (const recipient of allPhones) {
    const [sms, whatsapp] = await Promise.all([
      twilioService.sendSMS(recipient.phone, message).catch((e) => ({ success: false, error: e.message })),
      twilioService.sendWhatsApp(recipient.phone, message).catch((e) => ({ success: false, error: e.message })),
    ]);
    dispatchResults.push({ to: recipient.label, phone: recipient.phone, sms, whatsapp });
  }
  sendWhatsAppNotification(message).catch(() => {}); // CallMeBot — intentional extra redundancy to the same PROJO backup number via a second, independent channel

  await prisma.panicAlert.update({
    where: { id: alert.id },
    data: { dispatchLog: JSON.stringify(dispatchResults).slice(0, 4000) },
  });

  return allPhones.length;
}

// POST /api/panic/trigger  { latitude, longitude }  — authenticated user
exports.triggerAlert = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const alert = await prisma.panicAlert.create({
      data: { userId: user.id, latitude: latitude ?? null, longitude: longitude ?? null },
    });

    const notifiedCount = await dispatchAlert(alert, user);

    req.app.get("io")?.to("panic_monitors").emit("panic:new_alert", {
      ...alert, userName: user.name, userPhone: user.phone,
    });

    res.json({ triggered: true, alertId: alert.id, notifiedCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/panic/trigger-anonymous  { latitude, longitude } — public landing
// page, no login required. Only security monitors are notified (no
// personal contacts, since we don't know who this is), but the alert is
// still created, dispatched, and pushed to the live monitor dashboard.
//
// Rate-limited per IP (basic in-memory guard) — this endpoint has no auth,
// so without a limit it could be abused to flood real security contacts
// with fake alerts. Genuine repeat emergencies from the same visitor within
// the window still go through the authenticated endpoint if they're logged
// in, or can call again after the window passes.
const anonymousTriggerLog = new Map(); // ip -> [timestamps]
const ANON_MAX_TRIGGERS = 3;
const ANON_WINDOW_MS = 30 * 60 * 1000;

exports.triggerAnonymousAlert = async (req, res) => {
  try {
    const ip = req.ip || req.connection?.remoteAddress || "unknown";
    const now = Date.now();
    const recent = (anonymousTriggerLog.get(ip) || []).filter((t) => now - t < ANON_WINDOW_MS);
    if (recent.length >= ANON_MAX_TRIGGERS) {
      // Still respond success-shaped so a real person in danger isn't shown
      // a confusing error — but skip re-dispatching to avoid alert spam.
      return res.json({ triggered: true, alertId: null, notifiedCount: 0, rateLimited: true });
    }
    recent.push(now);
    anonymousTriggerLog.set(ip, recent);

    const { latitude, longitude } = req.body;
    const alert = await prisma.panicAlert.create({
      data: { userId: null, latitude: latitude ?? null, longitude: longitude ?? null },
    });

    const notifiedCount = await dispatchAlert(alert, { name: "Anonymous visitor (not signed in)", phone: "Unknown" });

    req.app.get("io")?.to("panic_monitors").emit("panic:new_alert", {
      ...alert, userName: "Anonymous visitor", userPhone: "Unknown",
    });

    res.json({ triggered: true, alertId: alert.id, notifiedCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── PERSONAL EMERGENCY CONTACTS (up to 2) ───────────────────────
// GET /api/panic/contacts
exports.listMyContacts = async (req, res) => {
  try {
    const contacts = await prisma.panicContact.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: "asc" } });
    res.json({ contacts });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/panic/contacts  { label, phone }
exports.addMyContact = async (req, res) => {
  try {
    const { label, phone } = req.body;
    if (!phone) return res.status(400).json({ error: "A phone number is required" });
    const count = await prisma.panicContact.count({ where: { userId: req.user.id } });
    if (count >= MAX_PERSONAL_CONTACTS) {
      return res.status(400).json({ error: `You can only add up to ${MAX_PERSONAL_CONTACTS} emergency contacts` });
    }
    const contact = await prisma.panicContact.create({ data: { userId: req.user.id, label: label || "", phone } });
    res.json({ contact });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// DELETE /api/panic/contacts/:id
exports.removeMyContact = async (req, res) => {
  try {
    await prisma.panicContact.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
    res.json({ removed: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/panic/alerts/:id/self-cancel — the triggering user marking
// their own alert as a false alarm (does not require admin rights)
exports.selfCancelAlert = async (req, res) => {
  try {
    const alert = await prisma.panicAlert.findUnique({ where: { id: req.params.id } });
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    if (alert.userId !== req.user.id) return res.status(403).json({ error: "Not your alert" });
    const updated = await prisma.panicAlert.update({
      where: { id: req.params.id },
      data: { status: "FALSE_ALARM", resolvedAt: new Date(), notes: "Cancelled by user as accidental trigger" },
    });
    req.app.get("io")?.to("panic_monitors").emit("panic:alert_cancelled", { id: req.params.id });
    res.json({ alert: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── SECURITY COMPANY LOGIN ACCOUNTS (admin only) ────────────────
// Creates a real User account with role:"SECURITY" so a security company's
// staff can log in through the normal phone+OTP flow and see the Panic
// Monitor page — without getting the rest of the admin panel.
// POST /api/panic/security-users  { name, phone }
exports.adminCreateSecurityUser = async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) return res.status(400).json({ error: "name and phone are required" });
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      if (existing.role === "SECURITY") return res.status(400).json({ error: "This phone already has a security account" });
      return res.status(409).json({ error: "This phone number is already registered with a different role" });
    }
    const user = await prisma.user.create({
      data: { phone, name, role: "SECURITY", status: "ACTIVE" },
    });
    res.json({ user: { id: user.id, name: user.name, phone: user.phone, role: user.role } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/panic/security-users
exports.adminListSecurityUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: "SECURITY" },
      select: { id: true, name: true, phone: true, createdAt: true, lastLoginAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ users });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// DELETE /api/panic/security-users/:id — revoke access (deletes the login account)
exports.adminRemoveSecurityUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user || user.role !== "SECURITY") return res.status(404).json({ error: "Not found" });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ removed: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── ADMIN / SECURITY MONITOR DASHBOARD ──────────────────────────
// GET /api/panic/alerts?status=ACTIVE
exports.adminListAlerts = async (req, res) => {
  try {
    const { status } = req.query;
    const alerts = await prisma.panicAlert.findMany({
      where: status ? { status } : {},
      include: { user: { select: { name: true, phone: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ alerts });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/panic/alerts/:id/acknowledge
exports.adminAcknowledgeAlert = async (req, res) => {
  try {
    const alert = await prisma.panicAlert.update({
      where: { id: req.params.id },
      data: { status: "ACKNOWLEDGED", acknowledgedBy: req.user.id, acknowledgedAt: new Date() },
    });
    res.json({ alert });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/panic/alerts/:id/resolve  { notes, falseAlarm }
exports.adminResolveAlert = async (req, res) => {
  try {
    const { notes, falseAlarm } = req.body;
    const alert = await prisma.panicAlert.update({
      where: { id: req.params.id },
      data: { status: falseAlarm ? "FALSE_ALARM" : "RESOLVED", resolvedAt: new Date(), notes: notes || "" },
    });
    res.json({ alert });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/panic/security-contacts
exports.adminListSecurityContacts = async (req, res) => {
  try {
    const contacts = await prisma.securityMonitorContact.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ contacts });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/panic/security-contacts  { companyName, phone }
exports.adminAddSecurityContact = async (req, res) => {
  try {
    const { companyName, phone } = req.body;
    if (!companyName || !phone) return res.status(400).json({ error: "companyName and phone are required" });
    const contact = await prisma.securityMonitorContact.create({ data: { companyName, phone, addedBy: req.user.id } });
    res.json({ contact });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/panic/security-contacts/:id/toggle
exports.adminToggleSecurityContact = async (req, res) => {
  try {
    const existing = await prisma.securityMonitorContact.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    const contact = await prisma.securityMonitorContact.update({ where: { id: req.params.id }, data: { isActive: !existing.isActive } });
    res.json({ contact });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
