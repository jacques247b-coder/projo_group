const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { requireAdmin, requireAdminOrSecurity } = require("../middleware/requireAdmin");
const panic = require("../controllers/panic.controller");

// Trigger (any authenticated user)
router.post("/trigger",                    authenticate, panic.triggerAlert);
// Trigger from the public landing page — no login required
router.post("/trigger-anonymous",          panic.triggerAnonymousAlert);

// Personal emergency contacts
router.get("/contacts",                    authenticate, panic.listMyContacts);
router.post("/contacts",                   authenticate, panic.addMyContact);
router.delete("/contacts/:id",             authenticate, panic.removeMyContact);
router.post("/alerts/:id/self-cancel",     authenticate, panic.selfCancelAlert);

// Monitor dashboard — ADMIN or SECURITY company staff can view/act on alerts
router.get("/alerts",                      authenticate, requireAdminOrSecurity, panic.adminListAlerts);
router.post("/alerts/:id/acknowledge",     authenticate, requireAdminOrSecurity, panic.adminAcknowledgeAlert);
router.post("/alerts/:id/resolve",         authenticate, requireAdminOrSecurity, panic.adminResolveAlert);
router.post("/alerts/:id/sitrep",          authenticate, requireAdminOrSecurity, panic.submitSitRep);

// Admin only — manage security company monitor phone numbers (SMS/WhatsApp recipients)
router.get("/security-contacts",               authenticate, requireAdmin, panic.adminListSecurityContacts);
router.post("/security-contacts",              authenticate, requireAdmin, panic.adminAddSecurityContact);
router.post("/security-contacts/:id/toggle",   authenticate, requireAdmin, panic.adminToggleSecurityContact);

// Admin only — manage SECURITY-role login accounts (so their staff can log
// into the Panic Monitor dashboard itself, not just receive SMS/WhatsApp)
router.get("/security-users",              authenticate, requireAdmin, panic.adminListSecurityUsers);
router.post("/security-users",             authenticate, requireAdmin, panic.adminCreateSecurityUser);
router.delete("/security-users/:id",       authenticate, requireAdmin, panic.adminRemoveSecurityUser);

module.exports = router;
