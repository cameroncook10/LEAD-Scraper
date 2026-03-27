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

export default router;
