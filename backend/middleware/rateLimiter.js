import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Middleware
 * Different limits for different endpoints
 */

// Global API limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

// Strict limiter for authentication endpoints
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: (req) => {
    // Use combination of IP and email for more accurate limiting
    return `${req.ip}-${req.body.email || 'unknown'}`;
  }
});

// Email campaign limiter
export const emailLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 100, // 100 email campaigns per day
  message: 'Too many email campaigns, please try again tomorrow.',
  keyGenerator: (req) => req.user?.userId || req.ip,
  skip: (req) => !req.user // Only apply to authenticated users
});

// SMS/WhatsApp campaign limiter
export const smsCampaignLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 50, // 50 SMS campaigns per day
  message: 'SMS campaign limit reached. Try again tomorrow.',
  keyGenerator: (req) => req.user?.userId || req.ip,
  skip: (req) => !req.user
});

// Campaign send limiter (prevent accidental mass sends)
export const campaignLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 campaign sends per minute
  message: 'Campaign send rate limited. Please wait before sending another campaign.',
  keyGenerator: (req) => req.user?.userId || req.ip,
  skip: (req) => !req.user
});

// Webhook limiter (be generous with webhooks)
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute
  message: 'Webhook rate limit exceeded.',
  skipFailedRequests: true // Don't count failed requests
});

// Scrape limiter (strict to prevent resource abuse)
export const scrapeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 scrape jobs per hour
  message: 'Scraping limit reached. You can only create 10 scrape jobs per hour.',
  keyGenerator: (req) => req.user?.userId || req.ip,
  skip: (req) => !req.user
});

// Search limiter
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: 'Search rate limit exceeded.',
  keyGenerator: (req) => req.user?.userId || req.ip
});

// API key endpoints limiter
export const apiKeyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: 'API key operation rate limited.',
  keyGenerator: (req) => req.user?.userId || req.ip,
  skip: (req) => !req.user
});

/**
 * Custom rate limiter factory
 * Create custom limiters with specific configurations
 */
export const createLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || 'Too many requests',
    keyGenerator: options.keyGenerator || ((req) => req.ip),
    skip: options.skip,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    standardHeaders: true,
    legacyHeaders: false
  });
};

/**
 * Rate limit error handler
 */
export const rateLimitErrorHandler = (err, req, res, next) => {
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Too many requests',
      message: err.message,
      retryAfter: err.resetTime
    });
  }
  next(err);
};
