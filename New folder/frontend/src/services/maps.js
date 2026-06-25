// ============================================================
// PROJO GROUP — Maps Service
// Leaflet + OpenStreetMap + OSRM — 100% FREE, no API key
// Default center: Rustenburg, North West Province, SA
// ============================================================

export const RUSTENBURG = {
  lat: -25.667,
  lng: 27.242,
  zoom: 13,
  name: "Rustenburg",
};

// Tile layer URL — OpenStreetMap (free, no key needed)
export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Dark tile layer — looks premium on dark theme
export const DARK_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
export const DARK_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

/**
 * Get real road distance and duration between two points
 * Uses OSRM public API — free, no key required
 */
export async function getRouteDistance(pickupLat, pickupLng, dropoffLat, dropoffLng) {
  try {
    // OSRM expects longitude first, then latitude
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${pickupLng},${pickupLat};${dropoffLng},${dropoffLat}` +
      `?overview=full&geometries=geojson&alternatives=false`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.code !== "Ok" || !data.routes?.length) {
      throw new Error("OSRM returned no route");
    }

    const route = data.routes[0];
    return {
      distanceKm: parseFloat((route.distance / 1000).toFixed(2)),
      durationMin: Math.round(route.duration / 60),
      geometry: route.geometry, // GeoJSON LineString for drawing route on map
    };
  } catch (err) {
    console.warn("[PROJO Maps] OSRM failed, using haversine fallback:", err.message);
    const km = haversineKm(pickupLat, pickupLng, dropoffLat, dropoffLng);
    return {
      distanceKm: km,
      durationMin: Math.round(km * 1.5),
      geometry: null,
    };
  }
}

/**
 * Reverse geocode: coordinates → address string
 * Uses Nominatim (OpenStreetMap) — free, no key
 */
export async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en", "User-Agent": "PROJO-GROUP-App" },
    });
    const data = await res.json();
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

/**
 * Forward geocode: address string → coordinates
 * Uses Nominatim — biased toward Rustenburg area
 */
export async function geocodeAddress(address) {
  try {
    const query = encodeURIComponent(`${address}, Rustenburg, South Africa`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5&countrycodes=za`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en", "User-Agent": "PROJO-GROUP-App" },
    });
    const results = await res.json();
    return results.map((r) => ({
      label: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }));
  } catch {
    return [];
  }
}

/**
 * Haversine fallback — straight-line distance × 1.25 ≈ road distance
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.25).toFixed(2));
}

/**
 * Check if coordinates are within Rustenburg (Zone 1 — R60 flat)
 */
export function isInsideRustenburg(lat, lng) {
  return lat >= -25.75 && lat <= -25.58 && lng >= 27.18 && lng <= 27.35;
}

/** Known Rustenburg area coordinates for the booking widget */
export const RUSTENBURG_AREAS = [
  { name: "Rustenburg CBD",         lat: -25.6694, lng: 27.2424, zone: 1 },
  { name: "Waterfall East",         lat: -25.6520, lng: 27.2630, zone: 1 },
  { name: "Boitekong",              lat: -25.6900, lng: 27.2100, zone: 1 },
  { name: "Tlhabane",               lat: -25.6970, lng: 27.2700, zone: 1 },
  { name: "Cashan",                 lat: -25.6550, lng: 27.2200, zone: 1 },
  { name: "Protea Park",            lat: -25.6400, lng: 27.2350, zone: 1 },
  { name: "Rustenburg Industrial",  lat: -25.6800, lng: 27.2500, zone: 1 },
  { name: "Phokeng",                lat: -25.7100, lng: 27.1900, zone: 1 },
  { name: "Swartruggens",           lat: -25.6600, lng: 26.6900, zone: 2 },
  { name: "Brits",                  lat: -25.6310, lng: 27.7800, zone: 2 },
  { name: "Sun City / Pilanesberg", lat: -25.3381, lng: 27.0937, zone: 2 },
  { name: "Magaliesburg",           lat: -25.9940, lng: 27.5430, zone: 2 },
  { name: "Johannesburg",           lat: -26.2041, lng: 28.0473, zone: 2 },
  { name: "Pretoria",               lat: -25.7479, lng: 28.2293, zone: 2 },
];
