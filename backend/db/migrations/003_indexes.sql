-- ============================================================
-- 003_indexes.sql
-- Performance indexes for common query patterns
-- Run against your Supabase project via SQL Editor or CLI:
--   supabase db push
-- ============================================================

-- ── leads ──
-- Composite index for listing user's leads sorted by newest first
CREATE INDEX IF NOT EXISTS idx_leads_user_created
  ON leads(user_id, created_at DESC);

-- Composite index for filtering leads by quality score
CREATE INDEX IF NOT EXISTS idx_leads_user_score
  ON leads(user_id, ai_score);

-- ── scrape_jobs ──
-- Composite index for listing user's jobs by status
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_user_status
  ON scrape_jobs(user_id, status);

-- Index for global job listing sorted by newest first
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_created
  ON scrape_jobs(created_at DESC);

-- ── email_campaigns ──
-- Composite index for listing user's campaigns by status
CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_status
  ON email_campaigns(user_id, status);

-- ── campaign_deliveries ──
-- Composite index for checking delivery status within a campaign
CREATE INDEX IF NOT EXISTS idx_campaign_deliveries_campaign_status
  ON campaign_deliveries(campaign_id, status);

-- Index for looking up deliveries by lead
CREATE INDEX IF NOT EXISTS idx_campaign_deliveries_lead
  ON campaign_deliveries(lead_id);

-- ── outreach_credentials ──
-- Composite index for looking up credentials by user and platform
CREATE INDEX IF NOT EXISTS idx_outreach_credentials_user_platform
  ON outreach_credentials(user_id);

-- ── job_logs ──
-- Composite index for listing logs for a job sorted by time
CREATE INDEX IF NOT EXISTS idx_job_logs_job_created
  ON job_logs(job_id, created_at);

-- ============================================================
-- DONE! Performance indexes created.
-- ============================================================
