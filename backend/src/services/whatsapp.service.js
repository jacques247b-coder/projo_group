// PROJO GROUP — WhatsApp Notification Service (CallMeBot)
// Setup: Send "I allow callmebot to send me messages" to +34 644 77 72 31 on WhatsApp
// Then visit: https://www.callmebot.com/blog/free-api-whatsapp-messages/
// You'll receive your API key via WhatsApp
// Set CALLMEBOT_API_KEY and CALLMEBOT_PHONE in Render environment variables
//
// CallMeBot's structural limit: one API key only ever sends to the ONE
// phone number that generated it. There's no "send to any number" mode —
// so to reach multiple people (panic emergency contacts, security
// companies), EACH person must personally do that same opt-in and give you
// their own key. sendWhatsAppToContact() below handles that per-contact
// case; sendWhatsAppNotification() keeps the original single-number
// behavior used elsewhere in the app (bookings, rides, etc).

const https = require("https");

function callmebotRequest(phone, apiKey, message) {
  const encoded = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`;
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        console.log(`[PROJO WhatsApp] Sent to ${phone}: ${res.statusCode}`);
        resolve({ success: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, data });
      });
    }).on("error", (err) => {
      console.error(`[PROJO WhatsApp] Error sending to ${phone}: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
  });
}

async function sendWhatsAppNotification(message) {
  const phone = process.env.CALLMEBOT_PHONE || "27766147386";
  const apiKey = process.env.CALLMEBOT_API_KEY;

  if (!apiKey) {
    // Fallback: log the message (until CallMeBot is set up)
    console.log(`[PROJO WhatsApp] NOTIFICATION (no API key set):\n${message}`);
    return { success: false, dev: true };
  }
  return callmebotRequest(phone, apiKey, message);
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
