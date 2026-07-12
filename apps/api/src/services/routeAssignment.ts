import { supabase } from '../db/client';
import { RouteSuggestion } from '@sla/shared';
import { haversineKm } from './routingUtils';

const CAPACITY_PENALTY_THRESHOLD = 0.8; // Routes >80% full score lower

export async function suggestRoute(
  studentLat: number,
  studentLon: number,
): Promise<RouteSuggestion | null> {
  const { data: routes, error } = await supabase
    .from('routes')
    .select(
      `*, route_assignments(count), route_assignments!inner(students(student_locations(latitude, longitude)))`,
    )
    .eq('active', true);

  if (error || !routes?.length) return null;

  const scored: RouteSuggestion[] = [];

  for (const route of routes) {
    const currentCount = (route.route_assignments as Array<{ count: number }>)[0]?.count ?? 0;
    if (currentCount >= route.capacity) continue;

    // Calculate additional detour if this student joins the route
    const detour_km = estimateDetour(studentLat, studentLon, route);
    const capacityRatio = currentCount / route.capacity;
    const capacityWeight = capacityRatio > CAPACITY_PENALTY_THRESHOLD ? 0.5 : 1.0;
    const score = (1 / Math.max(detour_km, 0.1)) * capacityWeight;

    scored.push({ route, score, detour_km, current_count: currentCount });
  }

  if (!scored.length) return null;

  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}

function estimateDetour(
  studentLat: number,
  studentLon: number,
  route: Record<string, unknown>,
): number {
  // Use school as the anchor point for detour estimation
  const schoolLat = parseFloat(process.env.SCHOOL_LATITUDE ?? '-3.7321');
  const schoolLon = parseFloat(process.env.SCHOOL_LONGITUDE ?? '36.6858');
  return haversineKm(studentLat, studentLon, schoolLat, schoolLon);
}
