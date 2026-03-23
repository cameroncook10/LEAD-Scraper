# Lead Scraper SaaS - Developer Guide

## 📚 Complete Developer Documentation

This guide provides everything you need to understand, develop, deploy, and maintain the Lead Scraper SaaS application.

---

## 🏗️ Project Structure

```
lead-scraper/
├── frontend/                       # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx                # Main app with routing
│   │   ├── main.jsx               # Vite entry point
│   │   ├── index.css              # Global styles
│   │   ├── pages/
│   │   │   ├── Landing.jsx        # Public landing page
│   │   │   ├── Login.jsx          # Authentication
│   │   │   ├── Signup.jsx         # Registration
│   │   │   ├── Dashboard.jsx      # Main dashboard
│   │   │   ├── LeadsView.jsx      # Lead management
│   │   │   ├── CampaignsPage.jsx  # Campaign management
│   │   │   ├── TemplatesPage.jsx  # Template editor
│   │   │   ├── AnalyticsPage.jsx  # Analytics & reports
│   │   │   ├── AgentLogsPage.jsx  # Agent monitoring
│   │   │   └── SettingsPage.jsx   # User settings
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── Sidebar.jsx
│   │   │   ├── ui/                # Reusable UI components
│   │   │   └── sections/          # Landing page sections
│   │   ├── hooks/                 # Custom React hooks
│   │   │   ├── useRealtimeMetrics.js
│   │   │   └── useAgentStatus.js
│   │   └── services/
│   │       └── api.js             # API client
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── index.html
│
├── backend/                        # Node.js + Express server
│   ├── server.js                  # Main server entry point
│   ├── package.json
│   ├── routes/
│   │   ├── auth.js                # Authentication endpoints
│   │   ├── agents.js              # DM agent & monitoring
│   │   ├── leads.js               # Lead management
│   │   ├── campaigns.js           # Campaign management
│   │   ├── templates.js           # Template management
│   │   ├── analytics.js           # Analytics data
│   │   ├── scrape.js              # Scraping jobs
│   │   ├── jobs.js                # Job monitoring
│   │   ├── industries.js          # Industry data
│   │   ├── webhooks.js            # Tracking webhooks
│   │   └── [more routes]
│   ├── agents/
│   │   └── dm-agent-opus.js       # Claude Opus DM agent
│   ├── middleware/
│   │   ├── auth.js                # JWT authentication
│   │   ├── security.js            # Security headers
│   │   └── rate-limiter.js        # Rate limiting
│   ├── services/
│   │   ├── aiQualification.js     # Lead scoring
│   │   ├── scrapers/              # Source-specific scrapers
│   │   └── messageQueue.js        # Message delivery queue
│   ├── db/
│   │   ├── schema.js              # Schema initialization
│   │   ├── migrations.sql         # Database migrations
│   │   └── messaging-schema.sql   # Messaging schema
│   └── utils/
│       ├── validation.js          # Input validation
│       ├── logger.js              # Logging utility
│       └── auditLog.js            # Audit logging
│
├── legal/                         # Legal documents
├── mobile/                        # Mobile app (future)
├── api/                           # API documentation
│
├── .env.example                   # Environment template
├── APP_BUILD_COMPLETE.md          # Completion summary
├── DEVELOPER_GUIDE.md             # This file
├── ARCHITECTURE.md                # System architecture
├── DEPLOYMENT.md                  # Deployment guide
└── [other docs]
```

---

## 🔧 Setup & Installation

### 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/yourusername/lead-scraper.git
cd lead-scraper

# Install root dependencies
npm install

# Install backend
cd backend && npm install && cd ..

# Install frontend
cd frontend && npm install && cd ..
```

### 2. Environment Configuration

```bash
# Copy template
cp .env.example .env

# Edit with your keys
nano .env
```

**Required variables:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

ANTHROPIC_API_KEY=sk-ant-...
SENDGRID_API_KEY=SG.xxx
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890

JWT_SECRET=your-secure-random-string
PORT=3001
NODE_ENV=development
```

### 3. Database Setup

```bash
# In Supabase SQL editor, run:
# Copy entire contents of backend/db/migrations.sql
# Paste into SQL editor and execute

# Or use CLI:
# supabase db push
```

### 4. Start Development

```bash
# Terminal 1: Backend
cd backend && npm run dev
# Logs: Server running on http://localhost:3001

# Terminal 2: Frontend
cd frontend && npm run dev
# Logs: Local: http://localhost:5173
```

### 5. Test Authentication

```bash
# Navigate to http://localhost:5173
# Click "Sign In"
# Use demo credentials:
# Email: demo@example.com
# Password: demo123
```

---

## 📁 File-by-File Breakdown

### Frontend Pages

#### Dashboard.jsx
- **Purpose**: Main application dashboard
- **Components**: Real-time metrics, charts, quick actions
- **API Calls**: GET /api/analytics/summary, POST /api/agents/start-scrape
- **State**: metrics, campaigns, loading
- **Features**: Live metrics, quick actions, campaign list

#### LeadsView.jsx
- **Purpose**: Leads database & management
- **Components**: Table, filters, search, bulk actions
- **API Calls**: GET /api/leads, POST /api/leads/score, DELETE /api/leads/:id
- **State**: leads, filters, pagination, selectedLeads
- **Features**: Advanced filtering, search, bulk operations

#### CampaignsPage.jsx
- **Purpose**: Campaign creation & management
- **Components**: Campaign list, create form, detail view, A/B testing
- **API Calls**: GET/POST/PUT/DELETE /api/campaigns, GET /api/campaigns/:id/performance
- **Features**: CRUD operations, performance tracking, A/B testing

#### AnalyticsPage.jsx
- **Purpose**: Performance analytics & reporting
- **Components**: Chart visualizations, metrics cards, export buttons
- **Libraries**: Chart.js, react-chartjs-2
- **API Calls**: GET /api/analytics/chart/:type, GET /api/analytics/export
- **Features**: Multiple chart types, date range picker, CSV/PDF export

#### SettingsPage.jsx
- **Purpose**: User account & preference management
- **Sections**: Account, Security, Integrations, Preferences, Notifications, Billing
- **API Calls**: PUT /api/auth/profile, POST /api/auth/change-password
- **Features**: Profile management, password change, preferences

### Backend Routes

#### auth.js (Authentication)
- `POST /signup` - Register new user
  - Input: { firstName, lastName, email, password }
  - Output: { token, user }
  - Validation: Email unique, password 8+ chars

- `POST /login` - User login
  - Input: { email, password }
  - Output: { token, user }
  - Validation: Valid credentials

- `GET /profile` - Get current user (requires auth)
  - Middleware: authMiddleware
  - Output: User profile data

- `PUT /profile` - Update profile
  - Input: { firstName, lastName, timezone }
  - Middleware: authMiddleware
  - Output: Updated user data

- `POST /change-password` - Change password
  - Input: { currentPassword, newPassword }
  - Middleware: authMiddleware
  - Validation: Current password correct, new password 8+ chars

#### agents.js (DM Agent)
- `POST /start-scrape` - Start scraping job
  - Input: { source, query, limit }
  - Output: { jobId, status }

- `POST /send-dm` - Send personalized DM
  - Input: { leadIds, channel }
  - Process:
    1. Get lead data from Supabase
    2. Generate personalized message with Claude Opus
    3. Send via email/SMS/WhatsApp
    4. Log message & track delivery
  - Output: { successful, failed, channel }

- `POST /campaign` - Launch campaign
  - Input: { campaignId, leadIds }
  - Process:
    1. Update campaign status to "running"
    2. Link leads to campaign
    3. Trigger DM agent for all leads
  - Output: { campaignId, leadsCount }

- `GET /status` - Agent health status
  - Output: { scraper, qualifier, 'dm-agent', analytics }

- `GET /logs` - Agent activity logs
  - Output: Array of log entries with filtering

---

## 🔌 API Integration Points

### Frontend → Backend Communication

**Example: Fetch Leads**
```javascript
// frontend/services/api.js
async function getLeads(filters) {
  const token = localStorage.getItem('auth_token');
  const response = await axios.get(
    `${API_URL}/api/leads`,
    {
      params: filters,
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
}
```

**Example: Send Campaign**
```javascript
async function sendCampaign(campaignId, leadIds) {
  const token = localStorage.getItem('auth_token');
  const response = await axios.post(
    `${API_URL}/api/agents/campaign`,
    { campaignId, leadIds },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}
```

### Backend → External Services

**Supabase (Database)**
```javascript
const { data, error } = await supabase
  .from('leads')
  .select('*')
  .eq('user_id', userId);
```

**Claude API (Message Generation)**
```javascript
const message = await anthropic.messages.create({
  model: 'claude-opus-4-20250805',
  max_tokens: 1024,
  messages: [{ role: 'user', content: prompt }],
});
```

**SendGrid (Email)**
```javascript
await emailTransporter.sendMail({
  from: 'noreply@agentlead.com',
  to: lead.email,
  subject: 'Subject',
  html: htmlContent,
});
```

**Twilio (SMS/WhatsApp)**
```javascript
await twilioClient.messages.create({
  body: message,
  from: process.env.TWILIO_PHONE_NUMBER,
  to: lead.phone,
});
```

---

## 🔐 Authentication Flow

### Login Process
1. User submits email/password on Login page
2. Frontend calls `POST /api/auth/login`
3. Backend verifies credentials with Supabase
4. Backend generates JWT token
5. Frontend stores token in localStorage
6. Frontend redirects to /dashboard
7. Protected routes check token on every navigation

### Protected Route Example
```javascript
function ProtectedRoute({ isAuthenticated, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return children;
}
```

### JWT Verification
```javascript
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}
```

---

## 📊 Auto DM Agent Deep Dive

### How It Works

1. **Message Generation**
   - Accepts lead data: name, company, size, budget, location, source
   - Builds context-aware prompt
   - Sends to Claude Opus 4.6
   - Receives personalized message

2. **Channel Selection**
   - Email: SendGrid SMTP
   - SMS: Twilio API
   - WhatsApp: Twilio WhatsApp API

3. **Delivery Tracking**
   - Logs all sent messages
   - Tracks opens, clicks, bounces
   - Stores conversation history

4. **Auto Follow-up**
   - Daily job checks for unopened messages (3+ days old)
   - Generates intelligent follow-up
   - Sends automatically

### Example: Personalized Message

**Input Lead:**
```json
{
  "name": "John Smith",
  "company": "ABC Construction",
  "businessType": "Construction",
  "companySize": "50-100 employees",
  "location": "Denver, CO",
  "phone": "+1234567890",
  "email": "john@abcconstruction.com"
}
```

**Claude Prompt:**
```
You are an expert B2B sales copywriter...
Lead Information:
- Name: John Smith
- Company: ABC Construction
- Business Type: Construction
...
Guidelines:
- Keep it SHORT and PERSONAL (3-4 sentences max)
- Reference something specific about their business
...
```

**Generated Message:**
```
Hi John,

I noticed ABC Construction has been expanding in the Denver market. 
We help construction firms like yours reduce project delays by 30% 
with our lead qualification system. 

Would you be open to a quick 15-min call this week to see if it fits?

Best,
[Your Name]
```

---

## 🧪 Testing

### Manual Testing

```bash
# 1. Test Authentication
- Go to http://localhost:5173
- Click Sign Up
- Enter: email, password (8+ chars)
- Should redirect to dashboard

# 2. Test Lead Creation
- Mock endpoint or use admin panel
- Add a test lead
- Should appear in Leads table

# 3. Test Campaign
- Create campaign
- Select leads
- Click "Launch Campaign"
- Monitor in Agent Logs

# 4. Test Analytics
- Wait for some messages sent
- Go to Analytics page
- Verify charts load correctly
- Test date range filters
```

### API Testing with cURL

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123"}'

# Response: { token, user }

# Get Leads (with token)
curl -X GET http://localhost:3001/api/leads \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send Campaign
curl -X POST http://localhost:3001/api/agents/campaign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"xxx","leadIds":["xxx"]}'
```

---

## 📈 Monitoring & Debugging

### Frontend Debugging
```javascript
// In browser console
localStorage.getItem('auth_token')      // Check token
localStorage.getItem('user')            // Check user data
```

### Backend Logging
```javascript
// Check backend logs
console.log('Action:', data);           // Development logs
// Production: Use structured logging
```

### Database Inspection
```sql
-- In Supabase SQL editor
SELECT * FROM users;
SELECT * FROM leads LIMIT 10;
SELECT * FROM messages LIMIT 10;
SELECT * FROM agent_logs ORDER BY created_at DESC LIMIT 20;
```

---

## 🚀 Deployment Checklist

### Before Production
- [ ] Set strong JWT_SECRET
- [ ] Configure CORS properly
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Configure rate limiting
- [ ] Set up monitoring
- [ ] Test all integrations
- [ ] Database backups configured
- [ ] Error tracking (Sentry, etc.)
- [ ] CDN for static assets

### Frontend Deploy (Vercel)
```bash
cd frontend
npm run build
# Vercel auto-deploys from GitHub
```

### Backend Deploy (Railway/Heroku)
```bash
# Add environment variables
# Connect database
# Deploy
```

---

## 🔍 Troubleshooting

### "Cannot find module" errors
```bash
# Solution: Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### Port already in use
```bash
# Solution: Kill process or use different port
lsof -i :3001
kill -9 <PID>
# Or change PORT in .env
```

### Supabase connection fails
```bash
# Check:
1. SUPABASE_URL is correct
2. SUPABASE_ANON_KEY is correct
3. Network connectivity
4. Firewall/VPN not blocking
```

### Claude API errors
```bash
# Check:
1. ANTHROPIC_API_KEY is correct
2. Account has credits
3. API rate limits
4. Model name is correct
```

---

## 📚 Key Libraries & Their Roles

| Library | Purpose | Docs |
|---------|---------|------|
| React 18 | UI framework | https://react.dev |
| Vite | Build tool | https://vitejs.dev |
| TailwindCSS | Styling | https://tailwindcss.com |
| React Router | Navigation | https://reactrouter.com |
| Framer Motion | Animations | https://www.framer.com/motion |
| Chart.js | Analytics charts | https://www.chartjs.org |
| Express | Server framework | https://expressjs.com |
| Supabase | Database & auth | https://supabase.com |
| Anthropic SDK | Claude API | https://docs.anthropic.com |
| Twilio | SMS/WhatsApp | https://www.twilio.com/docs |

---

## 🎓 Learning Path

1. **Understanding the Architecture**
   - Read ARCHITECTURE.md
   - Review App.jsx routing structure
   - Study backend/server.js

2. **Frontend Development**
   - Learn React components
   - Study pages/ structure
   - Understand routing

3. **Backend Development**
   - Study routes/ files
   - Understand middleware
   - Learn Supabase queries

4. **Database**
   - Review migrations.sql
   - Understand RLS policies
   - Query Supabase directly

5. **Integration**
   - Study dm-agent-opus.js
   - Learn API communication
   - Test end-to-end flows

---

## 🤝 Contributing Guidelines

1. **Code Style**
   - Use ES6+ features
   - Keep functions small and focused
   - Add comments for complex logic
   - Use meaningful variable names

2. **Commits**
   - Clear commit messages
   - One feature per commit
   - Reference issues

3. **Testing**
   - Test before committing
   - Test on multiple browsers
   - Test mobile responsiveness

4. **Documentation**
   - Update README if adding features
   - Document API changes
   - Add code comments

---

## 📞 Common Tasks

### Add a New API Endpoint
1. Create route in `backend/routes/newfeature.js`
2. Add middleware as needed
3. Import in `server.js`
4. Add `app.use('/api/newfeature', newfeatureRoutes)`
5. Test with API client

### Add a New Dashboard Page
1. Create `frontend/src/pages/NewPage.jsx`
2. Add to routing in `App.jsx`
3. Add to sidebar menu
4. Create API calls needed
5. Build UI with TailwindCSS

### Add a New Database Table
1. Add SQL to `migrations.sql`
2. Add indexes as needed
3. Add RLS policies
4. Test queries in SQL editor
5. Update schema documentation

---

## 📊 Performance Optimization Tips

- Use React.memo for expensive components
- Implement pagination for large lists
- Cache API responses
- Lazy load routes
- Optimize images
- Use CDN for static assets
- Database indexes (already done)
- Rate limiting (configured)

---

## 🎉 You're Ready!

You now have a complete understanding of the Lead Scraper SaaS application. You can:
- ✅ Understand the architecture
- ✅ Set up development environment
- ✅ Make frontend changes
- ✅ Modify backend routes
- ✅ Add new features
- ✅ Deploy to production

**Happy coding!** 🚀
