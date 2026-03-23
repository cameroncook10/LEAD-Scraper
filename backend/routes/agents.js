import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware } from '../middleware/auth.js';
import { DMAgent } from '../agents/dm-agent-opus.js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const dmAgent = new DMAgent();

/**
 * POST /api/agents/start-scrape
 * Start a new scraping job
 */
router.post('/start-scrape', authMiddleware, async (req, res) => {
  try {
    const { source, query, limit } = req.body;

    if (!source || !query) {
      return res.status(400).json({ message: 'Missing source or query' });
    }

    // Create job record
    const { data: job, error } = await supabase
      .from('agent_logs')
      .insert([
        {
          user_id: req.user.id,
          agent_name: 'scraper',
          action: `Scrape from ${source}`,
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: 'Failed to create scrape job' });
    }

    // TODO: Trigger actual scraping agent
    // For now, just return the job
    return res.json({
      jobId: job.id,
      status: 'pending',
      source,
      query,
    });
  } catch (error) {
    console.error('Start scrape error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/agents/qualify-leads
 * Run lead qualification on leads
 */
router.post('/qualify-leads', authMiddleware, async (req, res) => {
  try {
    const { leadIds } = req.body;

    if (!leadIds || leadIds.length === 0) {
      return res.status(400).json({ message: 'No leads to qualify' });
    }

    // TODO: Trigger Claude Haiku to qualify leads
    return res.json({
      message: 'Qualification started',
      leadsToProcess: leadIds.length,
    });
  } catch (error) {
    console.error('Qualify leads error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/agents/send-dm
 * Send personalized DM to lead(s) using Claude Opus 4.6
 */
router.post('/send-dm', authMiddleware, async (req, res) => {
  try {
    const { leadIds, channel, campaignId } = req.body;

    if (!leadIds || !channel) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get leads data
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .in('id', leadIds)
      .eq('user_id', req.user.id);

    if (leadsError) {
      return res.status(400).json({ message: 'Failed to fetch leads' });
    }

    // Send DMs with Claude Opus
    const results = await Promise.allSettled(
      leads.map(lead => dmAgent.sendPersonalizedMessage(lead, channel, campaignId))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return res.json({
      message: 'DM campaign initiated',
      successful,
      failed,
      channel,
    });
  } catch (error) {
    console.error('Send DM error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/agents/campaign
 * Launch campaign to lead list
 */
router.post('/campaign', authMiddleware, async (req, res) => {
  try {
    const { campaignId, leadIds } = req.body;

    if (!campaignId || !leadIds) {
      return res.status(400).json({ message: 'Missing campaign or leads' });
    }

    // Update campaign status
    const { error: campaignError } = await supabase
      .from('campaigns')
      .update({ status: 'running' })
      .eq('id', campaignId)
      .eq('user_id', req.user.id);

    if (campaignError) {
      return res.status(400).json({ message: 'Failed to update campaign' });
    }

    // Add leads to campaign
    const campaignLeads = leadIds.map(leadId => ({
      campaign_id: campaignId,
      lead_id: leadId,
      status: 'pending',
      added_at: new Date().toISOString(),
    }));

    const { error: linkError } = await supabase
      .from('campaign_leads')
      .insert(campaignLeads);

    if (linkError) {
      return res.status(400).json({ message: 'Failed to add leads to campaign' });
    }

    // TODO: Trigger DM agent for all leads
    return res.json({
      message: 'Campaign launched',
      campaignId,
      leadsCount: leadIds.length,
    });
  } catch (error) {
    console.error('Campaign error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/agents/status
 * Get status of all agents
 */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const agents = {
      scraper: {
        state: 'active',
        jobsProcessed: 42,
        uptime: '5h 23m',
      },
      qualifier: {
        state: 'active',
        jobsProcessed: 156,
        uptime: '5h 23m',
      },
      'dm-agent': {
        state: 'idle',
        jobsProcessed: 28,
        uptime: '5h 23m',
      },
      analytics: {
        state: 'active',
        jobsProcessed: 12,
        uptime: '5h 23m',
      },
    };

    return res.json(agents);
  } catch (error) {
    console.error('Agent status error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/agents/logs
 * Get agent activity logs
 */
router.get('/logs', authMiddleware, async (req, res) => {
  try {
    const { data: logs, error } = await supabase
      .from('agent_logs')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return res.status(400).json({ message: 'Failed to fetch logs' });
    }

    const formattedLogs = logs.map(log => ({
      id: log.id,
      agentName: log.agent_name,
      action: log.action,
      status: log.status,
      duration: log.duration,
      error: log.error,
      createdAt: log.created_at,
    }));

    return res.json(formattedLogs);
  } catch (error) {
    console.error('Logs error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/agents/performance
 * Get campaign performance
 */
router.get('/performance', authMiddleware, async (req, res) => {
  try {
    const { campaignId } = req.query;

    if (!campaignId) {
      return res.status(400).json({ message: 'Campaign ID required' });
    }

    // Get campaign metrics
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('campaign_id', campaignId);

    if (error) {
      return res.status(400).json({ message: 'Failed to fetch campaign data' });
    }

    const totalSent = messages.length;
    const totalOpened = messages.filter(m => m.opened_at).length;
    const totalClicked = messages.filter(m => m.clicked_at).length;

    return res.json({
      campaignId,
      totalSent,
      openRate: ((totalOpened / totalSent) * 100).toFixed(2),
      clickRate: ((totalClicked / totalSent) * 100).toFixed(2),
      messages: messages.map(m => ({
        id: m.id,
        leadId: m.lead_id,
        channel: m.channel,
        status: m.status,
        openedAt: m.opened_at,
        clickedAt: m.clicked_at,
      })),
    });
  } catch (error) {
    console.error('Performance error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
