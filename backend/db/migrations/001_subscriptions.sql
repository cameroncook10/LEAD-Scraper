-- ============================================================
-- 001_subscriptions.sql
-- Subscription, billing, and usage tracking tables for Stripe
-- Run against your Supabase project via SQL Editor or CLI:
--   supabase db push
-- ============================================================

-- ── Subscriptions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id    TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  plan          TEXT NOT NULL CHECK (plan IN ('starter', 'growth', 'enterprise')),
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
  current_period_start  TIMESTAMP WITH TIME ZONE,
  current_period_end    TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end  BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id
  ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id
  ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON subscriptions(status);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_select_own ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY subscriptions_insert_service ON subscriptions
  FOR INSERT WITH CHECK (TRUE);
  -- Inserts come from the backend service-role key, not end users.

CREATE POLICY subscriptions_update_service ON subscriptions
  FOR UPDATE USING (TRUE);

-- ── User ↔ Stripe customer mapping ─────────────────────────
CREATE TABLE IF NOT EXISTS user_stripe_mapping (
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  email             TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, stripe_customer_id)
);

CREATE INDEX IF NOT EXISTS idx_user_stripe_mapping_customer
  ON user_stripe_mapping(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_stripe_mapping_user
  ON user_stripe_mapping(user_id);

-- RLS
ALTER TABLE user_stripe_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_stripe_mapping_select_own ON user_stripe_mapping
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_stripe_mapping_insert_service ON user_stripe_mapping
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY user_stripe_mapping_update_service ON user_stripe_mapping
  FOR UPDATE USING (TRUE);

-- ── Usage tracking ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usage_tracking (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start  TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end    TIMESTAMP WITH TIME ZONE NOT NULL,
  leads_scraped INTEGER DEFAULT 0,
  dms_sent      INTEGER DEFAULT 0,
  emails_sent   INTEGER DEFAULT 0,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id
  ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period
  ON usage_tracking(user_id, period_start, period_end);

-- RLS
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY usage_tracking_select_own ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY usage_tracking_insert_service ON usage_tracking
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY usage_tracking_update_service ON usage_tracking
  FOR UPDATE USING (TRUE);

-- ── Auto-update updated_at trigger ──────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
