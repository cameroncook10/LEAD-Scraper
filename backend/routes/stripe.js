/**
 * Stripe API Routes (proxied through Supabase Edge Function)
 * POST /api/stripe/create-checkout  — Create a Checkout Session (3-day trial)
 * POST /api/stripe/create-portal    — Create a Customer Portal Session
 * GET  /api/stripe/plans            — Get available pricing plans
 */

import express from 'express';
import { createCheckoutSession, createPortalSession, PLANS } from '../services/stripe.js';

const router = express.Router();

// Create Checkout Session with 3-day free trial
router.post('/create-checkout', async (req, res) => {
  try {
    const { plan, email, isAnnual } = req.body;
    if (!plan) return res.status(400).json({ error: 'plan is required (starter or growth)' });
    
    // Build the plan key (e.g., "starter" or "starter_annual")
    const planKey = isAnnual ? `${plan}_annual` : plan;
    
    const session = await createCheckoutSession(planKey, email);
    res.json(session);
  } catch (err) {
    console.error('[Stripe Checkout Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Create Customer Portal Session (for managing subscription)
router.post('/create-portal', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });
    
    const portal = await createPortalSession(sessionId);
    res.json(portal);
  } catch (err) {
    console.error('[Stripe Portal Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get available plans
router.get('/plans', (req, res) => {
  res.json(PLANS);
});

export default router;
