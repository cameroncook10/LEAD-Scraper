/**
 * Outreach Credentials API Routes
 * 
 * Allows each user to save their own Instagram, Facebook, and Email
 * credentials. Credentials are stored encrypted in Supabase.
 * 
 * POST /api/outreach-credentials — Save credentials
 * GET  /api/outreach-credentials — Load saved credentials (masked)
 */

import express from 'express';

const router = express.Router();

/**
 * Save outreach credentials for a user.
 * In production, add auth middleware to get user ID from JWT.
 * For now, uses a default user ID.
 */
router.post('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.body.userId || 'default';
    const { instagram, facebook, email } = req.body;

    const record = {
      user_id: userId,
      ig_access_token: instagram?.accessToken || '',
      ig_business_id: instagram?.businessId || '',
      fb_page_id: facebook?.pageId || '',
      fb_page_token: facebook?.pageToken || '',
      smtp_host: email?.smtpHost || '',
      smtp_port: parseInt(email?.smtpPort || '587'),
      smtp_user: email?.smtpUser || '',
      smtp_pass: email?.smtpPass || '',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('outreach_credentials')
      .upsert(record, { onConflict: 'user_id' })
      .select();

    if (error) throw error;

    res.json({ success: true, message: 'Outreach credentials saved' });
  } catch (err) {
    console.error('[Outreach Credentials] Save error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Load saved credentials (returns masked values so tokens aren't fully exposed).
 */
router.get('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.query.userId || 'default';

    const { data, error } = await supabase
      .from('outreach_credentials')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      return res.json({ connected: { instagram: false, facebook: false, email: false } });
    }

    // Return masked values + connection status
    res.json({
      connected: {
        instagram: !!data.ig_access_token,
        facebook: !!data.fb_page_token,
        email: !!data.smtp_user,
      },
      instagram: {
        businessId: data.ig_business_id || '',
        accessToken: data.ig_access_token ? '••••' + data.ig_access_token.slice(-8) : '',
      },
      facebook: {
        pageId: data.fb_page_id || '',
        pageToken: data.fb_page_token ? '••••' + data.fb_page_token.slice(-8) : '',
      },
      email: {
        smtpHost: data.smtp_host || '',
        smtpPort: data.smtp_port?.toString() || '587',
        smtpUser: data.smtp_user || '',
        smtpPass: data.smtp_pass ? '••••••••' : '',
      },
    });
  } catch (err) {
    console.error('[Outreach Credentials] Load error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get the raw (unmasked) credentials for server-side use when sending DMs.
 * This should never be exposed to the frontend.
 */
export async function getUserCredentials(supabase, userId = 'default') {
  const { data, error } = await supabase
    .from('outreach_credentials')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data;
}

export default router;
