import express from 'express';
import crypto from 'crypto';
const router = express.Router();

/**
 * Webhook support for CRM integrations and external event delivery.
 * Mounted behind requireAuth (see server.js), so every request has req.user.
 */

// In-memory webhook store (would be Supabase in production).
// Each entry stores the owning userId so customers can only see/modify their own.
const webhooks = new Map();

const VALID_EVENTS = ['lead.created', 'lead.qualified', 'lead.converted', 'dm.sent', 'dm.replied', 'campaign.started', 'campaign.completed', 'scrape.completed'];

// ── SSRF guard ───────────────────────────────────────────────────────────────
// Reject webhook URLs that point at internal/private/link-local hosts so a
// customer can't make the server call cloud metadata (169.254.169.254),
// localhost, or RFC-1918 ranges. Best-effort host check (does not resolve DNS).
function isSafeWebhookUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;

  const host = u.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return false;

  // Block obvious private / loopback / link-local IPv4 + IPv6 literals
  if (host === '0.0.0.0' || host === '::1' || host === '[::1]') return false;
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)];
    if (a === 127) return false;                         // loopback
    if (a === 10) return false;                          // private
    if (a === 169 && b === 254) return false;            // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return false;   // private
    if (a === 192 && b === 168) return false;            // private
  }
  // IPv6 unique-local / link-local
  if (host.startsWith('[fc') || host.startsWith('[fd') || host.startsWith('[fe80')) return false;
  return true;
}

const ownedBy = (req) => (wh) => wh && wh.userId === req.user.userId;

// POST /api/webhooks — register a new webhook
router.post('/', (req, res) => {
  const { url, events, secret } = req.body;

  if (!url || !events || !Array.isArray(events)) {
    return res.status(400).json({
      error: 'Missing required fields: url (string), events (array)',
      validEvents: VALID_EVENTS,
    });
  }

  if (!isSafeWebhookUrl(url)) {
    return res.status(400).json({ error: 'Invalid webhook URL: must be a public http(s) endpoint' });
  }

  const id = `wh_${crypto.randomBytes(12).toString('hex')}`;
  const signingSecret = secret || `whsec_${crypto.randomBytes(24).toString('hex')}`;

  const webhook = {
    id,
    userId: req.user.userId,
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

// GET /api/webhooks — list the caller's webhooks
router.get('/', (req, res) => {
  const list = Array.from(webhooks.values()).filter(ownedBy(req)).map(wh => ({
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

// DELETE /api/webhooks/:id — remove one of the caller's webhooks
router.delete('/:id', (req, res) => {
  const wh = webhooks.get(req.params.id);
  if (!wh || wh.userId !== req.user.userId) {
    return res.status(404).json({ error: 'Webhook not found' });
  }
  webhooks.delete(req.params.id);
  res.json({ deleted: true });
});

// PATCH /api/webhooks/:id — toggle active/inactive
router.patch('/:id', (req, res) => {
  const wh = webhooks.get(req.params.id);
  if (!wh || wh.userId !== req.user.userId) {
    return res.status(404).json({ error: 'Webhook not found' });
  }

  if (req.body.url !== undefined) {
    if (!isSafeWebhookUrl(req.body.url)) {
      return res.status(400).json({ error: 'Invalid webhook URL: must be a public http(s) endpoint' });
    }
    wh.url = req.body.url;
  }
  if (req.body.active !== undefined) wh.active = req.body.active;
  if (req.body.events) wh.events = req.body.events;

  webhooks.set(req.params.id, wh);
  res.json(wh);
});

// POST /api/webhooks/:id/test — send a test event
router.post('/:id/test', async (req, res) => {
  const wh = webhooks.get(req.params.id);
  if (!wh || wh.userId !== req.user.userId) {
    return res.status(404).json({ error: 'Webhook not found' });
  }

  // Re-validate at send time in case the stored URL ever bypassed the guard.
  if (!isSafeWebhookUrl(wh.url)) {
    return res.status(400).json({ error: 'Webhook URL is not allowed' });
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
    wh => wh.active && wh.events.includes(eventType) && isSafeWebhookUrl(wh.url)
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
