// PROJO GROUP — WhatsApp Notification Service (CallMeBot)
// Setup: Send "I allow callmebot to send me messages" to +34 644 77 72 31 on WhatsApp
// Then visit: https://www.callmebot.com/blog/free-api-whatsapp-messages/
// You'll receive your API key via WhatsApp
// Set CALLMEBOT_API_KEY and CALLMEBOT_PHONE in Render environment variables

const https = require("https");

async function sendWhatsAppNotification(message) {
  const phone = process.env.CALLMEBOT_PHONE || "27766147386";
  const apiKey = process.env.CALLMEBOT_API_KEY;

  if (!apiKey) {
    // Fallback: log the message (until CallMeBot is set up)
    console.log(`[PROJO WhatsApp] NOTIFICATION (no API key set):\n${message}`);
    return;
  }

  const encoded = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        console.log(`[PROJO WhatsApp] Notification sent: ${res.statusCode}`);
        resolve(data);
      });
    }).on("error", (err) => {
      console.error(`[PROJO WhatsApp] Error: ${err.message}`);
      resolve(null);
    });
  });
}

module.exports = { sendWhatsAppNotification };
