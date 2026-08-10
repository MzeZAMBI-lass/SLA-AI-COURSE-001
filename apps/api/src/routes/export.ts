import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import { supabase } from '../db/client';

export const exportRouter = Router();
exportRouter.use(apiLimiter, authMiddleware);

exportRouter.get('/csv', async (req: Request, res: Response) => {
  const { route_id } = req.query as { route_id?: string };

  let query = supabase
    .from('route_assignments')
    .select(`
      pickup_order,
      estimated_pickup_time,
      students(name, grade, parent_phone, student_locations(road_distance_km)),
      routes(route_name, bus_number, driver_name, driver_phone)
    `)
    .eq('status', 'active')
    .order('pickup_order', { ascending: true, nullsFirst: false });

  if (route_id) query = query.eq('route_id', route_id);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const rows = (data ?? []) as Array<Record<string, unknown>>;

  const header = 'Route,Bus,Driver,Driver Phone,Student,Grade,Parent Phone,Pickup Order,Est. Pickup,Distance (km)';
  const lines = rows.map((r) => {
    const s = r.students as Record<string, unknown> | null;
    const rt = r.routes as Record<string, string> | null;
    const locs = s?.student_locations as Array<Record<string, unknown>> | null;
    const loc = locs?.[0] ?? null;
    return [
      rt?.route_name ?? '',
      rt?.bus_number ?? '',
      rt?.driver_name ?? '',
      rt?.driver_phone ?? '',
      (s?.name as string) ?? '',
      (s?.grade as string) ?? '',
      (s?.parent_phone as string) ?? '',
      r.pickup_order ?? '',
      r.estimated_pickup_time ?? '',
      loc?.road_distance_km ?? '',
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',');
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="route-export.csv"');
  res.send([header, ...lines].join('\r\n'));
});
