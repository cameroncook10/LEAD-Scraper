/**
 * Stripe API Routes
 * POST /api/stripe/create-checkout — Create a Checkout Session
 * POST /api/stripe/webhook          — Handle Stripe webhooks
 */

import express from 'express';
import { createCheckoutSession, constructWebhookEvent, handleCheckoutCompleted } from '../services/stripe.js';

const router = express.Router();

// Create Checkout Session
router.post('/create-checkout', async (req, res) => {
  try {
    const { plan, email } = req.body;
    if (!plan) return res.status(400).json({ error: 'plan is required (starter or growth)' });
    const session = await createCheckoutSession(plan, email);
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stripe Webhook (raw body needed for signature verification)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = constructWebhookEvent(req.body, sig);

    if (event.type === 'checkout.session.completed') {
      const supabase = req.app.locals.supabase;
      await handleCheckoutCompleted(event.data.object, supabase);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Stripe Webhook Error]', err.message);
    res.status(400).json({ error: err.message });
  }
});

export default router;
