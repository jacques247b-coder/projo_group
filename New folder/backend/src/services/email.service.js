// ============================================================
// PROJO GROUP — Email Service
// Sends OTP via Gmail (free forever)
// Also collects emails for marketing campaigns
// ============================================================
const nodemailer = require("nodemailer");

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

async function sendOTPEmail(email, otp, name = "") {
  // If Gmail not configured, log to console
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log(`[PROJO EMAIL] DEV MODE - OTP for ${email}: ${otp}`);
    return { success: true, dev: true };
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"PROJO GROUP" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your PROJO GROUP Verification Code",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#0d0505;font-family:'Arial',sans-serif;">
          <div style="max-width:500px;margin:0 auto;padding:40px 20px;">
            
            <!-- Logo/Brand -->
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;width:70px;height:70px;border-radius:50%;
                background:radial-gradient(circle at 35% 35%,#f5d078,#e8b84b,#c49a2f,#9a7520);
                line-height:70px;text-align:center;font-size:12px;font-weight:800;
                color:#2a1a00;box-shadow:0 0 24px rgba(232,184,75,0.4);">PROJO</div>
              <h1 style="color:#e8b84b;font-size:22px;font-weight:800;
                letter-spacing:2px;margin:12px 0 4px;">PROJO GROUP</h1>
              <p style="color:#7a5a55;font-size:12px;margin:0;">
                Rustenburg's Own. Ride. Shop. Deliver & Services.
              </p>
            </div>

            <!-- OTP Card -->
            <div style="background:#120808;border:1px solid rgba(232,184,75,0.2);
              border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
              <p style="color:#b8a09a;font-size:14px;margin:0 0 16px;">
                ${name ? `Hi ${name},` : "Hi there,"}<br/>
                Your verification code is:
              </p>
              <div style="background:#1c0f0f;border:2px solid #e8b84b;
                border-radius:12px;padding:20px;margin:0 0 16px;">
                <span style="font-size:42px;font-weight:800;color:#e8b84b;
                  letter-spacing:12px;">${otp}</span>
              </div>
              <p style="color:#7a5a55;font-size:12px;margin:0;">
                This code expires in <strong style="color:#e8b84b;">10 minutes</strong>
              </p>
            </div>

            <!-- Info -->
            <div style="background:#120808;border:1px solid rgba(139,26,26,0.3);
              border-radius:12px;padding:16px;margin-bottom:24px;">
              <p style="color:#b8a09a;font-size:13px;margin:0;line-height:1.6;">
                🚗 <strong style="color:#e8b84b;">R60 flat rate</strong> rides within Rustenburg<br/>
                📦 Same-day deliveries available<br/>
                🛍️ Book all services directly in the app
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align:center;">
              <p style="color:#3d1a1a;font-size:11px;margin:0 0 8px;">
                If you didn't request this code, please ignore this email.
              </p>
              <p style="color:#3d1a1a;font-size:11px;margin:0;">
                © 2023–2026 PROJO GROUP · Rustenburg, North West Province<br/>
                <a href="https://wa.me/27766147986" style="color:#e8b84b;">
                  WhatsApp: +27 76 614 7986
                </a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log(`[PROJO EMAIL] OTP sent to ${email}`);
    return { success: true };
  } catch (err) {
    console.error("[PROJO EMAIL] Failed:", err.message);
    console.log(`[PROJO EMAIL] Fallback OTP for ${email}: ${otp}`);
    return { success: false };
  }
}

async function sendWelcomeEmail(email, name) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"PROJO GROUP" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Welcome to PROJO GROUP! 🚗",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#0d0505;font-family:'Arial',sans-serif;">
          <div style="max-width:500px;margin:0 auto;padding:40px 20px;">
            <div style="text-align:center;margin-bottom:24px;">
              <h1 style="color:#e8b84b;font-size:22px;font-weight:800;letter-spacing:2px;">
                PROJO GROUP
              </h1>
            </div>
            <div style="background:#120808;border:1px solid rgba(232,184,75,0.2);
              border-radius:16px;padding:32px;margin-bottom:24px;">
              <h2 style="color:#f5ede8;font-size:20px;margin:0 0 12px;">
                Welcome, ${name}! 🎉
              </h2>
              <p style="color:#b8a09a;font-size:14px;line-height:1.7;margin:0 0 20px;">
                You're now part of <strong style="color:#e8b84b;">Rustenburg's Own</strong> 
                platform. Here's what you can do:
              </p>
              <div style="display:block;">
                <p style="color:#b8a09a;font-size:13px;margin:0 0 8px;">
                  🚗 <strong style="color:#e8b84b;">Book a Ride</strong> — R60 flat within Rustenburg
                </p>
                <p style="color:#b8a09a;font-size:13px;margin:0 0 8px;">
                  📦 <strong style="color:#e8b84b;">Package Delivery</strong> — Fast & reliable
                </p>
                <p style="color:#b8a09a;font-size:13px;margin:0 0 8px;">
                  🛍️ <strong style="color:#e8b84b;">Book Services</strong> — Cleaning, maintenance & more
                </p>
                <p style="color:#b8a09a;font-size:13px;margin:0;">
                  💰 <strong style="color:#e8b84b;">Earn Loyalty Points</strong> — 1 point per R10 spent
                </p>
              </div>
            </div>
            <div style="text-align:center;">
              <a href="https://projo-group.onrender.com" 
                style="background:#e8b84b;color:#1a0808;text-decoration:none;
                border-radius:10px;padding:14px 32px;font-size:14px;
                font-weight:800;display:inline-block;">
                Open PROJO GROUP App →
              </a>
            </div>
            <p style="text-align:center;color:#3d1a1a;font-size:11px;margin-top:24px;">
              © 2023–2026 PROJO GROUP · Rustenburg, North West Province
            </p>
          </div>
        </body>
        </html>
      `,
    });
    console.log(`[PROJO EMAIL] Welcome email sent to ${email}`);
  } catch (err) {
    console.error("[PROJO EMAIL] Welcome email failed:", err.message);
  }
}

module.exports = { sendOTPEmail, sendWelcomeEmail };
