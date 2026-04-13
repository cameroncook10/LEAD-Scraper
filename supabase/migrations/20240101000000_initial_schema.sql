-- ============================================================
-- Migration: 001 — Initial schema
-- Safe to re-run: uses IF NOT EXISTS + ADD COLUMN IF NOT EXISTS
-- ============================================================

-- ── Extensions ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── leads ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bring existing leads table up to date (safe no-op if columns already exist)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id       UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone         TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email         TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS website       TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address       TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score      NUMERIC(5,2) DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_category   TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(4,3) DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS raw_data      JSONB;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source        TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags          TEXT[] DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes         TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_deleted    BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_leads_user_id    ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_source     ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_ai_score   ON leads(ai_score);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_is_deleted ON leads(is_deleted) WHERE is_deleted = FALSE;

-- ── scrape_jobs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scrape_jobs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source           TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS user_id          UUID;
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS status           TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS query            TEXT;
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS total_leads      INTEGER NOT NULL DEFAULT 0;
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS processed_leads  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS started_at       TIMESTAMPTZ;
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS completed_at     TIMESTAMPTZ;
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS error_message    TEXT;
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS metadata         JSONB;

CREATE INDEX IF NOT EXISTS idx_jobs_user_id    ON scrape_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status     ON scrape_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON scrape_jobs(created_at DESC);

-- ── job_logs ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     UUID NOT NULL REFERENCES scrape_jobs(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  level      TEXT NOT NULL DEFAULT 'info',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_logs_job_id     ON job_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_job_logs_created_at ON job_logs(created_at DESC);

-- ── outreach_credentials ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS outreach_credentials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT UNIQUE NOT NULL DEFAULT 'default',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE outreach_credentials ADD COLUMN IF NOT EXISTS ig_access_token TEXT DEFAULT '';
ALTER TABLE outreach_credentials ADD COLUMN IF NOT EXISTS ig_business_id  TEXT DEFAULT '';
ALTER TABLE outreach_credentials ADD COLUMN IF NOT EXISTS fb_page_id      TEXT DEFAULT '';
ALTER TABLE outreach_credentials ADD COLUMN IF NOT EXISTS fb_page_token   TEXT DEFAULT '';
ALTER TABLE outreach_credentials ADD COLUMN IF NOT EXISTS smtp_host       TEXT DEFAULT '';
ALTER TABLE outreach_credentials ADD COLUMN IF NOT EXISTS smtp_port       INTEGER DEFAULT 587;
ALTER TABLE outreach_credentials ADD COLUMN IF NOT EXISTS smtp_user       TEXT DEFAULT '';
ALTER TABLE outreach_credentials ADD COLUMN IF NOT EXISTS smtp_pass       TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_outreach_creds_user ON outreach_credentials(user_id);

-- ── campaigns ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS user_id     UUID;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS type        TEXT NOT NULL DEFAULT 'email';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status      TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS template_id UUID;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS metadata    JSONB DEFAULT '{}';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS sent_count  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS open_count  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS click_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status  ON campaigns(status);

-- ── email_templates ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_templates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  subject    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS user_id    UUID;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS body_html  TEXT;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS body_text  TEXT;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS variables  TEXT[] DEFAULT '{}';
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_templates_user_id ON email_templates(user_id);

-- ── webhooks ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhooks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  url        TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS user_id   UUID;
ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS events    TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS secret    TEXT;
ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);

-- ── audit_logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id     UUID;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource    TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_id TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address  INET;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent  TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS metadata    JSONB;

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ── updated_at trigger ────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_updated_at          ON leads;
DROP TRIGGER IF EXISTS jobs_updated_at           ON scrape_jobs;
DROP TRIGGER IF EXISTS campaigns_updated_at      ON campaigns;
DROP TRIGGER IF EXISTS templates_updated_at      ON email_templates;
DROP TRIGGER IF EXISTS webhooks_updated_at       ON webhooks;
DROP TRIGGER IF EXISTS outreach_creds_updated_at ON outreach_credentials;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON scrape_jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER outreach_creds_updated_at
  BEFORE UPDATE ON outreach_credentials
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE leads                ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_jobs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns            ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs           ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_leads"      ON leads;
DROP POLICY IF EXISTS "users_own_jobs"       ON scrape_jobs;
DROP POLICY IF EXISTS "users_own_job_logs"   ON job_logs;
DROP POLICY IF EXISTS "users_own_campaigns"  ON campaigns;
DROP POLICY IF EXISTS "users_own_templates"  ON email_templates;
DROP POLICY IF EXISTS "users_own_webhooks"   ON webhooks;
DROP POLICY IF EXISTS "users_own_audit_logs" ON audit_logs;

CREATE POLICY "users_own_leads" ON leads
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "users_own_jobs" ON scrape_jobs
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "users_own_job_logs" ON job_logs
  USING (
    job_id IN (SELECT id FROM scrape_jobs WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "users_own_campaigns" ON campaigns
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "users_own_templates" ON email_templates
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "users_own_webhooks" ON webhooks
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "users_own_audit_logs" ON audit_logs
  USING (auth.uid() = user_id OR user_id IS NULL);
