import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function verifyWebhookSignature(req: Request, res: Response, next: NextFunction): void {
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;

  if (!signature || !secret) {
    res.status(403).json({ error: 'Missing signature' });
    return;
  }

  // req.body is a Buffer here (express.raw middleware applied upstream)
  const body = req.body as Buffer;
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;

  if (signature.length !== expected.length) {
    res.status(403).json({ error: 'Invalid signature' });
    return;
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    res.status(403).json({ error: 'Invalid signature' });
    return;
  }

  // Parse body for downstream handlers
  req.body = JSON.parse(body.toString());
  next();
}
