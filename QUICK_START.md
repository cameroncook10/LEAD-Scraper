# ⚡ Quick Start Guide

Get the Lead Scraper running in 10 minutes.

## Prerequisites
- Node.js 16+
- A Supabase account (free at supabase.com)
- An Anthropic API key (free at console.anthropic.com)

## 1️⃣ Setup (5 minutes)

```bash
# Clone/navigate to project
cd lead-scraper

# Install all dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
nano .env  # or use your preferred editor
```

**What to add to .env:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
```

## 2️⃣ Database Setup (3 minutes)

1. Go to your Supabase project
2. Click "SQL Editor" → "New Query"
3. Copy-paste this:

```sql
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

CREATE TABLE job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES scrape_jobs(id) ON DELETE CASCADE,
  message TEXT,
  level TEXT DEFAULT 'info',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_ai_score ON leads(ai_score);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_jobs_status ON scrape_jobs(status);
CREATE INDEX idx_job_logs_job_id ON job_logs(job_id);
```

4. Click "Run"

## 3️⃣ Start the App (2 minutes)

```bash
# From project root
npm run dev

# You'll see:
# ✓ Backend running on http://localhost:3002
# ✓ Frontend running on http://localhost:3001
```

Open http://localhost:3001 in your browser! 🎉

## 🧪 Test It

1. **Dashboard tab** → Enter search query (e.g., "plumbers") → Click "Start Scrape Job"
2. **Jobs tab** → Watch your job progress in real-time
3. **Leads tab** → View scraped and qualified leads (once job completes)

## 🆘 Troubleshooting

| Error | Fix |
|-------|-----|
| `Cannot find module` | Run `npm install` in that directory |
| `Port 3002 already in use` | `lsof -i :3002` then `kill -9 <PID>` |
| Supabase connection fails | Check URL/keys in `.env` |
| Claude errors | Verify API key and account has credits |

## 📚 Next Steps

- [Full Setup Guide](SETUP.md)
- [Architecture Overview](ARCHITECTURE.md)
- [Complete Documentation](README.md)
- [Deployment Guide](DEPLOYMENT.md)

## 🚀 Key Files

| File | Purpose |
|------|---------|
| `backend/server.js` | Express server entry point |
| `frontend/src/App.jsx` | React app root |
| `backend/services/aiQualification.js` | Claude integration |
| `backend/services/scrapers/` | Data sources |
| `frontend/src/pages/` | Dashboard/Jobs/Leads UI |

## 💡 Quick Tips

- **Real-time updates**: Browser auto-refreshes job status every 5 seconds
- **CSV export**: Go to Leads tab, filter what you want, click "Export"
- **Add more scrapers**: Create new file in `backend/services/scrapers/`
- **Customize AI**: Edit prompt in `backend/services/aiQualification.js`

## 🎯 What's Working

✅ Scrape leads from multiple sources
✅ AI qualification with scores and categories
✅ Real-time job monitoring
✅ Lead filtering and search
✅ CSV export
✅ Complete REST API

## 📞 Need Help?

1. Check job logs (Jobs tab → click job → view logs)
2. Check browser console (F12)
3. Check backend terminal for errors
4. Read [Troubleshooting](SETUP.md#troubleshooting) section

---

**That's it!** You now have a fully functional lead scraper with AI qualification. 🎉
