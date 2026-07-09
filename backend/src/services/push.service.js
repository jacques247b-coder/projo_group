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
 * Send a push notification to a subscribed device.
 * IMPORTANT: always returns a real result — never silently swallows a
 * failure. Callers (e.g. the admin broadcast endpoint) rely on this to
 * report an honest sent/failed count instead of claiming success for
 * every attempt regardless of what actually happened.
 * @param {Object} subscription - Push subscription object stored from frontend
 * @param {Object} payload - { title, body, icon, data }
 * @returns {Promise<{success: boolean, reason?: string, statusCode?: number}>}
 */
async function sendPushNotification(subscription, payload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log("[PROJO Push] VAPID keys not configured — cannot send");
    return { success: false, reason: "VAPID_NOT_CONFIGURED" };
  }
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log("[PROJO Push] ✅ Notification sent:", payload.title);
    return { success: true };
  } catch (err) {
    // web-push's err.message is a generic wrapper ("Received unexpected
    // response code") — the actually useful detail is on err.statusCode
    // and err.body (the real response from FCM/Mozilla/etc), which the
    // generic message hides entirely.
    console.error("[PROJO Push] ❌ Failed:", err.message,
      "| statusCode:", err.statusCode,
      "| body:", err.body,
      "| endpoint:", subscription?.endpoint?.slice(0, 60));
    // 410 Gone / 404 mean the subscription is dead (browser unsubscribed,
    // cleared site data, etc) — the caller should delete it from the user.
    // 410/404 = browser says the subscription is genuinely gone (user
    // unsubscribed, cleared site data, etc). A 403 specifically about VAPID
    // credentials means this subscription was created under DIFFERENT
    // VAPID keys than we're now signing with (e.g. before a key rotation)
    // — this is just as unrecoverable server-side; the only real fix is
    // the client creating a fresh subscription (which our resubscribe flow
    // already does automatically next time that device loads the app), so
    // there's no point keeping the old one around failing forever.
    const isVapidMismatch = err.statusCode === 403 && /vapid/i.test(err.body || "");
    const expired = err.statusCode === 410 || err.statusCode === 404 || isVapidMismatch;
    if (expired) console.log("[PROJO Push] Subscription expired/invalid" + (isVapidMismatch ? " (stale VAPID key)" : "") + ", should be removed");
    return { success: false, reason: expired ? "SUBSCRIPTION_EXPIRED" : "SEND_FAILED", statusCode: err.statusCode, error: err.body || err.message };
  }
}

module.exports = { sendPushNotification };
