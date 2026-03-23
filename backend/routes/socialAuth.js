/**
 * Social OAuth Routes
 * 
 * Handles Instagram and Facebook OAuth flows for per-user token management.
 * Users click "Connect Instagram/Facebook" → redirect to Meta OAuth → callback stores token.
 * 
 * Routes:
 *   GET  /api/auth/instagram/connect   → Redirect to Meta OAuth
 *   GET  /api/auth/instagram/callback  → Exchange code for token, store in DB
 *   GET  /api/auth/facebook/connect    → Redirect to Meta OAuth
 *   GET  /api/auth/facebook/callback   → Exchange code for token, store in DB
 *   GET  /api/auth/connections         → List user's connected accounts
 *   DELETE /api/auth/disconnect/:provider → Remove a connection
 */
import express from 'express';
import { supabase } from '../server.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const META_AUTH_URL = 'https://www.facebook.com/v21.0/dialog/oauth';
const META_TOKEN_URL = 'https://graph.facebook.com/v21.0/oauth/access_token';
const META_GRAPH_URL = 'https://graph.facebook.com/v21.0';

// ═══════════════════════════════════════
// Instagram OAuth
// ═══════════════════════════════════════

/**
 * GET /api/auth/instagram/connect
 * Redirects user to Facebook OAuth to authorize Instagram messaging
 */
router.get('/instagram/connect', requireAuth, (req, res) => {
  const appId = process.env.META_APP_ID;
  const redirectUri = `${process.env.APP_URL || 'http://localhost:3002'}/api/auth/instagram/callback`;
  
  if (!appId) {
    return res.status(500).json({ error: 'META_APP_ID not configured' });
  }

  // Store user ID in state param so we know who connected after the redirect
  const state = Buffer.from(JSON.stringify({ userId: req.user.userId })).toString('base64');

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

/**
 * GET /api/auth/instagram/callback
 * Facebook redirects here after user authorizes
 */
router.get('/instagram/callback', async (req, res) => {
  const { code, state, error: oauthError } = req.query;

  if (oauthError) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/settings?error=oauth_denied`);
  }

  if (!code || !state) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/settings?error=missing_params`);
  }

  try {
    // Decode user ID from state
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // 1. Exchange code for short-lived token
    const tokenResponse = await fetch(`${META_TOKEN_URL}?` + new URLSearchParams({
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      redirect_uri: `${process.env.APP_URL || 'http://localhost:3002'}/api/auth/instagram/callback`,
      code,
    }));

    const tokenData = await tokenResponse.json();
    if (tokenData.error) throw new Error(tokenData.error.message);

    // 2. Exchange for long-lived token (60 days)
    const longLivedResponse = await fetch(`${META_TOKEN_URL}?` + new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      fb_exchange_token: tokenData.access_token,
    }));

    const longLivedData = await longLivedResponse.json();
    if (longLivedData.error) throw new Error(longLivedData.error.message);

    // 3. Get Instagram Business Account ID
    const accountsResponse = await fetch(
      `${META_GRAPH_URL}/me/accounts?fields=id,name,instagram_business_account&access_token=${longLivedData.access_token}`
    );
    const accountsData = await accountsResponse.json();
    
    const igAccount = accountsData.data?.find(p => p.instagram_business_account);
    const igBusinessId = igAccount?.instagram_business_account?.id;

    // 4. Store in database
    const { error: dbError } = await supabase
      .from('api_keys')
      .upsert({
        user_id: userId,
        provider: 'instagram',
        encrypted_key: longLivedData.access_token,
        metadata: {
          ig_business_id: igBusinessId,
          page_id: igAccount?.id,
          page_name: igAccount?.name,
          expires_at: new Date(Date.now() + (longLivedData.expires_in || 5184000) * 1000).toISOString(),
          connected_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,provider' });

    if (dbError) throw dbError;

    console.log(`[OAuth] Instagram connected for user ${userId} (IG: ${igBusinessId})`);

    // Redirect back to frontend with success
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/settings?connected=instagram`);
  } catch (error) {
    console.error('[OAuth] Instagram callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/settings?error=instagram_failed`);
  }
});

// ═══════════════════════════════════════
// Facebook OAuth
// ═══════════════════════════════════════

/**
 * GET /api/auth/facebook/connect
 */
router.get('/facebook/connect', requireAuth, (req, res) => {
  const appId = process.env.META_APP_ID;
  const redirectUri = `${process.env.APP_URL || 'http://localhost:3002'}/api/auth/facebook/callback`;

  if (!appId) {
    return res.status(500).json({ error: 'META_APP_ID not configured' });
  }

  const state = Buffer.from(JSON.stringify({ userId: req.user.userId })).toString('base64');

  const scopes = [
    'pages_show_list',
    'pages_messaging',
    'pages_manage_metadata',
    'pages_read_engagement',
  ].join(',');

  const authUrl = `${META_AUTH_URL}?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${state}`;

  res.json({ redirectUrl: authUrl });
});

/**
 * GET /api/auth/facebook/callback
 */
router.get('/facebook/callback', async (req, res) => {
  const { code, state, error: oauthError } = req.query;

  if (oauthError || !code || !state) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/settings?error=facebook_denied`);
  }

  try {
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange for token
    const tokenResponse = await fetch(`${META_TOKEN_URL}?` + new URLSearchParams({
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      redirect_uri: `${process.env.APP_URL || 'http://localhost:3002'}/api/auth/facebook/callback`,
      code,
    }));

    const tokenData = await tokenResponse.json();
    if (tokenData.error) throw new Error(tokenData.error.message);

    // Long-lived token
    const longLivedResponse = await fetch(`${META_TOKEN_URL}?` + new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      fb_exchange_token: tokenData.access_token,
    }));

    const longLivedData = await longLivedResponse.json();
    if (longLivedData.error) throw new Error(longLivedData.error.message);

    // Get Page access token (long-lived)
    const pagesResponse = await fetch(
      `${META_GRAPH_URL}/me/accounts?fields=id,name,access_token&access_token=${longLivedData.access_token}`
    );
    const pagesData = await pagesResponse.json();
    const page = pagesData.data?.[0]; // First page

    // Store
    const { error: dbError } = await supabase
      .from('api_keys')
      .upsert({
        user_id: userId,
        provider: 'facebook',
        encrypted_key: page?.access_token || longLivedData.access_token,
        metadata: {
          page_id: page?.id,
          page_name: page?.name,
          expires_at: new Date(Date.now() + 5184000000).toISOString(), // ~60 days
          connected_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,provider' });

    if (dbError) throw dbError;

    console.log(`[OAuth] Facebook connected for user ${userId} (Page: ${page?.name})`);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/settings?connected=facebook`);
  } catch (error) {
    console.error('[OAuth] Facebook callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/settings?error=facebook_failed`);
  }
});

// ═══════════════════════════════════════
// Connection Management
// ═══════════════════════════════════════

/**
 * GET /api/auth/connections
 * List all connected social accounts for the authenticated user
 */
router.get('/connections', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('provider, metadata, updated_at')
      .eq('user_id', req.user.userId);

    if (error) throw error;

    const connections = (data || []).map(c => ({
      provider: c.provider,
      connected: true,
      pageName: c.metadata?.page_name || null,
      connectedAt: c.metadata?.connected_at || c.updated_at,
      expiresAt: c.metadata?.expires_at || null,
    }));

    res.json({ connections });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
});

/**
 * DELETE /api/auth/disconnect/:provider
 * Remove a social account connection
 */
router.delete('/disconnect/:provider', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('user_id', req.user.userId)
      .eq('provider', req.params.provider);

    if (error) throw error;

    res.json({ success: true, message: `${req.params.provider} disconnected` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

export default router;
