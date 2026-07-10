function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function getOTPExpiry() {
  return new Date(Date.now() + 10 * 60 * 1000);
}

async function sendOTPSms(phone, otp) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const configured = sid && sid.startsWith("AC") && sid !== "ACplaceholder00000000000000000000";
  if (!configured) {
    console.log(`[PROJO OTP] DEV MODE - OTP for ${phone}: ${otp}`);
    return { success: true };
  }
  try {
    const twilio = require("twilio")(sid, process.env.TWILIO_AUTH_TOKEN);
    await twilio.messages.create({ body: `PROJO GROUP code: ${otp}`, from: process.env.TWILIO_PHONE_NUMBER, to: phone });
    return { success: true };
  } catch (err) {
    console.log(`[PROJO OTP] SMS failed - OTP for ${phone}: ${otp}`);
    return { success: false, error: err.message };
  }
}

// WhatsApp-first OTP delivery, falling back to SMS if it fails. Note:
// WhatsApp only allows a free-form business-initiated message (like an
// arbitrary OTP code) within 24 hours of the recipient having messaged
// first — this works reliably right after someone joins your Sandbox
// (that join message opens the window), but may fail outside it until a
// pre-approved WhatsApp verification-code template is set up for
// production use. Falling back to SMS covers that gap either way.
async function sendOTPPhone(phone, otp) {
  try {
    const twilioService = require("./twilio.service");
    const message = `Your PROJO GROUP verification code is: ${otp}\nValid for 10 minutes.`;
    const whatsappResult = await twilioService.sendWhatsApp(phone, message);
    if (whatsappResult.success && !whatsappResult.dev) {
      console.log(`[PROJO OTP] Sent via WhatsApp to ${phone}`);
      return { success: true, via: "whatsapp" };
    }
    console.log(`[PROJO OTP] WhatsApp not available/failed for ${phone}, falling back to SMS`);
  } catch (e) {
    console.log(`[PROJO OTP] WhatsApp attempt errored for ${phone}, falling back to SMS:`, e.message);
  }

  const smsResult = await sendOTPSms(phone, otp);
  return { success: smsResult.success, via: "sms" };
}

module.exports = { generateOTP, getOTPExpiry, sendOTPSms, sendOTPPhone };
