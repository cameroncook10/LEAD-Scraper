-- ============================================================
-- Migration: 002 — Billing, messaging, queue & preferences
--
-- Additive companion to 20240101000000_initial_schema.sql. Creates every
-- table the running backend queries that the initial schema does not already
-- create. Fully idempotent (IF NOT EXISTS + guarded policies/triggers), so it
-- is safe to re-run and to apply on top of an existing database.
--
-- Apply with:  supabase db push      (runs all files in supabase/migrations/)
-- or paste into the Supabase SQL editor.
-- ============================================================

-- Shared trigger function (no-op if it already exists from the initial schema)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════════
-- Messaging system  (templates → campaigns → deliveries → queue)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS message_templates (
  id          BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('email','sms','whatsapp','instagram','facebook')),
  subject     TEXT,
  body        TEXT NOT NULL,
  preview_text TEXT,
  variables   TEXT[] DEFAULT '{}',
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS email_campaigns (
  id           BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'email' CHECK (type IN ('email','sms','whatsapp','instagram','facebook')),
  template_id  BIGINT REFERENCES message_templates(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sent','paused')),
  quality_threshold NUMERIC(3,2) DEFAULT 0.5,
  recipient_count INTEGER DEFAULT 0,
  sent_count   INTEGER DEFAULT 0,
  schedule_time TIMESTAMPTZ,
  sent_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS campaign_deliveries (
  id           BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  campaign_id  BIGINT REFERENCES email_campaigns(id) ON DELETE CASCADE,
  lead_id      UUID REFERENCES leads(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','sending','sent','delivered','failed','bounced','opened','clicked')),
  email_message_id TEXT,
  sms_message_id   TEXT,
  error_message    TEXT,
  opened_at    TIMESTAMPTZ,
  clicked_at   TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE campaign_deliveries ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS message_queue (
  id           BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  delivery_id  BIGINT REFERENCES campaign_deliveries(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('email','sms','whatsapp','instagram','facebook')),
  retry_count  INTEGER DEFAULT 0,
  max_retries  INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE message_queue ENABLE ROW LEVEL SECURITY;

-- Permanently-failed messages land here (messageQueue.js → moveToDeadLetter)
CREATE TABLE IF NOT EXISTS dead_letter_queue (
  id                BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  original_queue_id BIGINT,
  delivery_id       BIGINT,
  message_type      TEXT,
  retry_count       INTEGER,
  error_message     TEXT,
  original_payload  TEXT,
  failed_at         TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE dead_letter_queue ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_templates_type     ON message_templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_user     ON message_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status   ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_user     ON email_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created  ON email_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deliveries_campaign ON campaign_deliveries(campaign_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_lead    ON campaign_deliveries(lead_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status  ON campaign_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_queue_next_retry   ON message_queue(next_retry_at);

DO $$ BEGIN
  CREATE TRIGGER trg_templates_updated_at  BEFORE UPDATE ON message_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_campaigns_updated_at  BEFORE UPDATE ON email_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_deliveries_updated_at BEFORE UPDATE ON campaign_deliveries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_queue_updated_at      BEFORE UPDATE ON message_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════
-- Stripe billing  (subscriptions, customer mapping, usage)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS subscriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id     TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  plan          TEXT NOT NULL CHECK (plan IN ('starter','growth','enterprise')),
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','trialing','past_due','canceled','unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id     ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer    ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status      ON subscriptions(status);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS user_stripe_mapping (
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  email              TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, stripe_customer_id)
);
CREATE INDEX IF NOT EXISTS idx_usm_customer ON user_stripe_mapping(stripe_customer_id);
ALTER TABLE user_stripe_mapping ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS usage_tracking (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start  TIMESTAMPTZ NOT NULL,
  period_end    TIMESTAMPTZ NOT NULL,
  leads_scraped INTEGER DEFAULT 0,
  dms_sent      INTEGER DEFAULT 0,
  emails_sent   INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_period  ON usage_tracking(user_id, period_start, period_end);
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Owners may read their own billing rows; all writes come from the backend
-- service-role key (which bypasses RLS), so no INSERT/UPDATE policy is needed.
DO $$ BEGIN
  CREATE POLICY subscriptions_select_own ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY user_stripe_mapping_select_own ON user_stripe_mapping
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY usage_tracking_select_own ON usage_tracking
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════
-- Notification preferences  (Settings page + GDPR export)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_digest  BOOLEAN NOT NULL DEFAULT TRUE,
  webhook_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  weekly_report BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY notif_prefs_select_own ON notification_preferences
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY notif_prefs_modify_own ON notification_preferences
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_notif_prefs_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
