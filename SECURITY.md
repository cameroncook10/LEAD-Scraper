# Security Architecture - Lead Scraper

## 1. Secrets Management

### Environment Variables (.env)
All sensitive credentials must be stored in `.env` files and **never committed to version control**.

**Required Environment Variables:**
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# JWT Authentication
JWT_SECRET=your-secure-random-jwt-secret-min-32-chars
JWT_EXPIRY=24h

# Email Service (SendGrid or Nodemailer)
EMAIL_SERVICE=sendgrid          # or 'nodemailer'
SENDGRID_API_KEY=your-api-key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Lead Scraper

# SMS/WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Encryption
ENCRYPTION_KEY=your-32-char-encryption-key
ENCRYPTION_ALGORITHM=aes-256-cbc

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Session Security
SESSION_SECRET=your-secure-session-secret
SECURE_COOKIES=true
SAME_SITE_COOKIES=strict

# CORS & Hosts
FRONTEND_URL=http://localhost:3001
ALLOWED_ORIGINS=http://localhost:3001,https://yourdomain.com

# Node Environment
NODE_ENV=production
DEBUG=false
```

**File Structure:**
```
lead-scraper/
├── .env                 # Production secrets (gitignored)
├── .env.example         # Template (committed to repo)
├── .env.development     # Dev secrets (gitignored)
├── .env.test           # Test secrets (gitignored)
└── .gitignore          # Must include .env, .env.local, etc.
```

### .gitignore Configuration
```
# Environment
.env
.env.local
.env.*.local
.env.production

# Dependencies
node_modules/
yarn.lock
package-lock.json

# Secrets
*.key
*.pem
secrets/

# Logs
logs/
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
```

### Loading Strategy
1. Load from environment variables first
2. Fall back to `.env` file using `dotenv`
3. Validate all required vars are present on startup
4. Never log sensitive values

```javascript
// backend/config/secrets.js
import dotenv from 'dotenv';

dotenv.config();

const requiredSecrets = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'JWT_SECRET',
  'ENCRYPTION_KEY'
];

const validateSecrets = () => {
  const missing = requiredSecrets.filter(secret => !process.env[secret]);
  if (missing.length > 0) {
    throw new Error(`Missing required secrets: ${missing.join(', ')}`);
  }
};

export const secrets = {
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiry: process.env.JWT_EXPIRY || '24h'
  },
  email: {
    service: process.env.EMAIL_SERVICE,
    sendgridKey: process.env.SENDGRID_API_KEY,
    from: process.env.EMAIL_FROM
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY,
    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-cbc'
  }
};

validateSecrets();
export default secrets;
```

---

## 2. Database Encryption at Rest (Supabase)

### Enable RLS (Row Level Security)
Every table should have RLS enabled with proper policies:

```sql
-- Example: Enable RLS on leads table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own leads
CREATE POLICY "Users see own leads"
  ON leads FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own leads
CREATE POLICY "Users insert own leads"
  ON leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own leads
CREATE POLICY "Users update own leads"
  ON leads FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Encrypt Sensitive Fields
For highly sensitive data (email addresses, phone numbers), implement application-level encryption:

```javascript
// backend/utils/encryption.js
import crypto from 'crypto';

const algorithm = process.env.ENCRYPTION_ALGORITHM;
const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

export const encryptField = (data) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

export const decryptField = (encryptedData) => {
  const [iv, encrypted] = encryptedData.split(':');
  const decipher = crypto.createDecipheriv(
    algorithm,
    encryptionKey,
    Buffer.from(iv, 'hex')
  );
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
```

### Database Backups
- Enable automated daily backups in Supabase dashboard
- Test restore procedures monthly
- Store backup encryption keys separately from backups

### SSL/TLS for Database Connections
Supabase enforces SSL connections by default. Ensure connection strings use `sslmode=require`:

```javascript
// Connection already enforces SSL
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
```

---

## 3. API Key Handling and Rotation

### API Key Storage
- **Never** store API keys in code
- Store in environment variables only
- Use service/role-specific keys (least privilege)
- Implement key rotation policies

### Key Rotation Strategy

```javascript
// backend/utils/keyRotation.js
import { supabase } from '../server.js';

export const rotateApiKey = async (keyName) => {
  // 1. Generate new key
  const newKey = crypto.randomBytes(32).toString('hex');
  
  // 2. Store with expiration
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90); // 90-day rotation
  
  await supabase
    .from('api_keys')
    .insert({
      name: keyName,
      key_hash: hashKey(newKey),
      expires_at: expiresAt,
      status: 'active'
    });
  
  // 3. Mark old key as deprecated
  await supabase
    .from('api_keys')
    .update({ status: 'deprecated' })
    .eq('name', keyName)
    .neq('status', 'active');
  
  return newKey; // Return to user only once
};

// Check for expired keys and alert
export const checkExpiredKeys = async () => {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .lt('expires_at', new Date().toISOString())
    .eq('status', 'active');
  
  if (data && data.length > 0) {
    console.warn('⚠️  API keys expiring soon:', data.map(k => k.name));
    // Send alert to admin
  }
};
```

### Third-Party API Key Security
For services like SendGrid, Twilio:
- Use separate API keys per environment
- Never commit keys
- Regenerate keys if exposed
- Monitor usage patterns for anomalies

```javascript
// Example: Validate API key before using
const validateApiKey = (key) => {
  if (!key || key.length < 20) {
    throw new Error('Invalid API key format');
  }
  // Log first 4 and last 4 chars only
  const masked = key.substring(0, 4) + '...' + key.substring(key.length - 4);
  console.log(`Using API key: ${masked}`);
};
```

---

## 4. Data Encryption in Transit (HTTPS/TLS)

### HTTPS Configuration

**Production:**
```javascript
// backend/server.js
import https from 'https';
import fs from 'fs';

const httpsOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH)
};

https.createServer(httpsOptions, app).listen(PORT);
```

**Development (auto-HTTPS via reverse proxy):**
Use a reverse proxy like Caddy or nginx in development too.

### HSTS (HTTP Strict Transport Security)
```javascript
import helmet from 'helmet';

app.use(helmet.hsts({
  maxAge: 31536000, // 1 year
  includeSubDomains: true,
  preload: true
}));
```

### TLS 1.2+ Enforcement
```javascript
const httpsOptions = {
  minVersion: 'TLSv1.2',
  ciphers: 'HIGH:!aNULL:!MD5',
  // ... other options
};
```

### CORS Configuration
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Secure Headers
```javascript
import helmet from 'helmet';

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'https:'],
    connectSrc: ["'self'", process.env.SUPABASE_URL]
  }
}));
```

---

## 5. Authentication (JWT Tokens)

### JWT Implementation

```javascript
// backend/utils/jwt.js
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
const EXPIRY = process.env.JWT_EXPIRY || '24h';

export const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    SECRET,
    { expiresIn: EXPIRY }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    return null;
  }
};

// Middleware
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  req.user = decoded;
  next();
};
```

### Login Endpoint
```javascript
// backend/routes/auth.js
import express from 'express';
import { generateToken } from '../utils/jwt.js';
import { supabase } from '../server.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Authenticate with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate JWT token
  const token = generateToken(data.user.id, data.user.email);
  
  return res.json({
    token,
    user: {
      id: data.user.id,
      email: data.user.email
    }
  });
});

export default router;
```

### Token Refresh
```javascript
export const refreshToken = (token) => {
  const decoded = jwt.decode(token);
  if (!decoded) return null;
  
  return generateToken(decoded.userId, decoded.email);
};

router.post('/refresh', (req, res) => {
  const { token } = req.body;
  const newToken = refreshToken(token);
  
  if (!newToken) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  res.json({ token: newToken });
});
```

### Token Blacklist (for logout)
```javascript
// backend/utils/tokenBlacklist.js
const blacklistedTokens = new Set();

export const blacklistToken = (token) => {
  const decoded = jwt.decode(token);
  if (decoded) {
    blacklistedTokens.add(token);
    // Optional: Cleanup expired tokens periodically
  }
};

export const isTokenBlacklisted = (token) => {
  return blacklistedTokens.has(token);
};

// Middleware
export const checkBlacklist = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token && isTokenBlacklisted(token)) {
    return res.status(401).json({ error: 'Token has been revoked' });
  }
  next();
};
```

---

## 6. Rate Limiting

### Global Rate Limiter
```javascript
// backend/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from 'redis';

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:'
  }),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Per-endpoint limiters
export const scrapeApiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  keyGenerator: (req) => req.user?.userId || req.ip
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true
});

export const emailLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 100, // 100 emails per day
  keyGenerator: (req) => req.user?.userId
});
```

### Application in Routes
```javascript
// backend/routes/scrape.js
import { scrapeApiLimiter } from '../middleware/rateLimiter.js';

router.post('/start', scrapeApiLimiter, async (req, res) => {
  // Handle scrape request
});
```

---

## 7. Request Validation

### Input Validation Schema
```javascript
// backend/utils/validation.js
import Joi from 'joi';

export const schemas = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
  }),
  
  createScrapeJob: Joi.object({
    urls: Joi.array().items(Joi.string().uri()).required(),
    keywords: Joi.array().items(Joi.string()).required(),
    selectors: Joi.object().required(),
    qualityThreshold: Joi.number().min(0).max(1)
  }),
  
  createLead: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[0-9\-\+\(\)\s]+$/).optional(),
    source: Joi.string().required(),
    data: Joi.object().optional()
  }),
  
  emailCampaign: Joi.object({
    recipientIds: Joi.array().items(Joi.number()).required(),
    templateId: Joi.number().required(),
    qualityThreshold: Joi.number().min(0).max(1),
    scheduleTime: Joi.date().optional(),
    unsubscribeUrl: Joi.string().uri().optional()
  })
};

// Validation middleware
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }));
      return res.status(400).json({ error: 'Validation failed', details });
    }
    
    req.validatedData = value;
    next();
  };
};
```

### Using Validation
```javascript
import { validate, schemas } from '../utils/validation.js';

router.post('/login', validate(schemas.login), async (req, res) => {
  const { email, password } = req.validatedData;
  // Process validated data
});
```

---

## 8. Audit Logging Setup

### Audit Logger
```javascript
// backend/utils/auditLog.js
import { supabase } from '../server.js';

export const auditLog = async (userId, action, resourceType, resourceId, details = {}) => {
  const timestamp = new Date().toISOString();
  const ipAddress = details.ipAddress || 'unknown';
  
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details: JSON.stringify(details),
      ip_address: ipAddress,
      timestamp
    });
  
  if (error) {
    console.error('Audit log failed:', error);
  }
};

// Middleware to extract IP and attach to request
export const auditLogMiddleware = (req, res, next) => {
  req.auditDetails = {
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  };
  next();
};

// Usage
await auditLog(
  req.user.userId,
  'CAMPAIGN_SENT',
  'email_campaign',
  campaignId,
  { recipients: 150, template: 'monthly-update', ...req.auditDetails }
);
```

### Audit Log Schema
```sql
CREATE TABLE audit_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_audit_user_time ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);
```

---

## 9. Security Checklist Before Production

### Pre-Deployment Verification

- [ ] **Environment Variables**
  - [ ] All secrets loaded from environment (never hardcoded)
  - [ ] `.env` file gitignored and not in repository
  - [ ] Required secrets documented in `.env.example`
  - [ ] No test/dev credentials in production

- [ ] **Database Security**
  - [ ] RLS (Row Level Security) enabled on all tables
  - [ ] Sensitive fields encrypted at application level
  - [ ] Database backups automated and tested
  - [ ] Connection strings using SSL/TLS
  - [ ] Service keys rotated and least-privilege applied

- [ ] **Authentication**
  - [ ] JWT tokens have short expiry (24h or less)
  - [ ] Token refresh endpoints implemented
  - [ ] Logout blacklists tokens
  - [ ] Password hashing using bcrypt (min. 10 rounds)
  - [ ] MFA enabled for admin accounts (if applicable)

- [ ] **HTTPS/TLS**
  - [ ] SSL certificate installed and valid
  - [ ] TLS 1.2+ enforced
  - [ ] HSTS headers configured
  - [ ] Cipher suites hardened
  - [ ] No mixed HTTP/HTTPS content

- [ ] **API Security**
  - [ ] All endpoints require authentication (except login/health)
  - [ ] CORS properly configured with allowed origins
  - [ ] Rate limiting active on all endpoints
  - [ ] Request validation enforced
  - [ ] File uploads scanned for malware (if applicable)

- [ ] **Error Handling**
  - [ ] Stack traces never exposed to clients
  - [ ] Generic error messages in production
  - [ ] Errors logged securely server-side
  - [ ] No sensitive data in error responses

- [ ] **Logging & Monitoring**
  - [ ] Audit logging enabled for sensitive actions
  - [ ] Logs stored securely (not in code)
  - [ ] Failed login attempts tracked
  - [ ] Unusual activity alerting configured
  - [ ] Log retention policy defined

- [ ] **Dependencies**
  - [ ] No known vulnerabilities (`npm audit`)
  - [ ] Dependencies pinned to specific versions
  - [ ] Regular security updates scheduled
  - [ ] Supply chain security reviewed

- [ ] **Code Security**
  - [ ] No SQL injection vulnerabilities (use parameterized queries)
  - [ ] No XSS vulnerabilities (escape user input)
  - [ ] No CSRF protection needed (stateless JWT auth)
  - [ ] Secrets scanning in CI/CD pipeline
  - [ ] Code review completed

- [ ] **Deployment**
  - [ ] Staging environment matches production
  - [ ] Deployment process automated and auditable
  - [ ] Rollback procedure documented and tested
  - [ ] Health checks configured
  - [ ] Monitoring dashboards set up

- [ ] **Legal & Compliance**
  - [ ] Privacy policy published
  - [ ] Terms of service in place
  - [ ] GDPR/CCPA compliance (if EU/US users)
  - [ ] Data retention policies defined
  - [ ] User consent for data collection

### Security Scanning Commands
```bash
# Check for vulnerabilities
npm audit

# Check for hardcoded secrets
npm install -g detect-secrets
detect-secrets scan

# Check dependencies for known issues
npm install -g snyk
snyk test

# OWASP dependency check
docker run --rm -v "$(pwd)":/src owasp/dependency-check:latest --project "lead-scraper" --scan /src
```

### Incident Response Plan
1. **Discovery:** Establish security incident
2. **Containment:** Isolate affected systems
3. **Investigation:** Determine scope and impact
4. **Notification:** Alert users if data exposed
5. **Recovery:** Restore systems and reset credentials
6. **Lessons:** Document and prevent recurrence

---

## 10. Additional Recommendations

### WAF (Web Application Firewall)
- Deploy behind Cloudflare or AWS WAF
- Enable DDoS protection
- Monitor for suspicious patterns

### API Versioning
```javascript
// /api/v1/leads (stable)
// /api/v2/leads (new features, backwards incompatible)
app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);
```

### Security Headers Testing
```bash
curl -I https://yourdomain.com | grep -E "Strict-Transport|X-Content-Type|CSP"
```

### Regular Security Audits
- Quarterly penetration testing
- Monthly dependency updates
- Weekly log reviews
- Annual security architecture review

---

## Quick Start: Implementing Security

### Step 1: Setup Secrets
```bash
cp .env.example .env
# Edit .env with your actual secrets
```

### Step 2: Enable Database RLS
Go to Supabase dashboard → RLS → Enable for each table

### Step 3: Install Security Packages
```bash
npm install helmet joi jsonwebtoken express-rate-limit rate-limit-redis
```

### Step 4: Apply Middleware
```javascript
import helmet from 'helmet';
import { apiLimiter, requireAuth } from './middleware/index.js';

app.use(helmet());
app.use(apiLimiter);

// Protected routes
app.use('/api/protected', requireAuth, routes);
```

### Step 5: Run Pre-Production Checklist
Go through the checklist section above before deploying.

---

**Last Updated:** 2024
**Status:** Production-Ready
