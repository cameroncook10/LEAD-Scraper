/**
 * Security middleware - headers, HTTPS enforcement, request sanitization
 */

/**
 * Set security headers (similar to helmet)
 */
export const securityHeaders = (req, res, next) => {
  const isElectron = process.env.ELECTRON === '1';

  // Prevent clickjacking (skip in Electron — app runs in BrowserWindow)
  if (!isElectron) {
    res.setHeader('X-Frame-Options', 'DENY');
  }
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Strict transport security (skip in Electron — runs on localhost)
  if (!isElectron) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Content Security Policy
  if (isElectron) {
    // Electron needs localhost access and inline scripts for BrowserWindow
    res.setHeader('Content-Security-Policy', "default-src 'self' http://localhost:* file:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  } else {
    // Production CSP: no unsafe-inline anywhere
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co https://api.stripe.com");
  }
  // Permissions policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Remove powered-by header
  res.removeHeader('X-Powered-By');

  next();
};

/**
 * Enforce HTTPS in production
 */
export const enforceHttps = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' &&
      process.env.ELECTRON !== '1' &&
      req.headers['x-forwarded-proto'] !== 'https' &&
      !req.headers.host?.includes('localhost')) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
};

/**
 * Sanitize request body - strip potential XSS from string values
 */
export const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;

  const sanitized = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function sanitizeString(str) {
  return str
    .replace(/[<>]/g, '') // Strip angle brackets
    .replace(/javascript:/gi, '') // Strip javascript: protocol
    .replace(/on\w+=/gi, '') // Strip event handlers
    .trim();
}

/**
 * Request ID middleware for tracing
 */
export const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
};

/**
 * Validate CORS configuration on startup.
 * In non-Electron mode, ALLOWED_ORIGINS must be explicitly set —
 * falling back to '*' is a security risk in production.
 * Call this once at server startup (not per-request).
 */
export const validateCorsConfig = () => {
  const isElectron = process.env.ELECTRON === '1';
  if (!isElectron && !process.env.ALLOWED_ORIGINS) {
    throw new Error(
      'SECURITY ERROR: ALLOWED_ORIGINS environment variable is not set. ' +
      'Set ALLOWED_ORIGINS to a comma-separated list of allowed origins ' +
      '(e.g. "https://yourdomain.com,https://app.yourdomain.com"). ' +
      'Refusing to start with wildcard CORS in non-Electron mode.'
    );
  }
};

export default {
  securityHeaders,
  enforceHttps,
  sanitizeInput,
  requestId,
  validateCorsConfig
};
