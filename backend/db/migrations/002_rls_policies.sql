-- ============================================================
-- 002_rls_policies.sql
-- Row Level Security policies for all user-owned tables
-- Run against your Supabase project via SQL Editor or CLI:
--   supabase db push
-- ============================================================

-- ── Step 1: Add user_id to tables that are missing it ─────
-- leads, scrape_jobs, and job_logs currently lack user_id.
-- We add the column (nullable at first so existing rows aren't broken),
-- then enable RLS on every user-owned table.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE scrape_jobs
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE job_logs
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- outreach_credentials exists in schema.js but not complete-schema.sql;
-- ensure user_id is a proper UUID FK (it was TEXT in the legacy schema).
-- If the table already exists with user_id as TEXT, this migration is
-- idempotent — Supabase will skip if column already present.
ALTER TABLE outreach_credentials
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ── Step 2: Enable RLS on all user-owned tables ───────────

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsubscribes ENABLE ROW LEVEL SECURITY;
-- api_keys already has RLS enabled in complete-schema.sql

-- ── Step 3: RLS Policies ──────────────────────────────────

-- ── leads ──
CREATE POLICY "Users can view own records" ON leads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own records" ON leads
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own records" ON leads
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own records" ON leads
  FOR DELETE USING (user_id = auth.uid());

-- ── scrape_jobs ──
CREATE POLICY "Users can view own records" ON scrape_jobs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own records" ON scrape_jobs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own records" ON scrape_jobs
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own records" ON scrape_jobs
  FOR DELETE USING (user_id = auth.uid());

-- ── job_logs ──
CREATE POLICY "Users can view own records" ON job_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own records" ON job_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own records" ON job_logs
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own records" ON job_logs
  FOR DELETE USING (user_id = auth.uid());

-- ── outreach_credentials ──
CREATE POLICY "Users can view own records" ON outreach_credentials
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own records" ON outreach_credentials
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own records" ON outreach_credentials
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own records" ON outreach_credentials
  FOR DELETE USING (user_id = auth.uid());

-- ── message_templates ──
CREATE POLICY "Users can view own records" ON message_templates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own records" ON message_templates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own records" ON message_templates
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own records" ON message_templates
  FOR DELETE USING (user_id = auth.uid());

-- ── email_campaigns ──
CREATE POLICY "Users can view own records" ON email_campaigns
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own records" ON email_campaigns
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own records" ON email_campaigns
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own records" ON email_campaigns
  FOR DELETE USING (user_id = auth.uid());

-- ── campaign_deliveries ──
-- campaign_deliveries doesn't have a direct user_id, but we secure it
-- through the campaign ownership chain. Users can only access deliveries
-- for campaigns they own.
DROP POLICY IF EXISTS "Users can view own records" ON campaign_deliveries;
CREATE POLICY "Users can view own deliveries" ON campaign_deliveries
  FOR SELECT USING (
    campaign_id IN (SELECT id FROM email_campaigns WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own deliveries" ON campaign_deliveries
  FOR INSERT WITH CHECK (
    campaign_id IN (SELECT id FROM email_campaigns WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own deliveries" ON campaign_deliveries
  FOR UPDATE USING (
    campaign_id IN (SELECT id FROM email_campaigns WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own deliveries" ON campaign_deliveries
  FOR DELETE USING (
    campaign_id IN (SELECT id FROM email_campaigns WHERE user_id = auth.uid())
  );

-- ── unsubscribes ──
CREATE POLICY "Users can view own records" ON unsubscribes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own records" ON unsubscribes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own records" ON unsubscribes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own records" ON unsubscribes
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- DONE! RLS policies applied to all user-owned tables.
-- ============================================================
