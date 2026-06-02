/**
 * Social OAuth Routes
 * 
 * Handles Instagram and Facebook OAuth flows for per-user token management.
 * Users click "Connect Instagram/Facebook" → redirect to Meta OAuth → callback stores token.
 * 
 * Now uses outreach_credentials table (already created) instead of api_keys.
 * Works without requireAuth for the initial MVP — uses 'default' user.
 * 
 * Routes:
 *   GET  /api/auth/instagram/connect   → Redirect URL for Meta OAuth
 *   GET  /api/auth/instagram/callback  → Exchange code for token, store in DB
 *   GET  /api/auth/facebook/connect    → Redirect URL for Meta OAuth
 *   GET  /api/auth/facebook/callback   → Exchange code for token, store in DB
 *   GET  /api/auth/google/connect      → Redirect URL for Google OAuth (Gmail SMTP)
 *   GET  /api/auth/google/callback     → Exchange code for Gmail send access
 *   GET  /api/auth/status              → Connection status for all providers
 */
import express from 'express';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// ── Signed OAuth state ───────────────────────────────────────────────────────
// The callback runs WITHOUT the user's session (it's a browser redirect from
// Meta/Google), so it must learn the user id from the `state` param. We HMAC-sign
// state at connect time and verify it on callback — otherwise an attacker could
// forge state and bind their social account (or token) to a victim's account.
const STATE_SECRET = process.env.JWT_SECRET || process.env.ENCRYPTION_KEY || 'insecure-dev-oauth-state-secret';
const STATE_TTL_MS = 60 * 60 * 1000; // 1 hour

function signState(userId) {
  const payload = Buffer.from(JSON.stringify({ u: userId, t: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', STATE_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyState(state) {
  if (typeof state !== 'string' || !state.includes('.')) return null;
  const [payload, sig] = state.split('.');
  const expected = crypto.createHmac('sha256', STATE_SECRET).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const { u, t } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!u || typeof t !== 'number' || Date.now() - t > STATE_TTL_MS) return null;
    return u;
  } catch {
    return null;
  }
}

const META_AUTH_URL = 'https://www.facebook.com/v21.0/dialog/oauth';
const META_TOKEN_URL = 'https://graph.facebook.com/v21.0/oauth/access_token';
const META_GRAPH_URL = 'https://graph.facebook.com/v21.0';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

const getAppUrl = () => process.env.APP_URL || 'http://localhost:3002';
const getFrontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:3001';

// ═══════════════════════════════════════
// Instagram OAuth
// ═══════════════════════════════════════

router.get('/instagram/connect', requireAuth, (req, res) => {
  const appId = process.env.META_APP_ID;
  if (!appId) return res.status(500).json({ error: 'META_APP_ID not configured. Set it in backend/.env' });

  const redirectUri = `${getAppUrl()}/api/auth/instagram/callback`;
  const state = signState(req.user.userId);

  const scopes = [
    'instagram_basic',
    'instagram_manage_messages',
    'pages_show_list',
    'pages_messaging',
    'pages_manage_metadata',
  ].join(',');

  const authUrl = `${META_AUTH_URL}?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${state}`;
  res.json({ redirectUrl: authUrl });
});

router.get('/instagram/callback', async (req, res) => {
  const { code, state, error: oauthError } = req.query;
  if (oauthError || !code || !state) {
    return res.redirect(`${getFrontendUrl()}/dashboard?tab=Settings&error=instagram_denied`);
  }

  try {
    const userId = verifyState(state);
    if (!userId) {
      return res.redirect(`${getFrontendUrl()}/dashboard?tab=Settings&error=invalid_state`);
    }
    const supabase = req.app.locals.supabase;

    // 1. Exchange code for short-lived token
    const tokenRes = await fetch(`${META_TOKEN_URL}?` + new URLSearchParams({
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      redirect_uri: `${getAppUrl()}/api/auth/instagram/callback`,
      code,
    }));
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error.message);

    // 2. Exchange for long-lived token (60 days)
    const longRes = await fetch(`${META_TOKEN_URL}?` + new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      fb_exchange_token: tokenData.access_token,
    }));
    const longData = await longRes.json();
    if (longData.error) throw new Error(longData.error.message);

    // 3. Get Instagram Business Account ID
    const acctRes = await fetch(`${META_GRAPH_URL}/me/accounts?fields=id,name,instagram_business_account&access_token=${longData.access_token}`);
    const acctData = await acctRes.json();
    const igPage = acctData.data?.find(p => p.instagram_business_account);
    const igBusinessId = igPage?.instagram_business_account?.id || '';

    // 4. Store in outreach_credentials
    await supabase
      .from('outreach_credentials')
      .upsert({
        user_id: userId,
        ig_access_token: longData.access_token,
        ig_business_id: igBusinessId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    console.log(`[OAuth] Instagram connected for user ${userId} (IG: ${igBusinessId})`);
    res.redirect(`${getFrontendUrl()}/dashboard?tab=Settings&connected=instagram`);
  } catch (error) {
    console.error('[OAuth] Instagram callback error:', error);
    res.redirect(`${getFrontendUrl()}/dashboard?tab=Settings&error=instagram_failed`);
  }
});

// ═══════════════════════════════════════
// Facebook OAuth
// ═══════════════════════════════════════

router.get('/facebook/connect', requireAuth, (req, res) => {
  const appId = process.env.META_APP_ID;
  if (!appId) return res.status(500).json({ error: 'META_APP_ID not configured. Set it in backend/.env' });

  const redirectUri = `${getAppUrl()}/api/auth/facebook/callback`;
  const state = signState(req.user.userId);

  const scopes = [
    'pages_show_list',
    'pages_messaging',
    'pages_manage_metadata',
    'pages_read_engagement',
  ].join(',');

  const authUrl = `${META_AUTH_URL}?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${state}`;
  res.json({ redirectUrl: authUrl });
});

router.get('/facebook/callback', async (req, res) => {
  const { code, state, error: oauthError } = req.query;
  if (oauthError || !code || !state) {
    return res.redirect(`${getFrontendUrl()}/dashboard?tab=Settings&error=facebook_denied`);
  }

  try {
    const userId = verifyState(state);
    if (!userId) {
      return res.redirect(`${getFrontendUrl()}/dashboard?tab=Settings&error=invalid_state`);
    }
    const supabase = req.app.locals.supabase;

    // Exchange for token
    const tokenRes = await fetch(`${META_TOKEN_URL}?` + new URLSearchParams({
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      redirect_uri: `${getAppUrl()}/api/auth/facebook/callback`,
      code,
    }));
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error.message);

    // Long-lived token
    const longRes = await fetch(`${META_TOKEN_URL}?` + new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      fb_exchange_token: tokenData.access_token,
    }));
    const longData = await longRes.json();
    if (longData.error) throw new Error(longData.error.message);

    // Get Page access token
    const pagesRes = await fetch(`${META_GRAPH_URL}/me/accounts?fields=id,name,access_token&access_token=${longData.access_token}`);
    const pagesData = await pagesRes.json();
    const page = pagesData.data?.[0];

    // Store in outreach_credentials
    await supabase
      .from('outreach_credentials')
      .upsert({
        user_id: userId,
        fb_page_id: page?.id || '',
        fb_page_token: page?.access_token || longData.access_token,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    console.log(`[OAuth] Facebook connected for user ${userId} (Page: ${page?.name})`);
    res.redirect(`${getFrontendUrl()}/dashboard?tab=Settings&connected=facebook`);
  } catch (error) {
    console.error('[OAuth] Facebook callback error:', error);
    res.redirect(`${getFrontendUrl()}/dashboard?tab=Settings&error=facebook_failed`);
  }
});

// ═══════════════════════════════════════
// Google OAuth (Gmail SMTP)
// ═══════════════════════════════════════

router.get('/google/connect', requireAuth, (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(500).json({ error: 'GOOGLE_CLIENT_ID not configured. Set it in backend/.env' });

  const redirectUri = `${getAppUrl()}/api/auth/google/callback`;
  const state = signState(req.user.userId);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
  res.json({ redirectUrl: authUrl });
});

router.get('/google/callback', async (req, res) => {
  const { code, state, error: oauthError } = req.query;
  if (oauthError || !code || !state) {
    return res.redirect(`${getFrontendUrl()}/dashboard?tab=Settings&error=google_denied`);
  }

  try {
    const userId = verifyState(state);
    if (!userId) {
      return res.redirect(`${getFrontendUrl()}/dashboard?tab=Settings&error=invalid_state`);
    }
    const supabase = req.app.locals.supabase;

    // Exchange code for tokens
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${getAppUrl()}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

    // Get user email
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    // Store in outreach_credentials as SMTP (Gmail uses OAuth tokens, but we store it in smtp fields)
    await supabase
      .from('outreach_credentials')
      .upsert({
        user_id: userId,
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: userData.email || '',
        smtp_pass: tokenData.refresh_token || tokenData.access_token, // Refresh token for long-term use
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    console.log(`[OAuth] Google/Gmail connected for user ${userId} (${userData.email})`);
    res.redirect(`${getFrontendUrl()}/dashboard?tab=Settings&connected=email`);
  } catch (error) {
    console.error('[OAuth] Google callback error:', error);
    res.redirect(`${getFrontendUrl()}/dashboard?tab=Settings&error=google_failed`);
  }
});

// ═══════════════════════════════════════
// Connection Status
// ═══════════════════════════════════════

router.get('/status', requireAuth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.userId;

    const { data, error } = await supabase
      .from('outreach_credentials')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({
      instagram: !!data?.ig_access_token,
      facebook: !!data?.fb_page_token,
      email: !!data?.smtp_user,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get connection status' });
  }
});

// GET /api/auth/connections — list connected providers for the Settings page
router.get('/connections', requireAuth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('outreach_credentials')
      .select('*')
      .eq('user_id', req.user.userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    const connections = [];
    if (data?.ig_access_token) connections.push({ provider: 'instagram', pageName: data.ig_business_id || null });
    if (data?.fb_page_token)   connections.push({ provider: 'facebook',  pageName: data.fb_page_id || null });
    res.json({ connections });
  } catch (error) {
    console.error('[OAuth] connections error:', error);
    res.status(500).json({ error: 'Failed to load connections' });
  }
});

// DELETE /api/auth/disconnect/:provider — clear a provider's stored credentials
router.delete('/disconnect/:provider', requireAuth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const patches = {
      instagram: { ig_access_token: '', ig_business_id: '' },
      facebook:  { fb_page_id: '', fb_page_token: '' },
      google:    { smtp_host: '', smtp_user: '', smtp_pass: '' },
      email:     { smtp_host: '', smtp_user: '', smtp_pass: '' },
    };
    const patch = patches[req.params.provider];
    if (!patch) return res.status(400).json({ error: 'Unknown provider' });

    const { error } = await supabase
      .from('outreach_credentials')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('user_id', req.user.userId);

    if (error) throw error;
    res.json({ disconnected: req.params.provider });
  } catch (error) {
    console.error('[OAuth] disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

export default router;
