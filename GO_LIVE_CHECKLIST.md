# 🚀 Go-Live Checklist — LEAD-Scraper / AgentLead

This is the single source of truth for taking the app to production. The code
builds, boots, and the core flows are wired. What remains is **(A)** accounts &
secrets only you can create, **(B)** one product decision about the checkout
flow, and **(C)** deploy. Work top to bottom.

Last reviewed: 2026-05-31. Everything in "Already done in code" below is committed.

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

---

## A. Accounts & secrets (only you can do these)

Create these accounts and collect the keys. Put backend keys in your host's env
(see §C), frontend `VITE_*` keys in Vercel.

### 1. Supabase (database + auth)
- [ ] Create a project at supabase.com → **Settings → API** copy:
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - For the frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] **Auth → Providers → Google**: enable Google OAuth (login is Google-based).
      Add your production domain to **Auth → URL Configuration → Redirect URLs**
      (`https://yourdomain.com/dashboard`).
- [ ] **Run the database migrations** (see §B).

### 2. Stripe (billing)
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

## D. ⚠️ One product decision: the checkout / signup flow

There are **two checkout paths** in the codebase and you should pick one:

- **Path 1 — Supabase edge function (currently wired to the landing page).**
  `PricingSection` / `SplineHeroSection` call the edge function anonymously and
  collect the email at Stripe. **Gap:** if the buyer doesn't already have a
  Supabase account with that exact email, the webhook can't link the
  subscription to a user (`resolveUserId` returns null). Works only if buyers
  sign up first, or sign up later with the same email.

- **Path 2 — backend `/api/stripe/create-checkout` (requires login).**
  Uses the authenticated user's email, so account linking is guaranteed. Already
  implemented (`backend/routes/stripe.js`) and exposed via `api.js`
  `createStripeCheckout()`, but the landing-page buttons don't call it yet.

**Recommended:** signup-first. Make the landing "Get Started"/pricing buttons
route anonymous users to `/login` (Google sign-in), then run checkout through the
authenticated backend endpoint. This makes subscription→user linking reliable and
lets you retire the edge function. This is a ~1 file change in `PricingSection.tsx`
+ `SplineHeroSection.tsx` — tell me which path you want and I'll wire it.

(If you keep Path 1, the annual-price fix above means pricing is now correct, but
you must accept the email-matching limitation.)

---

## E. Known partial features (non-blocking)

- **Settings → social account connections** (`frontend/src/pages/SettingsPage.jsx`)
  calls backend routes that don't exist yet (`/connections`, `/disconnect/:provider`);
  the backend exposes `/api/auth/status` and `/api/auth/<provider>/connect`
  instead. The Instagram/Facebook **scraping/DM** features work; this *settings UI*
  for managing OAuth connections needs the routes aligned + a real Meta app. Say
  the word and I'll finish it.
- **`.github/workflows/build-desktop.yml`** references a `desktop/` directory that
  doesn't exist (the project ships a `mobile/` Expo app instead). It only runs on
  `v*` tags, so it's harmless until you cut a tagged release — delete it or point
  it at `mobile/` before tagging.
- **Trial-ending reminder email** is logged but not sent (`stripe-webhooks.js`
  `handleTrialWillEnd`) — wire it to your email provider when ready.

---

## F. Pre-launch smoke test

1. [ ] `npm run install:all` then `npm run dev` — landing + dashboard load locally.
2. [ ] Sign in with Google (against the real Supabase project).
3. [ ] Run a scrape → leads appear → AI scores populate.
4. [ ] Stripe **test mode**: complete a checkout → webhook fires → a row appears in
       `subscriptions` with the correct `plan` → the paywall lifts for that user.
5. [ ] Hit `https://<backend>/health` → `status: ok` with supabase `connected`.
6. [ ] Flip Stripe + keys to live, redeploy, repeat step 4 once with a real card.
