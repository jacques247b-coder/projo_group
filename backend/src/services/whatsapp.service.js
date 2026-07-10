// PROJO GROUP — Admin Alert Notifications (new bookings, rides, orders, etc)
// Twilio SMS + WhatsApp are the reliable backbone here (same as Panic
// alerts use) — CallMeBot is layered on top as a free bonus channel, not
// the only one, since it's an unofficial hobby service with no uptime
// guarantees and can hit rate limits under real usage.
//
// CallMeBot setup (bonus channel): Send "I allow callmebot to send me
// messages" to +34 644 86 70 49 on WhatsApp, then set CALLMEBOT_API_KEY
// and CALLMEBOT_PHONE in Render environment variables.
// CallMeBot's structural limit: one API key only ever sends to the ONE
// phone number that generated it — there's no "send to any number" mode.
// sendWhatsAppToContact() below handles the per-contact case (panic
// emergency contacts / security companies, each with their own key).

const https = require("https");
const twilioService = require("./twilio.service");

function callmebotRequest(phone, apiKey, message) {
  const encoded = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`;
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        console.log(`[PROJO WhatsApp] CallMeBot sent to ${phone}: ${res.statusCode}`);
        resolve({ success: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, data });
      });
    }).on("error", (err) => {
      console.error(`[PROJO WhatsApp] CallMeBot error sending to ${phone}: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
  });
}

// Normalizes to E.164 (+27...) for Twilio — CallMeBot's env var has
// historically been stored without the leading '+' (e.g. "27766147386").
function toE164(phone) {
  return phone.startsWith("+") ? phone : `+${phone}`;
}

async function sendWhatsAppNotification(message) {
  const phone = process.env.CALLMEBOT_PHONE || "27766147386";
  const e164Phone = toE164(phone);

  // Twilio SMS + WhatsApp — the reliable backbone, run in parallel
  const [sms, whatsapp] = await Promise.all([
    twilioService.sendSMS(e164Phone, message).catch((e) => ({ success: false, error: e.message })),
    twilioService.sendWhatsApp(e164Phone, message).catch((e) => ({ success: false, error: e.message })),
  ]);

  // CallMeBot — free bonus layer, only if configured; never blocks on it
  let callmebot = { success: false, skipped: true };
  const apiKey = process.env.CALLMEBOT_API_KEY;
  if (apiKey) {
    callmebot = await callmebotRequest(phone, apiKey, message).catch((e) => ({ success: false, error: e.message }));
  }

  const anySucceeded = sms.success || whatsapp.success || callmebot.success;
  if (!anySucceeded) {
    console.warn("[PROJO WhatsApp] All channels failed for admin alert — logging message so it's not lost:\n" + message);
  }
  return { success: anySucceeded, sms, whatsapp, callmebot };
}

// Per-contact send — used for emergency contacts / security companies who
// have personally opted in with CallMeBot and given us their own key.
async function sendWhatsAppToContact(phone, apiKey, message) {
  if (!apiKey) {
    console.log(`[PROJO WhatsApp] Skipped ${phone} — no personal CallMeBot key on file for this contact`);
    return { success: false, skipped: true };
  }
  return callmebotRequest(phone, apiKey, message);
}

module.exports = { sendWhatsAppNotification, sendWhatsAppToContact };
