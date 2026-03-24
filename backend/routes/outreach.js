/**
 * Outreach API Routes
 * POST /api/outreach/instagram — Send Instagram DM
 * POST /api/outreach/facebook  — Send Facebook message
 * POST /api/outreach/email     — Send email via SMTP
 */

import express from 'express';
import { sendInstagramDM, sendFacebookMessage, sendEmail } from '../services/outreach.js';

const router = express.Router();

router.post('/instagram', async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    if (!recipientId || !message) return res.status(400).json({ error: 'recipientId and message are required' });
    const result = await sendInstagramDM(recipientId, message);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/facebook', async (req, res) => {
  try {
    const { recipientPsid, message } = req.body;
    if (!recipientPsid || !message) return res.status(400).json({ error: 'recipientPsid and message are required' });
    const result = await sendFacebookMessage(recipientPsid, message);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/email', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    if (!to || !subject) return res.status(400).json({ error: 'to and subject are required' });
    const result = await sendEmail({ to, subject, text, html });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
