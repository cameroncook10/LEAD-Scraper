import express from 'express';
import crypto from 'crypto';
const router = express.Router();

/**
 * Webhook support for CRM integrations and external event delivery
 */

// In-memory webhook store (would be Supabase in production)
const webhooks = new Map();

// POST /api/webhooks — register a new webhook
router.post('/', (req, res) => {
  const { url, events, secret } = req.body;

  if (!url || !events || !Array.isArray(events)) {
    return res.status(400).json({
      error: 'Missing required fields: url (string), events (array)',
      validEvents: ['lead.created', 'lead.qualified', 'lead.converted', 'dm.sent', 'dm.replied', 'campaign.started', 'campaign.completed', 'scrape.completed'],
    });
  }

  const id = `wh_${crypto.randomBytes(12).toString('hex')}`;
  const signingSecret = secret || `whsec_${crypto.randomBytes(24).toString('hex')}`;

  const webhook = {
    id,
    url,
    events,
    signingSecret,
    active: true,
    createdAt: new Date().toISOString(),
    lastTriggered: null,
    failCount: 0,
  };

  webhooks.set(id, webhook);

  res.status(201).json({
    id: webhook.id,
    url: webhook.url,
    events: webhook.events,
    signingSecret: webhook.signingSecret,
    active: webhook.active,
    createdAt: webhook.createdAt,
  });
});

// GET /api/webhooks — list all webhooks
router.get('/', (req, res) => {
  const list = Array.from(webhooks.values()).map(wh => ({
    id: wh.id,
    url: wh.url,
    events: wh.events,
    active: wh.active,
    lastTriggered: wh.lastTriggered,
    failCount: wh.failCount,
    createdAt: wh.createdAt,
  }));
  res.json({ webhooks: list, total: list.length });
});

// DELETE /api/webhooks/:id — remove a webhook
router.delete('/:id', (req, res) => {
  if (!webhooks.has(req.params.id)) {
    return res.status(404).json({ error: 'Webhook not found' });
  }
  webhooks.delete(req.params.id);
  res.json({ deleted: true });
});

// PATCH /api/webhooks/:id — toggle active/inactive
router.patch('/:id', (req, res) => {
  const wh = webhooks.get(req.params.id);
  if (!wh) {
    return res.status(404).json({ error: 'Webhook not found' });
  }

  if (req.body.active !== undefined) wh.active = req.body.active;
  if (req.body.events) wh.events = req.body.events;
  if (req.body.url) wh.url = req.body.url;

  webhooks.set(req.params.id, wh);
  res.json(wh);
});

// POST /api/webhooks/:id/test — send a test event
router.post('/:id/test', async (req, res) => {
  const wh = webhooks.get(req.params.id);
  if (!wh) {
    return res.status(404).json({ error: 'Webhook not found' });
  }

  const testPayload = {
    event: 'test.ping',
    timestamp: new Date().toISOString(),
    data: {
      message: 'This is a test webhook delivery from Agent Lead',
      webhookId: wh.id,
    },
  };

  try {
    const body = JSON.stringify(testPayload);
    const signature = crypto
      .createHmac('sha256', wh.signingSecret)
      .update(body)
      .digest('hex');

    const response = await fetch(wh.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AgentLead-Signature': signature,
        'X-AgentLead-Event': 'test.ping',
      },
      body,
      signal: AbortSignal.timeout(10000),
    });

    wh.lastTriggered = new Date().toISOString();
    webhooks.set(wh.id, wh);

    res.json({
      success: response.ok,
      statusCode: response.status,
      message: response.ok ? 'Test webhook delivered successfully' : 'Webhook endpoint returned an error',
    });
  } catch (error) {
    wh.failCount++;
    webhooks.set(wh.id, wh);

    res.json({
      success: false,
      error: error.message,
      message: 'Failed to deliver test webhook',
    });
  }
});

/**
 * Utility: Deliver a webhook event to all registered hooks
 * Call this from other services when events happen
 */
export async function deliverWebhook(eventType, payload) {
  const matchingHooks = Array.from(webhooks.values()).filter(
    wh => wh.active && wh.events.includes(eventType)
  );

  const results = await Promise.allSettled(
    matchingHooks.map(async (wh) => {
      const body = JSON.stringify({ event: eventType, timestamp: new Date().toISOString(), data: payload });
      const signature = crypto.createHmac('sha256', wh.signingSecret).update(body).digest('hex');

      const response = await fetch(wh.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AgentLead-Signature': signature,
          'X-AgentLead-Event': eventType,
        },
        body,
        signal: AbortSignal.timeout(10000),
      });

      wh.lastTriggered = new Date().toISOString();
      if (!response.ok) wh.failCount++;
      webhooks.set(wh.id, wh);

      return { webhookId: wh.id, status: response.status };
    })
  );

  return results;
}

export default router;
