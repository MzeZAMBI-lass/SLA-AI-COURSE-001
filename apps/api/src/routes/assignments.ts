import { Router, Request, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import { supabase } from '../db/client';
import type { PendingAssignment, Student, StudentLocation } from '@sla/shared';

export const assignmentsRouter = Router();
assignmentsRouter.use(apiLimiter, authMiddleware);

interface PendingAssignmentRow {
  id: string;
  student_id: string;
  route_id: string;
  pickup_order: number | null;
  estimated_pickup_time: string | null;
  status: PendingAssignment['status'];
  assigned_by: string | null;
  assigned_at: string | null;
  created_at: string;
  students: (Student & { student_locations: StudentLocation[] }) | null;
  routes: { route_name: string; bus_number: string } | null;
}

// All pending assignments for the dashboard
assignmentsRouter.get('/pending', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('route_assignments')
    .select(
      `id, student_id, route_id, pickup_order, estimated_pickup_time, status, assigned_by, assigned_at, created_at,
       students(id, name, grade, parent_name, parent_phone, whatsapp_id, created_at,
         student_locations(id, student_id, latitude, longitude, address_text, geocode_source, geocode_confidence, road_distance_km, travel_time_minutes, verified_by_staff, created_at)),
       routes(route_name, bus_number)`,
    )
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const pending: PendingAssignment[] = ((data ?? []) as unknown as PendingAssignmentRow[]).map((row) => {
    const location = row.students?.student_locations?.[0] ?? null;
    return {
      id: row.id,
      student_id: row.student_id,
      route_id: row.route_id,
      pickup_order: row.pickup_order,
      estimated_pickup_time: row.estimated_pickup_time,
      status: row.status,
      assigned_by: row.assigned_by,
      assigned_at: row.assigned_at,
      created_at: row.created_at,
      student: row.students as unknown as Student,
      student_location: location,
      route_name: row.routes?.route_name ?? '',
      road_distance_km: location?.road_distance_km ?? null,
      travel_time_minutes: location?.travel_time_minutes ?? null,
    };
  });

  res.json(pending);
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
