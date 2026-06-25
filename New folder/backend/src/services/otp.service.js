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
    return { success: false };
  }
}
module.exports = { generateOTP, getOTPExpiry, sendOTPSms };
