# Deployment Guide

## Production Deployment Options

### Option 1: Vercel + Railway (Recommended for MVP)

#### Frontend on Vercel
1. Push to GitHub
2. Connect to Vercel
3. Deploy automatically on push

#### Backend on Railway
1. Create Railway account
2. Connect GitHub
3. Set environment variables
4. Deploy with one click

### Option 2: Docker + Your VPS

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Build frontend
COPY frontend ./frontend
WORKDIR ./frontend
RUN npm install
RUN npm run build
WORKDIR ..

# Copy backend
COPY backend ./backend

EXPOSE 3002

CMD ["node", "backend/server.js"]
```

Build and run:
```bash
docker build -t lead-scraper .
docker run -p 3002:3002 --env-file .env lead-scraper
```

### Option 3: Heroku

```bash
# Install Heroku CLI
brew tap heroku/brew && brew install heroku

# Login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set SUPABASE_URL=your-url
heroku config:set SUPABASE_ANON_KEY=your-key
heroku config:set ANTHROPIC_API_KEY=your-key

# Deploy
git push heroku main
```

## Production Checklist

- [ ] Environment variables secured (not in git)
- [ ] Database backups configured
- [ ] Error monitoring (Sentry, LogRocket)
- [ ] Rate limiting enabled
- [ ] CORS configured for production domain
- [ ] Database connection pooling
- [ ] Health checks configured
- [ ] Logs aggregated (CloudWatch, Datadog)
- [ ] API key rotation schedule
- [ ] Load testing completed

## Environment Variables - Production

```
NODE_ENV=production
PORT=3002
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
```

## Monitoring

### Frontend
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for usage

### Backend
- New Relic for performance
- Sentry for exceptions
- CloudWatch for logs

## Scaling Considerations

**Current MVP can handle:**
- ~10 concurrent scrape jobs
- ~1000 leads processed daily
- ~100 concurrent frontend users

**To scale further:**
1. Use job queue (Bull, RabbitMQ)
2. Add Redis caching
3. Horizontal scaling with load balancer
4. Database read replicas
5. CDN for frontend assets

## Maintenance

**Weekly:**
- Check logs for errors
- Monitor API response times

**Monthly:**
- Review and update dependencies
- Check API quota usage
- Review security logs

**Quarterly:**
- Performance audit
- Security audit
- Load testing

## Troubleshooting Production

### High memory usage
```bash
# Check Node process
node --max-old-space-size=2048 server.js
```

### Database connection errors
```
Error: too many connections
```
Enable connection pooling in Supabase settings

### Rate limit errors
Implement exponential backoff in scrapers

## Backup Strategy

Supabase automatically backs up, but:
1. Test restore process monthly
2. Keep export of critical leads
3. Archive old data quarterly
