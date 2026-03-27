-- ============================================================
-- 004_soft_deletes.sql
-- Soft delete support for leads, scrape_jobs, email_campaigns,
-- and message_templates
-- Run against your Supabase project via SQL Editor or CLI:
--   supabase db push
-- ============================================================

-- ── Step 1: Add deleted_at column to target tables ────────

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE scrape_jobs
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE email_campaigns
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE message_templates
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- ── Step 2: Partial indexes for active (non-deleted) rows ─
-- These indexes speed up the common case: querying only active records.

CREATE INDEX IF NOT EXISTS idx_leads_active
  ON leads(id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_active
  ON scrape_jobs(id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_email_campaigns_active
  ON email_campaigns(id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_message_templates_active
  ON message_templates(id) WHERE deleted_at IS NULL;

-- ── Step 3: Helper function for soft delete ───────────────
-- Instead of DELETE, call: UPDATE table SET deleted_at = NOW()
-- This function can be used in a trigger or called directly.

CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Instead of physically deleting, set deleted_at timestamp
  EXECUTE format(
    'UPDATE %I.%I SET deleted_at = NOW() WHERE id = $1',
    TG_TABLE_SCHEMA, TG_TABLE_NAME
  ) USING OLD.id;
  -- Return NULL to cancel the actual DELETE
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ── Step 4: Triggers to intercept DELETE and soft-delete instead

-- leads
DROP TRIGGER IF EXISTS soft_delete_leads ON leads;
CREATE TRIGGER soft_delete_leads
  BEFORE DELETE ON leads
  FOR EACH ROW EXECUTE FUNCTION soft_delete();

-- scrape_jobs
DROP TRIGGER IF EXISTS soft_delete_scrape_jobs ON scrape_jobs;
CREATE TRIGGER soft_delete_scrape_jobs
  BEFORE DELETE ON scrape_jobs
  FOR EACH ROW EXECUTE FUNCTION soft_delete();

-- email_campaigns
DROP TRIGGER IF EXISTS soft_delete_email_campaigns ON email_campaigns;
CREATE TRIGGER soft_delete_email_campaigns
  BEFORE DELETE ON email_campaigns
  FOR EACH ROW EXECUTE FUNCTION soft_delete();

-- message_templates
DROP TRIGGER IF EXISTS soft_delete_message_templates ON message_templates;
CREATE TRIGGER soft_delete_message_templates
  BEFORE DELETE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION soft_delete();

-- ── Step 5: View for active records (convenience) ─────────
-- Application queries can use these views to automatically exclude
-- soft-deleted rows without adding WHERE deleted_at IS NULL everywhere.

CREATE OR REPLACE VIEW active_leads AS
  SELECT * FROM leads WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_scrape_jobs AS
  SELECT * FROM scrape_jobs WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_email_campaigns AS
  SELECT * FROM email_campaigns WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_message_templates AS
  SELECT * FROM message_templates WHERE deleted_at IS NULL;

-- ============================================================
-- DONE! Soft delete support added.
-- Usage:
--   DELETE FROM leads WHERE id = '...'  -- triggers soft delete
--   SELECT * FROM active_leads          -- only non-deleted rows
--   SELECT * FROM leads                 -- includes soft-deleted
-- ============================================================
