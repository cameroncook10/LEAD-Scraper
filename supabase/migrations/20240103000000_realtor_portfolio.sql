-- ============================================================
-- Migration: 003 — Realtor portfolio + lead fit scoring
--
-- Adds per-realtor "preferred buyer/seller portfolio" (their ideal-client
-- profile) and the columns used to score scraped leads against it. Idempotent.
-- ============================================================

-- ── realtor_profiles ──────────────────────────────────────────
-- One row per realtor (user). Describes the kind of buyers and sellers they
-- want, so the AI can qualify scraped leads against THIS realtor's book.
CREATE TABLE IF NOT EXISTS realtor_profiles (
  user_id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  market_areas   TEXT[] DEFAULT '{}',     -- cities / zips / neighborhoods served
  -- buyer_criteria JSONB shape:
  --   { price_min, price_max, property_types[], beds_min, baths_min,
  --     locations[], financing[], timeline, notes }
  buyer_criteria  JSONB NOT NULL DEFAULT '{}',
  -- seller_criteria JSONB shape:
  --   { price_min, price_max, property_types[], locations[],
  --     motivations[], timeline, notes }
  seller_criteria JSONB NOT NULL DEFAULT '{}',
  ideal_client    TEXT,                    -- freeform description of their dream client
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE realtor_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY realtor_profiles_select_own ON realtor_profiles
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY realtor_profiles_modify_own ON realtor_profiles
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_realtor_profiles_updated_at BEFORE UPDATE ON realtor_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── leads: realtor fit-scoring columns ────────────────────────
-- source_score   : deterministic 0-100 from data richness + cross-source signals
-- fit_score      : 0-100 AI fit to the realtor's preferred portfolio
-- composite_score: blended ranking score (source + fit)
-- lead_type      : buyer | seller | both | none
-- realtor_scoring: full detail { matched_criteria[], reasoning, confidence, scored_at }
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_score    NUMERIC(5,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fit_score       NUMERIC(5,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS composite_score NUMERIC(5,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_type       TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS realtor_scoring JSONB;

CREATE INDEX IF NOT EXISTS idx_leads_fit_score       ON leads(fit_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_leads_composite_score ON leads(composite_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_leads_lead_type       ON leads(lead_type);
