/**
 * Stripe API Routes (proxied through Supabase Edge Function)
 * POST /api/stripe/create-checkout — Create a Checkout Session
 * GET  /api/stripe/plans            — Get available pricing plans
 */

import express from 'express';
import { createCheckoutSession, PLANS } from '../services/stripe.js';

const router = express.Router();

// Create Checkout Session (proxied through edge function)
router.post('/create-checkout', async (req, res) => {
  try {
    const { plan, email } = req.body;
    if (!plan) return res.status(400).json({ error: 'plan is required (starter or growth)' });
    if (!PLANS[plan]) return res.status(400).json({ error: `Invalid plan. Available: ${Object.keys(PLANS).join(', ')}` });
    
    const session = await createCheckoutSession(plan, email);
    res.json(session);
  } catch (err) {
    console.error('[Stripe Route Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get available plans
router.get('/plans', (req, res) => {
  res.json(PLANS);
});

export default router;
