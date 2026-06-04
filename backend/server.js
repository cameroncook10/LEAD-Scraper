import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import scrapeRoutes from './routes/scrape.js';
import leadsRoutes from './routes/leads.js';
import jobsRoutes from './routes/jobs.js';
import industriesRoutes from './routes/industries.js';
import analyticsRoutes from './routes/analytics.js';
import webhooksRoutes from './routes/webhooks.js';
import workflowRoutes from './routes/workflows.js';
import socialAuthRoutes from './routes/socialAuth.js';
import outreachRoutes from './routes/outreach.js';
import outreachCredentialsRoutes from './routes/outreachCredentials.js';
import stripeRoutes from './routes/stripe.js';
import stripeWebhooksRouter from './routes/stripe-webhooks.js';
import settingsRoutes from './routes/settings.js';
import campaignsRoutes from './routes/campaigns.js';
import templatesRoutes from './routes/templates.js';
import authRoutes from './routes/authRoutes.js';
import gdprRoutes from './routes/gdpr.js';
import realtorRoutes from './routes/realtor.js';
import { initializeDatabase } from './db/schema.js';
import { startQueueProcessor } from './services/messageQueue.js';
import { securityHeaders, enforceHttps, sanitizeInput } from './middleware/security.js';
import { requireAuth } from './middleware/auth.js';
import { requireSubscription, requirePlan } from './middleware/subscriptionCheck.js';
import { apiLimiter, scrapeLimiter } from './middleware/rateLimiter.js';
import logger from './utils/logger.js';

// ── Environment ────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const PORT    = parseInt(process.env.PORT || '3002', 10);
const isProd  = process.env.NODE_ENV === 'production';

// ── Express app ────────────────────────────────────────────────────────────────
const app = express();

// Security middleware
app.use(securityHeaders);
app.use(enforceHttps);

// HTTP request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => logger.http(req, res, Date.now() - start));
  next();
});

// CORS — strict in production, permissive locally
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
app.use(cors({
  origin: isProd
    ? (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin ${origin} not allowed`));
      }
    : true,
  methods:      ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials:  true,
  maxAge:       86400,
}));

// Stripe webhook — raw body BEFORE express.json()
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhooksRouter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(sanitizeInput);

// ── Supabase client ────────────────────────────────────────────────────────────
let supabase = null;
// The backend is a trusted server: prefer the service-role key so it can read/
// write on behalf of authenticated users. Tenant isolation is enforced in-app by
// filtering EVERY query on the authenticated user's id (req.user.userId). RLS is
// kept on as defense-in-depth for any direct anon-key access. Falls back to the
// anon key for local dev — but under RLS, anon queries return no rows, so a
// service-role key is required in production for the app to function.
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (process.env.SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    logger.warn('Using SUPABASE_ANON_KEY — set SUPABASE_SERVICE_ROLE_KEY in production or backend queries will return no rows under RLS');
  }
} else {
  logger.warn('SUPABASE_URL / key not set — Supabase features disabled');
}
export { supabase };
app.locals.supabase = supabase;

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const checks = {
    api:       'ok',
    supabase:  supabase ? 'configured' : 'not_configured',
    encryption: process.env.ENCRYPTION_KEY ? 'enabled' : 'disabled',
    stripe:    process.env.STRIPE_SECRET_KEY ? 'configured' : 'not_configured',
  };

  // Optional: light DB ping
  if (supabase) {
    try {
      await Promise.race([
        supabase.from('leads').select('id').limit(1),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000)),
      ]);
      checks.supabase = 'connected';
    } catch {
      checks.supabase = 'unreachable';
    }
  }

  const allOk = !Object.values(checks).includes('unreachable');
  res.status(allOk ? 200 : 503).json({
    status:    allOk ? 'ok' : 'degraded',
    version:   process.env.npm_package_version || '2.0.0',
    timestamp: new Date().toISOString(),
    checks,
  });
});

// ── Readiness probe (no DB check, just "is the process alive?") ────────────────
app.get('/ready', (_req, res) => res.json({ status: 'ready' }));

// ── Global rate limiter ────────────────────────────────────────────────────────
app.use(apiLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/scrape',               requireAuth, requirePlan('starter'), scrapeLimiter, scrapeRoutes);
app.use('/api/leads',                requireAuth, requireSubscription, leadsRoutes);
app.use('/api/jobs',                 requireAuth, jobsRoutes);
app.use('/api/industries',           industriesRoutes);
app.use('/api/analytics',            requireAuth, analyticsRoutes);
app.use('/api/webhooks',             requireAuth, webhooksRoutes);
app.use('/api/workflows',            requireAuth, workflowRoutes);
app.use('/api/auth',                 socialAuthRoutes);
app.use('/api/outreach',             requireAuth, requirePlan('starter'), outreachRoutes);
app.use('/api/outreach-credentials', requireAuth, requireSubscription, outreachCredentialsRoutes);
app.use('/api/stripe',               stripeRoutes);
app.use('/api/settings',             requireAuth, settingsRoutes);
app.use('/api/campaigns',            requireAuth, campaignsRoutes);
app.use('/api/templates',            requireAuth, templatesRoutes);
app.use('/auth',                     authRoutes);
app.use('/api/gdpr',                 requireAuth, gdprRoutes);
app.use('/api/realtor',              requireAuth, requireSubscription, realtorRoutes);

// Lightweight access probe for the dashboard: 200 if the authenticated user may
// use the app, 403 (code NO_ACCESS) if they're signed in but not yet activated
// (pre-Stripe, not in MANUAL_ACCESS_EMAILS). Lets the UI show an activation screen.
app.get('/api/me', requireAuth, requireSubscription, (req, res) => {
  res.json({ ok: true, userId: req.user.userId, email: req.user.email });
});

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// ── Global error handler ───────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  logger.error('Unhandled request error', err);
  res.status(err.status || 500).json({
    error:   err.message || 'Internal server error',
    ...(isProd ? {} : { stack: err.stack }),
  });
});

// ── Export for Vercel serverless ───────────────────────────────────────────────
export default app;

// ── Start server (not in Vercel / test environments) ──────────────────────────
if (process.env.VERCEL !== '1') {
  const startServer = async () => {
    if (!process.env.ENCRYPTION_KEY) {
      logger.warn('ENCRYPTION_KEY not set — field-level encryption disabled');
    } else {
      logger.info('AES-256-GCM encryption enabled');
    }

    await initializeDatabase();
    logger.info('Database schema initialised');

    startQueueProcessor(30_000);
    logger.info('Message queue processor started');

    const server = app.listen(PORT, () => {
      logger.info(`Server ready`, { port: PORT, env: process.env.NODE_ENV });
    });

    // ── Graceful shutdown ─────────────────────────────────────────────────────
    let isShuttingDown = false;

    const shutdown = (signal) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      logger.info(`${signal} received — shutting down gracefully`);

      // Stop accepting new connections; allow existing ones to finish (30 s max)
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      setTimeout(() => {
        logger.warn('Forced shutdown after timeout');
        process.exit(1);
      }, 30_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    // Surface unhandled promise rejections instead of silently swallowing them
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled promise rejection', reason instanceof Error ? reason : new Error(String(reason)));
    });
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception — exiting', err);
      process.exit(1);
    });
  };

  startServer().catch((err) => {
    logger.error('Failed to start server', err);
    process.exit(1);
  });
}
