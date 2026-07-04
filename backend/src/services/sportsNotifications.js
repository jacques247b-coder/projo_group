// PROJO GROUP — Sports Notifications Job
// Runs on backend — checks upcoming matches and sends push notifications
// Called by a cron job every 15 minutes

const { PrismaClient } = require("@prisma/client");
const { sendPushNotification } = require("./push.service");
const prisma = new PrismaClient();

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
const PSL_LEAGUE_ID = 288;
const RUGBY_LEAGUE_ID = 175;

// Map league IDs to sport preference keys stored in localStorage
const LEAGUE_PREF_MAP = {
  288: "psl",        // Betway Premiership
  289: "psl",        // National First Division
  175: "urc",        // United Rugby Championship
  58:  "springboks", // Rugby Championship
  6:   "bafana",     // Africa Cup of Nations
  7:   "bafana",     // AFCON Qualifier
  67:  "cricket",    // Cricket (if added later)
};

async function checkAndNotifyMatches() {
  if (!API_FOOTBALL_KEY) return;
  try {
    const today = new Date().toISOString().split("T")[0];

    // Fetch today's PSL + Rugby fixtures
    const [soccerRes, rugbyRes] = await Promise.all([
      fetch(`https://v3.football.api-sports.io/fixtures?league=${PSL_LEAGUE_ID}&season=2025&date=${today}`,
        { headers: { "x-apisports-key": API_FOOTBALL_KEY } }),
      fetch(`https://v1.rugby.api-sports.io/games?league=${RUGBY_LEAGUE_ID}&season=2025&date=${today}`,
        { headers: { "x-apisports-key": API_FOOTBALL_KEY } }),
    ]);

    const soccerData = await soccerRes.json();
    const rugbyData = await rugbyRes.json();
    const fixtures = [
      ...(soccerData.response || []).map(f => ({ ...f, sport: "soccer" })),
      ...(rugbyData.response || []).map(f => ({ ...f, sport: "rugby" })),
    ];

    const now = Date.now();

    for (const fixture of fixtures) {
      const kickoff = new Date(fixture.fixture?.date || fixture.date).getTime();
      const minutesToKickoff = (kickoff - now) / 60000;
      const home = fixture.teams?.home?.name || "";
      const away = fixture.teams?.away?.name || "";
      const league = fixture.league?.name || "";
      const sport = fixture.sport === "soccer" ? "⚽" : "🏉";
      const fixtureId = fixture.fixture?.id || fixture.id;

      // Notify 30 minutes before kickoff
      const notifKey = `sports_notif_${fixtureId}_30min`;
      const alreadySent = await prisma.notification.findFirst({
        where: { referenceId: notifKey }
      }).catch(() => null);

      if (minutesToKickoff > 0 && minutesToKickoff <= 30 && !alreadySent) {
        await broadcastSportsNotification({
          title: `${sport} Kickoff in 30 minutes!`,
          body: `${home} vs ${away} — ${league}`,
          url: "/sports",
        });

        // Log to prevent duplicate
        await prisma.notification.create({
          data: {
            userId: "system",
            title: `${home} vs ${away}`,
            body: "30 min notification sent",
            type: "SPORTS",
            referenceId: notifKey,
          },
        }).catch(() => {});
      }

      // Notify when match goes live
      const liveKey = `sports_notif_${fixtureId}_live`;
      const liveStatuses = ["1H", "HT", "2H", "LIVE"];
      const isLive = liveStatuses.includes(fixture.fixture?.status?.short);
      const liveAlreadySent = await prisma.notification.findFirst({
        where: { referenceId: liveKey }
      }).catch(() => null);

      if (isLive && !liveAlreadySent) {
        const score = fixture.goals ? `${fixture.goals.home ?? 0}-${fixture.goals.away ?? 0}` : "";
        await broadcastSportsNotification({
          title: `${sport} LIVE NOW — ${home} vs ${away}`,
          body: `${score ? `Score: ${score} · ` : ""}${league}`,
          url: "/sports",
        });

        await prisma.notification.create({
          data: {
            userId: "system",
            title: `${home} vs ${away}`,
            body: "Live notification sent",
            type: "SPORTS",
            referenceId: liveKey,
          },
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.error("[PROJO Sports] Notification error:", err.message);
  }
}

async function broadcastSportsNotification({ title, body, url }) {
  try {
    // Only notify users who opted in to sports notifications
    // We use pushSubscription field — send to all subscribed users
    const users = await prisma.user.findMany({
      where: {
        pushSubscription: { not: null },
        // Future: add sportsNotifications boolean field to User model
      },
      select: { pushSubscription: true },
    });

    let sent = 0;
    for (const user of users) {
      try {
        const sub = JSON.parse(user.pushSubscription);
        await sendPushNotification(sub, {
          title,
          body,
          icon: "/assets/logo/PROJO_LOGO.png",
          badge: "/assets/logo/PROJO_LOGO.png",
          data: { url },
        });
        sent++;
      } catch { /* expired subscription */ }
    }
    console.log(`[PROJO Sports] Notified ${sent} devices: ${title}`);
  } catch (err) {
    console.error("[PROJO Sports] Broadcast error:", err.message);
  }
}

module.exports = { checkAndNotifyMatches };
