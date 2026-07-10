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
const twilioService = require("../services/twilio.service");
const { sendWhatsAppNotification, sendWhatsAppToContact } = require("../services/whatsapp.service"); // CallMeBot fallback + per-contact

const MAX_PERSONAL_CONTACTS = 2;

const ACTIVE_RIDE_STATUSES = ["REQUESTED", "DRIVER_ASSIGNED", "DRIVER_EN_ROUTE", "ARRIVED_AT_PICKUP", "IN_PROGRESS"];

async function findActiveRideContext(userId) {
  const ride = await prisma.ride.findFirst({
    where: {
      status: { in: ACTIVE_RIDE_STATUSES },
      OR: [{ passengerId: userId }, { driverId: userId }],
    },
    orderBy: { createdAt: "desc" },
  });
  if (!ride) return null;

  const [passenger, driver] = await Promise.all([
    prisma.user.findUnique({ where: { id: ride.passengerId }, select: { name: true, phone: true } }),
    ride.driverId ? prisma.user.findUnique({ where: { id: ride.driverId }, select: { name: true, phone: true } }) : Promise.resolve(null),
  ]);

  return {
    rideId: ride.id,
    rideContext: JSON.stringify({
      status: ride.status,
      pickupAddress: ride.pickupAddress,
      dropoffAddress: ride.dropoffAddress,
      passengerName: passenger?.name || null,
      driverName: driver?.name || null,
      driverPhone: driver?.phone || null,
    }),
  };
}

function buildAlertMessage(user, alert, tier) {
  const mapsLink = (alert.latitude && alert.longitude)
    ? `https://maps.google.com/?q=${alert.latitude},${alert.longitude}`
    : "Location not available";
  let rideLine = "";
  if (alert.rideContext) {
    try {
      const rc = JSON.parse(alert.rideContext);
      rideLine = `\n🚗 IN TRANSIT — PROJO Ride from "${rc.pickupAddress}" to "${rc.dropoffAddress}"` +
        (rc.driverName ? ` · Driver: ${rc.driverName}${rc.driverPhone ? ` (${rc.driverPhone})` : ""}` : "");
    } catch {}
  }
  let medicalLine = "";
  if (tier === "SUBSCRIBED" && (user.homeAddress || user.bloodGroup || user.medicalNotes)) {
    medicalLine = "\n🩺 " + [
      user.homeAddress && `Address: ${user.homeAddress}`,
      user.bloodGroup && `Blood group: ${user.bloodGroup}`,
      user.medicalNotes && `Medical: ${user.medicalNotes}`,
    ].filter(Boolean).join(" · ");
  }
  let watchLine = "";
  if (tier === "SUBSCRIBED") {
    const base = process.env.PROJO_APP_BASE_URL || "https://app.projogroup.co.za";
    watchLine = `\n👀 Live tracking: ${base}/panic-watch/${alert.id}`;
  }
  return (
    `🚨 PROJO PANIC ALERT 🚨\n` +
    `${user.name} (${user.phone}) has triggered an emergency alert.\n` +
    `Time: ${alert.createdAt.toLocaleString ? alert.createdAt.toLocaleString() : new Date(alert.createdAt).toLocaleString()}\n` +
    `Location: ${mapsLink}${rideLine}${medicalLine}${watchLine}\n` +
    `Please respond immediately.`
  );
}

async function dispatchAlert(alert, user, tier) {
  const message = buildAlertMessage(user, alert, tier);

  // Tiered dispatch audience:
  // - ANONYMOUS (free, no account): only the nearest/primary security company —
  //   never the full network, and never CPF (that's a signed-up perk).
  // - FREE_SIGNUP (has an account, not subscribed): every active security
  //   company AND every CPF contact — the full cooperative network.
  // - SUBSCRIBED (R37/month): everything FREE_SIGNUP gets, PLUS the user's
  //   own personal emergency contacts.
  let securityContacts;
  if (tier === "ANONYMOUS") {
    securityContacts = await prisma.securityMonitorContact.findMany({ where: { isActive: true, isPrimary: true } });
    if (securityContacts.length === 0) {
      // No company marked as primary/nearest yet — fall back to the first
      // active one so a free anonymous alert is never dispatched to nobody.
      securityContacts = await prisma.securityMonitorContact.findMany({ where: { isActive: true }, take: 1 });
    }
  } else {
    securityContacts = await prisma.securityMonitorContact.findMany({ where: { isActive: true } });
  }

  const personalContacts = (tier === "SUBSCRIBED" && user?.id)
    ? await prisma.panicContact.findMany({ where: { userId: user.id } })
    : [];

  // PROJO Group's own number always gets notified too — a guaranteed backup
  // so someone at PROJO can personally forward/escalate even if every other
  // configured contact somehow misses it. Set PROJO_BACKUP_WHATSAPP in env
  // (E.164 format, e.g. +27821234567); falls back to the CallMeBot number
  // already configured for other admin notifications if not set separately.
  const projoBackupPhone = process.env.PROJO_BACKUP_WHATSAPP || process.env.CALLMEBOT_PHONE;
  const allPhones = [
    ...personalContacts.map((c) => ({ phone: c.phone, label: c.label || "Personal contact", callmebotApiKey: c.callmebotApiKey })),
    ...securityContacts.map((c) => ({ phone: c.phone, label: `${c.companyName}${c.type === "CPF" ? " (CPF)" : ""}`, callmebotApiKey: c.callmebotApiKey })),
    ...(projoBackupPhone ? [{ phone: projoBackupPhone, label: "PROJO Group (backup)", callmebotApiKey: null }] : []),
  ];

  const dispatchResults = [];
  for (const recipient of allPhones) {
    // Twilio SMS is the backbone — works on any phone, no opt-in needed.
    // Twilio WhatsApp is layered on top where configured.
    // CallMeBot WhatsApp is a THIRD, independent layer for any contact who
    // has personally opted in and given us their own API key — free, but
    // only reaches that one contact's own number with their own key.
    const [sms, whatsappTwilio, whatsappCallmebot] = await Promise.all([
      twilioService.sendSMS(recipient.phone, message).catch((e) => ({ success: false, error: e.message })),
      twilioService.sendWhatsApp(recipient.phone, message).catch((e) => ({ success: false, error: e.message })),
      recipient.callmebotApiKey
        ? sendWhatsAppToContact(recipient.phone, recipient.callmebotApiKey, message).catch((e) => ({ success: false, error: e.message }))
        : Promise.resolve({ success: false, skipped: true }),
    ]);
    dispatchResults.push({ to: recipient.label, phone: recipient.phone, sms, whatsappTwilio, whatsappCallmebot });
  }
  sendWhatsAppNotification(message).catch(() => {}); // CallMeBot — intentional extra redundancy to the PROJO backup number via a second, independent channel

  await prisma.panicAlert.update({
    where: { id: alert.id },
    data: { dispatchLog: JSON.stringify(dispatchResults).slice(0, 4000) },
  });

  return allPhones.length;
}

// POST /api/panic/trigger  { latitude, longitude }  — authenticated user
const PANIC_SUBSCRIPTION_PRICE_ZAR = 37;

exports.triggerAlert = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const tier = user.hasPanicSubscription ? "SUBSCRIBED" : "FREE_SIGNUP";
    const rideInfo = await findActiveRideContext(user.id).catch(() => null);

    const alert = await prisma.panicAlert.create({
      data: {
        userId: user.id, latitude: latitude ?? null, longitude: longitude ?? null,
        lastLocationAt: latitude ? new Date() : null,
        rideId: rideInfo?.rideId || null, rideContext: rideInfo?.rideContext || null,
      },
    });

    const notifiedCount = await dispatchAlert(alert, user, tier);

    req.app.get("io")?.to("panic_monitors").emit("panic:new_alert", {
      ...alert, userName: user.name, userPhone: user.phone, tier,
      // Medical/safety details are only ever shared with monitors for
      // subscribed members — a signed-up-but-free trigger still reaches
      // every security company + CPF contact, just without this data.
      safetyProfile: tier === "SUBSCRIBED" ? {
        homeAddress: user.homeAddress, bloodGroup: user.bloodGroup, medicalNotes: user.medicalNotes,
        insuranceProvider: user.insuranceProvider, insurancePolicyNumber: user.insurancePolicyNumber,
      } : null,
    });

    res.json({ triggered: true, alertId: alert.id, notifiedCount, tier });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/panic/subscription-status
exports.getSubscriptionStatus = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { hasPanicSubscription: true, panicSubscriptionActivatedAt: true } });
    res.json({ subscribed: !!user?.hasPanicSubscription, activatedAt: user?.panicSubscriptionActivatedAt, priceZar: PANIC_SUBSCRIPTION_PRICE_ZAR });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/panic/activate-subscription — no payment gateway wired in yet;
// flips the flag the same way Dating Premium activation does. Ready to
// plug in real billing once a gateway (e.g. PayFast) is integrated.
exports.activateSubscription = async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { hasPanicSubscription: true, panicSubscriptionActivatedAt: new Date() },
    });
    res.json({ subscribed: true, activatedAt: user.panicSubscriptionActivatedAt });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/panic/safety-profile
exports.getSafetyProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { homeAddress: true, bloodGroup: true, medicalNotes: true, insuranceProvider: true, insurancePolicyNumber: true },
    });
    res.json({ profile: user });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/panic/safety-profile
exports.updateSafetyProfile = async (req, res) => {
  try {
    const { homeAddress, bloodGroup, medicalNotes, insuranceProvider, insurancePolicyNumber } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { homeAddress, bloodGroup, medicalNotes, insuranceProvider, insurancePolicyNumber },
    });
    res.json({ profile: user });
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

    const notifiedCount = await dispatchAlert(alert, { name: "Anonymous visitor (not signed in)", phone: "Unknown" }, "ANONYMOUS");

    req.app.get("io")?.to("panic_monitors").emit("panic:new_alert", {
      ...alert, userName: "Anonymous visitor", userPhone: "Unknown", tier: "ANONYMOUS", safetyProfile: null,
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
    const { label, phone, callmebotApiKey } = req.body;
    if (!phone) return res.status(400).json({ error: "A phone number is required" });
    const count = await prisma.panicContact.count({ where: { userId: req.user.id } });
    if (count >= MAX_PERSONAL_CONTACTS) {
      return res.status(400).json({ error: `You can only add up to ${MAX_PERSONAL_CONTACTS} emergency contacts` });
    }
    const contact = await prisma.panicContact.create({ data: { userId: req.user.id, label: label || "", phone, callmebotApiKey: callmebotApiKey || null } });
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

// POST /api/panic/alerts/:id/update-location  { latitude, longitude } — no
// auth required (matches trigger-anonymous), since a person mid-emergency
// may not have a valid session, and the alertId itself (a UUID) is the only
// thing needed. Only updates alerts that are still ACTIVE/ACKNOWLEDGED, so a
// resolved/false-alarm alert's pin can't be tampered with afterwards.
exports.updateAlertLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) return res.status(400).json({ error: "latitude and longitude required" });
    const alert = await prisma.panicAlert.findUnique({ where: { id: req.params.id } });
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    if (!["ACTIVE", "ACKNOWLEDGED"].includes(alert.status)) {
      return res.json({ updated: false, reason: "Alert is no longer active" });
    }
    const updated = await prisma.panicAlert.update({
      where: { id: req.params.id },
      data: { latitude, longitude, lastLocationAt: new Date() },
    });
    req.app.get("io")?.to("panic_monitors").emit("panic:location_update", { id: alert.id, latitude, longitude, lastLocationAt: updated.lastLocationAt });
    req.app.get("io")?.to(`panic_alert:${alert.id}`).emit("panic:location_update", { id: alert.id, latitude, longitude, lastLocationAt: updated.lastLocationAt });
    res.json({ updated: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/panic/watch/:id — PUBLIC, no auth. The unguessable alert UUID is
// the only thing needed to view it — this is what the private link sent to
// a subscriber's family/friends opens. Deliberately limited: live location
// and status only, never medical info, address, or phone number.
exports.getWatchAlert = async (req, res) => {
  try {
    const alert = await prisma.panicAlert.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, status: true, latitude: true, longitude: true,
        lastLocationAt: true, createdAt: true, resolvedAt: true,
        user: { select: { name: true } },
      },
    });
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    res.json({ alert: { ...alert, firstName: alert.user?.name?.split(" ")[0] || "Someone" } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── SECURITY COMPANY LOGIN ACCOUNTS (admin only) ────────────────
// Creates a real User account with role:"SECURITY" so a security company's
// staff can log in through the normal phone+OTP flow and see the Panic
// Monitor page — without getting the rest of the admin panel.
// POST /api/panic/security-users  { name, phone }
exports.adminCreateSecurityUser = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    if (!name || !phone || !email) return res.status(400).json({ error: "name, phone, and email are all required" });
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      if (existing.role === "SECURITY") return res.status(400).json({ error: "This phone already has a security account" });
      return res.status(409).json({ error: "This phone number is already registered with a different role" });
    }
    const emailOwner = await prisma.user.findUnique({ where: { email } });
    if (emailOwner) return res.status(409).json({ error: "That email is already registered to another account" });
    const user = await prisma.user.create({
      data: { phone, name, email, role: "SECURITY", status: "ACTIVE" },
    });
    res.json({ user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role } });
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
      include: {
        user: { select: { name: true, phone: true, homeAddress: true, bloodGroup: true, medicalNotes: true, insuranceProvider: true, insurancePolicyNumber: true } },
        sitreps: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    // Attach a display name for whoever submitted each sitrep
    const submitterIds = [...new Set(alerts.flatMap(a => a.sitreps.map(s => s.submittedBy)))];
    const submitters = submitterIds.length
      ? await prisma.user.findMany({ where: { id: { in: submitterIds } }, select: { id: true, name: true, role: true } })
      : [];
    const submitterMap = Object.fromEntries(submitters.map(s => [s.id, s]));
    const withNames = alerts.map(a => ({
      ...a,
      sitreps: a.sitreps.map(s => ({ ...s, submitter: submitterMap[s.submittedBy] || null })),
    }));
    res.json({ alerts: withNames });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/panic/alerts/:id/sitrep  { status, summary } — ADMIN or SECURITY
const SITREP_STATUSES = ["EN_ROUTE", "ON_SCENE", "RESOLVED", "ESCALATED", "FALSE_ALARM"];
exports.submitSitRep = async (req, res) => {
  try {
    const { status, summary } = req.body;
    if (!SITREP_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${SITREP_STATUSES.join(", ")}` });
    }
    const alert = await prisma.panicAlert.findUnique({ where: { id: req.params.id } });
    if (!alert) return res.status(404).json({ error: "Alert not found" });

    const sitrep = await prisma.panicSitRep.create({
      data: { alertId: alert.id, submittedBy: req.user.id, status, summary: summary || "" },
    });

    // A SITREP marking the incident resolved/false-alarm also closes the alert itself
    const alertStatusMap = { RESOLVED: "RESOLVED", FALSE_ALARM: "FALSE_ALARM" };
    if (alertStatusMap[status]) {
      await prisma.panicAlert.update({
        where: { id: alert.id },
        data: { status: alertStatusMap[status], resolvedAt: new Date() },
      });
    } else if (alert.status === "ACTIVE") {
      // Any other SITREP at least marks it acknowledged, so it's clear someone's on it
      await prisma.panicAlert.update({
        where: { id: alert.id },
        data: { status: "ACKNOWLEDGED", acknowledgedBy: req.user.id, acknowledgedAt: new Date() },
      });
    }

    const submitter = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, name: true, role: true } });
    const outgoing = { ...sitrep, submitter };
    req.app.get("io")?.to("panic_monitors").emit("panic:sitrep_added", { alertId: alert.id, sitrep: outgoing });
    res.json({ sitrep: outgoing });
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
    const { companyName, phone, callmebotApiKey, type, isPrimary } = req.body;
    if (!companyName || !phone) return res.status(400).json({ error: "companyName and phone are required" });
    const contact = await prisma.securityMonitorContact.create({
      data: {
        companyName, phone, callmebotApiKey: callmebotApiKey || null,
        type: type === "CPF" ? "CPF" : "SECURITY",
        isPrimary: !!isPrimary,
        addedBy: req.user.id,
      },
    });
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

// POST /api/panic/security-contacts/:id/toggle-primary — mark as the
// "nearest" company that free anonymous alerts get dispatched to
exports.adminTogglePrimaryContact = async (req, res) => {
  try {
    const existing = await prisma.securityMonitorContact.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    const contact = await prisma.securityMonitorContact.update({ where: { id: req.params.id }, data: { isPrimary: !existing.isPrimary } });
    res.json({ contact });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
