import express from 'express';
const router = express.Router();

/**
 * Analytics endpoints — real data from Supabase
 */

// GET /api/analytics/overview — high-level dashboard stats
router.get('/overview', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const stats = {
      totalLeads: 0,
      qualifiedLeads: 0,
      hotLeads: 0,
      warmLeads: 0,
      coldLeads: 0,
      avgLeadScore: 0,
      dmsSent: 0,
      emailsSent: 0,
      conversions: 0,
      responseRate: 0,
    };

    // Get leads with real column names
    const { data: leads } = await supabase
      .from('leads')
      .select('id, ai_score, ai_category, source, created_at')
      .gte('created_at', since);

    if (leads && leads.length > 0) {
      stats.totalLeads = leads.length;
      stats.qualifiedLeads = leads.filter(l => (l.ai_score || 0) >= 50).length;
      stats.hotLeads = leads.filter(l => (l.ai_score || 0) >= 80).length;
      stats.warmLeads = leads.filter(l => (l.ai_score || 0) >= 50 && (l.ai_score || 0) < 80).length;
      stats.coldLeads = leads.filter(l => (l.ai_score || 0) > 0 && (l.ai_score || 0) < 50).length;
      stats.avgLeadScore = Math.round(
        leads.reduce((sum, l) => sum + (l.ai_score || 0), 0) / leads.length
      );
    }

    // Get campaign delivery stats
    const { data: deliveries } = await supabase
      .from('campaign_deliveries')
      .select('status, campaign_id, email_campaigns(type)')
      .gte('created_at', since);

    if (deliveries && deliveries.length > 0) {
      const sent = deliveries.filter(d => ['sent', 'delivered', 'opened', 'clicked'].includes(d.status));
      stats.dmsSent = sent.filter(d =>
        d.email_campaigns?.type === 'instagram' || d.email_campaigns?.type === 'facebook'
      ).length;
      stats.emailsSent = sent.filter(d => d.email_campaigns?.type === 'email').length;
      stats.conversions = deliveries.filter(d => d.status === 'clicked').length;
      const totalSent = sent.length;
      const opened = deliveries.filter(d => ['opened', 'clicked'].includes(d.status)).length;
      stats.responseRate = totalSent > 0 ? Math.round((opened / totalSent) * 100 * 10) / 10 : 0;
    }

    res.json({
      period: `${days} days`,
      stats,
      roi: {
        leadsPerDollar: stats.totalLeads > 0 ? (stats.totalLeads / 497).toFixed(1) : '0',
        costPerConversion: stats.conversions > 0 ? (497 / stats.conversions).toFixed(2) : '0',
        estimatedRevenue: stats.conversions * 2500,
      },
    });
  } catch (error) {
    console.error('[Analytics] Overview error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/industry-performance — breakdown by business_type
router.get('/industry-performance', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;

    const { data: leads } = await supabase
      .from('leads')
      .select('business_type, ai_score, ai_category');

    if (!leads || leads.length === 0) {
      return res.json({ industries: [] });
    }

    // Group by business_type
    const byType = {};
    for (const lead of leads) {
      const type = lead.business_type || 'Other';
      if (!byType[type]) byType[type] = { leads: 0, qualified: 0, hot: 0 };
      byType[type].leads++;
      if ((lead.ai_score || 0) >= 50) byType[type].qualified++;
      if ((lead.ai_score || 0) >= 80) byType[type].hot++;
    }

    const industries = Object.entries(byType)
      .map(([name, data]) => ({
        industry: name.toLowerCase().replace(/\s+/g, '_'),
        name,
        leadsScraped: data.leads,
        qualified: data.qualified,
        hot: data.hot,
        conversionRate: data.leads > 0 ? Math.round((data.hot / data.leads) * 100 * 100) / 100 : 0,
      }))
      .sort((a, b) => b.leadsScraped - a.leadsScraped);

    res.json({ industries });
  } catch (error) {
    console.error('[Analytics] Industry error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/timeline — daily stats for charting
router.get('/timeline', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Get leads grouped by day
    const { data: leads } = await supabase
      .from('leads')
      .select('ai_score, created_at')
      .gte('created_at', since);

    // Build day-by-day map
    const dayMap = {};
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      dayMap[date] = { leadsScraped: 0, qualified: 0, totalScore: 0 };
    }

    if (leads) {
      for (const lead of leads) {
        const date = lead.created_at?.split('T')[0];
        if (dayMap[date]) {
          dayMap[date].leadsScraped++;
          if ((lead.ai_score || 0) >= 50) dayMap[date].qualified++;
          dayMap[date].totalScore += lead.ai_score || 0;
        }
      }
    }

    const timeline = Object.entries(dayMap).map(([date, data]) => ({
      date,
      leadsScraped: data.leadsScraped,
      qualified: data.qualified,
      leadScore: data.leadsScraped > 0 ? Math.round(data.totalScore / data.leadsScraped) : 0,
    }));

    res.json({ timeline });
  } catch (error) {
    console.error('[Analytics] Timeline error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
