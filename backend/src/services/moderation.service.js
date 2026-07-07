// PROJO GROUP — Community Chat Moderation Service
// Handles: contact-info detection (the anti-circumvention rule for Premium
// Dating), profanity filtering, and flood/spam protection.
//
// This runs BEFORE a message is ever broadcast or persisted as visible.
// If a message trips a rule, it is held/blocked and logged — it never
// reaches other users in the room.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── 1. CONTACT INFO DETECTION ───────────────────────────────────
// Goal: stop people using the "anonymous" Community Chat as a back-door to
// swap phone numbers / emails / socials and skip Premium Dating entirely.

const WORD_NUMBERS = {
  zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5",
  six: "6", seven: "7", eight: "8", nine: "9", oh: "0",
};

function normalizeForContactScan(raw) {
  let text = raw.toLowerCase();

  // Common obfuscations people use to sneak past filters
  text = text
    .replace(/\(at\)|\[at\]|\s+at\s+|\bat\b/g, "@")
    .replace(/\(dot\)|\[dot\]|\s+dot\s+|\bdot\b/g, ".")
    .replace(/\bunderscore\b/g, "_")
    .replace(/\bplus\b/g, "+");

  // Spelled-out digits ("zero eight two ...") → actual digits
  text = text.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|oh)\b/g,
    (m) => WORD_NUMBERS[m] || m);

  return text;
}

function stripSeparators(text) {
  // Remove spaces/dots/dashes between digits so "08 2 123 4567" or
  // "082-123-4567" still gets caught as a phone number
  return text.replace(/(\d)[\s.\-\u2013\u2014]+(?=\d)/g, "$1");
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9][a-z0-9.-]*\.[a-z]{2,}/i;

// South African-friendly + generic international phone matcher.
// Looks for 8+ digit runs (after separator-stripping) optionally prefixed
// with + or 0, which covers "0821234567", "+27821234567", "27 82 123 4567".
const PHONE_RE = /(\+?\d{8,15})/;

const SOCIAL_HANDLE_RE =
  /\b(whatsapp|whats\s*app|wa\.me|insta(gram)?|snapchat|snap|telegram|tg|facebook|fb|twitter|x\.com|tiktok|signal)\b[\s:.\-]{0,15}(@|#)?[a-z0-9._]{2,}/i;

const URL_RE = /\b((https?:\/\/)?(www\.)?[a-z0-9-]+\.(com|co\.za|net|org|me|io)\b\S*)/i;

function detectContactInfo(rawContent) {
  const normalized = normalizeForContactScan(rawContent);
  const stripped = stripSeparators(normalized);

  if (EMAIL_RE.test(normalized) || EMAIL_RE.test(rawContent)) {
    return { blocked: true, reason: "EMAIL_ADDRESS" };
  }
  if (PHONE_RE.test(stripped)) {
    return { blocked: true, reason: "PHONE_NUMBER" };
  }
  if (SOCIAL_HANDLE_RE.test(normalized)) {
    return { blocked: true, reason: "SOCIAL_HANDLE" };
  }
  if (URL_RE.test(rawContent)) {
    return { blocked: true, reason: "EXTERNAL_LINK" };
  }
  return { blocked: false };
}

// ── 2. PROFANITY FILTER (English, Afrikaans, Zulu) ─────────────
// Lightweight, extensible word-list filter covering the three languages
// most common around Rustenburg & surrounds. Mild hits get masked in place;
// nothing here needs to reproduce slurs, so the lists stay generic —
// extend per-language arrays as needed for your community's standards.

const PROFANITY_EN = [
  "fuck", "shit", "bitch", "cunt", "asshole", "dick", "bastard", "whore", "slut",
];

const PROFANITY_AF = [
  // Afrikaans profanity/insults
  "poes", "kak", "fok", "fokken", "voetsek", "gatvol", "doos", "moer", "hoer",
  "naaier", "piel", "poephol", "teef", "bliksem", "kakhuis",
];

const PROFANITY_ZU = [
  // isiZulu profanity/insults
  "msunu", "unyoko", "phuza", "phekula", "voester", "isishimane", "inja",
  "sfebe", "ipenge",
];

const PROFANITY_WORDS = [...PROFANITY_EN, ...PROFANITY_AF, ...PROFANITY_ZU];

const SEVERE_WORDS = new Set(["cunt", "poes", "msunu"]);

function scanProfanity(rawContent) {
  const lower = rawContent.toLowerCase();
  let masked = rawContent;
  let hit = null;
  let severe = false;

  for (const word of PROFANITY_WORDS) {
    const re = new RegExp(`\\b${word}\\b`, "gi");
    if (re.test(lower)) {
      hit = word;
      if (SEVERE_WORDS.has(word)) severe = true;
      masked = masked.replace(re, (m) => m[0] + "*".repeat(m.length - 1));
    }
  }
  return { hit: !!hit, severe, masked };
}

// ── 3. FLOOD / SPAM PROTECTION ──────────────────────────────────
// In-memory rolling window per user. Fine for a single Render instance;
// swap for Redis if you ever scale to multiple backend instances.

const MAX_MESSAGES = 6;
const WINDOW_MS = 10_000; // 6 messages per 10 seconds per user
const recentSends = new Map(); // userId -> [timestamps]

function isFlooding(userId) {
  const now = Date.now();
  const arr = (recentSends.get(userId) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  recentSends.set(userId, arr);
  return arr.length > MAX_MESSAGES;
}

// ── 4. LOGGING ───────────────────────────────────────────────────
async function logModerationEvent({ userId, roomId, messageId, action, reason = "", detail = "" }) {
  try {
    await prisma.chatModerationEvent.create({
      data: { userId, roomId, messageId, action, reason, detail },
    });
  } catch (e) {
    console.error("[Moderation] Failed to log event:", e.message);
  }
}

// ── 5. SANCTIONS (mute/ban) CHECK ───────────────────────────────
async function getActiveSanction(userId, roomId) {
  const now = new Date();
  const sanction = await prisma.chatSanction.findFirst({
    where: {
      userId,
      isActive: true,
      OR: [{ roomId: null }, { roomId }],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
    },
    orderBy: { createdAt: "desc" },
  });
  return sanction || null;
}

// ── MAIN ENTRY POINT ─────────────────────────────────────────────
// Call this before persisting/broadcasting any chat message.
// `roomMode`: "ANONYMOUS" (Dating Lounge — blocks contact info) or
// "OPEN_LOCAL" (PROJO Community — contact info & photos are allowed).
async function moderateMessage({ userId, roomId, type, content, roomMode = "ANONYMOUS" }) {
  // 1. Active mute/ban?
  const sanction = await getActiveSanction(userId, roomId);
  if (sanction) {
    return {
      allowed: false,
      publicReason:
        sanction.type === "BAN"
          ? "You've been banned from chat."
          : "You're temporarily muted in chat.",
    };
  }

  // 2. Flood protection — applies to every room
  if (isFlooding(userId)) {
    await logModerationEvent({
      userId, roomId, action: "FLOOD_BLOCKED",
      reason: "Rate limit exceeded", detail: `${MAX_MESSAGES}/${WINDOW_MS}ms`,
    });
    return { allowed: false, publicReason: "You're sending messages too fast — slow down a little." };
  }

  // Only text-like content needs contact-info / profanity scanning
  if ((type === "text" || type === undefined) && content) {
    // 3. Contact-info circumvention check — ANONYMOUS (Dating Lounge) rooms only.
    // OPEN_LOCAL (PROJO Community) rooms allow contact info & photos by design.
    if (roomMode === "ANONYMOUS") {
      const contactCheck = detectContactInfo(content);
      if (contactCheck.blocked) {
        await logModerationEvent({
          userId, roomId, action: "BLOCKED_CONTACT_INFO",
          reason: contactCheck.reason, detail: content.slice(0, 300),
        });
        return {
          allowed: false,
          heldForReview: true,
          flagReason: contactCheck.reason,
          publicReason:
            "Sharing phone numbers, emails, or social media handles isn't allowed in the Dating Lounge. " +
            "Connect through PROJO Dating's Premium messaging instead.",
        };
      }
    }

    // 4. Profanity (English/Afrikaans/Zulu) — mask and let it through, but log it;
    // severe hits are held for review. Applies in every room.
    const profanityCheck = scanProfanity(content);
    if (profanityCheck.hit) {
      await logModerationEvent({
        userId, roomId,
        action: profanityCheck.severe ? "BLOCKED_PROFANITY" : "MASKED_PROFANITY",
        detail: content.slice(0, 300),
      });
      if (profanityCheck.severe) {
        return {
          allowed: false,
          heldForReview: true,
          flagReason: "PROFANITY",
          publicReason: "That message was held for moderator review.",
        };
      }
      return { allowed: true, status: "VISIBLE", content: profanityCheck.masked, isFlagged: true, flagReason: "PROFANITY_MASKED" };
    }
  }

  return { allowed: true, status: "VISIBLE", content };
}

module.exports = {
  moderateMessage,
  detectContactInfo,
  scanProfanity,
  isFlooding,
  logModerationEvent,
  getActiveSanction,
};
