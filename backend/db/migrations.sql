-- Lead Scraper SaaS Database Schema
-- Supabase PostgreSQL Database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  website VARCHAR(255),
  address VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(10),
  business_type VARCHAR(100),
  company_size VARCHAR(50),
  source VARCHAR(50) NOT NULL, -- 'zillow', 'nextdoor', 'google_maps', 'web'
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Lead scores (AI qualification results)
CREATE TABLE IF NOT EXISTS lead_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0, -- 0-100
  category VARCHAR(20), -- 'hot', 'warm', 'cold', 'invalid'
  confidence DECIMAL(3, 2), -- 0-1
  reasoning TEXT,
  ai_model VARCHAR(50) DEFAULT 'claude-haiku',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_id UUID,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed'
  lead_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaign leads (links leads to campaigns)
CREATE TABLE IF NOT EXISTS campaign_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'bounced', 'opened', 'clicked'
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(campaign_id, lead_id)
);

-- Messages (all outbound messages)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL, -- 'email', 'sms', 'whatsapp'
  content TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'bounced', 'failed'
  external_message_id VARCHAR(255),
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  bounced_at TIMESTAMP,
  replied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Message tracking (detailed delivery and engagement)
CREATE TABLE IF NOT EXISTS message_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  external_message_id VARCHAR(255),
  opens INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  bounces INTEGER DEFAULT 0,
  complaints INTEGER DEFAULT 0,
  last_event_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  channel VARCHAR(50) NOT NULL, -- 'email', 'sms', 'whatsapp'
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]', -- ['{{name}}', '{{company}}', '{{budget}}']
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Agent logs (activity tracking)
CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  agent_name VARCHAR(100) NOT NULL, -- 'scraper', 'qualifier', 'dm-agent', 'analytics'
  action VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  duration INTEGER, -- milliseconds
  error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Metrics snapshot (daily metrics)
CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  leads_scraped INTEGER DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  hot_leads INTEGER DEFAULT 0,
  warm_leads INTEGER DEFAULT 0,
  cold_leads INTEGER DEFAULT 0,
  email_sent INTEGER DEFAULT 0,
  email_opened INTEGER DEFAULT 0,
  email_clicked INTEGER DEFAULT 0,
  sms_sent INTEGER DEFAULT 0,
  sms_read INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, metric_date)
);

-- Indexes for performance
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_company ON leads USING GIN(company gin_trgm_ops);

CREATE INDEX idx_lead_scores_lead_id ON lead_scores(lead_id);
CREATE INDEX idx_lead_scores_category ON lead_scores(category);
CREATE INDEX idx_lead_scores_created_at ON lead_scores(created_at);

CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at);

CREATE INDEX idx_campaign_leads_campaign_id ON campaign_leads(campaign_id);
CREATE INDEX idx_campaign_leads_lead_id ON campaign_leads(lead_id);
CREATE INDEX idx_campaign_leads_status ON campaign_leads(status);

CREATE INDEX idx_messages_campaign_id ON messages(campaign_id);
CREATE INDEX idx_messages_lead_id ON messages(lead_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_channel ON messages(channel);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_external_id ON messages(external_message_id);

CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_channel ON templates(channel);

CREATE INDEX idx_agent_logs_user_id ON agent_logs(user_id);
CREATE INDEX idx_agent_logs_agent_name ON agent_logs(agent_name);
CREATE INDEX idx_agent_logs_status ON agent_logs(status);
CREATE INDEX idx_agent_logs_created_at ON agent_logs(created_at);

CREATE INDEX idx_metrics_user_id ON metrics(user_id);
CREATE INDEX idx_metrics_date ON metrics(metric_date);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own data
CREATE POLICY "users_select_own" ON leads
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own" ON leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own" ON leads
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own" ON leads
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for other tables
CREATE POLICY "lead_scores_select_own" ON lead_scores
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "lead_scores_insert_own" ON lead_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "campaigns_select_own" ON campaigns
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "campaigns_insert_own" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "campaigns_update_own" ON campaigns
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "campaigns_delete_own" ON campaigns
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "messages_select_own" ON messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "messages_insert_own" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "templates_select_own" ON templates
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "templates_insert_own" ON templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "templates_update_own" ON templates
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "templates_delete_own" ON templates
  FOR DELETE USING (auth.uid() = user_id);

-- Functions for common operations
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
