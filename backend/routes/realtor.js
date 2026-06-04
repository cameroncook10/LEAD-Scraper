/**
 * Realtor routes
 *
 *   GET  /api/realtor/profile   — the realtor's preferred buyer/seller portfolio
 *   PUT  /api/realtor/profile   — create/update it
 *   POST /api/realtor/qualify   — score the caller's leads against their portfolio
 *                                 body: { leadIds?: string[], limit?: number, onlyUnscored?: boolean }
 *
 * All endpoints are tenant-scoped to req.user.userId.
 */
import express from 'express';
import { scoreLeadsForRealtor } from '../services/realtorQualification.js';

const router = express.Router();

// Clean 503 when the database isn't configured (instead of an unhandled 500)
router.use((req, res, next) => {
  if (!req.app.locals.supabase) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  next();
});

const EMPTY_PROFILE = {
  market_areas: [],
  buyer_criteria: {},
  seller_criteria: {},
  ideal_client: '',
};

// GET /api/realtor/profile
router.get('/profile', async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('realtor_profiles')
      .select('*')
      .eq('user_id', req.user.userId)
      .maybeSingle();

    if (error) throw error;
    res.json({ profile: data || { user_id: req.user.userId, ...EMPTY_PROFILE } });
  } catch (error) {
    next(error);
  }
});

// PUT /api/realtor/profile
router.put('/profile', async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    const { market_areas, buyer_criteria, seller_criteria, ideal_client } = req.body || {};

    const row = {
      user_id: req.user.userId,
      market_areas: Array.isArray(market_areas) ? market_areas.map(String) : [],
      buyer_criteria: buyer_criteria && typeof buyer_criteria === 'object' ? buyer_criteria : {},
      seller_criteria: seller_criteria && typeof seller_criteria === 'object' ? seller_criteria : {},
      ideal_client: typeof ideal_client === 'string' ? ideal_client.slice(0, 4000) : '',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('realtor_profiles')
      .upsert(row, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    res.json({ profile: data });
  } catch (error) {
    next(error);
  }
});

// POST /api/realtor/qualify
router.post('/qualify', async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.userId;
    const { leadIds, onlyUnscored = false } = req.body || {};
    const limit = Math.min(Math.max(parseInt(req.body?.limit ?? 25, 10) || 25, 1), 50);

    // Load the realtor's portfolio
    const { data: profile, error: profErr } = await supabase
      .from('realtor_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (profErr) throw profErr;
    if (!profile) {
      return res.status(400).json({
        error: 'No portfolio set',
        message: 'Set your preferred buyer/seller portfolio first (PUT /api/realtor/profile).',
        code: 'NO_PORTFOLIO',
      });
    }

    // Select the leads to score (scoped to this user)
    let query = supabase.from('leads').select('*').eq('user_id', userId);
    if (Array.isArray(leadIds) && leadIds.length > 0) {
      query = query.in('id', leadIds.slice(0, 50));
    } else {
      if (onlyUnscored) query = query.is('fit_score', null);
      query = query.order('created_at', { ascending: false });
    }
    query = query.limit(limit);

    const { data: leads, error: leadsErr } = await query;
    if (leadsErr) throw leadsErr;
    if (!leads || leads.length === 0) {
      return res.json({ scored: 0, leads: [] });
    }

    // Score them
    const scored = await scoreLeadsForRealtor(leads, profile);

    // Persist results per lead (scoped by id + user_id)
    let saved = 0;
    for (const lead of scored) {
      const { error: upErr } = await supabase
        .from('leads')
        .update({
          source_score: lead.source_score,
          fit_score: lead.fit_score,
          composite_score: lead.composite_score,
          lead_type: lead.lead_type,
          realtor_scoring: lead.realtor_scoring,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id)
        .eq('user_id', userId);
      if (!upErr) saved += 1;
      else console.error('[realtor] update error:', upErr.message);
    }

    // Return ranked by composite score
    const ranked = scored
      .map(l => ({
        id: l.id,
        name: l.name,
        lead_type: l.lead_type,
        fit_score: l.fit_score,
        source_score: l.source_score,
        composite_score: l.composite_score,
        matched_criteria: l.realtor_scoring?.matched_criteria || [],
        reasoning: l.realtor_scoring?.reasoning || '',
      }))
      .sort((a, b) => (b.composite_score ?? 0) - (a.composite_score ?? 0));

    res.json({ scored: saved, aiUsed: scored[0]?.realtor_scoring?.ai_used ?? false, leads: ranked });
  } catch (error) {
    next(error);
  }
});

export default router;
