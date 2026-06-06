// ============================================================
// PROJO GROUP — OTP Service
// SMS via Twilio — South African +27 numbers
// ============================================================
const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/** Generate a random 6-digit OTP */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** OTP expiry in minutes */
const OTP_EXPIRY_MIN = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;

/**
 * Send OTP SMS to a South African phone number
 * @param {string} phone - Format: +27xxxxxxxxx
 * @param {string} otp   - 6-digit code
 */
async function sendOTPSms(phone, otp) {
  const message = `Your PROJO GROUP verification code is: ${otp}. Valid for ${OTP_EXPIRY_MIN} minutes. Do not share this code.`;

  if (process.env.NODE_ENV === "development") {
    // In dev mode, log OTP instead of sending SMS (saves Twilio credits)
    console.log(`\n[PROJO OTP DEV] Phone: ${phone} | OTP: ${otp}\n`);
    return { success: true, dev: true };
  }

  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    return { success: true };
  } catch (err) {
    console.error("[PROJO OTP] Twilio error:", err.message);
    throw new Error("Failed to send OTP SMS. Please try again.");
  }
}

/** Get OTP expiry timestamp */
function getOTPExpiry() {
  return new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000);
}

module.exports = { generateOTP, sendOTPSms, getOTPExpiry, OTP_EXPIRY_MIN };
