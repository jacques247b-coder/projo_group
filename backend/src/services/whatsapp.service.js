// PROJO GROUP — WhatsApp Notification Service (CallMeBot)
// Activated: +34 644 86 70 49 | Phone: 27766147986 | APIKey: set in env vars
const https = require("https");

async function sendWhatsAppNotification(message) {
  const phone = process.env.CALLMEBOT_PHONE || "27766147986";
  const apiKey = process.env.CALLMEBOT_API_KEY;

  if (!apiKey) {
    console.log(`[PROJO WhatsApp] No API key set — message:\n${message}`);
    return;
  }

  const encoded = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        console.log(`[PROJO WhatsApp] ✅ Sent: ${res.statusCode}`);
        resolve(data);
      });
    }).on("error", (err) => {
      console.error(`[PROJO WhatsApp] ❌ Error: ${err.message}`);
      resolve(null);
    });
  });
}

module.exports = { sendWhatsAppNotification };
