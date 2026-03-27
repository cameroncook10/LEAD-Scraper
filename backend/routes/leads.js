import express from 'express';
import { stringify } from 'csv-stringify/sync';

const router = express.Router();

// Get all leads with filters
router.get('/', async (req, res, next) => {
  try {
    const { 
      source, 
      category, 
      minScore = 0, 
      maxScore = 100,
      search,
      limit = 100,
      offset = 0 
    } = req.query;

    let query = req.app.locals.supabase.from('leads').select('*');

    // Apply filters
    if (source) {
      query = query.eq('source', source);
    }
    if (category) {
      query = query.eq('ai_category', category);
    }

    query = query.gte('ai_score', parseInt(minScore))
                .lte('ai_score', parseInt(maxScore));

    if (search) {
      // Sanitize search to prevent ilike injection
      const sanitized = search.replace(/%/g, '\\%').replace(/_/g, '\\_');
      query = query.or(`name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,phone.ilike.%${sanitized}%`);
    }

    // Apply pagination
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

// Export leads as CSV (GET — streams CSV for the authenticated user's leads)
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

    // Format data for CSV export — include all lead fields
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

// Get lead by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await req.app.locals.supabase
      .from('leads')
      .select('*')
      .eq('id', id)
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

// Get leads statistics
router.get('/stats/summary', async (req, res, next) => {
  try {
    const { data, error } = await req.app.locals.supabase
      .from('leads')
      .select('id, ai_score, ai_category, source');

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

    // Count by category
    leads.forEach(lead => {
      stats.byCategory[lead.ai_category] = (stats.byCategory[lead.ai_category] || 0) + 1;
      stats.bySource[lead.source] = (stats.bySource[lead.source] || 0) + 1;

      // Score distribution
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

// Export leads to CSV
router.post('/export', async (req, res, next) => {
  try {
    const { 
      source, 
      category, 
      minScore = 0, 
      maxScore = 100 
    } = req.body;

    let query = req.app.locals.supabase.from('leads').select('*');

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
    
    // Format data for CSV
    const csvData = leads.map(lead => ({
      'Name': lead.name,
      'Phone': lead.phone || '',
      'Email': lead.email || '',
      'Website': lead.website || '',
      'Address': lead.address || '',
      'Business Type': lead.business_type || '',
      'AI Score': lead.ai_score,
      'Category': lead.ai_category,
      'Confidence': (lead.ai_confidence * 100).toFixed(0) + '%',
      'Source': lead.source,
      'Created': new Date(lead.created_at).toLocaleString()
    }));

    const csv = stringify(csvData, {
      header: true,
      columns: {
        'Name': { width: 30 },
        'Phone': { width: 15 },
        'Email': { width: 30 },
        'Website': { width: 25 },
        'Address': { width: 40 },
        'Business Type': { width: 20 },
        'AI Score': { width: 10 },
        'Category': { width: 10 },
        'Confidence': { width: 12 },
        'Source': { width: 12 },
        'Created': { width: 20 }
      }
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="leads-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// Delete lead
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await req.app.locals.supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
