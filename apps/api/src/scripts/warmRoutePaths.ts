import 'dotenv/config';
import { supabase } from '../db/client';
import { getRoutePath } from '../services/routePath';

async function main() {
  const { data: routes, error } = await supabase
    .from('routes')
    .select('id, route_name')
    .eq('active', true);

  if (error) {
    console.error('Failed to list routes:', error.message);
    process.exitCode = 1;
    return;
  }

  for (const route of routes ?? []) {
    try {
      const path = await getRoutePath(route.id);
      console.warn(
        `${route.route_name}: ${path.source} · ${path.distance_km.toFixed(1)}km · ${path.duration_min}min`,
      );
    } catch (err) {
      console.error(`${route.route_name}: failed —`, err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  }
}

main();
