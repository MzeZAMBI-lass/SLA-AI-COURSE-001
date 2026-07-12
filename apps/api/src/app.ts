import express from 'express';
import cors from 'cors';
import { webhookRouter } from './routes/webhook';
import { studentsRouter } from './routes/students';
import { routesRouter } from './routes/routes';
import { assignmentsRouter } from './routes/assignments';

const app = express();

// Raw body needed for HMAC signature verification on the webhook route
app.use('/webhook', express.raw({ type: 'application/json' }));

// All other routes use JSON
app.use(express.json());
app.use(cors({ origin: process.env.APP_URL }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/webhook', webhookRouter);
app.use('/api/students', studentsRouter);
app.use('/api/routes', routesRouter);
app.use('/api/assignments', assignmentsRouter);

export default app;
