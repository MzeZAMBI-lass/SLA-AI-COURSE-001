import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import { supabase } from '../db/client';

export const routesRouter = Router();
routesRouter.use(apiLimiter, authMiddleware);

routesRouter.get('/', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('routes')
    .select(
      `*, route_assignments(count)`,
    )
    .eq('active', true)
    .order('route_name');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

routesRouter.get('/:id/students', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('route_assignments')
    .select(
      `*, students(name, grade), student_locations(latitude, longitude, road_distance_km)`,
    )
    .eq('route_id', req.params.id)
    .eq('status', 'active')
    .order('pickup_order');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
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
