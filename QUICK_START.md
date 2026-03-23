# 🚀 Quick Start Guide

## 5-Minute Setup

### Prerequisites
- Node.js v18+
- Supabase account (free)
- Anthropic API key

### Step 1: Clone & Install
```bash
git clone <repo>
cd lead-scraper
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### Step 2: Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys:
# SUPABASE_URL, SUPABASE_ANON_KEY
# ANTHROPIC_API_KEY
# SENDGRID_API_KEY, TWILIO credentials
```

### Step 3: Database Setup
```bash
# In Supabase SQL editor:
# Copy & paste entire backend/db/migrations.sql
# Click Execute
```

### Step 4: Start Servers
```bash
# Terminal 1:
cd backend && npm run dev
# Server: http://localhost:3001

# Terminal 2:
cd frontend && npm run dev
# App: http://localhost:5173
```

### Step 5: Test
```
Demo Email: demo@example.com
Demo Password: demo123

👉 Click "Sign In" on app
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `frontend/src/App.jsx` | Main routing |
| `backend/server.js` | API server |
| `backend/routes/auth.js` | Authentication |
| `backend/agents/dm-agent-opus.js` | Auto DM agent |
| `backend/db/migrations.sql` | Database |

---

## 🔗 Key URLs

| URL | Purpose |
|-----|---------|
| http://localhost:5173 | Frontend app |
| http://localhost:3001 | Backend API |
| http://localhost:3001/health | API health |

---

## 🛠️ Common Commands

```bash
# Frontend
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production

# Backend
cd backend
npm run dev          # Start dev server
npm start            # Start production server

# Database
# Use Supabase SQL editor for queries
```

---

## 📋 File Structure

```
frontend/src/
  ├── pages/          # 7 dashboard pages
  ├── components/     # Reusable UI
  └── services/       # API calls

backend/
  ├── routes/         # API endpoints
  ├── agents/         # AI agents
  ├── middleware/     # Auth, security
  └── db/             # Database schema
```

---

## 🔐 API Authentication

All API calls need JWT token:

```javascript
const token = localStorage.getItem('auth_token');
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

---

## 🧪 Test API Endpoint

```bash
# Get token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123"}'

# Use token to get leads
curl -X GET http://localhost:3001/api/leads \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📚 Documentation

- **DEVELOPER_GUIDE.md** - Full developer docs
- **API_REFERENCE.md** - All API endpoints
- **APP_BUILD_COMPLETE.md** - Feature overview

---

## ❌ Troubleshooting

| Problem | Solution |
|---------|----------|
| `Cannot find module` | Run `npm install` |
| `Port 3001 in use` | Change PORT in .env |
| `Database error` | Check Supabase URL/key in .env |
| `API timeout` | Check backend is running |

---

## 🎯 First Steps After Setup

1. ✅ Login with demo credentials
2. ✅ View Dashboard
3. ✅ Check Leads page
4. ✅ Create a Campaign
5. ✅ View Analytics

---

## 💡 Tips

- Use browser DevTools to see API calls
- Check browser console for errors
- Backend logs show all requests
- Supabase SQL editor for database queries

---

## 📞 Need Help?

1. Check DEVELOPER_GUIDE.md
2. Check API_REFERENCE.md
3. Review error messages
4. Check Supabase/API logs

---

**You're ready to code! Good luck!** 🚀
