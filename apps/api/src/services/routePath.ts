import crypto from 'crypto';
import axios from 'axios';
import { supabase } from '../db/client';
import { haversineKm } from './routingUtils';
import type { LatLng, RouteLineString, RoutePath, RoutePathSource } from '@sla/shared';

const ORS_GEOJSON_URL = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
const EARTH_RADIUS_KM = 6371;
const ROAD_DISTANCE_FACTOR = 1.35; // Tanzania road correction factor, per planning.md §15
const AVG_SPEED_KMH = 40;

const ORIGIN_DISTANCE_KM = parseFloat(process.env.ROUTE_ORIGIN_DISTANCE_KM ?? '10');
const CACHE_TTL_MS = parseFloat(process.env.ROUTE_PATH_CACHE_TTL_DAYS ?? '7') * 24 * 60 * 60 * 1000;

/** Destination point given a start point, bearing (degrees) and distance (km). */
export function destinationPoint(origin: LatLng, bearingDegrees: number, distanceKm: number): LatLng {
  const delta = distanceKm / EARTH_RADIUS_KM;
  const theta = (bearingDegrees * Math.PI) / 180;
  const phi1 = (origin.latitude * Math.PI) / 180;
  const lambda1 = (origin.longitude * Math.PI) / 180;

  const phi2 = Math.asin(
    Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta),
  );
  const lambda2 =
    lambda1 +
    Math.atan2(
      Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
      Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2),
    );

  return { latitude: (phi2 * 180) / Math.PI, longitude: (lambda2 * 180) / Math.PI };
}

/** Compass bearing (0-360) from one point to another. */
export function bearingBetween(from: LatLng, to: LatLng): number {
  const phi1 = (from.latitude * Math.PI) / 180;
  const phi2 = (to.latitude * Math.PI) / 180;
  const deltaLambda = ((to.longitude - from.longitude) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);

  return ((theta * 180) / Math.PI + 360) % 360;
}

/** Stable cache key for an ordered set of waypoints — used to detect stale route geometry. */
export function hashWaypoints(points: LatLng[]): string {
  const key = points.map((p) => `${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`).join('|');
  return crypto.createHash('sha256').update(key).digest('hex');
}

/** Straight-line geometry through the given points, used when ORS is unavailable. */
export function buildFallbackGeometry(points: LatLng[]): RouteLineString {
  return {
    type: 'LineString',
    coordinates: points.map((p) => [p.longitude, p.latitude]),
  };
}

function sumRoadDistanceKm(points: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineKm(points[i - 1].latitude, points[i - 1].longitude, points[i].latitude, points[i].longitude);
  }
  return total * ROAD_DISTANCE_FACTOR;
}

async function fetchOrsGeometry(
  points: LatLng[],
): Promise<{ geometry: RouteLineString; distance_km: number; duration_min: number } | null> {
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) return null;

  const body = { coordinates: points.map((p) => [p.longitude, p.latitude]) };

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await axios.post(ORS_GEOJSON_URL, body, {
        headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
      });

      const feature = (response.data as Record<string, unknown>)?.['features'] as
        | Record<string, unknown>[]
        | undefined;
      const geometry = feature?.[0]?.['geometry'] as RouteLineString | undefined;
      const summary = (feature?.[0]?.['properties'] as Record<string, unknown> | undefined)?.['summary'] as
        | Record<string, number>
        | undefined;

      if (!geometry || !summary) throw new Error('ORS returned no geometry');

      return {
        geometry,
        distance_km: parseFloat((summary['distance'] / 1000).toFixed(3)),
        duration_min: Math.round(summary['duration'] / 60),
      };
    } catch {
      if (attempt === 3) return null;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
    }
  }

  return null;
}

interface RouteRow {
  id: string;
  route_name: string;
  origin_bearing_degrees: number | null;
  path_geometry: RouteLineString | null;
  path_distance_km: number | null;
  path_duration_min: number | null;
  path_waypoint_hash: string | null;
  path_source: RoutePathSource | null;
  path_cached_at: string | null;
  schools: { latitude: number; longitude: number };
}

async function resolveBearing(routeId: string, route: RouteRow, school: LatLng): Promise<number> {
  if (route.origin_bearing_degrees !== null && route.origin_bearing_degrees !== undefined) {
    return route.origin_bearing_degrees;
  }

  const { data } = await supabase
    .from('route_assignments')
    .select('students(student_locations(latitude, longitude))')
    .eq('route_id', routeId)
    .eq('status', 'active');

  type Nested = { students: { student_locations: LatLng[] } | null };
  const points = ((data ?? []) as unknown as Nested[])
    .flatMap((row) => row.students?.student_locations ?? [])
    .filter((p): p is LatLng => Boolean(p));

  if (!points.length) return 0; // No students yet to infer a direction from — default North.

  const farthest = points.reduce((best, p) => {
    const d = haversineKm(school.latitude, school.longitude, p.latitude, p.longitude);
    return d > best.d ? { p, d } : best;
  }, { p: points[0], d: -1 });

  return bearingBetween(school, farthest.p);
}

async function fetchOrderedStudentStops(routeId: string): Promise<LatLng[]> {
  const { data } = await supabase
    .from('route_assignments')
    .select('pickup_order, students(student_locations(latitude, longitude))')
    .eq('route_id', routeId)
    .eq('status', 'active')
    .order('pickup_order');

  type Nested = { students: { student_locations: LatLng[] } | null };
  return ((data ?? []) as unknown as Nested[])
    .flatMap((row) => row.students?.student_locations?.[0] ?? [])
    .filter((p): p is LatLng => Boolean(p));
}

/**
 * Returns the road-following path for a route: a synthetic origin point
 * ORIGIN_DISTANCE_KM out (along the route's bearing), through its assigned
 * students in pickup order, ending at the school. Geometry is cached on the
 * route row and only recomputed when the ordered waypoint set changes.
 */
export async function getRoutePath(routeId: string): Promise<RoutePath> {
  const { data: route, error } = await supabase
    .from('routes')
    .select(
      'id, route_name, origin_bearing_degrees, path_geometry, path_distance_km, path_duration_min, path_waypoint_hash, path_source, path_cached_at, schools(latitude, longitude)',
    )
    .eq('id', routeId)
    .single();

  if (error || !route) throw new Error('Route not found');
  const routeRow = route as unknown as RouteRow;

  const school: LatLng = { latitude: routeRow.schools.latitude, longitude: routeRow.schools.longitude };
  const bearing = await resolveBearing(routeId, routeRow, school);
  const origin = destinationPoint(school, bearing, ORIGIN_DISTANCE_KM);
  const stops = await fetchOrderedStudentStops(routeId);
  const waypoints = [origin, ...stops, school];
  const waypointHash = hashWaypoints(waypoints);

  const cacheFresh =
    routeRow.path_waypoint_hash === waypointHash &&
    routeRow.path_cached_at !== null &&
    Date.now() - new Date(routeRow.path_cached_at).getTime() < CACHE_TTL_MS;

  if (cacheFresh && routeRow.path_geometry) {
    return {
      route_id: routeRow.id,
      route_name: routeRow.route_name,
      origin,
      geometry: routeRow.path_geometry,
      distance_km: routeRow.path_distance_km ?? 0,
      duration_min: routeRow.path_duration_min ?? 0,
      source: routeRow.path_source ?? 'fallback',
      cached_at: routeRow.path_cached_at as string,
    };
  }

  const ors = await fetchOrsGeometry(waypoints);
  const result = ors ?? {
    geometry: buildFallbackGeometry(waypoints),
    distance_km: parseFloat(sumRoadDistanceKm(waypoints).toFixed(3)),
    duration_min: Math.round((sumRoadDistanceKm(waypoints) / AVG_SPEED_KMH) * 60),
  };
  const source: RoutePathSource = ors ? 'ors' : 'fallback';
  const cachedAt = new Date().toISOString();

  await supabase
    .from('routes')
    .update({
      path_geometry: result.geometry,
      path_distance_km: result.distance_km,
      path_duration_min: result.duration_min,
      path_waypoint_hash: waypointHash,
      path_source: source,
      path_cached_at: cachedAt,
    })
    .eq('id', routeId);

  return {
    route_id: routeRow.id,
    route_name: routeRow.route_name,
    origin,
    geometry: result.geometry,
    distance_km: result.distance_km,
    duration_min: result.duration_min,
    source,
    cached_at: cachedAt,
  };
}
