/**
 * Realtor lead qualification
 *
 * Two-part scoring for real-estate leads:
 *   1. scoreSources(lead)        — deterministic 0-100 from data richness +
 *                                  cross-source corroboration + intent signals.
 *                                  "Scoring against multiple sources."
 *   2. qualifyForPortfolio(...)  — Claude classifies the lead as buyer/seller and
 *                                  scores 0-100 fit to THIS realtor's preferred
 *                                  buyer/seller portfolio, with matched criteria.
 *
 * composite_score blends the two so the best-fit, best-data leads rank first.
 *
 * Uses the Anthropic SDK directly (ANTHROPIC_API_KEY in backend env). If the key
 * is missing it degrades gracefully to source-only scoring (no AI fit).
 */
import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

let _client = null;
function getClient() {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  _client = new Anthropic({ apiKey });
  return _client;
}

const BUY_INTENT = ['pre-approved', 'preapproved', 'looking to buy', 'first-time', 'first time', 'relocating', 'house hunting', 'mortgage', 'down payment', 'buyer', 'searching for', 'in the market'];
const SELL_INTENT = ['fsbo', 'for sale by owner', 'thinking of selling', 'expired listing', 'pre-foreclosure', 'preforeclosure', 'downsizing', 'must sell', 'motivated seller', 'estate sale', 'relocating', 'seller', 'list my home'];

function textBlob(lead) {
  const parts = [lead?.name, lead?.notes, lead?.business_type, lead?.address];
  if (lead?.raw_data) {
    try { parts.push(typeof lead.raw_data === 'string' ? lead.raw_data : JSON.stringify(lead.raw_data)); } catch { /* ignore */ }
  }
  return parts.filter(Boolean).join(' ').toLowerCase();
}

/**
 * Deterministic multi-source / data-quality score (0-100). Higher = more
 * reachable, richer, and corroborated across sources.
 */
export function scoreSources(lead) {
  let score = 0;
  const signals = [];

  // Contactability
  if (lead?.phone)   { score += 25; signals.push('phone'); }
  if (lead?.email)   { score += 20; signals.push('email'); }
  if (lead?.website) { score += 10; signals.push('website'); }

  // Data richness
  if (lead?.address) { score += 10; signals.push('address'); }
  const rd = lead?.raw_data && typeof lead.raw_data === 'object' ? lead.raw_data : {};
  if (rd.price || rd.list_price || rd.budget)       { score += 10; signals.push('price'); }
  if (rd.property_type || rd.beds || rd.bedrooms)   { score += 8;  signals.push('property_details'); }

  // Cross-source corroboration: a lead seen in multiple sources is stronger.
  const sources = Array.isArray(lead?.sources) ? lead.sources : (lead?.source ? [lead.source] : []);
  const uniqueSources = [...new Set(sources.filter(Boolean))];
  if (uniqueSources.length >= 3)      { score += 20; signals.push('3+ sources'); }
  else if (uniqueSources.length === 2){ score += 12; signals.push('2 sources'); }
  else if (uniqueSources.length === 1){ score += 5;  signals.push('1 source'); }

  // Intent signals in any text we have
  const blob = textBlob(lead);
  const hasBuy  = BUY_INTENT.some(k => blob.includes(k));
  const hasSell = SELL_INTENT.some(k => blob.includes(k));
  if (hasBuy || hasSell) { score += 12; signals.push('intent_keywords'); }

  return { source_score: Math.min(100, Math.round(score)), signals, intent: { buyer: hasBuy, seller: hasSell } };
}

function buildPrompt(lead, profile) {
  const leadSummary = {
    name: lead?.name,
    phone: lead?.phone || null,
    email: lead?.email || null,
    address: lead?.address || null,
    source: lead?.source || null,
    notes: lead?.notes || null,
    details: lead?.raw_data && typeof lead.raw_data === 'object' ? lead.raw_data : undefined,
  };

  return `You are a real-estate lead qualification expert. A realtor has defined the buyers and sellers they most want to work with. Score how well THIS lead fits THIS realtor's preferred portfolio.

REALTOR PORTFOLIO
Market areas: ${JSON.stringify(profile?.market_areas || [])}
Preferred BUYERS: ${JSON.stringify(profile?.buyer_criteria || {})}
Preferred SELLERS: ${JSON.stringify(profile?.seller_criteria || {})}
Ideal client (freeform): ${profile?.ideal_client || '(none provided)'}

LEAD
${JSON.stringify(leadSummary, null, 2)}

Decide:
- lead_type: "buyer", "seller", "both", or "none" — what this lead most likely is.
- fit_score: 0-100, how well the lead matches the realtor's PREFERRED portfolio (weigh location/market area, price range, property type, and intent/timeline). A lead outside the realtor's market or price band scores low even if they're a real buyer/seller.
- matched_criteria: short array of the specific portfolio criteria this lead matches (e.g. "in market area Austin", "price within $300k-$500k", "first-time buyer"). Empty if none.
- reasoning: one or two sentences, concrete.
- confidence: 0-1, based on how much lead data was available.

Respond with ONLY this JSON, no markdown:
{"lead_type":"buyer|seller|both|none","fit_score":<0-100>,"matched_criteria":["..."],"reasoning":"...","confidence":<0-1>}`;
}

function parseJsonResponse(text) {
  if (!text) return null;
  // Strip code fences / extract the first {...} block.
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

/**
 * AI fit score against the realtor's portfolio. Returns null if no API key.
 */
export async function qualifyForPortfolio(lead, profile) {
  const client = getClient();
  if (!client) return null;

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    messages: [{ role: 'user', content: buildPrompt(lead, profile) }],
  });

  const text = resp?.content?.[0]?.type === 'text' ? resp.content[0].text : '';
  const parsed = parseJsonResponse(text);
  if (!parsed) return null;

  const validTypes = ['buyer', 'seller', 'both', 'none'];
  const lead_type = validTypes.includes(parsed.lead_type) ? parsed.lead_type : 'none';
  const fit_score = Math.max(0, Math.min(100, Number(parsed.fit_score) || 0));
  const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));

  return {
    lead_type,
    fit_score,
    matched_criteria: Array.isArray(parsed.matched_criteria) ? parsed.matched_criteria.slice(0, 12).map(String) : [],
    reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
    confidence,
  };
}

/**
 * Full scoring for one lead: deterministic source score + AI portfolio fit,
 * blended into a composite ranking score.
 */
export async function scoreLeadForRealtor(lead, profile) {
  const src = scoreSources(lead);

  let ai = null;
  try {
    ai = await qualifyForPortfolio(lead, profile);
  } catch (err) {
    console.error('[realtor] AI qualify error:', err.message);
  }

  const fit_score = ai ? ai.fit_score : null;
  // Composite: weight portfolio fit higher than raw data quality when we have it.
  const composite_score = fit_score != null
    ? Math.round(fit_score * 0.7 + src.source_score * 0.3)
    : src.source_score;

  return {
    source_score: src.source_score,
    fit_score,
    composite_score,
    lead_type: ai ? ai.lead_type : (src.intent.buyer && src.intent.seller ? 'both' : src.intent.buyer ? 'buyer' : src.intent.seller ? 'seller' : null),
    realtor_scoring: {
      signals: src.signals,
      matched_criteria: ai?.matched_criteria || [],
      reasoning: ai?.reasoning || (ai ? '' : 'AI scoring unavailable (ANTHROPIC_API_KEY not set) — source score only'),
      confidence: ai?.confidence ?? null,
      ai_used: !!ai,
      scored_at: new Date().toISOString(),
    },
  };
}

/**
 * Batch score, sequential with a small delay to respect rate limits.
 */
export async function scoreLeadsForRealtor(leads, profile, onProgress) {
  const results = [];
  for (let i = 0; i < leads.length; i++) {
    const scoring = await scoreLeadForRealtor(leads[i], profile);
    results.push({ ...leads[i], ...scoring });
    if (onProgress) onProgress({ current: i + 1, total: leads.length });
    await new Promise(r => setTimeout(r, 120));
  }
  return results;
}
