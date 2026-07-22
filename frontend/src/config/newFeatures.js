// New feature registry — everything below ships FREE today. `upgradeAvailable`
// only marks the small number of specific capabilities that need a real,
// paid third-party service to become "real" instead of an honest
// placeholder. Nothing here is a paywall — it's a truthful label for
// something that currently works via a free workaround (a link-out, a
// disclosed limitation) and could become a first-party integration once
// you're paying for the service behind it.
//
// Use this to render nav tabs: map over the array, and for any entry with
// upgradeAvailable: true, wrap the label in <UpgradeBadge> (see
// UpgradeBadge.jsx) to get the glowing pill treatment.

export const NEW_FEATURES = [
  // --- Personal Tools ---
  { path: "/notes", label: "Notes", section: "Personal Tools" },
  { path: "/tasks", label: "Tasks", section: "Personal Tools" },
  { path: "/calendar", label: "Calendar", section: "Personal Tools",
    upgradeAvailable: true,
    upgradeNote: "Google/Outlook/Apple calendar sync needs OAuth app registrations with each provider — not built yet, see chat notes." },
  { path: "/journal", label: "Journal", section: "Personal Tools" },
  { path: "/goals", label: "Goals & Habits", section: "Personal Tools" },
  { path: "/shopping", label: "Shopping Lists", section: "Personal Tools" },
  { path: "/health", label: "Health", section: "Personal Tools" },
  { path: "/fitness", label: "Fitness", section: "Personal Tools" },
  { path: "/finance", label: "Finance", section: "Personal Tools" },
  { path: "/places", label: "Places", section: "Personal Tools" },
  { path: "/vault", label: "🔒 Secure Vault", section: "Personal Tools" },

  // --- Community ---
  { path: "/giveaway", label: "Giveaway Board", section: "Community" },
  { path: "/donations", label: "Donation Board", section: "Community" },
  { path: "/carpool", label: "School Carpool", section: "Community" },
  { path: "/noticeboard", label: "Noticeboard", section: "Community" },

  // --- Civic ---
  { path: "/road-hazards", label: "Road Hazards", section: "Civic",
    upgradeAvailable: true,
    upgradeNote: "Live Mode's \"Navigate\" is an honest Google Maps link-out today. Real in-app turn-by-turn needs a paid Maps/Mapbox Directions API key." },
  { path: "/utility-tracker", label: "Utility Tracker", section: "Civic",
    upgradeAvailable: true,
    upgradeNote: "Crowd-reported outages work today. Cross-referencing against EskomSePush's official load-shedding schedule needs a paid API subscription." },
];

// A second, smaller list: things that work today via a free workaround but
// would benefit from a paid service ACROSS the whole app, not just one new
// feature — surfaced separately since these aren't new tabs, they're
// upgrades to existing plumbing (auth, mostly).
export const PLATFORM_UPGRADE_GATES = [
  {
    id: "sms-otp",
    label: "Real SMS OTP verification",
    note: "All the new community features currently use name+phone with no OTP step — same gap, disclosed in every README this session. You already have Twilio wired up for the main PROJO app; extending it to these covers the gap in one place rather than one integration per feature.",
  },
];
