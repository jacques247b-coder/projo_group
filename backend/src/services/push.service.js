// PROJO GROUP — Web Push Notification Service
// Uses VAPID keys for browser push notifications (free, no Firebase needed)
const webpush = require("web-push");

// Generate these once with: npx web-push generate-vapid-keys
// Then add to Render environment variables
const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:info@projogroup.co.za",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

/**
 * Send a push notification to a subscribed device
 * @param {Object} subscription - Push subscription object stored from frontend
 * @param {Object} payload - { title, body, icon, data }
 */
async function sendPushNotification(subscription, payload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log("[PROJO Push] VAPID keys not configured — skipping push");
    return;
  }
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log("[PROJO Push] ✅ Notification sent:", payload.title);
  } catch (err) {
    console.error("[PROJO Push] ❌ Failed:", err.message);
    // 410 Gone means subscription expired — should be removed from DB
    if (err.statusCode === 410) {
      console.log("[PROJO Push] Subscription expired, should be removed");
    }
  }
}

module.exports = { sendPushNotification };
