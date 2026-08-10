import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import { supabase } from '../db/client';
import { getRoutePath } from '../services/routePath';
import type { RouteStudentSummary } from '@sla/shared';

export const routesRouter = Router();
routesRouter.use(apiLimiter, authMiddleware);

routesRouter.get('/', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('routes')
    .select(
      `*, route_assignments(count)`,
    )
    .eq('active', true)
    .eq('route_assignments.status', 'active')
    .order('route_name');

  if (error) return res.status(500).json({ error: error.message });

  const routes = (data ?? []).map((route) => {
    const { route_assignments, ...rest } = route as unknown as {
      route_assignments: { count: number }[];
      [key: string]: unknown;
    };
    return { ...rest, current_count: route_assignments?.[0]?.count ?? 0 };
  });

  res.json(routes);
});

interface RouteAssignmentRow {
  student_id: string;
  pickup_order: number | null;
  estimated_pickup_time: string | null;
  students: {
    name: string;
    student_locations: { latitude: number; longitude: number; road_distance_km: number | null }[];
  } | null;
}

routesRouter.get('/:id/students', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('route_assignments')
    .select(
      `student_id, pickup_order, estimated_pickup_time,
       students(name, student_locations(latitude, longitude, road_distance_km))`,
    )
    .eq('route_id', req.params.id)
    .eq('status', 'active')
    .order('pickup_order');

  if (error) return res.status(500).json({ error: error.message });

  const summaries: RouteStudentSummary[] = ((data ?? []) as unknown as RouteAssignmentRow[]).map((row) => {
    const location = row.students?.student_locations?.[0];
    return {
      student_id: row.student_id,
      student_name: row.students?.name ?? 'Unknown',
      pickup_order: row.pickup_order,
      estimated_pickup_time: row.estimated_pickup_time,
      road_distance_km: location?.road_distance_km ?? null,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
    };
  });

  res.json(summaries);
});

routesRouter.get('/:id/path', async (req: Request, res: Response) => {
  try {
    const path = await getRoutePath(req.params.id);
    res.json(path);
  } catch (err) {
    res.status(404).json({ error: err instanceof Error ? err.message : 'Route path unavailable' });
  }
});

routesRouter.post('/', async (req: Request, res: Response) => {
  const { route_name, bus_number, driver_name, driver_phone, capacity } =
    req.body as Record<string, string | number>;

  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('id')
    .limit(1)
    .single();

  if (schoolError || !school) return res.status(500).json({ error: 'No school configured' });

  const { data, error } = await supabase
    .from('routes')
    .insert({ route_name, bus_number, driver_name, driver_phone, capacity, school_id: school.id })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

routesRouter.patch('/:id', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('routes')
    .update(req.body as Record<string, unknown>)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

routesRouter.delete('/:id', async (req: Request, res: Response) => {
  // Soft delete — set active = false
  const { error } = await supabase
    .from('routes')
    .update({ active: false })
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.sendStatus(204);
});
