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
import { initializeDatabase } from './db/schema.js';
import { securityHeaders, enforceHttps, sanitizeInput } from './middleware/security.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// Security middleware
app.use(securityHeaders);
app.use(enforceHttps);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
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

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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

// Routes
app.use('/api/scrape', scrapeRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/industries', industriesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/webhooks', webhooksRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
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
