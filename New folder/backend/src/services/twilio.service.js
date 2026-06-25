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

module.exports = { sendOTP, sendSMS };
