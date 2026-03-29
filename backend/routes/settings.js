import express from 'express';
import { encrypt, decrypt } from '../utils/encryption.js';

const router = express.Router();

/**
 * Settings Routes
 * - User profile management
 * - Account deletion
 * - Notification preferences
 * - Channel connections (OAuth credentials)
 *
 * All routes require authentication (requireAuth middleware applied in server.js).
 */

// Get user profile
router.get('/profile', async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    const { userId, email, metadata } = req.user;

    // Fetch notification preferences if they exist
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Fetch channel connection status
    const { data: creds } = await supabase
      .from('outreach_credentials')
      .select('ig_access_token, fb_page_token, smtp_user')
      .eq('user_id', userId)
      .single();

    res.json({
      userId,
      profile: {
        name: metadata?.name || metadata?.full_name || '',
        email,
        avatar: metadata?.avatar_url || null,
      },
      notifications: {
        emailDigest: prefs?.email_digest ?? true,
        webhookAlerts: prefs?.webhook_alerts ?? true,
        weeklyReport: prefs?.weekly_report ?? true,
      },
      channels: {
        instagram: !!creds?.ig_access_token,
        facebook: !!creds?.fb_page_token,
        email: !!creds?.smtp_user,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    const { name, avatar_url } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const updateData = {
      data: {
        name: name.trim(),
        full_name: name.trim(),
      },
    };

    if (avatar_url !== undefined) {
      updateData.data.avatar_url = avatar_url;
    }

    const { data: { user }, error } = await supabase.auth.updateUser(updateData);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      message: 'Profile updated',
      profile: {
        name: user.user_metadata?.name || name.trim(),
        email: user.email,
        avatar: user.user_metadata?.avatar_url || null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete account and cascade all user data
router.delete('/account', async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    const { userId } = req.user;
    const { confirmation } = req.body;

    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return res.status(400).json({
        error: 'Confirmation required',
        message: 'Send { "confirmation": "DELETE_MY_ACCOUNT" } to confirm deletion',
      });
    }

    // Delete user data in order (respect foreign key constraints)
    // 1. Delete outreach credentials
    await supabase
      .from('outreach_credentials')
      .delete()
      .eq('user_id', userId);

    // 2. Delete notification preferences
    await supabase
      .from('notification_preferences')
      .delete()
      .eq('user_id', userId);

    // 3. Delete message queue entries related to user's campaigns
    const { data: campaigns } = await supabase
      .from('email_campaigns')
      .select('id')
      .eq('user_id', userId);

    if (campaigns && campaigns.length > 0) {
      const campaignIds = campaigns.map(c => c.id);

      // Delete campaign deliveries and queue entries
      const { data: deliveries } = await supabase
        .from('campaign_deliveries')
        .select('id')
        .in('campaign_id', campaignIds);

      if (deliveries && deliveries.length > 0) {
        const deliveryIds = deliveries.map(d => d.id);
        await supabase
          .from('message_queue')
          .delete()
          .in('delivery_id', deliveryIds);
      }

      await supabase
        .from('campaign_deliveries')
        .delete()
        .in('campaign_id', campaignIds);

      await supabase
        .from('email_campaigns')
        .delete()
        .eq('user_id', userId);
    }

    // 4. Delete leads owned by user
    await supabase
      .from('leads')
      .delete()
      .eq('user_id', userId);

    // 5. Delete scrape jobs owned by user
    await supabase
      .from('scrape_jobs')
      .delete()
      .eq('user_id', userId);

    // 6. Delete the auth user (this signs them out everywhere)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error(`[Settings] Failed to delete auth user ${userId}:`, deleteError.message);
      // Even if admin delete fails, the data is gone — inform user
      return res.status(500).json({
        error: 'Partial deletion',
        message: 'User data deleted but account removal failed. Contact support.',
      });
    }

    console.log(`[Settings] Account deleted: ${userId}`);

    res.json({
      success: true,
      message: 'Account and all associated data deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get notification preferences
router.get('/notifications', async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    const { userId } = req.user;

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If no preferences exist yet, return defaults
    if (error && error.code === 'PGRST116') {
      return res.json({
        emailDigest: true,
        webhookAlerts: true,
        weeklyReport: true,
      });
    }

    if (error) throw error;

    res.json({
      emailDigest: data.email_digest,
      webhookAlerts: data.webhook_alerts,
      weeklyReport: data.weekly_report,
    });
  } catch (error) {
    next(error);
  }
});

// Update notification preferences
router.put('/notifications', async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    const { userId } = req.user;
    const { emailDigest, webhookAlerts, weeklyReport } = req.body;

    const record = {
      user_id: userId,
      email_digest: emailDigest ?? true,
      webhook_alerts: webhookAlerts ?? true,
      weekly_report: weeklyReport ?? true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(record, { onConflict: 'user_id' })
      .select();

    if (error) throw error;

    res.json({
      success: true,
      notifications: {
        emailDigest: record.email_digest,
        webhookAlerts: record.webhook_alerts,
        weeklyReport: record.weekly_report,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Connect a channel (store encrypted OAuth credentials)
router.post('/channels/connect', async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    const { userId } = req.user;
    const { channel, credentials } = req.body;

    if (!channel || !credentials) {
      return res.status(400).json({ error: 'channel and credentials are required' });
    }

    const validChannels = ['instagram', 'facebook', 'email'];
    if (!validChannels.includes(channel)) {
      return res.status(400).json({ error: `Invalid channel. Must be one of: ${validChannels.join(', ')}` });
    }

    // Build the update based on channel type
    const update = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    switch (channel) {
      case 'instagram':
        if (!credentials.accessToken) {
          return res.status(400).json({ error: 'accessToken is required for Instagram' });
        }
        update.ig_access_token = encrypt(credentials.accessToken);
        update.ig_business_id = credentials.businessId || '';
        break;
      case 'facebook':
        if (!credentials.pageToken) {
          return res.status(400).json({ error: 'pageToken is required for Facebook' });
        }
        update.fb_page_id = credentials.pageId || '';
        update.fb_page_token = encrypt(credentials.pageToken);
        break;
      case 'email':
        if (!credentials.smtpUser || !credentials.smtpPass) {
          return res.status(400).json({ error: 'smtpUser and smtpPass are required for email' });
        }
        update.smtp_host = credentials.smtpHost || 'smtp.gmail.com';
        update.smtp_port = parseInt(credentials.smtpPort) || 587;
        update.smtp_user = credentials.smtpUser;
        update.smtp_pass = encrypt(credentials.smtpPass);
        break;
    }

    const { error } = await supabase
      .from('outreach_credentials')
      .upsert(update, { onConflict: 'user_id' });

    if (error) throw error;

    console.log(`[Settings] Channel ${channel} connected for user ${userId}`);

    res.json({
      success: true,
      channel,
      connected: true,
    });
  } catch (error) {
    next(error);
  }
});

// Disconnect a channel (remove credentials)
router.delete('/channels/:channelId', async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    const { userId } = req.user;
    const { channelId } = req.params;

    const validChannels = ['instagram', 'facebook', 'email'];
    if (!validChannels.includes(channelId)) {
      return res.status(400).json({ error: `Invalid channel. Must be one of: ${validChannels.join(', ')}` });
    }

    // Build the nullification update based on channel type
    const update = { updated_at: new Date().toISOString() };

    switch (channelId) {
      case 'instagram':
        update.ig_access_token = '';
        update.ig_business_id = '';
        break;
      case 'facebook':
        update.fb_page_id = '';
        update.fb_page_token = '';
        break;
      case 'email':
        update.smtp_host = '';
        update.smtp_port = 587;
        update.smtp_user = '';
        update.smtp_pass = '';
        break;
    }

    const { error } = await supabase
      .from('outreach_credentials')
      .update(update)
      .eq('user_id', userId);

    if (error) throw error;

    console.log(`[Settings] Channel ${channelId} disconnected for user ${userId}`);

    res.json({
      success: true,
      message: `${channelId} disconnected`,
    });
  } catch (error) {
    next(error);
  }
});

// ─── Outreach settings (used by desktop Settings page) ───

// Get outreach settings (SMTP + channel toggles)
router.get('/outreach', async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user?.userId || req.headers['x-user-id'];

    const { data: creds } = await supabase
      .from('outreach_credentials')
      .select('*')
      .eq('user_id', userId)
      .single();

    res.json({
      smtp: {
        host: creds?.smtp_host || '',
        port: String(creds?.smtp_port || '587'),
        username: creds?.smtp_user || '',
        password: '', // Never return the actual password
      },
      channels: {
        instagram: !!creds?.ig_access_token,
        facebook: !!creds?.fb_page_token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update SMTP settings
router.put('/outreach/smtp', async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user?.userId || req.headers['x-user-id'];
    const { host, port, username, password } = req.body;

    const update = {
      user_id: userId,
      smtp_host: host || 'smtp.gmail.com',
      smtp_port: parseInt(port) || 587,
      smtp_user: username || '',
      updated_at: new Date().toISOString(),
    };

    if (password) {
      update.smtp_pass = encrypt(password);
    }

    const { error } = await supabase
      .from('outreach_credentials')
      .upsert(update, { onConflict: 'user_id' });

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Update channel toggles
router.put('/outreach/channels', async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user?.userId || req.headers['x-user-id'];

    // Channel toggles are informational — actual connection requires OAuth
    // Just acknowledge the update
    res.json({ success: true, channels: req.body });
  } catch (error) {
    next(error);
  }
});

// ─── API Keys (used by desktop Settings page) ───

router.get('/api-keys', async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user?.userId || req.headers['x-user-id'];

    const { data } = await supabase
      .from('user_api_keys')
      .select('key_name, key_value')
      .eq('user_id', userId);

    const keys = {};
    (data || []).forEach(row => {
      keys[row.key_name] = row.key_value ? '••••' + row.key_value.slice(-4) : '';
    });

    res.json(keys);
  } catch (error) {
    // Table may not exist yet — return empty
    res.json({});
  }
});

router.put('/api-keys', async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user?.userId || req.headers['x-user-id'];

    const updates = Object.entries(req.body).map(([keyName, keyValue]) => ({
      user_id: userId,
      key_name: keyName,
      key_value: encrypt(String(keyValue)),
      updated_at: new Date().toISOString(),
    }));

    for (const update of updates) {
      await supabase
        .from('user_api_keys')
        .upsert(update, { onConflict: 'user_id,key_name' });
    }

    res.json({ success: true });
  } catch (error) {
    // Table may not exist yet — still return success
    res.json({ success: true });
  }
});

// ─── Preferences (used by desktop Settings page) ───

router.get('/preferences', async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user?.userId || req.headers['x-user-id'];

    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    res.json({
      notifications: data?.notifications ?? true,
      autoScrapeOnSearch: data?.auto_scrape_on_search ?? false,
      defaultRadius: String(data?.default_radius || '5000'),
      defaultResultLimit: String(data?.default_result_limit || '20'),
    });
  } catch (error) {
    // Table may not exist yet — return defaults
    res.json({
      notifications: true,
      autoScrapeOnSearch: false,
      defaultRadius: '5000',
      defaultResultLimit: '20',
    });
  }
});

router.put('/preferences', async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user?.userId || req.headers['x-user-id'];
    const { notifications, autoScrapeOnSearch, defaultRadius, defaultResultLimit } = req.body;

    const record = {
      user_id: userId,
      notifications: notifications ?? true,
      auto_scrape_on_search: autoScrapeOnSearch ?? false,
      default_radius: parseInt(defaultRadius) || 5000,
      default_result_limit: parseInt(defaultResultLimit) || 20,
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from('user_preferences')
      .upsert(record, { onConflict: 'user_id' });

    res.json({ success: true });
  } catch (error) {
    // Table may not exist — still return success
    res.json({ success: true });
  }
});

// ─── Billing portal (used by desktop Settings page) ───

router.post('/billing-portal', async (req, res, next) => {
  try {
    const { email } = req.body;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    // Look up customer first via verify-subscription to get status
    const verifyRes = await fetch(`${supabaseUrl}/functions/v1/verify-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ email }),
    });

    const verifyData = await verifyRes.json();

    if (!verifyData.active) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Use Stripe API directly for portal session
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    // Find customer
    const custRes = await fetch(
      `https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=1`,
      { headers: { Authorization: `Bearer ${stripeKey}` } }
    );
    const customers = await custRes.json();

    if (!customers.data?.length) {
      return res.status(400).json({ error: 'No Stripe customer found' });
    }

    // Create portal session
    const portalRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customers.data[0].id,
        return_url: 'agentlead://settings',
      }).toString(),
    });

    const portalData = await portalRes.json();

    if (!portalRes.ok) {
      throw new Error(portalData.error?.message || 'Portal creation failed');
    }

    res.json({ url: portalData.url });
  } catch (error) {
    next(error);
  }
});

export default router;
