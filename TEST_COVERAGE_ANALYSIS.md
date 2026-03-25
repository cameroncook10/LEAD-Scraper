# Test Coverage Analysis — AgentLead

## Current State: 0% Coverage

The codebase has **zero test files**, **no test frameworks installed**, and **no test configuration** across all four platforms (backend, frontend, mobile, desktop). The root `package.json` test script is a placeholder.

---

## Priority 1: Critical Backend Logic (High Risk, High Value)

These modules handle money, security, and core business logic. Bugs here directly impact users and revenue.

### 1. `backend/utils/encryption.js`
- **Why:** Handles AES-256-GCM encryption of PII (email, phone, address). A bug here means data leaks or corrupted data that can't be decrypted.
- **Tests needed:**
  - `encrypt()` → `decrypt()` round-trip produces original plaintext
  - Non-string/null/empty inputs return unchanged
  - Unencrypted strings pass through `decrypt()` unchanged (no `enc:` prefix)
  - `encryptLeadFields()` encrypts only sensitive fields, leaves others intact
  - `decryptLeadFields()` restores originals and strips `_hash` fields
  - `hash()` is deterministic (same input → same output)
  - Missing `ENCRYPTION_KEY` throws

### 2. `backend/middleware/validation.js`
- **Why:** Guards all API endpoints. Invalid data getting through can corrupt the database or crash services.
- **Tests needed:**
  - Each Joi schema (`login`, `register`, `createScrapeJob`, `createLead`, `updateLead`, `createEmailCampaign`, `createTemplate`) — valid input passes, invalid input returns 400
  - `validate()` middleware correctly reads from `body`, `params`, or `query`
  - `stripUnknown` removes extra fields
  - `customValidators` (phone, email, URL, domain) edge cases
  - Phone regex allows international formats

### 3. `backend/middleware/auth.js`
- **Why:** Protects every authenticated route. A bypass means unauthorized access.
- **Tests needed:**
  - Missing `Authorization` header → 401
  - Malformed token → 401
  - Expired token → 401
  - Valid token → `req.user` populated with `userId`, `email`, `metadata`
  - `optionalAuth` proceeds without error when no token provided
  - `requirePermission` rejects unauthenticated requests

### 4. `backend/services/stripe.js`
- **Why:** Handles payment checkout and portal sessions. Bugs mean lost revenue or incorrect billing.
- **Tests needed:**
  - `createCheckoutSession()` sends correct payload to edge function
  - Missing env vars throw descriptive error
  - Non-OK response from edge function throws with error message
  - `createPortalSession()` sends correct action and parameters

### 5. `backend/middleware/security.js` & `backend/middleware/rateLimiter.js`
- **Why:** Prevent abuse and attacks (XSS, injection, DDoS).
- **Tests needed:**
  - Security headers are set correctly
  - Input sanitization strips dangerous characters
  - Rate limiter blocks after threshold
  - Rate limiter allows requests under threshold

---

## Priority 2: Core Business Services (Medium-High Risk)

### 6. `backend/services/scrapeManager.js`
- **Why:** Orchestrates the entire scraping pipeline — the product's core feature.
- **Tests needed:**
  - `createScrapeJob()` inserts correct record into DB
  - `startScrapeJob()` selects the right scraper based on `source`
  - Unknown source throws descriptive error
  - Job status transitions: pending → running → completed/failed
  - Progress callback updates DB correctly
  - Failed scrape marks job as failed with error message

### 7. `backend/services/aiQualification.js`
- **Why:** AI scoring determines lead quality — directly impacts user decisions.
- **Tests needed:**
  - `qualifyLead()` returns `ai_score`, `ai_category`, `ai_confidence`, `reasoning`
  - Error from edge function returns safe defaults (`ai_score: 0`, `ai_category: 'invalid'`)
  - `batchQualifyLeads()` processes all leads and reports progress
  - `batchQualifyLeads()` continues processing after individual lead failure

### 8. `backend/services/scrapers/*.js` (googleMaps, zillow, nextdoor, webSearch)
- **Why:** Data extraction is fragile — upstream HTML changes can silently break scraping.
- **Tests needed:**
  - Each scraper parses sample HTML correctly (snapshot tests with saved HTML)
  - Graceful handling of empty results
  - Rate limiting / timeout behavior
  - Malformed HTML doesn't crash the scraper

### 9. `backend/routes/leads.js` & `backend/routes/scrape.js`
- **Why:** Primary API endpoints users interact with.
- **Tests needed:**
  - CRUD operations return correct status codes and payloads
  - Unauthorized access is rejected
  - Pagination works correctly
  - Filters and sorting work

---

## Priority 3: Communication Services (Medium Risk)

### 10. `backend/services/emailService.js` & `backend/services/smsService.js`
- **Why:** Sending messages to real people — failures or duplicates are costly.
- **Tests needed:**
  - Email sends with correct SendGrid/nodemailer parameters
  - SMS sends with correct Twilio parameters
  - Template variable substitution works
  - Error handling for invalid recipients

### 11. `backend/services/outreach.js` & `backend/workflows/autoDmWorkflow.js`
- **Why:** Automated outreach can send messages at scale — bugs amplify fast.
- **Tests needed:**
  - Campaign scheduling and execution flow
  - DM provider selection (Facebook, Instagram)
  - Deduplication — don't message the same person twice
  - Workflow state transitions

---

## Priority 4: Frontend (Lower Risk, Good for Regression)

### 12. `frontend/src/contexts/AuthContext.jsx`
- **Why:** Governs login state across the entire app.
- **Tests needed:**
  - Login/logout state changes
  - Token refresh behavior
  - Protected route redirection

### 13. `frontend/src/services/api.js`
- **Why:** All API calls flow through this module.
- **Tests needed:**
  - Auth header is attached to requests
  - Error responses are handled consistently
  - Base URL configuration

### 14. `frontend/src/components/ProtectedRoute.jsx`
- **Tests needed:**
  - Authenticated user sees children
  - Unauthenticated user is redirected

---

## Recommended Test Stack

| Platform | Framework | Why |
|----------|-----------|-----|
| Backend | **Vitest** + **supertest** | Fast, ESM-native (your backend uses ES modules), supertest for HTTP endpoint testing |
| Frontend | **Vitest** + **React Testing Library** | Vitest integrates with Vite (already used), RTL for component testing |
| Mobile | **Jest** + **React Native Testing Library** | Standard for Expo/React Native projects |
| E2E | **Playwright** | Cross-browser, can test the full user flow |

---

## Recommended Implementation Order

1. **Set up Vitest in backend** — install deps, create config, add test script
2. **Write encryption tests** — pure functions, no mocks needed, highest ROI
3. **Write validation tests** — pure Joi schemas, easy to test exhaustively
4. **Write auth middleware tests** — mock Supabase, test all auth paths
5. **Write scrapeManager tests** — mock DB and scrapers, test orchestration logic
6. **Write API route integration tests** — supertest against Express app
7. **Set up Vitest in frontend** — add React Testing Library
8. **Write AuthContext and API service tests**
9. **Add scraper snapshot tests** — saved HTML fixtures for regression
10. **Add E2E tests** — Playwright for critical user flows (login → scrape → view leads)

---

## Quick Wins (< 1 hour each)

- **Encryption round-trip tests** — 100% testable, no external deps
- **Validation schema tests** — Just Joi, no mocking needed
- **Custom validator tests** — Pure functions for phone/email/URL/domain
- **Stripe service tests** — Simple fetch mocking

These four alone would cover the most security-critical and data-integrity-critical code in the app.
