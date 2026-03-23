/**
 * Auto-DM Workflow API Routes
 * 
 * Endpoints:
 * POST /api/workflows/auto-dm          — Process a single lead through the Auto-DM pipeline
 * POST /api/workflows/auto-dm/batch    — Batch process all qualified leads
 * GET  /api/workflows/auto-dm/status   — Get workflow status and queue stats
 */
import express from 'express';
import { processLeadForAutoDM, batchProcessLeads } from '../workflows/autoDmWorkflow.js';
import { supabase } from '../server.js';

const router = express.Router();

/**
 * POST /api/workflows/auto-dm
 * Process a single lead through the Auto-DM pipeline
 */
router.post('/auto-dm', async (req, res) => {
  try {
    const { leadId, provider = 'instagram', minScore = 70, templateOverride } = req.body;

    if (!leadId) {
      return res.status(400).json({ error: 'leadId is required' });
    }

    // Fetch the lead
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error || !lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const result = await processLeadForAutoDM(lead, { provider, minScore, templateOverride });

    if (result.success) {
      res.json({
        success: true,
        deliveryId: result.deliveryId,
        campaignId: result.campaignId,
        message: 'Lead queued for Auto-DM',
      });
    } else if (result.skipped) {
      res.json({ 
        success: false, 
        skipped: true, 
        reason: result.reason 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('[Workflow Route] Error:', error);
    res.status(500).json({ error: 'Failed to process lead' });
  }
});

/**
 * POST /api/workflows/auto-dm/batch
 * Batch process all qualified leads
 */
router.post('/auto-dm/batch', async (req, res) => {
  try {
    const { provider = 'instagram', minScore = 70, limit = 50 } = req.body;

    const result = await batchProcessLeads({ provider, minScore, limit });

    res.json({
      success: true,
      processed: result.processed,
      skipped: result.skipped || 0,
      total: result.total || 0,
      message: `Batch complete: ${result.processed} leads queued`,
    });
  } catch (error) {
    console.error('[Workflow Route] Batch error:', error);
    res.status(500).json({ error: 'Batch processing failed' });
  }
});

/**
 * GET /api/workflows/auto-dm/status
 * Get current workflow and queue status
 */
router.get('/auto-dm/status', async (req, res) => {
  try {
    // Queue stats
    const { data: queueItems } = await supabase
      .from('message_queue')
      .select('message_type, retry_count');

    // Today's campaign stats
    const todayName = `Auto-DM ${new Date().toISOString().split('T')[0]}`;
    const { data: campaign } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('name', todayName)
      .single();

    // Recent deliveries
    const { data: recentDeliveries } = await supabase
      .from('campaign_deliveries')
      .select('status')
      .order('created_at', { ascending: false })
      .limit(100);

    const deliveryBreakdown = {};
    (recentDeliveries || []).forEach(d => {
      deliveryBreakdown[d.status] = (deliveryBreakdown[d.status] || 0) + 1;
    });

    res.json({
      queueSize: queueItems?.length || 0,
      queueByProvider: (queueItems || []).reduce((acc, item) => {
        acc[item.message_type] = (acc[item.message_type] || 0) + 1;
        return acc;
      }, {}),
      todayCampaign: campaign ? {
        id: campaign.id,
        name: campaign.name,
        sentCount: campaign.sent_count,
      } : null,
      recentDeliveries: deliveryBreakdown,
    });
  } catch (error) {
    console.error('[Workflow Route] Status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

export default router;
