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
import { encrypt, decrypt } from '../utils/encryption.js';

const router = express.Router();

// Fields that contain secrets and must be encrypted at rest
const SENSITIVE_FIELDS = ['ig_access_token', 'fb_page_token', 'smtp_pass'];

function encryptSensitiveFields(record) {
  const encrypted = { ...record };
  for (const field of SENSITIVE_FIELDS) {
    if (encrypted[field]) {
      try { encrypted[field] = encrypt(encrypted[field]); } catch {}
    }
  }
  return encrypted;
}

function decryptSensitiveFields(record) {
  if (!record) return record;
  const decrypted = { ...record };
  for (const field of SENSITIVE_FIELDS) {
    if (decrypted[field]) {
      try { decrypted[field] = decrypt(decrypted[field]); } catch {}
    }
  }
  return decrypted;
}

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

    const encryptedRecord = encryptSensitiveFields(record);

    const { data, error } = await supabase
      .from('outreach_credentials')
      .upsert(encryptedRecord, { onConflict: 'user_id' })
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

    // Decrypt sensitive fields before masking
    const decrypted = decryptSensitiveFields(data);

    // Return masked values + connection status
    res.json({
      connected: {
        instagram: !!decrypted.ig_access_token,
        facebook: !!decrypted.fb_page_token,
        email: !!decrypted.smtp_user,
      },
      instagram: {
        businessId: decrypted.ig_business_id || '',
        accessToken: decrypted.ig_access_token ? '••••' + decrypted.ig_access_token.slice(-8) : '',
      },
      facebook: {
        pageId: decrypted.fb_page_id || '',
        pageToken: decrypted.fb_page_token ? '••••' + decrypted.fb_page_token.slice(-8) : '',
      },
      email: {
        smtpHost: decrypted.smtp_host || '',
        smtpPort: decrypted.smtp_port?.toString() || '587',
        smtpUser: decrypted.smtp_user || '',
        smtpPass: decrypted.smtp_pass ? '••••••••' : '',
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
  return decryptSensitiveFields(data);
}

export default router;
