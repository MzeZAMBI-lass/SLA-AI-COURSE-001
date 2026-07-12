import axios from 'axios';

const ORS_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';
const CACHE = new Map<string, { distance_km: number; duration_min: number; cachedAt: number }>();
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Haversine straight-line distance in km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function calculateRoute(
  studentLat: number,
  studentLon: number,
  schoolLat: number,
  schoolLon: number,
): Promise<{ distance_km: number; duration_min: number; source: 'ors' | 'haversine' }> {
  const cacheKey = `${studentLat.toFixed(5)},${studentLon.toFixed(5)}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return { ...cached, source: 'ors' };
  }

  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) {
    return fallback(studentLat, studentLon, schoolLat, schoolLon);
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await axios.post(
        ORS_URL,
        { coordinates: [[studentLon, studentLat], [schoolLon, schoolLat]] },
        { headers: { Authorization: apiKey, 'Content-Type': 'application/json' } },
      );

      const summary = (response.data as Record<string, unknown>)?.['routes']?.[0]?.['summary'] as
        | Record<string, number>
        | undefined;

      if (!summary) throw new Error('ORS returned empty summary');

      const result = {
        distance_km: parseFloat((summary['distance'] / 1000).toFixed(3)),
        duration_min: Math.round(summary['duration'] / 60),
      };

      CACHE.set(cacheKey, { ...result, cachedAt: Date.now() });
      return { ...result, source: 'ors' };
    } catch (err) {
      if (attempt === 3) break;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
    }
  }

  return fallback(studentLat, studentLon, schoolLat, schoolLon);
}

function fallback(lat1: number, lon1: number, lat2: number, lon2: number) {
  // Tanzania road correction factor 1.35 per planning.md §15
  const straight = haversineKm(lat1, lon1, lat2, lon2);
  return {
    distance_km: parseFloat((straight * 1.35).toFixed(3)),
    duration_min: Math.round((straight * 1.35) / 40 * 60), // Assume 40 km/h avg
    source: 'haversine' as const,
  };
}
