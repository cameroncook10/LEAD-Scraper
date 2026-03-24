/**
 * Outreach Service — Instagram DM, Facebook Messenger, Email (SMTP)
 * 
 * Each channel reads its credentials from environment variables.
 * The frontend Settings tab lets users input these credentials,
 * but the backend stores them in .env / Supabase secrets for security.
 */

import nodemailer from 'nodemailer';

// ══════════════════════════════════════════════
// Instagram DM (via Instagram Graph API)
// Requires: INSTAGRAM_ACCESS_TOKEN, recipient IGSID
// ══════════════════════════════════════════════
export async function sendInstagramDM(recipientId, messageText) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) throw new Error('INSTAGRAM_ACCESS_TOKEN not configured');

  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: messageText },
        access_token: token,
        messaging_type: 'MESSAGE_TAG',
        tag: 'CONFIRMED_EVENT_UPDATE'
      })
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(`Instagram API error: ${data.error?.message || res.statusText}`);
  return data;
}

// ══════════════════════════════════════════════
// Facebook Messenger (via Send API)
// Requires: FACEBOOK_PAGE_ACCESS_TOKEN, FACEBOOK_PAGE_ID
// ══════════════════════════════════════════════
export async function sendFacebookMessage(recipientPsid, messageText) {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error('FACEBOOK_PAGE_ACCESS_TOKEN not configured');

  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientPsid },
        message: { text: messageText },
        messaging_type: 'RESPONSE'
      })
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(`Facebook API error: ${data.error?.message || res.statusText}`);
  return data;
}

// ══════════════════════════════════════════════
// Email (via Nodemailer SMTP)
// Requires: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
// ══════════════════════════════════════════════
export async function sendEmail({ to, subject, text, html }) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP credentials not fully configured (SMTP_HOST, SMTP_USER, SMTP_PASS)');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  const info = await transporter.sendMail({
    from: `"Agent Lead" <${user}>`,
    to,
    subject,
    text,
    html: html || undefined
  });

  return { messageId: info.messageId, accepted: info.accepted };
}
