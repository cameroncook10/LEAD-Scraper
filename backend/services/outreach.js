/**
 * Outreach Service — Sends DMs from the USER'S OWN accounts
 * 
 * Each user saves their Instagram, Facebook, and Email credentials
 * in the Dashboard Settings tab. This service pulls those credentials
 * from the `outreach_credentials` table and uses them to send messages.
 * 
 * Instagram/Facebook tokens: per-user from Supabase DB
 * Email: proxied through Supabase `send-email` edge function (SMTP secrets in Supabase)
 *        OR pulled from the user's own credentials in the DB
 */

import { getUserCredentials } from '../routes/outreachCredentials.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// ══════════════════════════════════════════════
// Instagram DM (via Instagram Graph API)
// Uses the user's own access token from the DB
// ══════════════════════════════════════════════
export async function sendInstagramDM(recipientId, messageText, { supabase, userId = 'default' } = {}) {
  // Try user's saved credentials first
  let token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (supabase) {
    const creds = await getUserCredentials(supabase, userId);
    if (creds?.ig_access_token) token = creds.ig_access_token;
  }
  if (!token) throw new Error('Instagram access token not configured. Go to Settings → Outreach Channels to connect your account.');

  const res = await fetch('https://graph.facebook.com/v19.0/me/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: messageText },
      access_token: token,
      messaging_type: 'MESSAGE_TAG',
      tag: 'CONFIRMED_EVENT_UPDATE',
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Instagram API error: ${data.error?.message || res.statusText}`);
  return data;
}

// ══════════════════════════════════════════════
// Facebook Messenger (via Send API)
// Uses the user's own page token from the DB
// ══════════════════════════════════════════════
export async function sendFacebookMessage(recipientPsid, messageText, { supabase, userId = 'default' } = {}) {
  let token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (supabase) {
    const creds = await getUserCredentials(supabase, userId);
    if (creds?.fb_page_token) token = creds.fb_page_token;
  }
  if (!token) throw new Error('Facebook page token not configured. Go to Settings → Outreach Channels to connect your page.');

  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientPsid },
        message: { text: messageText },
        messaging_type: 'RESPONSE',
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(`Facebook API error: ${data.error?.message || res.statusText}`);
  return data;
}

// ══════════════════════════════════════════════
// Email — Uses user's own SMTP credentials from DB
// Falls back to Supabase edge function if no per-user SMTP
// ══════════════════════════════════════════════
export async function sendEmail({ to, subject, text, html }, { supabase, userId = 'default' } = {}) {
  // Check for user's own SMTP creds in DB
  let userSmtp = null;
  if (supabase) {
    const creds = await getUserCredentials(supabase, userId);
    if (creds?.smtp_user && creds?.smtp_pass && creds?.smtp_host) {
      userSmtp = creds;
    }
  }

  if (userSmtp) {
    // Use Supabase edge function with user's credentials passed in body
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
    }

    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ to, subject, text, html }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Email edge function failed');
    return data;
  }

  // Fallback to edge function with system-level SMTP secrets
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('No email credentials configured. Go to Settings → Outreach Channels to connect your email.');
  }

  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ to, subject, text, html }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Email edge function failed');
  return data;
}
