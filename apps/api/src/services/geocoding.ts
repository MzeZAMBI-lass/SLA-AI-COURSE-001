import axios from 'axios';
import { ParsedLocation } from '@sla/shared';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const CACHE = new Map<string, { result: ParsedLocation; cachedAt: number }>();
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const CONFIDENCE_THRESHOLD = parseFloat(process.env.GEOCODE_CONFIDENCE_THRESHOLD ?? '0.5');

// Rate-limit: Nominatim allows 1 req/sec
let lastRequestAt = 0;
async function rateLimitedRequest(url: string, params: Record<string, string>) {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < 1100) {
    await new Promise((r) => setTimeout(r, 1100 - elapsed));
  }
  lastRequestAt = Date.now();
  return axios.get(url, { params, headers: { 'User-Agent': 'SLA-Transport/1.0' } });
}

export async function geocodeAddress(address: string): Promise<{
  location: ParsedLocation | null;
  needsReview: boolean;
  flagReason?: string;
}> {
  const cacheKey = address.toLowerCase().trim();
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return { location: cached.result, needsReview: cached.result.confidence < CONFIDENCE_THRESHOLD };
  }

  try {
    const response = await rateLimitedRequest(NOMINATIM_URL, {
      q: address,
      format: 'json',
      limit: '1',
      countrycodes: 'tz',
    });

    const results = response.data as Array<Record<string, unknown>>;
    if (!results.length) {
      return { location: null, needsReview: true, flagReason: 'Nominatim returned no results' };
    }

    const top = results[0];
    const confidence = parseFloat((top['importance'] as string) ?? '0');
    const location: ParsedLocation = {
      latitude: parseFloat(top['lat'] as string),
      longitude: parseFloat(top['lon'] as string),
      source: 'text',
      confidence,
      address_text: top['display_name'] as string,
    };

    CACHE.set(cacheKey, { result: location, cachedAt: Date.now() });

    if (confidence < CONFIDENCE_THRESHOLD) {
      return {
        location,
        needsReview: true,
        flagReason: `Low geocoding confidence (${confidence.toFixed(2)}) — staff verification required`,
      };
    }

    return { location, needsReview: false };
  } catch (err) {
    // Attempt Google Maps fallback if key is configured
    if (process.env.GOOGLE_MAPS_API_KEY) {
      return geocodeWithGoogle(address);
    }
    return {
      location: null,
      needsReview: true,
      flagReason: 'Geocoding service unavailable — manual entry required',
    };
  }
}

async function geocodeWithGoogle(address: string): Promise<{
  location: ParsedLocation | null;
  needsReview: boolean;
  flagReason?: string;
}> {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { address, key: process.env.GOOGLE_MAPS_API_KEY, region: 'tz' },
    });
    const data = response.data as Record<string, unknown>;
    const results = data['results'] as Array<Record<string, unknown>>;
    if (!results?.length) {
      return { location: null, needsReview: true, flagReason: 'Google geocoding returned no results' };
    }
    const geometry = results[0]['geometry'] as Record<string, Record<string, number>>;
    return {
      location: {
        latitude: geometry['location']['lat'],
        longitude: geometry['location']['lng'],
        source: 'text',
        confidence: 0.7,
        address_text: results[0]['formatted_address'] as string,
      },
      needsReview: false,
    };
  } catch {
    return { location: null, needsReview: true, flagReason: 'All geocoding services failed' };
  }
}
