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

const router = express.Router();

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

router.get('/instagram/connect', (req, res) => {
  const appId = process.env.META_APP_ID;
  if (!appId) return res.status(500).json({ error: 'META_APP_ID not configured. Set it in backend/.env' });

  const redirectUri = `${getAppUrl()}/api/auth/instagram/callback`;
  const state = Buffer.from(JSON.stringify({ userId: req.query.userId || 'default' })).toString('base64');

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
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
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

router.get('/facebook/connect', (req, res) => {
  const appId = process.env.META_APP_ID;
  if (!appId) return res.status(500).json({ error: 'META_APP_ID not configured. Set it in backend/.env' });

  const redirectUri = `${getAppUrl()}/api/auth/facebook/callback`;
  const state = Buffer.from(JSON.stringify({ userId: req.query.userId || 'default' })).toString('base64');

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
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
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

router.get('/google/connect', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(500).json({ error: 'GOOGLE_CLIENT_ID not configured. Set it in backend/.env' });

  const redirectUri = `${getAppUrl()}/api/auth/google/callback`;
  const state = Buffer.from(JSON.stringify({ userId: req.query.userId || 'default' })).toString('base64');

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
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
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

router.get('/status', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.query.userId || 'default';

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

// GET /api/auth/connections — structured connection list (used by SettingsPage)
router.get('/connections', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    // Try to get userId from auth header, fall back to query param or 'default'
    let userId = req.query.userId || 'default';
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) userId = user.id;
      } catch { /* use fallback */ }
    }

    const { data, error } = await supabase
      .from('outreach_credentials')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    const connections = [];
    if (data?.ig_access_token) {
      connections.push({
        provider: 'instagram',
        businessId: data.ig_business_id || '',
        connectedAt: data.updated_at,
      });
    }
    if (data?.fb_page_token) {
      connections.push({
        provider: 'facebook',
        pageId: data.fb_page_id || '',
        connectedAt: data.updated_at,
      });
    }
    if (data?.smtp_user) {
      connections.push({
        provider: 'email',
        email: data.smtp_user,
        connectedAt: data.updated_at,
      });
    }

    res.json({ connections });
  } catch (error) {
    console.error('[Auth] Connections error:', error);
    res.json({ connections: [] });
  }
});

// DELETE /api/auth/disconnect/:provider — disconnect a provider
router.delete('/disconnect/:provider', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { provider } = req.params;
    let userId = req.query.userId || 'default';
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) userId = user.id;
      } catch { /* use fallback */ }
    }

    const updates = {};
    if (provider === 'instagram') {
      updates.ig_access_token = '';
      updates.ig_business_id = '';
    } else if (provider === 'facebook') {
      updates.fb_page_id = '';
      updates.fb_page_token = '';
    } else if (provider === 'email' || provider === 'google') {
      updates.smtp_host = '';
      updates.smtp_user = '';
      updates.smtp_pass = '';
    } else {
      return res.status(400).json({ error: `Unknown provider: ${provider}` });
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('outreach_credentials')
      .update(updates)
      .eq('user_id', userId);

    if (error) throw error;

    console.log(`[OAuth] Disconnected ${provider} for user ${userId}`);
    res.json({ success: true, message: `${provider} disconnected` });
  } catch (error) {
    console.error('[Auth] Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect provider' });
  }
});

export default router;
