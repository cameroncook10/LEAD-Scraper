# Lead Scraper SaaS - Complete API Reference

## 📡 API Overview

Base URL: `http://localhost:3001/api` (development)
Base URL: `https://api.agentlead.com/api` (production)

All API requests require JWT token in Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

Response format:
```json
{
  "data": {},
  "error": null,
  "timestamp": "2024-03-23T12:00:00Z"
}
```

---

## 🔐 Authentication Endpoints

### POST /auth/signup
Register a new user account.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Validation:**
- Email must be valid format
- Email must be unique
- Password must be 8+ characters

---

### POST /auth/login
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Errors:**
- 401: Invalid credentials

---

### GET /auth/profile
Get current authenticated user profile.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "timezone": "America/New_York"
}
```

**Errors:**
- 401: Unauthorized

---

### PUT /auth/profile
Update user profile information.

**Request:**
```json
{
  "firstName": "Jonathan",
  "lastName": "Smith",
  "timezone": "America/Los_Angeles"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "firstName": "Jonathan",
  "lastName": "Smith",
  "timezone": "America/Los_Angeles"
}
```

---

### POST /auth/change-password
Change user password.

**Request:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Validation:**
- Current password must be correct
- New password must be 8+ characters

---

### PUT /auth/preferences
Update user preferences.

**Request:**
```json
{
  "scrapingSources": ["zillow", "nextdoor", "google-maps"],
  "leadLimit": 1000,
  "autoQualify": true,
  "dailySchedule": true
}
```

**Response (200):**
```json
{
  "message": "Preferences updated"
}
```

---

## 🎯 Leads Endpoints

### GET /leads
List all leads with filtering and pagination.

**Query Parameters:**
```
?page=1
&limit=50
&status=hot,warm
&source=zillow,google-maps
&minScore=70
&search=company%20name
&sortBy=created_at
&sortOrder=desc
```

**Response (200):**
```json
{
  "leads": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Smith",
      "company": "ABC Corporation",
      "email": "john@abc.com",
      "phone": "+1234567890",
      "website": "https://abccorp.com",
      "address": "123 Main St",
      "city": "Denver",
      "state": "CO",
      "zipCode": "80202",
      "businessType": "Construction",
      "companySize": "50-100",
      "source": "zillow",
      "score": 85,
      "category": "hot",
      "createdAt": "2024-03-20T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250,
    "pages": 25
  }
}
```

**Filters:**
- `status`: hot, warm, cold, unqualified
- `source`: zillow, nextdoor, google-maps, web
- `minScore`: 0-100

---

### GET /leads/:id
Get single lead detail.

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Smith",
  "company": "ABC Corporation",
  "email": "john@abc.com",
  "phone": "+1234567890",
  "website": "https://abccorp.com",
  "address": "123 Main St",
  "city": "Denver",
  "state": "CO",
  "zipCode": "80202",
  "businessType": "Construction",
  "companySize": "50-100",
  "source": "zillow",
  "score": 85,
  "category": "hot",
  "confidence": 0.95,
  "reasoning": "Large construction company with active projects, high budget indicators",
  "messages": [
    {
      "id": "msg-123",
      "channel": "email",
      "status": "opened",
      "sentAt": "2024-03-21T10:00:00Z",
      "openedAt": "2024-03-21T14:30:00Z"
    }
  ],
  "createdAt": "2024-03-20T10:00:00Z"
}
```

---

### POST /leads/score
Manually score/qualify a lead.

**Request:**
```json
{
  "leadId": "550e8400-e29b-41d4-a716-446655440000",
  "score": 85,
  "category": "hot",
  "reasoning": "Large company with strong indicators"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "score": 85,
  "category": "hot",
  "confidence": 0.95
}
```

---

### DELETE /leads/:id
Remove a lead from database.

**Response (200):**
```json
{
  "message": "Lead deleted",
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 📧 Campaigns Endpoints

### GET /campaigns
List all campaigns.

**Query Parameters:**
```
?status=running,completed
&page=1
&limit=20
```

**Response (200):**
```json
{
  "campaigns": [
    {
      "id": "camp-123",
      "name": "Q2 Outreach Campaign",
      "description": "Targeted outreach to construction leads",
      "status": "running",
      "leadCount": 250,
      "sent": 150,
      "opened": 45,
      "clicked": 12,
      "conversions": 3,
      "createdAt": "2024-03-15T10:00:00Z",
      "updatedAt": "2024-03-23T14:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

---

### POST /campaigns
Create new campaign.

**Request:**
```json
{
  "name": "Q2 Outreach Campaign",
  "description": "Targeted outreach to construction leads",
  "templateId": "tpl-456"
}
```

**Response (201):**
```json
{
  "id": "camp-123",
  "name": "Q2 Outreach Campaign",
  "description": "Targeted outreach to construction leads",
  "status": "draft",
  "templateId": "tpl-456",
  "createdAt": "2024-03-23T12:00:00Z"
}
```

---

### PUT /campaigns/:id
Update campaign.

**Request:**
```json
{
  "name": "Updated Campaign Name",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "id": "camp-123",
  "name": "Updated Campaign Name",
  "description": "Updated description",
  "status": "draft",
  "updatedAt": "2024-03-23T12:05:00Z"
}
```

---

### DELETE /campaigns/:id
Delete campaign.

**Response (200):**
```json
{
  "message": "Campaign deleted",
  "id": "camp-123"
}
```

---

### POST /campaigns/:id/launch
Launch campaign to leads.

**Request:**
```json
{
  "leadIds": ["lead-1", "lead-2", "lead-3"],
  "channel": "email"
}
```

**Response (202):**
```json
{
  "message": "Campaign launched",
  "campaignId": "camp-123",
  "leadsCount": 3,
  "channel": "email",
  "status": "running"
}
```

---

### GET /campaigns/:id/performance
Get campaign performance metrics.

**Response (200):**
```json
{
  "campaignId": "camp-123",
  "totalSent": 250,
  "delivered": 248,
  "deliveryRate": "99.2%",
  "opened": 67,
  "openRate": "26.8%",
  "clicked": 18,
  "clickRate": "7.2%",
  "conversions": 3,
  "conversionRate": "1.2%",
  "revenue": 4500,
  "avgTimeToConversion": "2.5 days"
}
```

---

## 📨 Messages Endpoints

### GET /messages
List all sent messages.

**Query Parameters:**
```
?campaignId=camp-123
&channel=email
&status=delivered
&page=1
&limit=50
```

**Response (200):**
```json
{
  "messages": [
    {
      "id": "msg-123",
      "campaignId": "camp-123",
      "leadId": "lead-456",
      "channel": "email",
      "status": "delivered",
      "content": "Hi John, I noticed...",
      "sentAt": "2024-03-22T10:00:00Z",
      "openedAt": "2024-03-22T14:30:00Z",
      "clickedAt": null,
      "deliveredAt": "2024-03-22T10:05:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 250
  }
}
```

---

### GET /messages/:id/tracking
Get detailed tracking for a message.

**Response (200):**
```json
{
  "messageId": "msg-123",
  "externalMessageId": "sendgrid-123",
  "opens": 2,
  "clicks": 1,
  "bounces": 0,
  "complaints": 0,
  "events": [
    {
      "type": "sent",
      "timestamp": "2024-03-22T10:00:00Z"
    },
    {
      "type": "delivered",
      "timestamp": "2024-03-22T10:05:00Z"
    },
    {
      "type": "open",
      "timestamp": "2024-03-22T14:30:00Z"
    },
    {
      "type": "click",
      "timestamp": "2024-03-22T14:32:00Z",
      "url": "https://agentlead.com"
    }
  ]
}
```

---

## 📋 Templates Endpoints

### GET /templates
List all templates.

**Query Parameters:**
```
?channel=email
&isDefault=false
```

**Response (200):**
```json
{
  "templates": [
    {
      "id": "tpl-123",
      "name": "Initial Outreach",
      "description": "First contact template",
      "channel": "email",
      "content": "Hi {{name}}, I noticed {{company}} is doing great work...",
      "variables": ["{{name}}", "{{company}}", "{{budget}}"],
      "isDefault": false,
      "createdAt": "2024-03-10T10:00:00Z"
    }
  ]
}
```

---

### POST /templates
Create new template.

**Request:**
```json
{
  "name": "Follow-up Email",
  "description": "Follow-up to initial contact",
  "channel": "email",
  "content": "Hi {{name}}, checking in on my previous message...",
  "variables": ["{{name}}", "{{company}}"]
}
```

**Response (201):**
```json
{
  "id": "tpl-456",
  "name": "Follow-up Email",
  "description": "Follow-up to initial contact",
  "channel": "email",
  "content": "Hi {{name}}, checking in on my previous message...",
  "variables": ["{{name}}", "{{company}}"],
  "createdAt": "2024-03-23T12:00:00Z"
}
```

---

### PUT /templates/:id
Update template.

**Request:**
```json
{
  "name": "Updated Template Name",
  "content": "Updated content with {{variables}}"
}
```

**Response (200):**
```json
{
  "id": "tpl-456",
  "name": "Updated Template Name",
  "content": "Updated content with {{variables}}",
  "updatedAt": "2024-03-23T12:05:00Z"
}
```

---

### DELETE /templates/:id
Delete template.

**Response (200):**
```json
{
  "message": "Template deleted",
  "id": "tpl-456"
}
```

---

## 🤖 Agents Endpoints

### POST /agents/start-scrape
Start a new scraping job.

**Request:**
```json
{
  "source": "zillow",
  "query": "Denver real estate contractors",
  "limit": 100
}
```

**Response (202):**
```json
{
  "jobId": "job-789",
  "status": "pending",
  "source": "zillow",
  "query": "Denver real estate contractors",
  "estimatedLeads": 100
}
```

**Sources:**
- `zillow` - Zillow real estate
- `nextdoor` - Nextdoor neighbors
- `google-maps` - Google Maps businesses
- `web` - Web search

---

### POST /agents/qualify-leads
Trigger lead qualification with AI.

**Request:**
```json
{
  "leadIds": ["lead-1", "lead-2", "lead-3"],
  "model": "claude-haiku"
}
```

**Response (202):**
```json
{
  "message": "Qualification started",
  "leadsToProcess": 3,
  "model": "claude-haiku"
}
```

---

### POST /agents/send-dm
Send personalized DM to lead(s) using Claude Opus 4.6.

**Request:**
```json
{
  "leadIds": ["lead-1", "lead-2"],
  "channel": "email",
  "campaignId": "camp-123"
}
```

**Response (202):**
```json
{
  "message": "DM campaign initiated",
  "successful": 2,
  "failed": 0,
  "channel": "email"
}
```

**Channels:**
- `email` - Email via SendGrid
- `sms` - SMS via Twilio
- `whatsapp` - WhatsApp via Twilio

---

### POST /agents/campaign
Launch campaign to lead list.

**Request:**
```json
{
  "campaignId": "camp-123",
  "leadIds": ["lead-1", "lead-2", "lead-3"]
}
```

**Response (202):**
```json
{
  "message": "Campaign launched",
  "campaignId": "camp-123",
  "leadsCount": 3
}
```

---

### GET /agents/status
Get all agents status.

**Response (200):**
```json
{
  "scraper": {
    "state": "active",
    "jobsProcessed": 42,
    "uptime": "5h 23m"
  },
  "qualifier": {
    "state": "active",
    "jobsProcessed": 156,
    "uptime": "5h 23m"
  },
  "dm-agent": {
    "state": "idle",
    "jobsProcessed": 28,
    "uptime": "5h 23m"
  },
  "analytics": {
    "state": "active",
    "jobsProcessed": 12,
    "uptime": "5h 23m"
  }
}
```

---

### GET /agents/logs
Get agent activity logs.

**Query Parameters:**
```
?agent=dm-agent
&status=completed,failed
&limit=100
```

**Response (200):**
```json
{
  "logs": [
    {
      "id": "log-123",
      "agentName": "dm-agent",
      "action": "Send email to lead-456",
      "status": "completed",
      "duration": 1250,
      "error": null,
      "createdAt": "2024-03-23T14:00:00Z"
    }
  ]
}
```

---

### GET /agents/performance
Get campaign performance from agent perspective.

**Query Parameters:**
```
?campaignId=camp-123
```

**Response (200):**
```json
{
  "campaignId": "camp-123",
  "totalSent": 250,
  "openRate": "26.8%",
  "clickRate": "7.2%",
  "messages": [
    {
      "id": "msg-123",
      "leadId": "lead-456",
      "channel": "email",
      "status": "opened",
      "openedAt": "2024-03-22T14:30:00Z",
      "clickedAt": null
    }
  ]
}
```

---

## 📊 Analytics Endpoints

### GET /analytics/summary
Get dashboard metrics summary.

**Query Parameters:**
```
?dateRange=7days
```

**Response (200):**
```json
{
  "totalLeads": 5432,
  "qualifiedLeads": 3891,
  "hotLeads": 1245,
  "warmLeads": 1893,
  "coldLeads": 753,
  "totalSent": 2145,
  "totalOpened": 575,
  "openRate": "26.8%",
  "totalClicked": 154,
  "clickRate": "7.2%",
  "conversions": 28,
  "conversionRate": "1.3%",
  "revenue": 42000,
  "avgLeadScore": 68
}
```

---

### GET /analytics/chart/:type
Get chart data.

**Chart Types:**
- `leads-over-time` - Lead volume trend
- `lead-quality` - Hot/warm/cold distribution
- `conversion-funnel` - Leads → conversions
- `email-metrics` - Open/click rates
- `sms-metrics` - SMS delivery/read rates
- `revenue-by-source` - Revenue breakdown

**Example: leads-over-time**
```json
{
  "type": "leads-over-time",
  "data": [
    { "date": "2024-03-17", "count": 125 },
    { "date": "2024-03-18", "count": 143 },
    { "date": "2024-03-19", "count": 156 },
    { "date": "2024-03-20", "count": 198 },
    { "date": "2024-03-21", "count": 187 },
    { "date": "2024-03-22", "count": 201 },
    { "date": "2024-03-23", "count": 214 }
  ]
}
```

---

### GET /analytics/export
Export analytics data.

**Query Parameters:**
```
?dateRange=7days
&format=csv|pdf
```

**Response (200):**
Download file with analytics data in requested format.

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid input",
  "details": {
    "email": "Invalid email format"
  }
}
```

### 401 Unauthorized
```json
{
  "message": "No authorization token"
}
```

### 403 Forbidden
```json
{
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found",
  "id": "lead-123"
}
```

### 409 Conflict
```json
{
  "message": "Email already registered"
}
```

### 429 Too Many Requests
```json
{
  "message": "Rate limit exceeded",
  "retryAfter": 60
}
```

### 500 Server Error
```json
{
  "message": "Internal server error",
  "requestId": "req-123"
}
```

---

## 🔑 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| /auth/login | 10 | 15 minutes |
| /auth/signup | 5 | 1 hour |
| /leads | 100 | 1 minute |
| /campaigns | 50 | 1 minute |
| /agents/send-dm | 100 | 1 hour |
| /agents/start-scrape | 10 | 1 hour |

---

## 📝 Example Workflows

### Complete Lead-to-Conversion Flow

```bash
# 1. User logs in
POST /auth/login
→ Get JWT token

# 2. Get available leads
GET /leads?minScore=70&status=hot

# 3. Create campaign
POST /campaigns
→ Get campaign ID

# 4. Add leads to campaign & launch
POST /campaigns/{id}/launch
→ Campaign launches

# 5. Agent sends personalized messages
POST /agents/send-dm
→ Claude Opus generates messages

# 6. Track performance
GET /agents/performance?campaignId={id}
GET /messages?campaignId={id}

# 7. View analytics
GET /analytics/summary
GET /analytics/chart/conversion-funnel

# 8. Export report
GET /analytics/export?format=pdf
```

---

## 🧪 Testing API with cURL

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123"}' \
  | jq -r '.token')

# 2. Get leads
curl -X GET http://localhost:3001/api/leads \
  -H "Authorization: Bearer $TOKEN"

# 3. Create campaign
curl -X POST http://localhost:3001/api/campaigns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign",
    "description": "Testing the API"
  }'

# 4. Send campaign
curl -X POST http://localhost:3001/api/agents/campaign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "camp-123",
    "leadIds": ["lead-1", "lead-2"]
  }'
```

---

## 📚 SDK Integration Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get leads
const { data } = await apiClient.get('/leads');

// Send campaign
await apiClient.post('/agents/campaign', {
  campaignId: 'camp-123',
  leadIds: ['lead-1', 'lead-2']
});
```

### Python
```python
import requests

headers = {'Authorization': f'Bearer {token}'}

# Get leads
response = requests.get(
    'http://localhost:3001/api/leads',
    headers=headers
)

# Send campaign
requests.post(
    'http://localhost:3001/api/agents/campaign',
    headers=headers,
    json={
        'campaignId': 'camp-123',
        'leadIds': ['lead-1', 'lead-2']
    }
)
```

---

This API reference covers all 25+ endpoints with complete request/response examples. For additional help, refer to the DEVELOPER_GUIDE.md.
