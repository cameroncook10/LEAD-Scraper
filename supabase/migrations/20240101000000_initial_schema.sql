-- ============================================================
-- Migration: 001 — Initial schema
-- Applied:   2024-01-01
-- ============================================================

-- ── Extensions ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── leads ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID,                          -- FK to auth.users (nullable for legacy rows)
  name          TEXT NOT NULL,
  phone         TEXT,
  email         TEXT,
  website       TEXT,
  address       TEXT,
  business_type TEXT,
  ai_score      NUMERIC(5,2) DEFAULT 0,
  ai_category   TEXT CHECK (ai_category IN ('hot','warm','cold','invalid',NULL)),
  ai_confidence NUMERIC(4,3) DEFAULT 0,
  raw_data      JSONB,
  source        TEXT,
  tags          TEXT[] DEFAULT '{}',
  notes         TEXT,
  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE, -- soft delete
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_user_id    ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_source     ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_ai_score   ON leads(ai_score);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_is_deleted ON leads(is_deleted) WHERE is_deleted = FALSE;

-- ── scrape_jobs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scrape_jobs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','running','completed','failed')),
  source           TEXT NOT NULL,
  query            TEXT,
  total_leads      INTEGER NOT NULL DEFAULT 0,
  processed_leads  INTEGER NOT NULL DEFAULT 0,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  error_message    TEXT,
  metadata         JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id    ON scrape_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status     ON scrape_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON scrape_jobs(created_at DESC);

-- ── job_logs ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     UUID NOT NULL REFERENCES scrape_jobs(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  level      TEXT NOT NULL DEFAULT 'info'
               CHECK (level IN ('info','warning','error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_logs_job_id     ON job_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_job_logs_created_at ON job_logs(created_at DESC);

-- ── outreach_credentials ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS outreach_credentials (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT UNIQUE NOT NULL DEFAULT 'default',
  ig_access_token TEXT DEFAULT '',
  ig_business_id  TEXT DEFAULT '',
  fb_page_id      TEXT DEFAULT '',
  fb_page_token   TEXT DEFAULT '',
  smtp_host       TEXT DEFAULT '',
  smtp_port       INTEGER DEFAULT 587,
  smtp_user       TEXT DEFAULT '',
  smtp_pass       TEXT DEFAULT '',          -- encrypted at application layer
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outreach_creds_user ON outreach_credentials(user_id);

-- ── campaigns ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'email'
                CHECK (type IN ('email','sms','dm')),
  status      TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','active','paused','completed')),
  template_id UUID,
  metadata    JSONB DEFAULT '{}',
  sent_count  INTEGER NOT NULL DEFAULT 0,
  open_count  INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status  ON campaigns(status);

-- ── email_templates ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_templates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID,
  name       TEXT NOT NULL,
  subject    TEXT NOT NULL,
  body_html  TEXT,
  body_text  TEXT,
  variables  TEXT[] DEFAULT '{}',   -- e.g. ['{{name}}', '{{business}}']
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_user_id ON email_templates(user_id);

-- ── webhooks ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhooks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID,
  name       TEXT NOT NULL,
  url        TEXT NOT NULL,
  events     TEXT[] NOT NULL DEFAULT '{}',
  secret     TEXT,                    -- for signature verification
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);

-- ── audit_logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID,
  action     TEXT NOT NULL,
  resource   TEXT,
  resource_id TEXT,
  ip_address  INET,
  user_agent  TEXT,
  metadata    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ── updated_at auto-trigger ────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER jobs_updated_at
  BEFORE UPDATE ON scrape_jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER outreach_creds_updated_at
  BEFORE UPDATE ON outreach_credentials
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security (RLS) ───────────────────────────────────
-- Enable RLS on all tables — all access goes through service_role key
-- or auth'd user matching user_id.

ALTER TABLE leads                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_jobs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_logs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns              ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_credentials   ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs             ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (backend uses service_role key)
-- Authenticated users can only access their own rows

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
