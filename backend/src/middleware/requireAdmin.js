// PROJO GROUP — Admin Role Middleware
// Attach AFTER the existing `authenticate` middleware on all admin routes.
// Usage: router.use(authenticate, requireAdmin);

/**
 * requireAdmin
 * Blocks access to any route unless the authenticated user has role = "ADMIN".
 * Returns 403 Forbidden for non-admin users rather than 401, so attackers
 * cannot distinguish "not logged in" from "logged in but wrong role".
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    // Should never reach here if authenticate ran first, but be safe
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== "ADMIN") {
    console.warn(
      `[PROJO SECURITY] Blocked non-admin access to ${req.method} ${req.originalUrl} — user ${req.user.id} (role: ${req.user.role})`
    );
    return res.status(403).json({ error: "Access denied. Admin only." });
  }

  next();
};

/**
 * requireAdminOrSecurity
 * For panic-monitoring routes only: allows ADMIN or the dedicated SECURITY
 * role (security company staff created by an admin) to view/acknowledge/
 * resolve alerts, without granting them the rest of the admin panel.
 */
const requireAdminOrSecurity = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Authentication required" });
  if (req.user.role !== "ADMIN" && req.user.role !== "SECURITY") {
    console.warn(`[PROJO SECURITY] Blocked non-admin/security access to ${req.method} ${req.originalUrl} — user ${req.user.id} (role: ${req.user.role})`);
    return res.status(403).json({ error: "Access denied." });
  }
  next();
};

module.exports = { requireAdmin, requireAdminOrSecurity };
