/**
 * Outreach Service — Instagram DM, Facebook Messenger, Email
 * 
 * Instagram/Facebook tokens can stay in .env (user's preference).
 * Email is proxied through the Supabase `send-email` edge function
 * so SMTP credentials are stored as Supabase secrets.
 * 
 * Setup:
 *   Instagram/Facebook: Set tokens in backend/.env
 *   Email: supabase secrets set SMTP_HOST=... SMTP_USER=... SMTP_PASS=...
 *          supabase functions deploy send-email
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// ══════════════════════════════════════════════
// Instagram DM (via Instagram Graph API)
// Token stored locally in .env (user preference)
// ══════════════════════════════════════════════
export async function sendInstagramDM(recipientId, messageText) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) throw new Error('INSTAGRAM_ACCESS_TOKEN not configured in .env');

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
// Token stored locally in .env (user preference)
// ══════════════════════════════════════════════
export async function sendFacebookMessage(recipientPsid, messageText) {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error('FACEBOOK_PAGE_ACCESS_TOKEN not configured in .env');

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
// Email — Proxied through Supabase Edge Function
// SMTP credentials stored in Supabase secrets
// ══════════════════════════════════════════════
export async function sendEmail({ to, subject, text, html }) {
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
