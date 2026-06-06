// ============================================================
// PROJO GROUP — Distance Calculator
// Uses OSRM (Open Source Routing Machine) — FREE, no API key
// Replaces Google Maps Distance API completely
// ============================================================

const https = require("https");

const OSRM_BASE = process.env.OSRM_BASE_URL || "https://router.project-osrm.org";

/**
 * Get real road distance (km) and duration (minutes) between two points
 * using OSRM — completely free, no API key required.
 *
 * @param {number} pickupLat
 * @param {number} pickupLng
 * @param {number} dropoffLat
 * @param {number} dropoffLng
 * @returns {Promise<{distanceKm: number, durationMin: number}>}
 */
function getOSRMDistance(pickupLat, pickupLng, dropoffLat, dropoffLng) {
  return new Promise((resolve, reject) => {
    // OSRM expects: lng,lat (note: longitude first)
    const url =
      `${OSRM_BASE}/route/v1/driving/` +
      `${pickupLng},${pickupLat};${dropoffLng},${dropoffLat}` +
      `?overview=false&alternatives=false`;

    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.code !== "Ok" || !json.routes?.length) {
              // Fallback to straight-line haversine if OSRM fails
              const km = haversineKm(pickupLat, pickupLng, dropoffLat, dropoffLng);
              return resolve({ distanceKm: km, durationMin: Math.round(km * 1.5) });
            }
            const route = json.routes[0];
            const distanceKm = parseFloat((route.distance / 1000).toFixed(2));
            const durationMin = Math.round(route.duration / 60);
            resolve({ distanceKm, durationMin });
          } catch (e) {
            // Fallback to haversine on parse error
            const km = haversineKm(pickupLat, pickupLng, dropoffLat, dropoffLng);
            resolve({ distanceKm: km, durationMin: Math.round(km * 1.5) });
          }
        });
      })
      .on("error", () => {
        // Fallback to haversine on network error
        const km = haversineKm(pickupLat, pickupLng, dropoffLat, dropoffLng);
        resolve({ distanceKm: km, durationMin: Math.round(km * 1.5) });
      });
  });
}

/**
 * Haversine straight-line distance fallback (when OSRM unreachable)
 * Slightly underestimates real road distance — used as fallback only
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // Multiply by 1.25 to approximate road distance from straight line
  return parseFloat((R * c * 1.25).toFixed(2));
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

module.exports = { getOSRMDistance, haversineKm };
