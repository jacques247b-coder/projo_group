// ============================================================
// PROJO GROUP — Fare Calculator
// Rustenburg Zone 1: R60 flat | Zone 2: R7.50/km
// Distance via OSRM (free) — no Google Maps needed
// ============================================================

/**
 * Rustenburg area bounding box (approximate)
 * Covers: CBD, Waterfall East, Boitekong, Tlhabane,
 *         Cashan, Protea Park, Industrial, Phokeng
 */
const RUSTENBURG_BOUNDS = {
  swLat: -25.75,
  swLng: 27.18,
  neLat: -25.58,
  neLng: 27.35,
};

/** Pricing constants — hardcoded per PROJO GROUP spec */
const PRICING = {
  FLAT_RATE_ZAR: 60.0,
  PER_KM_RATE_ZAR: 7.50,
  MIN_FARE_ZAR: 60.0,
  SURGE_MULTIPLIER: 1.15,
  SURGE_FLAT_ZAR: 70.0,
  DRIVER_PCT: 0.80,
  PROJO_PCT: 0.20,
};

/** Vehicle type multipliers */
const VEHICLE_MULTIPLIERS = {
  ECONOMY:  1.0,
  COMFORT:  1.3,
  XL:       1.5,
  LUXURY:   2.5,
  BIKE:     1.0,
  VAN:      1.5,
  BUSINESS: 2.0,
};

/** Peak hour check (SAST = UTC+2) */
function isPeakHour(date = new Date()) {
  const hour = date.getHours();
  return (hour >= 6 && hour < 9) || (hour >= 16 && hour < 19);
}

/** Check if coordinate is within Rustenburg */
function isInsideRustenburg(lat, lng) {
  return (
    lat >= RUSTENBURG_BOUNDS.swLat &&
    lat <= RUSTENBURG_BOUNDS.neLat &&
    lng >= RUSTENBURG_BOUNDS.swLng &&
    lng <= RUSTENBURG_BOUNDS.neLng
  );
}

/** Both points inside = Zone 1 flat rate */
function isZone1(pickupLat, pickupLng, dropoffLat, dropoffLng) {
  return (
    isInsideRustenburg(pickupLat, pickupLng) &&
    isInsideRustenburg(dropoffLat, dropoffLng)
  );
}

/**
 * Calculate fare. distanceKm comes from OSRM (free routing API).
 */
function calculateFare({
  pickupLat, pickupLng,
  dropoffLat, dropoffLng,
  distanceKm = 0,
  vehicleType = "ECONOMY",
  requestedAt = new Date(),
}) {
  const zone1 = isZone1(pickupLat, pickupLng, dropoffLat, dropoffLng);
  const surge = isPeakHour(requestedAt);
  const multiplier = VEHICLE_MULTIPLIERS[vehicleType] || 1.0;

  if (zone1) {
    const baseFare = surge ? PRICING.SURGE_FLAT_ZAR : PRICING.FLAT_RATE_ZAR;
    const totalFare = parseFloat((baseFare * multiplier).toFixed(2));
    return {
      zone: "ZONE_1_FLAT",
      fareZone: "ZONE_1_FLAT",
      baseFare,
      multiplier,
      surge,
      surgePct: surge ? 15 : 0,
      totalFare,
      driverPayout: parseFloat((totalFare * PRICING.DRIVER_PCT).toFixed(2)),
      projoCommission: parseFloat((totalFare * PRICING.PROJO_PCT).toFixed(2)),
      distanceKm: null,
      fareType: "FLAT_RATE",
      displayString: totalFare % 1 === 0 ? `R${totalFare}.00` : `R${totalFare.toFixed(2)}`,
      fareLabel: `R${totalFare % 1 === 0 ? totalFare.toFixed(0) : totalFare.toFixed(2)} — Flat Rate (Rustenburg Area)`,
    };
  } else {
    const kmFare = distanceKm * PRICING.PER_KM_RATE_ZAR;
    const afterMin = Math.max(PRICING.MIN_FARE_ZAR, kmFare);
    const vehicleFare = afterMin * multiplier;
    const totalFare = parseFloat((surge ? vehicleFare * PRICING.SURGE_MULTIPLIER : vehicleFare).toFixed(2));
    return {
      zone: "ZONE_2_PER_KM",
      fareZone: "ZONE_2_PER_KM",
      baseFare: afterMin,
      multiplier,
      surge,
      surgePct: surge ? 15 : 0,
      ratePerKm: PRICING.PER_KM_RATE_ZAR,
      distanceKm,
      totalFare,
      driverPayout: parseFloat((totalFare * PRICING.DRIVER_PCT).toFixed(2)),
      projoCommission: parseFloat((totalFare * PRICING.PROJO_PCT).toFixed(2)),
      fareType: "PER_KM",
      displayString: `R${totalFare.toFixed(2)}`,
      fareLabel: `R${totalFare.toFixed(2)} — ${distanceKm.toFixed(1)}km × R7.50/km`,
    };
  }
}

module.exports = {
  calculateFare,
  isInsideRustenburg,
  isZone1,
  isPeakHour,
  PRICING,
  VEHICLE_MULTIPLIERS,
  RUSTENBURG_BOUNDS,
};
