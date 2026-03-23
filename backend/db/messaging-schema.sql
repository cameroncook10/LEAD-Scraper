-- Message Templates Table
CREATE TABLE IF NOT EXISTS message_templates (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'whatsapp')),
  subject TEXT, -- For emails
  body TEXT NOT NULL,
  preview_text TEXT,
  variables TEXT[] DEFAULT '{}', -- Array of variable names like ['firstName', 'company']
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE INDEX idx_templates_user ON message_templates(user_id);
CREATE INDEX idx_templates_type ON message_templates(type);

-- Email Campaigns Table
CREATE TABLE IF NOT EXISTS email_campaigns (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'email' CHECK (type IN ('email', 'sms', 'whatsapp')),
  template_id BIGINT NOT NULL REFERENCES message_templates(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'paused')),
  quality_threshold NUMERIC(3,2) DEFAULT 0.5, -- 0.0 to 1.0
  recipient_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  schedule_time TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_campaigns_user ON email_campaigns(user_id);
CREATE INDEX idx_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_campaigns_created ON email_campaigns(created_at DESC);

-- Campaign Deliveries Table
CREATE TABLE IF NOT EXISTS campaign_deliveries (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  campaign_id BIGINT NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')),
  email_message_id TEXT, -- From email provider
  sms_message_id TEXT, -- From SMS provider
  error_message TEXT,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}', -- Store additional tracking data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_deliveries_campaign ON campaign_deliveries(campaign_id);
CREATE INDEX idx_deliveries_lead ON campaign_deliveries(lead_id);
CREATE INDEX idx_deliveries_status ON campaign_deliveries(status);
CREATE INDEX idx_deliveries_created ON campaign_deliveries(created_at DESC);

-- Email Opens Tracking
CREATE TABLE IF NOT EXISTS email_opens (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  delivery_id BIGINT NOT NULL REFERENCES campaign_deliveries(id) ON DELETE CASCADE,
  user_agent TEXT,
  ip_address TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_opens_delivery ON email_opens(delivery_id);

-- Email Clicks Tracking
CREATE TABLE IF NOT EXISTS email_clicks (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  delivery_id BIGINT NOT NULL REFERENCES campaign_deliveries(id) ON DELETE CASCADE,
  link_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_clicks_delivery ON email_clicks(delivery_id);

-- Unsubscribe List
CREATE TABLE IF NOT EXISTS unsubscribes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  unsubscribe_type TEXT CHECK (unsubscribe_type IN ('email', 'sms', 'whatsapp')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_unsubscribes_user ON unsubscribes(user_id);
CREATE INDEX idx_unsubscribes_email ON unsubscribes(email);
CREATE INDEX idx_unsubscribes_phone ON unsubscribes(phone);

-- Message Queue (for pending messages)
CREATE TABLE IF NOT EXISTS message_queue (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  delivery_id BIGINT NOT NULL REFERENCES campaign_deliveries(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('email', 'sms', 'whatsapp')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_queue_next_retry ON message_queue(next_retry_at);
CREATE INDEX idx_queue_created ON message_queue(created_at DESC);

-- Campaign Analytics
CREATE TABLE IF NOT EXISTS campaign_analytics (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  campaign_id BIGINT NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  total_unsubscribed INTEGER DEFAULT 0,
  unique_opens INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE UNIQUE INDEX idx_analytics_campaign ON campaign_analytics(campaign_id);

-- Enable RLS
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_opens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsubscribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Message Templates
CREATE POLICY "Users see own templates"
  ON message_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own templates"
  ON message_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own templates"
  ON message_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own templates"
  ON message_templates FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies - Email Campaigns
CREATE POLICY "Users see own campaigns"
  ON email_campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own campaigns"
  ON email_campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own campaigns"
  ON email_campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own campaigns"
  ON email_campaigns FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies - Campaign Deliveries (users can only access deliveries of their own campaigns)
CREATE POLICY "Users see their campaign deliveries"
  ON campaign_deliveries FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM email_campaigns WHERE user_id = auth.uid()
    )
  );

-- RLS Policies - Unsubscribes
CREATE POLICY "Users see own unsubscribes"
  ON unsubscribes FOR SELECT
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE
  ON message_templates FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE
  ON email_campaigns FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_deliveries_updated_at BEFORE UPDATE
  ON campaign_deliveries FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_queue_updated_at BEFORE UPDATE
  ON message_queue FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
