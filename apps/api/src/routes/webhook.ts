import { Router, Request, Response } from 'express';
import { verifyWebhookSignature } from '../middleware/verifySignature';
import { webhookLimiter } from '../middleware/rateLimiter';
import { supabase } from '../db/client';
import { processMessage } from '../queue/processor';

export const webhookRouter = Router();

// Webhook verification handshake — required by Meta
webhookRouter.get('/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_SECRET) {
    res.status(200).send(challenge);
    return;
  }
  res.sendStatus(403);
});

// Incoming messages
webhookRouter.post(
  '/whatsapp',
  webhookLimiter,
  verifyWebhookSignature,
  async (req: Request, res: Response) => {
    // Acknowledge within 2 seconds — process async
    res.sendStatus(200);

    const messages: Record<string, unknown>[] =
      (req.body as Record<string, unknown>)?.['entry']?.[0]?.['changes']?.[0]?.['value']?.[
        'messages'
      ] ?? [];

    for (const msg of messages) {
      const { error } = await supabase.from('incoming_messages').insert({
        whatsapp_message_id: msg['id'],
        sender_phone: msg['from'],
        message_type: msg['type'] ?? 'unknown',
        raw_payload: msg,
        processed: false,
        processing_status: 'pending',
      });

      if (!error) {
        processMessage(msg as Record<string, unknown>).catch((err: unknown) => {
          console.error('processMessage failed', err);
        });
      }
    }
  },
);
