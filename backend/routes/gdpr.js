import express from 'express';
import { createLimiter } from '../middleware/rateLimiter.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GDPR Data Rights Routes
 *
 * GET    /api/gdpr/export  - Export all user data as JSON
 * DELETE /api/gdpr/delete  - Delete all user data + account
 * PUT    /api/gdpr/rectify - Correct user profile data
 *
 * All endpoints require authentication.
 */

// Rate limiter: 1 export request per hour per user
const gdprExportLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1,
  message: 'You can only request a data export once per hour.',
  keyGenerator: (req) => req.user?.userId || req.ip,
});

// All GDPR routes require authentication
router.use(requireAuth);

/**
 * GET /api/gdpr/export
 * Export all user data as a JSON download (GDPR Article 20 — Right to Data Portability)
 */
router.get('/export', gdprExportLimiter, async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    const { userId, email } = req.user;

    // Gather all user data from every relevant table in parallel
    const [
      leadsResult,
      scrapeJobsResult,
      notificationPrefsResult,
      outreachCredsResult,
      campaignsResult,
      deliveriesResult,
    ] = await Promise.all([
      supabase.from('leads').select('*').eq('user_id', userId),
      supabase.from('scrape_jobs').select('*').eq('user_id', userId),
      supabase.from('notification_preferences').select('*').eq('user_id', userId),
      supabase.from('outreach_credentials').select(
        'id, user_id, ig_business_id, fb_page_id, smtp_host, smtp_port, smtp_user, created_at, updated_at'
      ).eq('user_id', userId),
      supabase.from('email_campaigns').select('*').eq('user_id', userId),
      supabase.from('campaign_deliveries').select('*').eq('user_id', userId),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId,
      email,
      profile: req.user.metadata || {},
      leads: leadsResult.data || [],
      scrapeJobs: scrapeJobsResult.data || [],
      notificationPreferences: notificationPrefsResult.data || [],
      outreachCredentials: (outreachCredsResult.data || []).map(cred => {
        // Strip sensitive tokens from export — user can re-connect
        const { ig_access_token, fb_page_token, smtp_pass, ...safe } = cred;
        return safe;
      }),
      emailCampaigns: campaignsResult.data || [],
      campaignDeliveries: deliveriesResult.data || [],
    };

    const filename = `gdpr-export-${userId}-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(exportData);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/gdpr/delete
 * Delete all user data and account (GDPR Article 17 — Right to Erasure)
 * Requires a confirmation token in the request body.
 */
router.delete('/delete', async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    const { userId } = req.user;
    const { confirmation } = req.body;

    // Require explicit confirmation to prevent accidental deletion
    if (confirmation !== 'PERMANENTLY_DELETE_ALL_MY_DATA') {
      return res.status(400).json({
        error: 'Confirmation required',
        message: 'Send { "confirmation": "PERMANENTLY_DELETE_ALL_MY_DATA" } to confirm. This action is irreversible.',
      });
    }

    const deletionLog = [];

    // Delete in dependency order (children before parents)

    // 1. Message queue entries for user's campaign deliveries
    const { data: campaigns } = await supabase
      .from('email_campaigns')
      .select('id')
      .eq('user_id', userId);

    if (campaigns && campaigns.length > 0) {
      const campaignIds = campaigns.map(c => c.id);

      const { data: deliveries } = await supabase
        .from('campaign_deliveries')
        .select('id')
        .in('campaign_id', campaignIds);

      if (deliveries && deliveries.length > 0) {
        const deliveryIds = deliveries.map(d => d.id);
        await supabase.from('message_queue').delete().in('delivery_id', deliveryIds);
        deletionLog.push(`message_queue entries for ${deliveryIds.length} deliveries`);
      }

      await supabase.from('campaign_deliveries').delete().in('campaign_id', campaignIds);
      deletionLog.push(`campaign_deliveries for ${campaignIds.length} campaigns`);

      await supabase.from('email_campaigns').delete().eq('user_id', userId);
      deletionLog.push('email_campaigns');
    }

    // 2. Outreach credentials
    await supabase.from('outreach_credentials').delete().eq('user_id', userId);
    deletionLog.push('outreach_credentials');

    // 3. Notification preferences
    await supabase.from('notification_preferences').delete().eq('user_id', userId);
    deletionLog.push('notification_preferences');

    // 4. Leads
    const { count: leadCount } = await supabase
      .from('leads')
      .delete({ count: 'exact' })
      .eq('user_id', userId);
    deletionLog.push(`leads (${leadCount || 0} records)`);

    // 5. Scrape jobs (job_logs cascade via FK)
    await supabase.from('scrape_jobs').delete().eq('user_id', userId);
    deletionLog.push('scrape_jobs');

    // 6. Delete the Supabase auth user
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error(`[GDPR] Auth user deletion failed for ${userId}:`, authDeleteError.message);
      return res.status(500).json({
        error: 'Partial deletion',
        message: 'User data was deleted but the account could not be removed. Contact support.',
        deletedTables: deletionLog,
      });
    }

    deletionLog.push('auth account');

    console.log(`[GDPR] Full account deletion for user ${userId}:`, deletionLog.join(', '));

    res.json({
      success: true,
      message: 'All data and your account have been permanently deleted.',
      deleted: deletionLog,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/gdpr/rectify
 * Correct user profile data (GDPR Article 16 — Right to Rectification)
 */
router.put('/rectify', async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    const { name, email: newEmail } = req.body;

    if (!name && !newEmail) {
      return res.status(400).json({
        error: 'No data provided',
        message: 'Provide at least one field to rectify: name, email',
      });
    }

    const updatePayload = { data: {} };

    if (name && typeof name === 'string' && name.trim().length > 0) {
      updatePayload.data.name = name.trim();
      updatePayload.data.full_name = name.trim();
    }

    if (newEmail && typeof newEmail === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail.trim())) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      updatePayload.email = newEmail.trim().toLowerCase();
    }

    const { data: { user }, error } = await supabase.auth.updateUser(updatePayload);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    console.log(`[GDPR] Profile rectified for user ${user.id}`);

    res.json({
      success: true,
      message: 'Profile data updated.',
      profile: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || '',
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
