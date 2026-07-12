import { haversineKm, isWithinServiceArea, isValidCoordinates } from '../src/services/routingUtils';

// School: Babati, Manyara (-3.7321, 36.6858)
const SCHOOL_LAT = -3.7321;
const SCHOOL_LON = 36.6858;

beforeAll(() => {
  process.env.SCHOOL_LATITUDE = String(SCHOOL_LAT);
  process.env.SCHOOL_LONGITUDE = String(SCHOOL_LON);
  process.env.MAX_SERVICE_DISTANCE_KM = '50';
});

describe('haversineKm', () => {
  it('returns 0 for identical points', () => {
    expect(haversineKm(SCHOOL_LAT, SCHOOL_LON, SCHOOL_LAT, SCHOOL_LON)).toBe(0);
  });

  it('calculates roughly correct distance between two known points', () => {
    // Arusha (~160 km from Babati)
    const dist = haversineKm(SCHOOL_LAT, SCHOOL_LON, -3.3667, 36.6833);
    expect(dist).toBeGreaterThan(30);
    expect(dist).toBeLessThan(60);
  });
});

describe('isWithinServiceArea', () => {
  it('accepts a point near the school', () => {
    expect(isWithinServiceArea(SCHOOL_LAT + 0.1, SCHOOL_LON + 0.1)).toBe(true);
  });

  it('rejects a point 100 km away', () => {
    expect(isWithinServiceArea(-4.6, 36.7)).toBe(false);
  });
});

describe('isValidCoordinates', () => {
  it('accepts valid lat/lon', () => {
    expect(isValidCoordinates(-3.7321, 36.6858)).toBe(true);
  });

  it('rejects out-of-range latitude', () => {
    expect(isValidCoordinates(95, 36)).toBe(false);
  });

  it('rejects out-of-range longitude', () => {
    expect(isValidCoordinates(-3, 200)).toBe(false);
  });
});
