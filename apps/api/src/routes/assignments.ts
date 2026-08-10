import { Router, Request, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import { supabase } from '../db/client';

export const assignmentsRouter = Router();
assignmentsRouter.use(apiLimiter, authMiddleware);

// All pending assignments for the dashboard
assignmentsRouter.get('/pending', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('route_assignments')
    .select(
      `*, students(name, grade, parent_phone, student_locations(latitude, longitude, road_distance_km, travel_time_minutes, geocode_confidence)), routes(route_name, bus_number)`,
    )
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Confirm an assignment
assignmentsRouter.post('/:id/confirm', async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { data, error } = await supabase
    .from('route_assignments')
    .update({
      status: 'active',
      assigned_by: authReq.userId,
      assigned_at: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Override: move student to a different route
assignmentsRouter.post('/:id/override', async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { route_id } = req.body as { route_id: string };

  const { data, error } = await supabase
    .from('route_assignments')
    .update({
      route_id,
      status: 'active',
      assigned_by: authReq.userId,
      assigned_at: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Flag for manual review
assignmentsRouter.post('/:id/flag', async (req: Request, res: Response) => {
  const { notes } = req.body as { notes?: string };

  const { data, error } = await supabase
    .from('route_assignments')
    .update({ status: 'suspended', notes } as Record<string, unknown>)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
