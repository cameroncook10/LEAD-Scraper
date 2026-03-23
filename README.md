# Lead Scraper MVP

A full-stack lead scraping and AI qualification system. Scrapes leads from multiple sources, qualifies them using Claude AI, and provides a clean dashboard for management.

## Features

✨ **Multi-source scraping**
- Web search
- Google Maps
- Zillow
- Nextdoor

🤖 **AI-powered qualification**
- Claude Haiku analyzes each lead
- Scores leads 0-100
- Categorizes as hot/warm/cold/invalid
- Provides confidence levels

📊 **Real-time dashboard**
- Monitor active scrape jobs
- View lead cards with full contact info
- Filter/search leads
- Track AI scores and confidence

📥 **Data export**
- Download leads as CSV
- Filter before export
- All lead data included

## Architecture

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- Real-time updates via polling
- Responsive design

### Backend
- **Node.js + Express** server
- **Supabase** for data storage
- **Claude Haiku** for AI qualification
- Job queue system for async scraping
- Comprehensive error handling

### Database
- **Supabase PostgreSQL**
- Leads table with scoring
- Scrape jobs tracking
- Job logs for debugging

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Supabase account (free tier works)
- Anthropic API key (for Claude Haiku)

### Setup

1. **Clone and install**
```bash
cd lead-scraper

# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

2. **Configure environment**
```bash
# Copy from example
cp .env.example .env

# Edit .env with your keys:
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=your-api-key
```

3. **Set up Supabase**
Create a new Supabase project and run this SQL to create tables:

```sql
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

-- Create indexes
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_ai_score ON leads(ai_score);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_jobs_status ON scrape_jobs(status);
CREATE INDEX idx_job_logs_job_id ON job_logs(job_id);
```

4. **Run the application**
```bash
# From root directory
npm run dev

# Frontend: http://localhost:3001
# Backend: http://localhost:3002
```

## Usage

### Starting a Scrape Job
1. Go to Dashboard
2. Select a data source (Web Search, Google Maps, Zillow, Nextdoor)
3. Enter search query (e.g., "plumbers in New York")
4. Set number of leads (1-1000)
5. Click "Start Scrape Job"

### Monitoring Progress
1. Go to Jobs tab
2. Click on a job to see details
3. Watch real-time progress updates
4. View logs as scraping and AI qualification runs

### Managing Leads
1. Go to Leads tab
2. Filter by source, category, score range
3. Search by name, email, or phone
4. Click lead names to view details
5. Export filtered results to CSV

## API Endpoints

### Scrape Jobs
- `POST /api/scrape/start` - Start a new scrape job
- `GET /api/scrape/status/:jobId` - Get job status and logs
- `GET /api/scrape/jobs` - List all jobs

### Leads
- `GET /api/leads` - Get leads with filters
  - Query params: `source`, `category`, `minScore`, `maxScore`, `search`, `limit`, `offset`
- `GET /api/leads/:id` - Get single lead
- `GET /api/leads/stats/summary` - Get statistics
- `POST /api/leads/export` - Export to CSV
- `DELETE /api/leads/:id` - Delete a lead

### Job Details
- `GET /api/jobs` - List all jobs
- `GET /api/jobs/:jobId` - Get job with logs

## File Structure

```
lead-scraper/
├── backend/
│   ├── server.js              # Express server
│   ├── package.json
│   ├── db/
│   │   └── schema.js          # Database schema
│   ├── routes/
│   │   ├── scrape.js          # Scrape endpoints
│   │   ├── leads.js           # Lead endpoints
│   │   └── jobs.js            # Job endpoints
│   └── services/
│       ├── aiQualification.js # Claude integration
│       ├── scrapeManager.js   # Job management
│       └── scrapers/
│           ├── googleMaps.js
│           ├── zillow.js
│           ├── nextdoor.js
│           └── webSearch.js
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main component
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── services/
│   │   │   └── api.js         # API client
│   │   └── pages/
│   │       ├── Dashboard.jsx
│   │       ├── JobMonitor.jsx
│   │       └── LeadsView.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── package.json
├── .env.example
└── README.md
```

## Extending the Application

### Adding New Scrapers
1. Create new scraper in `backend/services/scrapers/`
2. Export async function that returns array of leads
3. Add to `scrapers` object in `scrapeManager.js`
4. Update frontend source options

### Customizing AI Qualification
Edit `backend/services/aiQualification.js`:
- Modify Claude prompt
- Adjust scoring logic
- Add custom fields

### Adding Auth
Extend with Supabase Auth:
- Add user table
- Implement JWT validation
- Associate leads with users

### Adding Payments
Integrate Stripe:
- Add subscription plans
- Track usage per user
- Rate limiting by plan

## Performance Notes

- **Rate limiting**: AI qualification has 100ms delays between leads
- **Database**: Indexed on source, score, and timestamp for fast queries
- **Pagination**: Leads use limit/offset pagination (default 50 per page)
- **Job queue**: Scraping runs asynchronously, doesn't block UI

## Error Handling

- Scraper errors are logged and allow job continuation
- Failed API calls retry with exponential backoff
- AI qualification falls back gracefully if API unavailable
- All errors logged to job_logs table for debugging

## Future Enhancements

- [ ] Real-time WebSocket updates (replace polling)
- [ ] Advanced filtering/saved searches
- [ ] Lead scoring customization
- [ ] Duplicate detection
- [ ] CRM integrations (Salesforce, HubSpot)
- [ ] Email/SMS outreach templates
- [ ] Custom scraper rules
- [ ] Data validation pipeline
- [ ] Webhook notifications
- [ ] Historical analytics

## Support

For issues or questions:
1. Check the logs in the Jobs tab
2. Review error messages in job details
3. Check backend console for errors
4. Verify Supabase connection and schema

## License

MIT
