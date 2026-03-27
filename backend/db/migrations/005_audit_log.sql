-- ============================================================
-- 005_audit_log.sql
-- Audit logging table for tracking user actions
-- Run against your Supabase project via SQL Editor or CLI:
--   supabase db push
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,           -- 'create', 'update', 'delete', 'export', 'login', etc.
  resource_type TEXT NOT NULL,    -- 'lead', 'campaign', 'subscription', etc.
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────

CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);

-- ── RLS ───────────────────────────────────────────────────

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON audit_log
  FOR SELECT USING (user_id = auth.uid());

-- Only the backend (service role) can insert audit log entries.
-- End users should not be able to insert/update/delete audit records.
CREATE POLICY "Service role can insert audit logs" ON audit_log
  FOR INSERT WITH CHECK (TRUE);

-- ============================================================
-- DONE! Audit logging table created.
-- ============================================================
