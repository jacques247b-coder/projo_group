// PROJO GROUP — Push Notification Controller
// Manages subscription storage and sending. Each device/browser gets its
// own PushSubscription row (keyed by its unique endpoint) — a user can be
// subscribed on any number of devices at once (PC, phone, etc), unlike the
// old single User.pushSubscription field which could only remember one.
const { PrismaClient } = require("@prisma/client");
const { sendPushNotification } = require("../services/push.service");
const prisma = new PrismaClient();

// POST /api/push/subscribe — save one device's push subscription
exports.subscribe = async (req, res) => {
  const { subscription } = req.body;
  if (!subscription?.endpoint) return res.status(400).json({ error: "Subscription (with endpoint) required" });
  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: { userId: req.user.id, subscriptionJson: JSON.stringify(subscription), lastUsedAt: new Date() },
      create: { userId: req.user.id, endpoint: subscription.endpoint, subscriptionJson: JSON.stringify(subscription) },
    });
    res.json({ message: "Subscribed to push notifications" });
  } catch (err) {
    res.status(500).json({ error: "Could not save subscription" });
  }
};

// POST /api/push/unsubscribe — removes ALL of this user's devices (matches
// the existing "opt out entirely" behavior; the client doesn't currently
// send which specific device, so this errs toward doing what "unsubscribe"
// implies rather than guessing which single device to remove).
exports.unsubscribe = async (req, res) => {
  try {
    await prisma.pushSubscription.deleteMany({ where: { userId: req.user.id } });
    res.json({ message: "Unsubscribed" });
  } catch (err) {
    res.status(500).json({ error: "Could not unsubscribe" });
  }
};

// GET /api/push/image/:id — PUBLIC, serves the actual image bytes for a
// push notification. This is what the short URL in a payload points to;
// the browser fetches this separately when displaying the notification,
// which is why the payload itself never needs to contain the image data.
exports.servePushImage = async (req, res) => {
  try {
    const record = await prisma.pushImage.findUnique({ where: { id: req.params.id } });
    if (!record) return res.status(404).send("Not found");
    const match = record.dataUrl.match(/^data:(.+?);base64,(.+)$/);
    if (!match) return res.status(500).send("Invalid stored image");
    const [, mimeType, base64Data] = match;
    const buffer = Buffer.from(base64Data, "base64");
    res.set("Content-Type", mimeType);
    res.set("Cache-Control", "public, max-age=604800"); // a week — these never change once uploaded
    res.send(buffer);
  } catch (err) { res.status(500).send("Error serving image"); }
};

// GET /api/push/vapid-key — frontend needs this to subscribe
exports.getVapidKey = async (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
};

// Helper — call this from other controllers to notify a user on EVERY one
// of their subscribed devices, not just one.
exports.notifyUser = async (userId, payload) => {
  try {
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    for (const sub of subs) {
      try {
        const subscription = JSON.parse(sub.subscriptionJson);
        const result = await sendPushNotification(subscription, payload);
        if (!result.success) {
          console.log(`[PROJO Push] notifyUser(${userId}) device ${sub.id} did not deliver: ${result.reason}`);
          if (result.reason === "SUBSCRIPTION_EXPIRED") {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
        }
      } catch {}
    }
  } catch (err) {
    console.error("[PROJO Push] notifyUser error:", err.message);
  }
};
