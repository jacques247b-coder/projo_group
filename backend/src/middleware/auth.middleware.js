// ============================================================
// PROJO GROUP — Auth Middleware
// JWT verification + role-based access control
// ============================================================

const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Verify JWT and attach user to request
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { driverProfile: true, wallet: true },
    });

    if (!user) return res.status(401).json({ error: "User not found" });
    if (user.status === "BANNED") return res.status(403).json({ error: "Account banned" });
    if (user.status === "SUSPENDED") return res.status(403).json({ error: "Account suspended" });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
}

/**
 * Require a specific role
 * Usage: requireRole("ADMIN") or requireRole("DRIVER")
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }
    next();
  };
}

/**
 * Optional auth — attaches user if token present but doesn't block
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return next();
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  } catch (e) {
    // Ignore auth errors for optional routes
  }
  next();
}

module.exports = { authenticate, requireRole, optionalAuth };
