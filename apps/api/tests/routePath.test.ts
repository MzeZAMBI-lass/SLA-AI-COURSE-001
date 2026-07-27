import { haversineKm } from '../src/services/routingUtils';
import {
  destinationPoint,
  bearingBetween,
  hashWaypoints,
  buildFallbackGeometry,
} from '../src/services/routePath';

// School: Babati, Manyara (-3.7321, 36.6858)
const SCHOOL = { latitude: -3.7321, longitude: 36.6858 };

describe('destinationPoint', () => {
  it('moves due north (bearing 0) without changing longitude', () => {
    const point = destinationPoint(SCHOOL, 0, 10);
    expect(point.latitude).toBeGreaterThan(SCHOOL.latitude);
    expect(point.longitude).toBeCloseTo(SCHOOL.longitude, 3);
  });

  it('moves due south (bearing 180) without changing longitude', () => {
    const point = destinationPoint(SCHOOL, 180, 10);
    expect(point.latitude).toBeLessThan(SCHOOL.latitude);
    expect(point.longitude).toBeCloseTo(SCHOOL.longitude, 3);
  });

  it('moves due east (bearing 90) without changing latitude', () => {
    const point = destinationPoint(SCHOOL, 90, 10);
    expect(point.longitude).toBeGreaterThan(SCHOOL.longitude);
    expect(point.latitude).toBeCloseTo(SCHOOL.latitude, 3);
  });

  it('lands approximately the requested distance away', () => {
    const point = destinationPoint(SCHOOL, 45, 10);
    const dist = haversineKm(SCHOOL.latitude, SCHOOL.longitude, point.latitude, point.longitude);
    expect(dist).toBeGreaterThan(9.9);
    expect(dist).toBeLessThan(10.1);
  });
});

describe('bearingBetween', () => {
  it('is the inverse of destinationPoint for cardinal directions', () => {
    for (const bearing of [0, 90, 180, 270]) {
      const point = destinationPoint(SCHOOL, bearing, 10);
      expect(bearingBetween(SCHOOL, point)).toBeCloseTo(bearing, 0);
    }
  });
});

describe('hashWaypoints', () => {
  it('produces the same hash for identical ordered points', () => {
    const points = [SCHOOL, { latitude: -3.7, longitude: 36.7 }];
    expect(hashWaypoints(points)).toBe(hashWaypoints(points));
  });

  it('produces a different hash when a point changes', () => {
    const a = [SCHOOL, { latitude: -3.7, longitude: 36.7 }];
    const b = [SCHOOL, { latitude: -3.71, longitude: 36.7 }];
    expect(hashWaypoints(a)).not.toBe(hashWaypoints(b));
  });

  it('produces a different hash when point order changes', () => {
    const p1 = { latitude: -3.7, longitude: 36.7 };
    const p2 = { latitude: -3.75, longitude: 36.75 };
    expect(hashWaypoints([p1, p2])).not.toBe(hashWaypoints([p2, p1]));
  });
});

describe('buildFallbackGeometry', () => {
  it('produces a GeoJSON LineString in [lng, lat] order through all points', () => {
    const points = [SCHOOL, { latitude: -3.7, longitude: 36.7 }];
    const geometry = buildFallbackGeometry(points);
    expect(geometry.type).toBe('LineString');
    expect(geometry.coordinates).toEqual([
      [SCHOOL.longitude, SCHOOL.latitude],
      [36.7, -3.7],
    ]);
  });
});
