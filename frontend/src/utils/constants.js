// ============================================================
// PROJO GROUP — Frontend Constants
// Rustenburg, North West Province, South Africa
// ============================================================

// ─── MAP ─────────────────────────────────────────────────────
export const RUSTENBURG_CENTER = {
  lat: -25.667,
  lng: 27.242,
};
export const DEFAULT_MAP_ZOOM = 13;

// ─── PRICING ─────────────────────────────────────────────────
export const PRICING = {
  FLAT_RATE: 60,          // R60 inside Rustenburg
  PER_KM_RATE: 7.50,      // R7.50/km outside Rustenburg
  MIN_FARE: 60,           // R60 minimum always
  SURGE_FLAT: 70,         // R70 flat during peak hours
  SURGE_PCT: 15,          // 15% surge
  DRIVER_PCT: 80,         // Driver keeps 80%
  PROJO_PCT: 20,          // PROJO GROUP keeps 20%
};

export const VEHICLE_MULTIPLIERS = {
  ECONOMY:  1.0,
  COMFORT:  1.3,
  XL:       1.5,
  LUXURY:   2.5,
  BIKE:     1.0,
  VAN:      1.5,
  BUSINESS: 2.0,
};

export const VEHICLE_INFO = {
  ECONOMY: {
    label: "Economy",
    emoji: "🚗",
    description: "Affordable everyday rides",
    capacity: 4,
    multiplier: 1.0,
  },
  COMFORT: {
    label: "Comfort",
    emoji: "🚙",
    description: "Newer, more comfortable cars",
    capacity: 4,
    multiplier: 1.3,
  },
  XL: {
    label: "XL",
    emoji: "🚐",
    description: "SUVs & minivans for groups",
    capacity: 6,
    multiplier: 1.5,
  },
  LUXURY: {
    label: "Luxury",
    emoji: "🏎️",
    description: "Premium vehicles for special trips",
    capacity: 4,
    multiplier: 2.5,
  },
  BIKE: {
    label: "Delivery Bike",
    emoji: "🏍️",
    description: "Fast parcel delivery",
    capacity: 1,
    multiplier: 1.0,
  },
  VAN: {
    label: "Courier Boot",
    emoji: "🚛",
    description: "Large parcel & furniture delivery",
    capacity: 1,
    multiplier: 1.5,
  },
  BUSINESS: {
    label: "Business",
    emoji: "🚘",
    description: "Corporate & airport transfers",
    capacity: 4,
    multiplier: 2.0,
  },
};

// ─── SERVICE AREAS ───────────────────────────────────────────
export const ACTIVE_ZONES = [
  { name: "Rustenburg CBD", lat: -25.6694, lng: 27.2424, zone: 1 },
  { name: "Waterfall East", lat: -25.6520, lng: 27.2630, zone: 1 },
  { name: "Boitekong",      lat: -25.6900, lng: 27.2100, zone: 1 },
  { name: "Tlhabane",       lat: -25.6970, lng: 27.2700, zone: 1 },
  { name: "Cashan",         lat: -25.6550, lng: 27.2200, zone: 1 },
  { name: "Protea Park",    lat: -25.6400, lng: 27.2350, zone: 1 },
  { name: "Rustenburg Industrial", lat: -25.6800, lng: 27.2500, zone: 1 },
  { name: "Phokeng",        lat: -25.7100, lng: 27.1900, zone: 1 },
];

export const FUTURE_ZONES = [
  { name: "Swartruggens", lat: -25.6600, lng: 26.6900, zone: 2 },
  { name: "Brits",         lat: -25.6310, lng: 27.7800, zone: 2 },
  { name: "Sun City",      lat: -25.3381, lng: 27.0937, zone: 2 },
  { name: "Magaliesburg",  lat: -25.9940, lng: 27.5430, zone: 2 },
];

// ─── BRANDING ────────────────────────────────────────────────
export const BRAND = {
  name: "PROJO GROUP",
  tagline: "Rustenburg's Own. Ride. Shop. Deliver.",
  established: "2023",
  primaryColor: "#e8b84b",
  city: "Rustenburg",
  province: "North West Province",
  country: "South Africa",
  logoPath: "/assets/logo/LogoPlacementGoldShineEdit.png",
};

// ─── SOCIAL & CONTACT ────────────────────────────────────────
export const CONTACT = {
  whatsapp: "27766147986",
  whatsappLink: "https://wa.me/27766147986",
  phone: "+27 76 614 7986",
  email: "info@projogroup.co.za",
  website: "https://www.projogroup.co.za",
  shopLink: "https://take.app/projogroup",
  facebook: "https://www.facebook.com/projogroup247",
  instagram: "https://www.instagram.com/projogroup?igsh=dGNsdTk3NmlvMjh2",
  tiktok: "https://www.tiktok.com/@projo.group?_r=1&_t=ZS-94cnPR6ohsX",
  address: "Rustenburg, North West Province, South Africa",
};

// ─── FARE DISPLAY HELPERS ────────────────────────────────────
export function formatFare(amount) {
  if (amount % 1 === 0) return `R${amount.toFixed(0)}.00`;
  return `R${amount.toFixed(2)}`;
}

export function formatFareShort(amount) {
  if (amount % 1 === 0) return `R${amount.toFixed(0)}`;
  return `R${amount.toFixed(2)}`;
}

/**
 * Calculate fare on the frontend (uses approximate km)
 */
export function calculateFrontendFare(pickupZone, dropoffZone, vehicleType = "ECONOMY", distanceKm = 0) {
  const insideAreas = ACTIVE_ZONES.map((z) => z.name);
  const pickupInside = insideAreas.some((a) =>
    a.toLowerCase().includes(pickupZone?.toLowerCase()) ||
    pickupZone?.toLowerCase().includes(a.toLowerCase())
  );
  const dropoffInside = insideAreas.some((a) =>
    a.toLowerCase().includes(dropoffZone?.toLowerCase()) ||
    dropoffZone?.toLowerCase().includes(a.toLowerCase())
  );
  const multiplier = VEHICLE_MULTIPLIERS[vehicleType] || 1.0;

  if (pickupInside && dropoffInside) {
    const fare = PRICING.FLAT_RATE * multiplier;
    return {
      zone: 1,
      fare,
      label: `${formatFare(fare)} — Flat Rate (Rustenburg Area)`,
      type: "FLAT",
    };
  } else {
    const kmFare = distanceKm > 0 ? distanceKm * PRICING.PER_KM_RATE : PRICING.MIN_FARE;
    const fare = Math.max(PRICING.MIN_FARE, kmFare) * multiplier;
    return {
      zone: 2,
      fare,
      label: `${formatFare(fare)} — ${distanceKm > 0 ? `${distanceKm}km × R7.50/km` : "per km (min R60)"}`,
      type: "PER_KM",
    };
  }
}

// ─── PHONE FORMAT ────────────────────────────────────────────
export const PHONE_PREFIX = "+27";
export function formatSAPhone(raw) {
  // Convert 083xxxxxxx → +27 83 xxx xxxx
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("27")) return `+${digits}`;
  if (digits.startsWith("0")) return `+27${digits.slice(1)}`;
  return `+27${digits}`;
}

// ─── RIDE STATUS LABELS ──────────────────────────────────────
export const RIDE_STATUS_LABELS = {
  REQUESTED: "Finding your driver...",
  DRIVER_ASSIGNED: "Driver assigned",
  DRIVER_EN_ROUTE: "Driver on the way",
  ARRIVED_AT_PICKUP: "Driver arrived",
  IN_PROGRESS: "Ride in progress",
  COMPLETED: "Ride completed",
  CANCELLED: "Ride cancelled",
};
