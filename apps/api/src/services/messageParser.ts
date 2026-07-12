import { ClassificationResult, ParsedLocation } from '@sla/shared';

const GOOGLE_MAPS_PATTERNS = [
  /@(-?\d+\.\d+),(-?\d+\.\d+)/,
  /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
  /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
  /\/maps\/place\/[^/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/,
];

const GOOGLE_MAPS_URL_PATTERN =
  /https?:\/\/(maps\.app\.goo\.gl|www\.google\.com\/maps|maps\.google\.com|goo\.gl\/maps)/i;

const OSM_PATTERN =
  /https?:\/\/www\.openstreetmap\.org\/#map=\d+\/(-?\d+\.\d+)\/(-?\d+\.\d+)/i;

export function classifyMessage(payload: Record<string, unknown>): ClassificationResult {
  // Scenario A — native WhatsApp location pin
  if (payload['type'] === 'location') {
    const loc = payload['location'] as Record<string, unknown> | undefined;
    if (loc && typeof loc['latitude'] === 'number' && typeof loc['longitude'] === 'number') {
      return {
        type: 'location',
        location: {
          latitude: loc['latitude'] as number,
          longitude: loc['longitude'] as number,
          source: 'pin',
          confidence: 1.0,
          address_text: (loc['address'] as string | undefined) ?? (loc['name'] as string | undefined),
        },
      };
    }
  }

  // Scenario B — text message with a maps link
  if (payload['type'] === 'text') {
    const text = (payload['text'] as Record<string, unknown> | undefined)?.['body'] as
      | string
      | undefined;
    if (!text) return { type: 'unknown', flagReason: 'Empty text message' };

    // Google Maps link
    if (GOOGLE_MAPS_URL_PATTERN.test(text)) {
      const coords = extractGoogleMapsCoords(text);
      if (coords) {
        return { type: 'link', location: { ...coords, source: 'link', confidence: 0.95 } };
      }
      // Short URL — needs server-side redirect resolution
      if (/maps\.app\.goo\.gl|goo\.gl\/maps/i.test(text)) {
        return {
          type: 'link',
          flagReason: 'Short Google Maps URL — redirect resolution required',
          rawText: text,
        };
      }
    }

    // OSM link
    const osmMatch = text.match(OSM_PATTERN);
    if (osmMatch) {
      return {
        type: 'link',
        location: {
          latitude: parseFloat(osmMatch[1]),
          longitude: parseFloat(osmMatch[2]),
          source: 'link',
          confidence: 0.95,
        },
      };
    }

    // Plain text — needs geocoding
    if (text.trim().length > 5) {
      return { type: 'text', needsGeocoding: true, rawText: text.trim() };
    }

    return { type: 'unknown', flagReason: 'Text too short to geocode' };
  }

  // Image or other unsupported type
  if (payload['type'] === 'image') {
    return { type: 'image', flagReason: 'Map screenshot — requires manual coordinate entry' };
  }

  return { type: 'unknown', flagReason: `Unsupported message type: ${payload['type']}` };
}

function extractGoogleMapsCoords(url: string): Omit<ParsedLocation, 'source' | 'confidence'> | null {
  for (const pattern of GOOGLE_MAPS_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) };
    }
  }
  return null;
}
