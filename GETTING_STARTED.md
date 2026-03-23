# 🚀 Getting Started with Lead Scraper MVP

Welcome! This guide will help you get the application running locally.

## Choose Your Path

### 🏃 In a Hurry? (10 minutes)
Start with [QUICK_START.md](QUICK_START.md) - minimal setup, just get running

### 📖 Want Details? (30 minutes)
Read [SETUP.md](SETUP.md) - step-by-step instructions with explanations

### 🏗️ Want to Understand It? (1 hour)
Start with [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) then dive into code

### 🚀 Ready to Deploy?
Skip to [DEPLOYMENT.md](DEPLOYMENT.md) after local testing

---

## 📚 Documentation Map

```
START HERE
    │
    ├─→ QUICK_START.md ─────────────────> Get running in 10 min
    │                                      (fastest path)
    │
    ├─→ SETUP.md ───────────────────────> Detailed setup guide
    │   │                                  (with troubleshooting)
    │   └─→ Run: npm run dev
    │
    ├─→ README.md ──────────────────────> Full feature docs
    │   │                                  (features & API)
    │   ├─→ Usage guide
    │   ├─→ API endpoints
    │   └─→ File structure
    │
    ├─→ PROJECT_OVERVIEW.md ────────────> Project overview
    │   │                                  (what was built)
    │   ├─→ Technology stack
    │   ├─→ Architecture decisions
    │   └─→ Next steps for expansion
    │
    ├─→ ARCHITECTURE.md ────────────────> System design
    │   │                                  (how it works)
    │   ├─→ Data flow diagrams
    │   ├─→ Database schema
    │   ├─→ API design
    │   └─→ Scaling considerations
    │
    └─→ DEPLOYMENT.md ──────────────────> Production deployment
                                           (taking it live)
```

## 🎯 Recommended Reading Order

**For Quick Start:**
1. QUICK_START.md (get it running)
2. README.md (understand features)
3. Test the UI locally

**For Full Understanding:**
1. PROJECT_OVERVIEW.md (what we built)
2. SETUP.md (how to set it up)
3. ARCHITECTURE.md (how it works)
4. README.md (how to use it)
5. DEPLOYMENT.md (how to ship it)

**For Development:**
1. PROJECT_OVERVIEW.md (context)
2. ARCHITECTURE.md (system design)
3. Code exploration (read the files)
4. SETUP.md (run it locally)

## ⚡ The Fastest Path to Running

```bash
# 1. Install dependencies (2 min)
cd lead-scraper && npm install && cd backend && npm install && cd ../frontend && npm install && cd ..

# 2. Configure environment (1 min)
cp .env.example .env
# Edit .env with: SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY

# 3. Set up database (3 min)
# Create Supabase project, run SQL schema (see QUICK_START.md)

# 4. Run it (1 min)
npm run dev

# 5. Open browser
# http://localhost:3001
```

**Total: ~10 minutes** ⏱️

## 📋 Prerequisites Checklist

- [ ] Node.js 16+ installed
- [ ] npm or yarn available
- [ ] Supabase account created (free)
- [ ] Anthropic API key obtained (free)
- [ ] Code editor ready
- [ ] Internet connection for APIs

## 🎮 Testing the App

Once running:

1. **Create a scrape job**
   - Go to Dashboard tab
   - Select "Web Search"
   - Enter: "plumbers"
   - Click "Start Scrape Job"

2. **Monitor progress**
   - Go to Jobs tab
   - Click your job
   - Watch logs update in real-time

3. **View results**
   - Go to Leads tab
   - See your scraped leads
   - Filter by score, export to CSV

## 📖 Key Documentation Files

| File | Purpose | Read Time |
|------|---------|-----------|
| [QUICK_START.md](QUICK_START.md) | Get running ASAP | 5 min |
| [SETUP.md](SETUP.md) | Detailed setup | 15 min |
| [README.md](README.md) | Features & API | 20 min |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | Project context | 15 min |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design | 25 min |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production guide | 10 min |

## 💻 System Requirements

| Component | Requirement |
|-----------|-------------|
| Node.js | 16.x or higher |
| RAM | 2GB minimum |
| Disk | 500MB for dependencies |
| Internet | Required for APIs |
| Ports | 3001 (frontend), 3002 (backend) |

## 🏗️ Project Structure at a Glance

```
lead-scraper/
├── frontend/          React app (Vite + Tailwind)
│   └── src/
│       ├── App.jsx              Main component
│       ├── pages/               Dashboard/Jobs/Leads
│       └── services/api.js      API client
│
├── backend/           Node.js server (Express)
│   ├── server.js              Server entry point
│   ├── routes/                API endpoints
│   ├── services/              Business logic
│   │   ├── aiQualification.js Claude integration
│   │   ├── scrapeManager.js   Job management
│   │   └── scrapers/          Data sources
│   └── db/schema.js           Database schema
│
└── docs/              This documentation
```

## 🚨 Common Issues

**Cannot find npm:**
- Install Node.js from nodejs.org

**Port 3002 already in use:**
- Run: `lsof -i :3002` then `kill -9 <PID>`

**Supabase connection fails:**
- Check .env has correct URL and keys
- Verify database tables exist

**Claude API errors:**
- Check ANTHROPIC_API_KEY is correct
- Verify account has API credits

See [SETUP.md - Troubleshooting](SETUP.md#troubleshooting) for more.

## 📞 Where to Get Help

1. **Setup issues** → Check [SETUP.md](SETUP.md#troubleshooting)
2. **How to use** → Read [README.md](README.md#usage)
3. **API questions** → See [README.md](README.md#api-endpoints)
4. **Architecture questions** → Read [ARCHITECTURE.md](ARCHITECTURE.md)
5. **Deployment questions** → Check [DEPLOYMENT.md](DEPLOYMENT.md)

## 🎓 Learning Resources

- React: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- Express: https://expressjs.com
- Supabase: https://supabase.com/docs
- Claude API: https://claude.ai/

## ✨ Features Included

✅ Multi-source lead scraping (Web, Maps, Zillow, Nextdoor)
✅ AI qualification with Claude Haiku
✅ Real-time progress tracking
✅ Lead filtering and search
✅ CSV export
✅ Professional UI
✅ Full REST API
✅ Production-ready code

## 🎯 What Happens Next

1. **Get it running** - Start with QUICK_START.md
2. **Understand it** - Read PROJECT_OVERVIEW.md
3. **Learn the code** - Explore the files
4. **Deploy it** - Follow DEPLOYMENT.md
5. **Extend it** - Add auth, payments, etc.

## 🤝 Built For

This MVP is built for **Cam** to take into Claude Code and extend with:
- Authentication (user login)
- Payment processing (Stripe)
- Advanced features (CRM integration, etc.)

All code is clean, modular, and well-documented for easy extension.

---

## 📍 You Are Here

```
START
  ↓
Choose your path:
  ├─ QUICK_START.md      ← Go here if you want to run it now
  ├─ SETUP.md            ← Go here for step-by-step guide
  └─ PROJECT_OVERVIEW.md ← Go here to understand what we built
```

## 🚀 Next: Pick Your Path

- **Just want to run it?** → [QUICK_START.md](QUICK_START.md)
- **Want detailed instructions?** → [SETUP.md](SETUP.md)
- **Want to understand the project?** → [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)
- **Want to see the code?** → Start with `backend/server.js` or `frontend/src/App.jsx`

---

**Ready? Let's go!** Pick a link above and get started. 🎉
