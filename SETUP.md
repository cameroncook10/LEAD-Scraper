# Setup Guide - Lead Scraper MVP

## Step-by-Step Setup Instructions

### 1. Prerequisites
Ensure you have:
- Node.js 16+ installed
- npm or yarn
- A Supabase account (create free at supabase.com)
- An Anthropic API key (create at console.anthropic.com)

### 2. Install Dependencies

```bash
# Navigate to project root
cd lead-scraper

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Create Supabase Project

1. Go to https://app.supabase.com
2. Create a new project
3. Wait for project to initialize
4. Go to Project Settings > API
5. Copy:
   - Project URL (SUPABASE_URL)
   - anon public key (SUPABASE_ANON_KEY)

### 4. Set Up Database Schema

In Supabase:
1. Go to SQL Editor
2. Click "New Query"
3. Paste this SQL:

```sql
-- Leads table
CREATE TABLE leads (
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
CREATE TABLE scrape_jobs (
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
CREATE TABLE job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES scrape_jobs(id) ON DELETE CASCADE,
  message TEXT,
  level TEXT DEFAULT 'info',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_ai_score ON leads(ai_score);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_jobs_status ON scrape_jobs(status);
CREATE INDEX idx_job_logs_job_id ON job_logs(job_id);
```

4. Click "Run"
5. You should see 3 tables created

### 5. Get Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign up or log in
3. Go to Account > API Keys
4. Create new API key
5. Copy it (you'll use it in .env)

### 6. Configure Environment Variables

```bash
# In root directory
cp .env.example .env

# Edit .env with your values:
nano .env
# or use your preferred editor
```

Your .env should look like:
```
PORT=3002
NODE_ENV=development
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx...
```

### 7. Run the Application

```bash
# From root directory
npm run dev

# This will start:
# - Frontend on http://localhost:3001
# - Backend on http://localhost:3002

# In your browser:
# Open http://localhost:3001
```

You should see the Lead Scraper dashboard!

## Testing the MVP

### 1. Test Dashboard
- Go to Dashboard tab
- Select "Web Search" as source
- Enter search query: "plumbers"
- Set limit to 10
- Click "Start Scrape Job"

### 2. Monitor Job
- Go to Jobs tab
- You'll see your job listed
- Click it to see progress
- Watch logs as scraping and AI qualification happens

### 3. View Leads
- Go to Leads tab
- You'll see scraped leads once job completes
- Filter by category or score
- Try exporting to CSV

## Troubleshooting

### Backend won't start
```
Error: Cannot find module '@supabase/supabase-js'
```
Solution: Run `cd backend && npm install`

### Frontend shows "Cannot GET /api/..."
Check that:
- Backend is running on port 3002
- .env has correct SUPABASE_URL and keys
- Vite proxy is configured (check frontend/vite.config.js)

### Supabase connection error
```
Error: Failed to authenticate user
```
Solution:
- Verify SUPABASE_URL format (should be https://xxxxx.supabase.co)
- Check SUPABASE_ANON_KEY is correct
- Ensure tables exist (run SQL schema again)

### Claude API errors
```
Error: Invalid API key
```
Solution:
- Verify ANTHROPIC_API_KEY starts with `sk-ant-`
- Check key is not expired
- Ensure account has credits

### Port already in use
```
Error: listen EADDRINUSE :::3002
```
Solution:
```bash
# Find what's using port 3002
lsof -i :3002

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3003 npm run dev:backend
```

## Next Steps

After MVP is working:

1. **Add authentication** (Supabase Auth)
   - User signup/login
   - Associate leads with users
   - Restrict API access

2. **Add payment processing** (Stripe)
   - Subscription plans
   - Usage tracking
   - Rate limiting per plan

3. **Improve scrapers**
   - Use real scraper APIs (SerpAPI, Bright Data)
   - Better data cleaning
   - Custom field extraction

4. **Advanced features**
   - Real-time updates (WebSockets)
   - Duplicate detection
   - CRM integrations
   - Email templates

## File Locations Reference

| Component | Location |
|-----------|----------|
| Backend server | `backend/server.js` |
| Frontend app | `frontend/src/App.jsx` |
| API routes | `backend/routes/` |
| Database schema | `backend/db/schema.js` |
| AI qualification | `backend/services/aiQualification.js` |
| Scrapers | `backend/services/scrapers/` |
| Pages | `frontend/src/pages/` |

## Getting Help

1. Check backend console for error messages
2. Check browser console (F12) for frontend errors
3. Review job logs in Jobs tab
4. Check Supabase logs in project dashboard

Good luck! 🚀
