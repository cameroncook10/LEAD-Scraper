# 🚀 Go-Live Checklist — LEAD-Scraper / AgentLead

This is the single source of truth for taking the app to production. The code
builds, boots, and the core flows are wired. What remains is **(A)** accounts &
secrets only you can create, **(B)** one product decision about the checkout
flow, and **(C)** deploy. Work top to bottom.

Last reviewed: 2026-05-31. Everything in "Already done in code" below is committed.

---

## 0. Pricing model: one-time setup fee (no Stripe needed)

The landing page no longer shows monthly/annual plans — it presents a single
"Custom setup fee" offer with **Get Started** (→ sign in) and **Book a setup call**
(→ your `VITE_CONTACT_EMAIL`) CTAs. You collect the setup fee out-of-band (wire /
invoice), then grant the client access with `MANUAL_ACCESS_EMAILS` (below). The
Stripe code is dormant and can be ignored or enabled later. You can fully run the
business without ever configuring Stripe.

You don't need Stripe to go live. Right now:

- **Leave `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLISHABLE_KEY` unset.** With no
  Stripe key, the paywall is off and the landing-page plan buttons route to your
  sales email (`VITE_CONTACT_EMAIL`, default sales@agentlead.io) instead of a
  checkout.
- **Grant a client access after they wire:** add their email to
  `MANUAL_ACCESS_EMAILS` (comma-separated) in the backend env and restart. While
  Stripe is off and this list has any entry, **only** those emails (+
  `ADMIN_EMAILS`) can use the app — that's your access gate. Leave it blank to
  keep the app open to anyone who signs in.
- Everything else below (Supabase, DB migrations, deploy) still applies. Skip the
  Stripe (§A.2) and edge-function (§C) steps until you're ready to switch on
  self-serve billing — at which point set the two Stripe keys and the manual list
  becomes a comp list instead of the gate.

---

## ✅ Already done in code (this pass)

These were real bugs/blockers that are now fixed in the repo:

- **Billing tier resolution** — the Stripe webhook now reads the plan from
  subscription metadata and normalizes annual plans, instead of guessing from
  the charge amount (which misclassified Growth and all annual plans as
  "enterprise" → unlimited access for a Starter price). `backend/routes/stripe-webhooks.js`
- **Stripe customer → user lookup** — replaced unsupported Supabase admin calls
  (`listUsers({filter})` / `getUserByEmail`, which would throw) with a correct
  paginated lookup. Checkout → account linking now works. `backend/routes/stripe-webhooks.js`
- **Annual price bug in the live checkout path** — the Supabase edge function
  charged annual plans at **1/12th** the intended price ($397/yr instead of
  $397/mo billed annually). Fixed to match the backend. `supabase/functions/stripe-checkout/index.ts`
- **Auth fail-open hardening** — a misconfigured production deploy (missing
  Supabase env) used to silently grant *everyone* the local "dev user." Now the
  backend returns 503 and the frontend never enters dev-bypass in a prod build.
  `backend/middleware/auth.js`, `frontend/src/contexts/AuthContext.jsx`, `frontend/src/components/ProtectedRoute.jsx`
- **Env var name mismatch** — code reads `SUPABASE_SERVICE_ROLE_KEY` but the
  example said `SUPABASE_SERVICE_KEY`. Fixed + documented all previously-missing
  vars. `backend/.env.example`
- **SMS/WhatsApp crash path** — sending used `${BACKEND_URL}` with no fallback,
  producing a malformed callback Twilio rejects. Now omitted when unset. `backend/services/smsService.js`
- **Database setup** — added one additive, idempotent migration that creates the
  billing, messaging, queue, and preferences tables the app queries but that no
  migration created (including `notification_preferences` and `dead_letter_queue`,
  which were missing entirely). `supabase/migrations/20240102000000_billing_messaging_prefs.sql`
- **Security pass (multi-tenant isolation)** — the backend now uses the
  service-role key and **every** data query is scoped to the authenticated user.
  Fixed real cross-tenant exposures: `/api/jobs`, `/api/analytics`, `/api/webhooks`
  were unauthenticated; jobs/scrape status, lead delete, lead stats and analytics
  didn't filter by `user_id`. Added SSRF protection on customer webhook URLs
  (blocks localhost / private / cloud-metadata hosts), HMAC-signed OAuth `state`
  (prevents social-account-takeover), and hardened the leads search filter against
  PostgREST injection. `server.js`, `routes/{jobs,scrape,analytics,leads,webhooks,socialAuth}.js`
- **Deploy workflow** — `deploy.yml` used the `secrets` context in a job-level
  `if:` (invalid → the run failed at 0s on every push). Switched it to manual
  (`workflow_dispatch`) and fixed the gate; this stops the red ✗ on pushes.

---

## A. Accounts & secrets (only you can do these)

Create these accounts and collect the keys. Put backend keys in your host's env
(see §C), frontend `VITE_*` keys in Vercel.

### 1. Supabase (database + auth)
- [ ] Create a project at supabase.com → **Settings → API** copy:
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
    (**`SUPABASE_SERVICE_ROLE_KEY` is now required** — the backend uses it for all
    queries; without it, RLS makes every query return zero rows and the app looks
    empty/broken. Keep this key server-side only, never in the frontend.)
  - For the frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] **Auth → Providers → Google**: enable Google OAuth (login is Google-based).
      Add your production domain to **Auth → URL Configuration → Redirect URLs**
      (`https://yourdomain.com/dashboard`).
- [ ] **Run the database migrations** (see §B).

### 2. Stripe (billing) — DEFERRED (skip while clients pay by wire, see §0)
- [ ] `STRIPE_SECRET_KEY` (use `sk_test_…` first, then `sk_live_…`)
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` (`pk_…`) for the frontend
- [ ] Create a webhook endpoint → `https://<your-backend>/api/webhooks/stripe`,
      subscribe to: `checkout.session.completed`, `customer.subscription.created`,
      `customer.subscription.updated`, `customer.subscription.deleted`,
      `invoice.payment_succeeded`, `invoice.payment_failed`,
      `customer.subscription.trial_will_end`. Copy the signing secret →
      `STRIPE_WEBHOOK_SECRET`.
- [ ] Plans/prices are defined **in code** (`backend/services/stripe.js`), so you
      do **not** need to create Products in Stripe. Confirm the prices there match
      what you want before going live.

### 3. Anthropic (AI lead qualification)
- [ ] `ANTHROPIC_API_KEY` from console.anthropic.com.

### 4. Encryption / secrets
- [ ] `ENCRYPTION_KEY` — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] `JWT_SECRET` — any long random string.
- [ ] `ADMIN_EMAILS` — your email, comma-separated. These bypass the paywall.

### 5. Optional integrations (only if you use the feature)
- [ ] **Email**: SendGrid (`SENDGRID_API_KEY`, `EMAIL_FROM`) or SMTP vars.
- [ ] **SMS/WhatsApp**: Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`).
- [ ] **Instagram/Facebook DM connect**: Meta app (`META_APP_ID`, `META_APP_SECRET`).
- [ ] **Google Maps scraping**: `GOOGLE_PLACES_API_KEY`.

See `backend/.env.example` for the complete, now-accurate list.

---

## B. Set up the database

With the Supabase CLI (recommended), from the repo root:

```bash
supabase link --project-ref <your-project-ref>
supabase db push        # runs BOTH files in supabase/migrations/ in order
```

Or paste these two files into the Supabase **SQL Editor**, in order:
1. `supabase/migrations/20240101000000_initial_schema.sql`
2. `supabase/migrations/20240102000000_billing_messaging_prefs.sql`

> Note: `backend/db/complete-schema.sql` and `backend/db/migrations/00x_*.sql`
> are older/partial drafts kept for reference. The two `supabase/migrations`
> files above are the authoritative, complete setup — use those.

---

## C. Deploy

### Frontend → Vercel (already configured: `.github/workflows/deploy.yml`)
- [ ] Import the repo in Vercel. Set Project env vars: `VITE_API_URL`
      (your backend origin **including** `/api`, e.g. `https://api.yourdomain.com/api`),
      `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`.
- [ ] Add repo secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` for
      the CI deploy (or just deploy via the Vercel dashboard).

### Backend → a Node host (Render / Railway / Fly / a VPS)
The backend is a long-running Express server with a cron queue — it is **not**
suited to Vercel serverless. Deploy it to a host that keeps a process alive.
- [ ] Set all backend env vars from §A. Set `NODE_ENV=production`,
      `BACKEND_URL`/`APP_URL` to the backend's public https URL, and
      `ALLOWED_ORIGINS`/`FRONTEND_URL` to your Vercel domain.
- [ ] A `Dockerfile` and `docker-compose.yml` are provided if you prefer containers.
- [ ] Point the Stripe webhook (§A.2) at `https://<backend>/api/webhooks/stripe`.

### Edge function (only if you keep the public checkout — see §D)
```bash
supabase functions deploy stripe-checkout
supabase secrets set STRIPE_SECRET_KEY=sk_live_... FRONTEND_URL=https://yourdomain.com
```

---

## D. Checkout / signup flow — built but DORMANT

> Under the current setup-fee model the landing page has no paid-plan buttons, so
> this checkout path is not triggered. It remains in the code intact, so if you
> ever switch to self-serve Stripe billing you can re-enable it by adding plan
> buttons back. Everything below describes that dormant path.

This is wired. Anonymous visitors who click a paid plan are sent to `/login`,
their plan choice is stashed, and after Google sign-in `CheckoutResume` runs the
**authenticated** backend checkout (`/api/stripe/create-checkout`) — so every
subscription is created against a real user and the webhook links it reliably.

- Pricing buttons & hero CTA: `PricingSection.tsx`, `SplineHeroSection.tsx`
- Resume-after-login: `frontend/src/components/CheckoutResume.jsx` (+ `lib/checkout.js`)
- Backend checkout: `backend/routes/stripe.js` → `services/stripe.js`

Consequence for setup: the Supabase **`stripe-checkout` edge function is no longer
used** by the app. You can skip deploying it (§C "Edge function" step is optional)
or delete `supabase/functions/stripe-checkout/`. Checkout works entirely through
your backend, so the backend must be deployed and reachable for billing to work.

---

## E. Notes (non-blocking)

- **Social DM "Connect account" OAuth** (Instagram/Facebook/Google in Settings)
  is fully wired (connect/status/connections/disconnect, signed OAuth state), but
  only works once you create a Meta/Google OAuth app and set `META_APP_ID/SECRET`
  / `GOOGLE_CLIENT_ID/SECRET`. Until then, clients can paste credentials manually
  in the dashboard Settings tab (that path works with no OAuth app).
- **Calendly**: set `VITE_CALENDLY_URL` in Vercel when ready and the "Book a setup
  call" buttons point at it; until then they open a mailto.
- The legacy `frontend/src/pages/Landing.jsx` and `DownloadPage.jsx` are not routed
  (dead code) — safe to ignore or delete.

---

## F. Pre-launch smoke test

1. [ ] `npm run install:all` then `npm run dev` — landing + dashboard load locally.
2. [ ] Sign in with Google (against the real Supabase project).
3. [ ] Add your email to `MANUAL_ACCESS_EMAILS` → dashboard loads (no "Account
       being set up" screen). Remove it → you should see that screen instead.
4. [ ] Run a scrape → a job appears under your account → leads show up (AI scores
       populate only if `ANTHROPIC_API_KEY` is set; otherwise category is
       "unconfigured", which is expected).
5. [ ] Create a template + campaign; connect an outreach channel; send a test.
6. [ ] Hit `https://<backend>/health` → `status: ok` with supabase `connected`.
