// PROJO GROUP — Push Notification Controller
// Manages subscription storage and sending
const { PrismaClient } = require("@prisma/client");
const { sendPushNotification } = require("../services/push.service");
const prisma = new PrismaClient();

// POST /api/push/subscribe — save a user's push subscription
exports.subscribe = async (req, res) => {
  const { subscription } = req.body;
  if (!subscription) return res.status(400).json({ error: "Subscription required" });
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { pushSubscription: JSON.stringify(subscription) },
    });
    res.json({ message: "Subscribed to push notifications" });
  } catch (err) {
    res.status(500).json({ error: "Could not save subscription" });
  }
};

// POST /api/push/unsubscribe
exports.unsubscribe = async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { pushSubscription: null },
    });
    res.json({ message: "Unsubscribed" });
  } catch (err) {
    res.status(500).json({ error: "Could not unsubscribe" });
  }
};

// GET /api/push/vapid-key — frontend needs this to subscribe
exports.getVapidKey = async (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
};

// Helper — call this from other controllers to notify a user
exports.notifyUser = async (userId, payload) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.pushSubscription) return;
    const subscription = JSON.parse(user.pushSubscription);
    const result = await sendPushNotification(subscription, payload);
    if (!result.success) {
      console.log(`[PROJO Push] notifyUser(${userId}) did not deliver: ${result.reason}`);
      if (result.reason === "SUBSCRIPTION_EXPIRED") {
        await prisma.user.update({ where: { id: userId }, data: { pushSubscription: null } }).catch(() => {});
      }
    }
  } catch (err) {
    console.error("[PROJO Push] notifyUser error:", err.message);
  }
};
