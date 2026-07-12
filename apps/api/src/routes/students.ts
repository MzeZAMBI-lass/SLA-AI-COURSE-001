import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import { supabase } from '../db/client';

export const studentsRouter = Router();
studentsRouter.use(apiLimiter, authMiddleware);

studentsRouter.get('/', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('students')
    .select('*, student_locations(*), route_assignments(*)')
    .order('name');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

studentsRouter.get('/:id', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('students')
    .select('*, student_locations(*), route_assignments(*, routes(*))')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Student not found' });
  res.json(data);
});

studentsRouter.post('/', async (req: Request, res: Response) => {
  const { name, grade, parent_name, parent_phone, whatsapp_id } = req.body as Record<
    string,
    string
  >;

  const { data, error } = await supabase
    .from('students')
    .insert({ name, grade, parent_name, parent_phone, whatsapp_id })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

studentsRouter.patch('/:id', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('students')
    .update(req.body as Record<string, unknown>)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
