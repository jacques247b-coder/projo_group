const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET /api/users/profile
router.get("/profile", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { wallet: true, driverProfile: true },
  });
  const { passwordHash, otpCode, otpExpiresAt, ...safe } = user;
  res.json({ user: safe });
});

// PUT /api/users/profile
router.put("/profile", authenticate, async (req, res) => {
  const { name, email } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { name, email },
  });
  res.json({ message: "Profile updated", user });
});

module.exports = router;
