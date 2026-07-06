// PROJO GROUP — Classifieds Expiry & Renewal Job
// Runs every 24 hours
// - Expires ads older than 2 months
// - Sends renewal notification 7 days before expiry
// - Sends expiry notification on expiry day

const { PrismaClient } = require("@prisma/client");
const { Resend } = require("resend");
const prisma = new PrismaClient();

async function runClassifiedsJob() {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 1. Expire ads that have passed their expiry date
    const expired = await prisma.classified.updateMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lt: now },
      },
      data: { status: "EXPIRED" },
    });

    if (expired.count > 0) {
      console.log(`[PROJO Classifieds] Expired ${expired.count} ads`);

      // Notify users their ad expired
      const expiredAds = await prisma.classified.findMany({
        where: { status: "EXPIRED", expiresAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
        include: { user: { select: { email: true, name: true, pushSubscription: true } } },
      });

      for (const ad of expiredAds) {
        await sendNotification(ad.user, {
          subject: `Your PROJO classified ad has expired — "${ad.title}"`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0d0505;color:#f0ede8;padding:32px;border-radius:12px">
              <h2 style="color:#e8b84b">Your Ad Has Expired</h2>
              <p>Hi ${ad.user.name?.split(" ")[0] || "there"},</p>
              <p>Your classified ad <strong style="color:#e8b84b">"${ad.title}"</strong> has expired after 2 months.</p>
              <p style="color:#6b6760">To keep your ad active, simply repost it on the PROJO app. It's 100% free!</p>
              <a href="https://app.projogroup.co.za/entertainment" style="display:inline-block;background:#e8b84b;color:#0a0a0a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:800;margin-top:16px">Repost Your Ad</a>
              <p style="color:#4a3030;font-size:12px;margin-top:24px">PROJO GROUP · app.projogroup.co.za · Rustenburg</p>
            </div>
          `,
          pushTitle: "📋 Your classified ad has expired",
          pushBody: `"${ad.title}" — tap to repost for free`,
        });
      }
    }

    // 2. Send 7-day renewal warning
    const aboutToExpire = await prisma.classified.findMany({
      where: {
        status: "ACTIVE",
        expiresAt: {
          gte: now,
          lte: sevenDaysFromNow,
        },
        // Only notify once — check renewedAt isn't recent
        renewedAt: { lt: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000) },
      },
      include: { user: { select: { email: true, name: true, pushSubscription: true } } },
    });

    for (const ad of aboutToExpire) {
      const daysLeft = Math.ceil((new Date(ad.expiresAt) - now) / (1000 * 60 * 60 * 24));

      await sendNotification(ad.user, {
        subject: `Your PROJO ad expires in ${daysLeft} days — "${ad.title}"`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0d0505;color:#f0ede8;padding:32px;border-radius:12px">
            <h2 style="color:#f59e0b">⚠️ Your Ad Expires in ${daysLeft} Days</h2>
            <p>Hi ${ad.user.name?.split(" ")[0] || "there"},</p>
            <p>Your classified ad <strong style="color:#e8b84b">"${ad.title}"</strong> will expire in <strong>${daysLeft} days</strong>.</p>
            <p style="color:#6b6760">After expiry it will no longer be visible to buyers. Renew it for free to keep it active for another 2 months.</p>
            <a href="https://app.projogroup.co.za/entertainment" style="display:inline-block;background:#e8b84b;color:#0a0a0a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:800;margin-top:16px">Renew My Ad Free</a>
            <p style="color:#4a3030;font-size:12px;margin-top:24px">PROJO GROUP · app.projogroup.co.za · Rustenburg</p>
          </div>
        `,
        pushTitle: `⚠️ Your ad expires in ${daysLeft} days`,
        pushBody: `"${ad.title}" — tap to renew for free`,
      });

      console.log(`[PROJO Classifieds] Sent ${daysLeft}-day warning for "${ad.title}"`);
    }

    console.log(`[PROJO Classifieds] Job complete — ${expired.count} expired, ${aboutToExpire.length} warnings sent`);
  } catch (err) {
    console.error("[PROJO Classifieds] Job error:", err.message);
  }
}

async function sendNotification(user, { subject, html, pushTitle, pushBody }) {
  // Email
  if (user.email && process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "noreply@projogroup.co.za",
        to: user.email,
        subject,
        html,
      });
    } catch (e) { console.log("[PROJO Classifieds] Email failed:", e.message); }
  }

  // Push notification
  if (user.pushSubscription) {
    try {
      const { sendPushNotification } = require("./push.service");
      const sub = JSON.parse(user.pushSubscription);
      await sendPushNotification(sub, {
        title: pushTitle,
        body: pushBody,
        icon: "/assets/logo/PROJO_LOGO.png",
        data: { url: "/entertainment" },
      });
    } catch (e) { console.log("[PROJO Classifieds] Push failed:", e.message); }
  }
}

module.exports = { runClassifiedsJob };
