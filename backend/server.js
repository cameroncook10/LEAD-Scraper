import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
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
import settingsRoutes from './routes/settings.js';
import { initializeDatabase } from './db/schema.js';
import { startQueueProcessor } from './services/messageQueue.js';
import { securityHeaders, enforceHttps, sanitizeInput } from './middleware/security.js';
import { requireAuth } from './middleware/auth.js';
import { apiLimiter, scrapeLimiter } from './middleware/rateLimiter.js';

// Load .env - must assign to process.env for ES modules
const envConfig = dotenv.config();
if (envConfig.parsed) {
  Object.assign(process.env, envConfig.parsed);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// Security middleware
app.use(securityHeaders);
app.use(enforceHttps);

// CORS configuration
const isElectron = process.env.ELECTRON === '1';
app.use(cors({
  origin: isElectron
    ? true  // Allow all origins in Electron (same-machine only)
    : (process.env.ALLOWED_ORIGINS?.split(',') || '*'),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Sanitize all inputs
app.use(sanitizeInput);

// Initialize Supabase client (optional — app works without it for local/desktop use)
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
} else {
  console.warn('WARNING: SUPABASE_URL/SUPABASE_ANON_KEY not set. Supabase features disabled.');
}
export { supabase };

// Make supabase available to routes
app.locals.supabase = supabase;

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    encryption: !!process.env.ENCRYPTION_KEY,
    version: '2.0.0'
  });
});

// Global rate limiter
app.use(apiLimiter);

// Routes — protected with auth + rate limiters where appropriate
app.use('/api/scrape', requireAuth, scrapeLimiter, scrapeRoutes);
app.use('/api/leads', requireAuth, leadsRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/industries', industriesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/workflows', requireAuth, workflowRoutes);
app.use('/api/auth', socialAuthRoutes);
app.use('/api/outreach', requireAuth, outreachRoutes);
app.use('/api/outreach-credentials', requireAuth, outreachCredentialsRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/settings', requireAuth, settingsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler (MUST be last)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Export app for Vercel serverless
export default app;

// Start server only when running directly (not imported by Vercel)
const isVercel = process.env.VERCEL === '1';

if (!isVercel) {
  const startServer = async () => {
    try {
      if (!process.env.ENCRYPTION_KEY) {
        console.warn('WARNING: ENCRYPTION_KEY not set. Field-level encryption is disabled.');
      } else {
        console.log('AES-256-GCM encryption enabled');
      }

      await initializeDatabase();
      console.log('Database schema initialized');

      // Start the message queue processor (polls every 30s)
      startQueueProcessor(30000);
      console.log('Message queue processor started');

      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Health: http://localhost:${PORT}/health`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  startServer();
}
