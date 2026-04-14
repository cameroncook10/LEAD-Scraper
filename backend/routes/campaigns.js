import express from 'express';
import { supabase } from '../server.js';
import { requireAuth } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';
import { auditLog } from '../utils/auditLog.js';
import { emailLimiter, campaignLimiter } from '../middleware/rateLimiter.js';
import { enqueueEmailCampaign, enqueueSMSCampaign } from '../services/messageQueue.js';

const router = express.Router();

// Middleware
router.use(requireAuth);

/**
 * GET /api/campaigns
 * Get all campaigns for authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      campaigns: data,
      total: data.length
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

/**
 * GET /api/campaigns/:id
 * Get campaign details
 */
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Campaign not found' });

    // Get campaign statistics
    const { data: stats } = await supabase
      .from('campaign_deliveries')
      .select('status')
      .eq('campaign_id', req.params.id);

    const statusCounts = {
      sent: stats?.filter(s => s.status === 'sent').length || 0,
      opened: stats?.filter(s => s.status === 'opened').length || 0,
      clicked: stats?.filter(s => s.status === 'clicked').length || 0,
      failed: stats?.filter(s => s.status === 'failed').length || 0,
      bounced: stats?.filter(s => s.status === 'bounced').length || 0
    };

    res.json({
      campaign: data,
      stats: statusCounts
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

/**
 * POST /api/campaigns
 * Create new campaign
 */
router.post('/', emailLimiter, async (req, res) => {
  try {
    const { 
      name,
      type, // 'email' | 'sms' | 'whatsapp'
      template_id,
      recipient_ids,
      quality_threshold,
      schedule_time,
      status = 'draft'
    } = req.body;

    // Validate required fields
    if (!name || !type || !template_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, type, template_id' 
      });
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .insert({
        user_id: req.user.userId,
        name,
        type,
        template_id,
        quality_threshold: quality_threshold || 0.5,
        schedule_time: schedule_time ? new Date(schedule_time).toISOString() : null,
        status,
        recipient_count: recipient_ids?.length || 0
      })
      .select()
      .single();

    if (campaignError) throw campaignError;

    // Create delivery records for each recipient
    if (recipient_ids && recipient_ids.length > 0) {
      const deliveries = recipient_ids.map(leadId => ({
        campaign_id: campaign.id,
        lead_id: leadId,
        status: 'pending',
        created_at: new Date().toISOString()
      }));

      const { error: deliveryError } = await supabase
        .from('campaign_deliveries')
        .insert(deliveries);

      if (deliveryError) {
        console.error('Error creating deliveries:', deliveryError);
      }
    }

    // Audit log
    await auditLog(
      req.user.userId,
      'CAMPAIGN_CREATED',
      'email_campaign',
      campaign.id,
      { name, type, recipientCount: recipient_ids?.length || 0 }
    );

    res.status(201).json({
      campaign,
      message: 'Campaign created successfully'
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

/**
 * POST /api/campaigns/:id/send
 * Send campaign (immediately or scheduled)
 */
router.post('/:id/send', campaignLimiter, async (req, res) => {
  try {
    const campaignId = req.params.id;

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', req.user.userId)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status === 'sent') {
      return res.status(400).json({ error: 'Campaign already sent' });
    }

    // Get pending deliveries
    const { data: deliveries, error: deliveryError } = await supabase
      .from('campaign_deliveries')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');

    if (deliveryError) throw deliveryError;

    // Queue messages based on campaign type
    let queuedCount = 0;
    
    if (campaign.type === 'email') {
      for (const delivery of deliveries) {
        await enqueueEmailCampaign({
          campaignId,
          deliveryId: delivery.id,
          leadId: delivery.lead_id,
          templateId: campaign.template_id,
          scheduleTime: campaign.schedule_time
        });
        queuedCount++;
      }
    } else if (campaign.type === 'sms' || campaign.type === 'whatsapp') {
      for (const delivery of deliveries) {
        await enqueueSMSCampaign({
          campaignId,
          deliveryId: delivery.id,
          leadId: delivery.lead_id,
          templateId: campaign.template_id,
          messageType: campaign.type,
          scheduleTime: campaign.schedule_time
        });
        queuedCount++;
      }
    }

    // Update campaign status
    const newStatus = campaign.schedule_time ? 'scheduled' : 'sent';
    const { error: updateError } = await supabase
      .from('email_campaigns')
      .update({
        status: newStatus,
        sent_at: newStatus === 'sent' ? new Date().toISOString() : null,
        sent_count: queuedCount
      })
      .eq('id', campaignId);

    if (updateError) throw updateError;

    // Audit log
    await auditLog(
      req.user.userId,
      'CAMPAIGN_SENT',
      'email_campaign',
      campaignId,
      { queuedCount, type: campaign.type }
    );

    res.json({
      campaign: { ...campaign, status: newStatus },
      queuedCount,
      message: `Campaign queued for ${campaign.type} delivery`
    });
  } catch (error) {
    console.error('Error sending campaign:', error);
    res.status(500).json({ error: 'Failed to send campaign' });
  }
});

/**
 * DELETE /api/campaigns/:id
 * Delete campaign
 */
router.delete('/:id', async (req, res) => {
  try {
    const { data: campaign, error: getError } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .single();

    if (getError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status === 'sent' || campaign.status === 'scheduled') {
      return res.status(400).json({ 
        error: 'Cannot delete campaign that has been sent or scheduled' 
      });
    }

    // Delete deliveries first
    await supabase
      .from('campaign_deliveries')
      .delete()
      .eq('campaign_id', req.params.id);

    // Delete campaign
    const { error: deleteError } = await supabase
      .from('email_campaigns')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;

    // Audit log
    await auditLog(
      req.user.userId,
      'CAMPAIGN_DELETED',
      'email_campaign',
      req.params.id,
      { name: campaign.name }
    );

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

/**
 * GET /api/campaigns/:id/stats
 * Get campaign delivery and engagement stats
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const campaignId = req.params.id;
    const userId = req.user.userId;

    // Verify campaign belongs to the authenticated user
    const { data: campaign, error: campaignErr } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', userId)
      .single();

    if (campaignErr || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get deliveries
    const { data: deliveries } = await supabase
      .from('campaign_deliveries')
      .select('*')
      .eq('campaign_id', campaignId);

    if (!deliveries) {
      return res.json({
        sent: 0,
        opened: 0,
        clicked: 0,
        failed: 0,
        bounced: 0,
        pending: 0,
        openRate: 0,
        clickRate: 0
      });
    }

    const stats = {
      sent: deliveries.filter(d => d.status === 'sent').length,
      opened: deliveries.filter(d => d.status === 'opened').length,
      clicked: deliveries.filter(d => d.status === 'clicked').length,
      failed: deliveries.filter(d => d.status === 'failed').length,
      bounced: deliveries.filter(d => d.status === 'bounced').length,
      pending: deliveries.filter(d => d.status === 'pending').length,
      total: deliveries.length
    };

    stats.openRate = stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0;
    stats.clickRate = stats.sent > 0 ? Math.round((stats.clicked / stats.sent) * 100) : 0;

    res.json(stats);
  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    res.status(500).json({ error: 'Failed to fetch campaign stats' });
  }
});

export default router;
