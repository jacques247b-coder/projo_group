// ============================================================
// PROJO GROUP — Twilio SMS Service
// Sends OTP codes to South African numbers (+27)
// Falls back to console.log in development (no credits needed)
// ============================================================

let twilioClient = null;

// Only init Twilio if credentials are provided
if (
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_ACCOUNT_SID.startsWith("AC") &&
  process.env.TWILIO_AUTH_TOKEN
) {
  const twilio = require("twilio");
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  console.log("[PROJO] Twilio SMS service initialized");
} else {
  console.log("[PROJO] Twilio not configured — OTP codes will be logged to console");
}

/**
 * Send OTP SMS to a South African number
 * @param {string} phone  — format: +27xxxxxxxxx
 * @param {string} otp    — 6-digit code
 */
async function sendOTP(phone, otp) {
  const message =
    `Your PROJO GROUP verification code is: ${otp}\n` +
    `Valid for 10 minutes.\n` +
    `Rustenburg's Own. Ride. Shop. Deliver.`;

  if (!twilioClient) {
    // Development fallback — log OTP to console
    console.log("╔═══════════════════════════════════╗");
    console.log(`║  PROJO GROUP OTP for ${phone}  ║`);
    console.log(`║  Code: ${otp}                       ║`);
    console.log("╚═══════════════════════════════════╝");
    return { success: true, dev: true };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    console.log(`[PROJO] OTP sent to ${phone} — SID: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (err) {
    console.error(`[PROJO] Failed to send OTP to ${phone}:`, err.message);
    throw new Error("Failed to send SMS. Please try again.");
  }
}

/**
 * Send a general notification SMS
 */
async function sendSMS(phone, message) {
  if (!twilioClient) {
    console.log(`[PROJO DEV SMS] To: ${phone}\n${message}`);
    return { success: true, dev: true };
  }
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    return { success: true, sid: result.sid };
  } catch (err) {
    console.error(`[PROJO] SMS failed to ${phone}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send a WhatsApp message via Twilio's WhatsApp API.
 * Requires TWILIO_WHATSAPP_FROM to be set (e.g. "whatsapp:+14155238886" for
 * the Twilio Sandbox, or your approved WhatsApp Business sender number).
 * The recipient must have opted in (sandbox: sent the join code once;
 * production: standard WhatsApp Business opt-in rules apply).
 */
async function sendWhatsApp(phone, message) {
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!twilioClient || !from) {
    console.log(`[PROJO DEV WHATSAPP] To: ${phone}\n${message}`);
    return { success: true, dev: true };
  }
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
      to: phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`,
    });
    return { success: true, sid: result.sid };
  } catch (err) {
    console.error(`[PROJO] WhatsApp failed to ${phone}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Make an actual voice call reading out a message — the most attention-
 * grabbing channel available, used for panic alerts. Requires a public
 * TwiML Bin or endpoint URL (TWILIO_VOICE_TWIML_URL) that returns TwiML
 * for Twilio to read; if not configured, this is skipped gracefully.
 */
async function makeVoiceCall(phone, twimlUrl) {
  if (!twilioClient || !twimlUrl) {
    console.log(`[PROJO DEV VOICE CALL] Would call: ${phone}`);
    return { success: true, dev: true };
  }
  try {
    const call = await twilioClient.calls.create({
      url: twimlUrl,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    return { success: true, sid: call.sid };
  } catch (err) {
    console.error(`[PROJO] Voice call failed to ${phone}:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendOTP, sendSMS, sendWhatsApp, makeVoiceCall };
