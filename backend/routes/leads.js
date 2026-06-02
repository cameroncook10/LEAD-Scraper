import express from 'express';
import { stringify } from 'csv-stringify/sync';

const router = express.Router();

// ────────────────────────────────────────────────────────────────────────────
// IMPORTANT: static routes (/export, /stats/summary) MUST be declared
// before the parameterised route (/:id) to avoid being swallowed by it.
// ────────────────────────────────────────────────────────────────────────────

// Get leads statistics
router.get('/stats/summary', async (req, res, next) => {
  try {
    const { data, error } = await req.app.locals.supabase
      .from('leads')
      .select('id, ai_score, ai_category, source')
      .eq('user_id', req.user.userId);

    if (error) throw error;

    const leads = data || [];
    const stats = {
      totalLeads: leads.length,
      byCategory: {},
      bySource: {},
      scoreDistribution: {
        hot: 0,
        warm: 0,
        cold: 0,
        invalid: 0
      },
      averageScore: leads.length > 0
        ? (leads.reduce((sum, l) => sum + (l.ai_score || 0), 0) / leads.length).toFixed(2)
        : 0
    };

    leads.forEach(lead => {
      stats.byCategory[lead.ai_category] = (stats.byCategory[lead.ai_category] || 0) + 1;
      stats.bySource[lead.source] = (stats.bySource[lead.source] || 0) + 1;

      if (lead.ai_score >= 80) stats.scoreDistribution.hot++;
      else if (lead.ai_score >= 50) stats.scoreDistribution.warm++;
      else if (lead.ai_score > 0) stats.scoreDistribution.cold++;
      else stats.scoreDistribution.invalid++;
    });

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Export leads as CSV — GET (authenticated user's leads, streams CSV)
router.get('/export', async (req, res, next) => {
  try {
    const { userId } = req.user;
    const {
      source,
      category,
      minScore = 0,
      maxScore = 100,
    } = req.query;

    let query = req.app.locals.supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId);

    if (source) {
      query = query.eq('source', source);
    }
    if (category) {
      query = query.eq('ai_category', category);
    }

    query = query
      .gte('ai_score', parseInt(minScore))
      .lte('ai_score', parseInt(maxScore))
      .order('ai_score', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    const leads = data || [];

    const csvData = leads.map(lead => ({
      'ID': lead.id,
      'Name': lead.name || '',
      'Phone': lead.phone || '',
      'Email': lead.email || '',
      'Website': lead.website || '',
      'Address': lead.address || '',
      'Business Type': lead.business_type || '',
      'AI Score': lead.ai_score ?? '',
      'Category': lead.ai_category || '',
      'Confidence': lead.ai_confidence != null ? (lead.ai_confidence * 100).toFixed(0) + '%' : '',
      'Source': lead.source || '',
      'Created': lead.created_at ? new Date(lead.created_at).toISOString() : '',
      'Updated': lead.updated_at ? new Date(lead.updated_at).toISOString() : '',
    }));

    const csv = stringify(csvData, { header: true });

    const filename = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// Get all leads with filters (scoped to authenticated user)
router.get('/', async (req, res, next) => {
  try {
    const { userId } = req.user;
    const {
      source,
      category,
      minScore = 0,
      maxScore = 100,
      search,
      limit = 100,
      offset = 0
    } = req.query;

    let query = req.app.locals.supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (source) {
      query = query.eq('source', source);
    }
    if (category) {
      query = query.eq('ai_category', category);
    }

    query = query.gte('ai_score', parseInt(minScore))
                 .lte('ai_score', parseInt(maxScore));

    if (search) {
      // Neutralize PostgREST .or() filter syntax (comma / parens / backslash
      // would otherwise inject extra conditions), then escape LIKE wildcards.
      // Combined with the user_id .eq() above this prevents filter injection.
      const sanitized = String(search)
        .replace(/[,()\\]/g, ' ')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
        .slice(0, 100);
      query = query.or(`name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,phone.ilike.%${sanitized}%`);
    }

    query = query.order('ai_score', { ascending: false })
                 .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      leads: data || [],
      total: count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    next(error);
  }
});

// Export leads to CSV — POST (legacy endpoint, no user filter needed here as
// requireAuth + requireSubscription are applied at the server level)
router.post('/export', async (req, res, next) => {
  try {
    const { userId } = req.user;
    const {
      source,
      category,
      minScore = 0,
      maxScore = 100
    } = req.body;

    let query = req.app.locals.supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId);

    if (source) {
      query = query.eq('source', source);
    }
    if (category) {
      query = query.eq('ai_category', category);
    }

    query = query.gte('ai_score', parseInt(minScore))
                 .lte('ai_score', parseInt(maxScore));

    const { data, error } = await query;

    if (error) throw error;

    const leads = data || [];

    const csvData = leads.map(lead => ({
      'Name': lead.name || '',
      'Phone': lead.phone || '',
      'Email': lead.email || '',
      'Website': lead.website || '',
      'Address': lead.address || '',
      'Business Type': lead.business_type || '',
      'AI Score': lead.ai_score ?? '',
      'Category': lead.ai_category || '',
      'Confidence': lead.ai_confidence != null ? (lead.ai_confidence * 100).toFixed(0) + '%' : '',
      'Source': lead.source || '',
      'Created': lead.created_at ? new Date(lead.created_at).toLocaleString() : '',
    }));

    const csv = stringify(csvData, { header: true });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="leads-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// Get lead by ID (verify ownership)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const { data, error } = await req.app.locals.supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Delete lead (verify ownership)
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    // First verify ownership
    const { data: existing, error: fetchError } = await req.app.locals.supabase
      .from('leads')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const { error } = await req.app.locals.supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
