/**
 * Outreach API Routes
 * POST /api/outreach/instagram — Send Instagram DM (using user's own token)
 * POST /api/outreach/facebook  — Send Facebook message (using user's own token)
 * POST /api/outreach/email     — Send email (using user's SMTP or edge function)
 */

import express from 'express';
import { sendInstagramDM, sendFacebookMessage, sendEmail } from '../services/outreach.js';

const router = express.Router();

router.post('/instagram', async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    // Use authenticated user's ID — never trust client-supplied userId
    const userId = req.user?.userId;
    if (!recipientId || !message) return res.status(400).json({ error: 'recipientId and message are required' });
    const supabase = req.app.locals.supabase;
    const result = await sendInstagramDM(recipientId, message, { supabase, userId });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/facebook', async (req, res) => {
  try {
    const { recipientPsid, message } = req.body;
    // Use authenticated user's ID — never trust client-supplied userId
    const userId = req.user?.userId;
    if (!recipientPsid || !message) return res.status(400).json({ error: 'recipientPsid and message are required' });
    const supabase = req.app.locals.supabase;
    const result = await sendFacebookMessage(recipientPsid, message, { supabase, userId });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/email', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    // Use authenticated user's ID — never trust client-supplied userId
    const userId = req.user?.userId;
    if (!to || !subject) return res.status(400).json({ error: 'to and subject are required' });
    const supabase = req.app.locals.supabase;
    const result = await sendEmail({ to, subject, text, html }, { supabase, userId });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
