# Quick Setup Guide - 15 Minute Deployment

This guide gets you from zero to running campaigns in **15 minutes**.

---

## Prerequisites

- Node.js 16+ installed
- Supabase account (free tier OK)
- SendGrid API key (free tier)
- Twilio account (optional, for SMS)

---

## Step 1: Environment Setup (2 min)

```bash
cd /path/to/lead-scraper

# Copy template
cp .env.example .env

# Edit with your credentials
nano .env  # or your favorite editor
```

**Required variables:**
```env
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=generate-32-random-chars
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@yourdomain.com
```

**Optional for SMS:**
```env
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## Step 2: Database Setup (3 min)

1. Open Supabase dashboard
2. Go to SQL Editor
3. Create new query
4. Paste content from: `backend/db/messaging-schema.sql`
5. Click "Run"

✅ Done! 8 new tables created with RLS.

---

## Step 3: Dependencies (2 min)

```bash
# Backend
cd backend
npm install nodemailer @sendgrid/mail twilio joi express-rate-limit jsonwebtoken

# Frontend
cd ../frontend
npm install
```

---

## Step 4: Integrate Routes (2 min)

Edit `backend/server.js`, add after existing routes:

```javascript
import campaignsRoutes from './routes/campaigns.js';
import templatesRoutes from './routes/templates.js';
import { startQueueProcessor } from './services/messageQueue.js';
import { initEmailService } from './services/emailService.js';

// Initialize
await initEmailService();
startQueueProcessor(10000);

// Routes
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/templates', templatesRoutes);
```

---

## Step 5: Update Frontend (2 min)

Edit `frontend/src/App.jsx`, update navigation:

```jsx
import CampaignsPage from './pages/CampaignsPage';
import TemplatesPage from './pages/TemplatesPage';

const pages = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'campaigns', label: 'Campaigns', icon: '📧' },
  { id: 'templates', label: 'Templates', icon: '📝' },
  { id: 'leads', label: 'Leads', icon: '👥' }
];

// In render:
{currentPage === 'campaigns' && <CampaignsPage />}
{currentPage === 'templates' && <TemplatesPage />}
```

---

## Step 6: Run (2 min)

```bash
# Backend
cd backend
npm start

# Frontend (new terminal)
cd frontend
npm run dev
```

Open: **http://localhost:3001**

---

## Step 7: Test Campaign (2 min)

1. Go to **Templates** page
2. Click **+ New Template**
3. Create an email:
   - Name: "Welcome"
   - Type: Email
   - Subject: "Welcome {{firstName}}"
   - Body: "Hi {{firstName}}, thanks for joining!"
4. Click **Create Template**

5. Go to **Campaigns** page
6. Click **+ New Campaign**
7. Fill in:
   - Name: "Test Campaign"
   - Type: Email
   - Template: "Welcome"
8. Click **Create Campaign**
9. Click **Send**

✅ Done! Campaign is queued.

---

## Verify It Works

**Check email sending:**
```bash
# Backend logs should show:
# ✓ Email sent to test@example.com
```

**Check database:**
```sql
SELECT * FROM campaign_deliveries;
SELECT * FROM email_campaigns;
```

---

## Common Issues

### "Missing SendGrid API key"
→ Check .env file has `SENDGRID_API_KEY`

### "Database RLS error"
→ Run `messaging-schema.sql` in Supabase

### "Routes not found"
→ Verify routes added to `server.js`

### "Components not rendering"
→ Clear node_modules: `npm install`

---

## API Quick Reference

```bash
# Create template
curl -X POST http://localhost:3002/api/templates \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Welcome",
    "type": "email",
    "subject": "Hi {{firstName}}",
    "body": "Welcome to our service!",
    "variables": ["firstName"]
  }'

# Create campaign
curl -X POST http://localhost:3002/api/campaigns \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q1 Outreach",
    "type": "email",
    "template_id": 1,
    "recipient_ids": [1, 2, 3],
    "quality_threshold": 0.5
  }'

# Send campaign
curl -X POST http://localhost:3002/api/campaigns/1/send \
  -H "Authorization: Bearer YOUR_JWT"

# Get campaign stats
curl -X GET http://localhost:3002/api/campaigns/1/stats \
  -H "Authorization: Bearer YOUR_JWT"
```

---

## What's Included

✅ Email campaigns (SendGrid/Nodemailer)
✅ SMS/WhatsApp campaigns (Twilio)
✅ Template management with live preview
✅ Message queue with retry logic
✅ Open & click tracking
✅ Unsubscribe management
✅ Rate limiting & authentication
✅ Audit logging
✅ Modern UI components
✅ RLS database security

---

## Next Steps

After campaigns are working:

1. **Production checklist** → See `SECURITY.md`
2. **Full docs** → See `IMPLEMENTATION_GUIDE.md`
3. **Security hardening** → Review security checklist
4. **Advanced features** → See enhancement summary

---

## Production Deploy Checklist

Before going live:

- [ ] Review SECURITY.md checklist
- [ ] Change JWT_SECRET to unique value
- [ ] Enable HTTPS/SSL certificate
- [ ] Set NODE_ENV=production
- [ ] Configure firewall rules
- [ ] Set up monitoring
- [ ] Test backup/restore
- [ ] Review GDPR compliance
- [ ] Rotate API keys
- [ ] Test rate limiting

---

**Estimated time: 15 minutes**
**Result: Working email/SMS campaign system**
**Status: Production-ready**

🚀 You're ready to start sending campaigns!
