# Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Dashboard │ Job Monitor │ Leads View               │   │
│  │  - Scrape form            - Job list   - Lead cards│   │
│  │  - Stats cards            - Job detail - CSV export│   │
│  └──────────────────────────────────────────────────────┘   │
│                     Port 3001                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend (Node.js + Express)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Routes                                          │   │
│  │  ├─ /api/scrape - Start/monitor scrape jobs         │   │
│  │  ├─ /api/leads  - Query, filter, export leads       │   │
│  │  └─ /api/jobs   - Get job details and logs          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Services                                            │   │
│  │  ├─ Scrape Manager - Job orchestration             │   │
│  │  ├─ AI Qualification - Claude Haiku integration    │   │
│  │  └─ Scrapers - Multi-source data collection        │   │
│  └──────────────────────────────────────────────────────┘   │
│                     Port 3002                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   ┌────────┐    ┌──────────┐    ┌──────────┐
   │Supabase│    │ Anthropic│    │  Web     │
   │PostgreSQL   │Claude    │    │ Scrapers │
   │- Leads │    │ Haiku    │    │          │
   │- Jobs  │    │          │    │ (Mock)   │
   │- Logs  │    │          │    │          │
   └────────┘    └──────────┘    └──────────┘
```

## Data Flow

### 1. Scrape Job Initiation
```
User Input (Dashboard)
    │
    ▼
POST /api/scrape/start
    │
    ▼
Create Job (pending) → Save to Database
    │
    ▼
Return Job ID to Frontend
    │
    ▼
Start Async Scraping (non-blocking)
```

### 2. Scraping & Qualification
```
Async Scrape Job
    │
    ├─▶ Select Scraper (Google Maps, Zillow, etc.)
    │    │
    │    └─▶ Fetch Raw Lead Data
    │
    ├─▶ Process Each Lead
    │    │
    │    ├─▶ Clean Data
    │    │
    │    └─▶ Send to Claude Haiku
    │         │
    │         └─▶ Get Score + Category + Confidence
    │
    ├─▶ Save Qualified Leads
    │    │
    │    └─▶ Insert into Database
    │
    └─▶ Update Job Status (completed)
```

### 3. Data Query & Display
```
Frontend (Leads View)
    │
    ▼
GET /api/leads?filters
    │
    ▼
Query Database with Filters
    │
    ├─ Source: google_maps, zillow, etc.
    ├─ Category: hot, warm, cold
    ├─ Score Range: 0-100
    ├─ Search: Text search in name/email/phone
    └─ Pagination: limit/offset
    │
    ▼
Return Paginated Results
    │
    ▼
Display Lead Cards with AI Scores
```

## Database Schema

### Leads Table
```sql
CREATE TABLE leads (
  id UUID (PK)           -- Unique identifier
  name TEXT              -- Business/person name
  phone TEXT             -- Contact phone
  email TEXT             -- Contact email
  website TEXT           -- Business website
  address TEXT           -- Physical address
  business_type TEXT     -- Category (HVAC, Plumbing, etc.)
  ai_score NUMERIC       -- AI score 0-100
  ai_category TEXT       -- hot/warm/cold/invalid
  ai_confidence NUMERIC  -- 0-1 confidence level
  raw_data JSONB         -- Original scraped data
  source TEXT            -- Where scraped from
  created_at TIMESTAMP   -- When created
  updated_at TIMESTAMP   -- When updated
)

Indexes:
- idx_leads_source      (for filtering by source)
- idx_leads_ai_score    (for sorting by score)
- idx_leads_created_at  (for time-based queries)
```

### Scrape Jobs Table
```sql
CREATE TABLE scrape_jobs (
  id UUID (PK)                -- Job identifier
  status TEXT                 -- pending/running/completed/failed
  source TEXT                 -- Scraper source used
  total_leads INTEGER         -- Total leads found
  processed_leads INTEGER     -- Leads qualified by AI
  started_at TIMESTAMP        -- When scraping started
  completed_at TIMESTAMP      -- When scraping completed
  error_message TEXT          -- Error if failed
  created_at TIMESTAMP        -- When job created
  updated_at TIMESTAMP        -- When job updated
)

Indexes:
- idx_jobs_status  (for filtering by status)
```

### Job Logs Table
```sql
CREATE TABLE job_logs (
  id UUID (PK)           -- Log entry ID
  job_id UUID (FK)       -- Reference to job
  message TEXT           -- Log message
  level TEXT             -- info/warning/error
  created_at TIMESTAMP   -- When logged
)

Indexes:
- idx_job_logs_job_id  (for querying logs by job)
```

## Authentication (Future)

When adding auth, add:
```sql
CREATE TABLE users (
  id UUID (PK)
  email TEXT (UNIQUE)
  password TEXT (hashed)
  created_at TIMESTAMP
)

ALTER TABLE leads ADD COLUMN user_id UUID (FK to users)
ALTER TABLE scrape_jobs ADD COLUMN user_id UUID (FK to users)
```

## API Response Format

### Success Response
```json
{
  "data": { ... },
  "status": 200,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "error": "Invalid query parameters",
  "status": 400,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Performance Characteristics

| Operation | Typical Time | Bottleneck |
|-----------|--------------|-----------|
| Start scrape job | 100ms | API response |
| Get job status | 50ms | Database query |
| Get 50 leads | 150ms | Database pagination |
| AI qualify 1 lead | 500-1000ms | Claude API |
| Export 100 leads to CSV | 200ms | CSV generation |

## Scalability Bottlenecks & Solutions

### Current (MVP)
- Max: ~10 concurrent scrape jobs
- Max: ~100 leads processed/minute
- Storage: ~50MB per 1000 leads

### To 100x Scale
1. **Job Queue** (Bull, RabbitMQ)
   - Distribute scrape workers
   - Handle 100+ concurrent jobs

2. **Database Optimization**
   - Connection pooling
   - Read replicas for queries
   - Partitioning by date

3. **Caching** (Redis)
   - Cache frequent queries
   - Session storage
   - Rate limit tracking

4. **Worker Processes**
   - Separate AI qualification service
   - Multiple scraper workers
   - Dedicated import/export service

### Architecture for 100x Scale
```
Load Balancer
├─ Frontend CDN (Vercel/CloudFront)
└─ API Servers (x3-5)
   ├─ Job Queue (Redis)
   │  └─ Worker Processes (x10-20)
   │     ├─ Scraper Workers
   │     ├─ AI Workers
   │     └─ Export Workers
   ├─ Cache (Redis Cluster)
   └─ Database
      ├─ Primary (PostgreSQL)
      ├─ Read Replicas
      └─ Analytics DB
```

## Technology Choices

### Frontend: React + Vite
✅ Fast development
✅ Great ecosystem
✅ Easy to extend

### Backend: Node.js + Express
✅ JavaScript everywhere
✅ Good for I/O-heavy tasks
✅ Great middleware ecosystem

### Database: Supabase (PostgreSQL)
✅ Managed PostgreSQL
✅ Built-in Auth (future)
✅ Real-time subscriptions (future)
✅ Free tier for MVP

### AI: Claude Haiku
✅ Fast & cheap
✅ Great for classification
✅ Easy to integrate

## Future Architecture Improvements

1. **WebSockets** - Real-time job updates instead of polling
2. **GraphQL** - More efficient queries
3. **Message Queue** - Better job distribution
4. **Microservices** - Separate scraper/AI/export services
5. **Analytics DB** - Separate from operational DB
6. **Search Engine** - Elasticsearch for lead search
7. **Cache Layer** - Redis for hot data

## Security Considerations

✅ API keys in environment variables
✅ CORS configured
✅ Rate limiting (to implement)
✅ Input validation (basic, expand in production)
✅ SQL injection protection (using ORMs)
✅ No sensitive data in logs

🔒 To add for production:
- Authentication/Authorization
- HTTPS enforcement
- Rate limiting per user
- Request signing
- Audit logging
- Data encryption at rest
