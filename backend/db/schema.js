import { supabase } from '../server.js';

export const initializeDatabase = async () => {
  try {
    // Check if tables exist by querying them
    const { data, error } = await supabase
      .from('leads')
      .select('id')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      console.log('Tables not found. Please ensure Supabase is set up with the following schema:');
      console.log(getSchemaSql());
    } else {
      console.log('Database tables exist');
    }
  } catch (error) {
    console.error('Database check failed:', error.message);
  }
};

export const getSchemaSql = () => {
  return `
-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  business_type TEXT,
  ai_score NUMERIC DEFAULT 0,
  ai_category TEXT,
  ai_confidence NUMERIC DEFAULT 0,
  raw_data JSONB,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scrape jobs table
CREATE TABLE IF NOT EXISTS scrape_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'pending',
  source TEXT NOT NULL,
  total_leads INTEGER DEFAULT 0,
  processed_leads INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job logs table
CREATE TABLE IF NOT EXISTS job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES scrape_jobs(id) ON DELETE CASCADE,
  message TEXT,
  level TEXT DEFAULT 'info',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_ai_score ON leads(ai_score);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON scrape_jobs(status);
CREATE INDEX IF NOT EXISTS idx_job_logs_job_id ON job_logs(job_id);
  `;
};
