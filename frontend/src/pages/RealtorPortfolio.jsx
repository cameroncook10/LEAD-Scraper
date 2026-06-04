/**
 * Realtor Portfolio — define your preferred buyer/seller profile, then score
 * your scraped leads against it (multi-source + AI fit).
 */
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles, Target, TrendingUp } from 'lucide-react';
import { getRealtorProfile, saveRealtorProfile, qualifyRealtorLeads, startScrape } from '../services/api';

const list = (s) => (s || '').split(',').map(x => x.trim()).filter(Boolean);
const csv = (a) => (Array.isArray(a) ? a.join(', ') : '');
const num = (v) => (v === '' || v == null ? undefined : Number(v));

const blankForm = {
  marketAreas: '',
  buyer: { priceMin: '', priceMax: '', propertyTypes: '', bedsMin: '', locations: '', financing: '', timeline: '', notes: '' },
  seller: { priceMin: '', priceMax: '', propertyTypes: '', locations: '', motivations: '', timeline: '', notes: '' },
  idealClient: '',
};

function fromProfile(p) {
  const b = p?.buyer_criteria || {};
  const s = p?.seller_criteria || {};
  return {
    marketAreas: csv(p?.market_areas),
    buyer: {
      priceMin: b.price_min ?? '', priceMax: b.price_max ?? '', propertyTypes: csv(b.property_types),
      bedsMin: b.beds_min ?? '', locations: csv(b.locations), financing: csv(b.financing),
      timeline: b.timeline ?? '', notes: b.notes ?? '',
    },
    seller: {
      priceMin: s.price_min ?? '', priceMax: s.price_max ?? '', propertyTypes: csv(s.property_types),
      locations: csv(s.locations), motivations: csv(s.motivations), timeline: s.timeline ?? '', notes: s.notes ?? '',
    },
    idealClient: p?.ideal_client ?? '',
  };
}

function toPayload(f) {
  return {
    market_areas: list(f.marketAreas),
    buyer_criteria: {
      price_min: num(f.buyer.priceMin), price_max: num(f.buyer.priceMax),
      property_types: list(f.buyer.propertyTypes), beds_min: num(f.buyer.bedsMin),
      locations: list(f.buyer.locations), financing: list(f.buyer.financing),
      timeline: f.buyer.timeline || undefined, notes: f.buyer.notes || undefined,
    },
    seller_criteria: {
      price_min: num(f.seller.priceMin), price_max: num(f.seller.priceMax),
      property_types: list(f.seller.propertyTypes), locations: list(f.seller.locations),
      motivations: list(f.seller.motivations), timeline: f.seller.timeline || undefined, notes: f.seller.notes || undefined,
    },
    ideal_client: f.idealClient || '',
  };
}

const inputCls = 'w-full glass rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 border border-white/[0.06] placeholder-gray-600';
const labelCls = 'block text-xs text-gray-400 mb-1';

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </div>
  );
}

const typeColor = { buyer: 'text-cyan-400', seller: 'text-emerald-400', both: 'text-purple-400', none: 'text-gray-500' };

export default function RealtorPortfolio() {
  const navigate = useNavigate();
  const [form, setForm] = useState(blankForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [msg, setMsg] = useState(null);
  const [results, setResults] = useState(null);
  const [aiUsed, setAiUsed] = useState(true);
  const [scrapeLoc, setScrapeLoc] = useState('');
  const [finding, setFinding] = useState(null); // 'buyer' | 'seller' | null

  useEffect(() => {
    getRealtorProfile()
      .then(({ profile }) => {
        const f = fromProfile(profile);
        setForm(f);
        setScrapeLoc(list(f.marketAreas)[0] || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const findProspects = async (intent) => {
    const loc = (scrapeLoc || list(form.marketAreas)[0] || '').trim();
    if (!loc) { setMsg({ type: 'err', text: 'Enter a location (or add a market area) to find prospects.' }); return; }
    setFinding(intent); setMsg(null);
    try {
      await startScrape(intent === 'seller' ? 'seller_leads' : 'buyer_leads', loc, 50);
      setMsg({ type: 'ok', text: `Finding ${intent === 'seller' ? 'sellers (FSBO)' : 'buyers'} in ${loc}. This runs in the background — give it a minute, then click "Save & score my leads".` });
    } catch (e) {
      setMsg({ type: 'err', text: e?.response?.data?.error || e?.response?.data?.message || 'Failed to start search.' });
    } finally { setFinding(null); }
  };

  const setBuyer = (k, v) => setForm(f => ({ ...f, buyer: { ...f.buyer, [k]: v } }));
  const setSeller = (k, v) => setForm(f => ({ ...f, seller: { ...f.seller, [k]: v } }));

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      await saveRealtorProfile(toPayload(form));
      setMsg({ type: 'ok', text: 'Portfolio saved.' });
    } catch (e) {
      setMsg({ type: 'err', text: e?.response?.data?.message || 'Failed to save.' });
    } finally { setSaving(false); }
  };

  const scoreLeads = async () => {
    setScoring(true); setMsg(null); setResults(null);
    try {
      await saveRealtorProfile(toPayload(form)); // save latest before scoring
      const res = await qualifyRealtorLeads({ limit: 25 });
      setResults(res.leads || []);
      setAiUsed(res.aiUsed !== false);
      if (!res.leads?.length) setMsg({ type: 'ok', text: 'No leads to score yet — run a scrape first.' });
    } catch (e) {
      setMsg({ type: 'err', text: e?.response?.data?.message || 'Failed to score leads.' });
    } finally { setScoring(false); }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-10 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </button>

        <div className="flex items-center gap-3 mb-2">
          <Target className="w-6 h-6 text-cyan-400" />
          <h1 className="text-3xl font-bold">Preferred Portfolio</h1>
        </div>
        <p className="text-gray-500 mb-8 max-w-2xl">
          Describe the buyers and sellers you want. We score every scraped lead against
          multiple data signals and use AI to rank how well each fits your book.
        </p>

        {msg && (
          <div className={`mb-6 p-3 rounded-lg text-sm border ${msg.type === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
            {msg.text}
          </div>
        )}

        {/* Market areas */}
        <div className="glass-liquid rounded-2xl p-6 mb-5">
          <Field label="Market areas (cities / zips you serve, comma-separated)" value={form.marketAreas}
                 onChange={v => setForm(f => ({ ...f, marketAreas: v }))} placeholder="Austin TX, 78701, Round Rock" />
        </div>

        {/* Buyer + Seller side by side */}
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <div className="glass-liquid rounded-2xl p-6">
            <h2 className="font-semibold text-cyan-400 mb-4">Preferred Buyers</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="Price min ($)" type="number" value={form.buyer.priceMin} onChange={v => setBuyer('priceMin', v)} placeholder="300000" />
              <Field label="Price max ($)" type="number" value={form.buyer.priceMax} onChange={v => setBuyer('priceMax', v)} placeholder="500000" />
            </div>
            <div className="mb-3"><Field label="Property types" value={form.buyer.propertyTypes} onChange={v => setBuyer('propertyTypes', v)} placeholder="single-family, condo" /></div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="Beds min" type="number" value={form.buyer.bedsMin} onChange={v => setBuyer('bedsMin', v)} placeholder="3" />
              <Field label="Timeline" value={form.buyer.timeline} onChange={v => setBuyer('timeline', v)} placeholder="0-3 months" />
            </div>
            <div className="mb-3"><Field label="Locations" value={form.buyer.locations} onChange={v => setBuyer('locations', v)} placeholder="downtown, suburbs" /></div>
            <div className="mb-3"><Field label="Financing" value={form.buyer.financing} onChange={v => setBuyer('financing', v)} placeholder="pre-approved, cash, FHA" /></div>
            <div>
              <label className={labelCls}>Notes</label>
              <textarea value={form.buyer.notes} onChange={e => setBuyer('notes', e.target.value)} rows={2} className={inputCls} placeholder="first-time buyers preferred" />
            </div>
          </div>

          <div className="glass-liquid rounded-2xl p-6">
            <h2 className="font-semibold text-emerald-400 mb-4">Preferred Sellers</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="Price min ($)" type="number" value={form.seller.priceMin} onChange={v => setSeller('priceMin', v)} placeholder="400000" />
              <Field label="Price max ($)" type="number" value={form.seller.priceMax} onChange={v => setSeller('priceMax', v)} placeholder="900000" />
            </div>
            <div className="mb-3"><Field label="Property types" value={form.seller.propertyTypes} onChange={v => setSeller('propertyTypes', v)} placeholder="single-family, luxury" /></div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="Timeline" value={form.seller.timeline} onChange={v => setSeller('timeline', v)} placeholder="ready to list" />
              <Field label="Locations" value={form.seller.locations} onChange={v => setSeller('locations', v)} placeholder="waterfront, west side" />
            </div>
            <div className="mb-3"><Field label="Motivations" value={form.seller.motivations} onChange={v => setSeller('motivations', v)} placeholder="downsizing, relocating, estate" /></div>
            <div>
              <label className={labelCls}>Notes</label>
              <textarea value={form.seller.notes} onChange={e => setSeller('notes', e.target.value)} rows={2} className={inputCls} placeholder="motivated sellers, FSBO" />
            </div>
          </div>
        </div>

        {/* Ideal client freeform */}
        <div className="glass-liquid rounded-2xl p-6 mb-6">
          <label className={labelCls}>Describe your ideal client (freeform — the AI reads this)</label>
          <textarea value={form.idealClient} onChange={e => setForm(f => ({ ...f, idealClient: e.target.value }))} rows={3} className={inputCls}
            placeholder="I work best with first-time buyers in the $300-500k range in central Austin, and downsizing sellers with paid-off homes." />
        </div>

        {/* Find prospects */}
        <div className="glass-liquid rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-white mb-1">Find prospects</h2>
          <p className="text-gray-500 text-sm mb-4">Pull fresh buyer/seller leads from public listings (FSBO + housing-wanted) for a market, then score them below.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input value={scrapeLoc} onChange={e => setScrapeLoc(e.target.value)} placeholder="Austin TX" className={`${inputCls} sm:max-w-xs`} />
            <button onClick={() => findProspects('seller')} disabled={!!finding}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/20 transition disabled:opacity-50">
              {finding === 'seller' ? 'Searching…' : 'Find sellers (FSBO)'}
            </button>
            <button onClick={() => findProspects('buyer')} disabled={!!finding}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/20 transition disabled:opacity-50">
              {finding === 'buyer' ? 'Searching…' : 'Find buyers'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-10">
          <button onClick={save} disabled={saving}
            className="px-6 py-3 rounded-xl font-semibold text-sm bg-white/5 hover:bg-white/10 text-white border border-white/[0.06] transition disabled:opacity-50">
            {saving ? 'Saving…' : 'Save portfolio'}
          </button>
          <button onClick={scoreLeads} disabled={scoring}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/25 transition disabled:opacity-50">
            {scoring ? <><Loader2 className="w-4 h-4 animate-spin" /> Scoring leads…</> : <><Sparkles className="w-4 h-4" /> Save &amp; score my leads</>}
          </button>
        </div>

        {/* Results */}
        {results && results.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-semibold">Ranked leads</h2>
              {!aiUsed && <span className="text-xs text-amber-400">(source score only — set ANTHROPIC_API_KEY for AI fit)</span>}
            </div>
            <div className="space-y-3">
              {results.map(r => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="glass-liquid rounded-xl p-4 flex items-start gap-4">
                  <div className="text-center min-w-[60px]">
                    <div className="text-2xl font-black text-white">{r.composite_score ?? '—'}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">fit</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{r.name}</span>
                      <span className={`text-xs font-medium ${typeColor[r.lead_type] || 'text-gray-500'}`}>{r.lead_type || 'unscored'}</span>
                    </div>
                    {r.reasoning && <p className="text-sm text-gray-400 mt-1">{r.reasoning}</p>}
                    {r.matched_criteria?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {r.matched_criteria.map((c, i) => (
                          <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div>AI fit {r.fit_score ?? '—'}</div>
                    <div>source {r.source_score ?? '—'}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
