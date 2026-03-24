/**
 * API Key Management Routes
 * Proxies to the Supabase `manage-api-keys` edge function,
 * or stores keys directly in the outreach_credentials / api_keys table.
 *
 * POST /api/api-keys        — Store an API key
 * GET  /api/api-keys        — List configured keys (masked)
 * DELETE /api/api-keys/:provider — Remove a key
 */

import express from 'express';

const router = express.Router();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

/**
 * Store an API key via Supabase edge function (if deployed)
 * or directly in api_keys table.
 */
router.post('/', async (req, res) => {
  try {
    const { provider, key } = req.body;
    if (!provider || !key) {
      return res.status(400).json({ error: 'provider and key are required' });
    }

    const supabase = req.app.locals.supabase;
    const authHeader = req.headers.authorization;

    // Try edge function first
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        const edgeRes = await fetch(`${SUPABASE_URL}/functions/v1/manage-api-keys`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader || `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ action: 'store', provider, key }),
        });

        const data = await edgeRes.json();
        if (edgeRes.ok) return res.json(data);
        // If unauthorized (no user session), fall back to direct DB
        if (edgeRes.status !== 401) throw new Error(data.error);
      } catch (e) {
        console.warn('[API Keys] Edge function unavailable, using direct DB:', e.message);
      }
    }

    // Fallback: store directly in api_keys table with 'default' user
    const userId = req.body.userId || 'default';
    const { error } = await supabase
      .from('api_keys')
      .upsert({
        user_id: userId,
        provider,
        encrypted_key: key,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,provider' });

    if (error) throw error;

    res.json({ success: true, message: `${provider} key stored` });
  } catch (err) {
    console.error('[API Keys] Store error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * List stored API keys (masked)
 */
router.get('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const authHeader = req.headers.authorization;

    // Try edge function first
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        const edgeRes = await fetch(`${SUPABASE_URL}/functions/v1/manage-api-keys`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader || `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ action: 'list' }),
        });

        const data = await edgeRes.json();
        if (edgeRes.ok) return res.json(data);
        if (edgeRes.status !== 401) throw new Error(data.error);
      } catch (e) {
        console.warn('[API Keys] Edge function unavailable, using direct DB:', e.message);
      }
    }

    // Fallback: query api_keys table directly
    const userId = req.query.userId || 'default';
    const { data, error } = await supabase
      .from('api_keys')
      .select('provider, created_at, updated_at')
      .eq('user_id', userId);

    if (error) throw error;

    res.json({
      keys: (data || []).map(k => ({
        provider: k.provider,
        configured: true,
        updatedAt: k.updated_at,
      })),
    });
  } catch (err) {
    console.error('[API Keys] List error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Delete an API key
 */
router.delete('/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const supabase = req.app.locals.supabase;
    const authHeader = req.headers.authorization;

    // Try edge function first
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        const edgeRes = await fetch(`${SUPABASE_URL}/functions/v1/manage-api-keys`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader || `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ action: 'delete', provider }),
        });

        const data = await edgeRes.json();
        if (edgeRes.ok) return res.json(data);
        if (edgeRes.status !== 401) throw new Error(data.error);
      } catch (e) {
        console.warn('[API Keys] Edge function unavailable, using direct DB');
      }
    }

    // Fallback
    const userId = req.query.userId || 'default';
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider);

    if (error) throw error;

    res.json({ success: true, message: `${provider} key deleted` });
  } catch (err) {
    console.error('[API Keys] Delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
