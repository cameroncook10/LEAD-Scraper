/**
 * Stripe Webhook Handler
 *
 * Receives Stripe events, verifies the signature, and updates
 * the subscriptions / usage_tracking tables in Supabase.
 *
 * IMPORTANT: This route MUST be registered with express.raw() body
 * parsing — Stripe signature verification requires the raw request body.
 *
 * Environment variables required:
 *   STRIPE_SECRET_KEY       — sk_live_… or sk_test_…
 *   STRIPE_WEBHOOK_SECRET   — whsec_… (from Stripe Dashboard → Webhooks)
 */

import express from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// ---------------------------------------------------------------------------
// Stripe + Supabase clients (service-role so we bypass RLS for writes)
// ---------------------------------------------------------------------------
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key, { apiVersion: '2024-04-10' });
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  return createClient(url, serviceKey);
}

// ---------------------------------------------------------------------------
// Plan resolver — maps Stripe price IDs to plan names.
// Falls back to product metadata → "starter" if nothing matches.
// ---------------------------------------------------------------------------
const PRICE_TO_PLAN = {
  // Populate with real price IDs from your Stripe Dashboard, e.g.:
  // 'price_1Xyz...': 'starter',
  // 'price_1Abc...': 'growth',
};

function resolvePlan(subscription) {
  if (!subscription?.items?.data?.length) return 'starter';
  const priceId = subscription.items.data[0].price.id;
  if (PRICE_TO_PLAN[priceId]) return PRICE_TO_PLAN[priceId];

  // Fall back: check product metadata for a "plan" field
  const meta = subscription.items.data[0].price.metadata || {};
  if (meta.plan && ['starter', 'growth', 'enterprise'].includes(meta.plan)) {
    return meta.plan;
  }

  // Last resort — infer from price amount (cents)
  const amount = subscription.items.data[0].price.unit_amount || 0;
  if (amount >= 150000) return 'enterprise';
  if (amount >= 100000) return 'growth';
  return 'starter';
}

// ---------------------------------------------------------------------------
// Webhook endpoint — POST /api/webhooks/stripe
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  // ── Verify signature ────────────────────────────────────────
  let event;
  try {
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  const supabaseAdmin = getSupabaseAdmin();

  console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  // ── Route to handler ────────────────────────────────────────
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabaseAdmin, stripe, event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreatedOrUpdated(supabaseAdmin, stripe, event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionCreatedOrUpdated(supabaseAdmin, stripe, event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabaseAdmin, event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(supabaseAdmin, stripe, event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(supabaseAdmin, event.data.object);
        break;

      case 'customer.subscription.trial_will_end':
        handleTrialWillEnd(event.data.object);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error(`[Stripe Webhook] Handler error for ${event.type}:`, err);
    // Still return 200 so Stripe doesn't keep retrying on app-level bugs.
    // Change to 500 if you want Stripe to retry on transient failures.
    return res.status(200).json({ received: true, error: err.message });
  }
});

// ===================================================================
// Event handlers
// ===================================================================

/**
 * checkout.session.completed
 * A customer just finished paying — create the user↔stripe mapping
 * and ensure a subscription record exists.
 */
async function handleCheckoutCompleted(supabaseAdmin, stripe, session) {
  const customerId = session.customer;
  const subscriptionId = session.subscription;
  const email = session.customer_email || session.customer_details?.email;

  // Resolve user_id from Supabase auth by email
  const userId = await resolveUserId(supabaseAdmin, email);
  if (!userId) {
    console.error(`[checkout.session.completed] No Supabase user found for email: ${email}`);
    return;
  }

  // Upsert user ↔ stripe mapping
  const { error: mappingErr } = await supabaseAdmin
    .from('user_stripe_mapping')
    .upsert(
      { user_id: userId, stripe_customer_id: customerId, email },
      { onConflict: 'stripe_customer_id' }
    );
  if (mappingErr) {
    console.error('[checkout.session.completed] mapping upsert error:', mappingErr);
  }

  // If this checkout created a subscription, fetch full details & upsert
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await upsertSubscription(supabaseAdmin, userId, customerId, subscription);
  }

  console.log(`[checkout.session.completed] user=${userId} customer=${customerId}`);
}

/**
 * customer.subscription.created / customer.subscription.updated
 */
async function handleSubscriptionCreatedOrUpdated(supabaseAdmin, stripe, subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  const userId = await resolveUserIdByCustomer(supabaseAdmin, customerId);
  if (!userId) {
    console.error(`[subscription.updated] No user mapped to customer ${customerId}`);
    return;
  }

  await upsertSubscription(supabaseAdmin, userId, customerId, subscription);
  console.log(`[subscription.updated] sub=${subscription.id} status=${subscription.status}`);
}

/**
 * customer.subscription.deleted — mark canceled
 */
async function handleSubscriptionDeleted(supabaseAdmin, subscription) {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'canceled', cancel_at_period_end: false, updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('[subscription.deleted] update error:', error);
  }
  console.log(`[subscription.deleted] sub=${subscription.id}`);
}

/**
 * invoice.payment_succeeded — set status active, reset usage for the new period
 */
async function handleInvoicePaymentSucceeded(supabaseAdmin, stripe, invoice) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return; // one-off invoice, skip

  // Mark subscription active
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', subscriptionId);
  if (error) console.error('[invoice.payment_succeeded] update error:', error);

  // Reset usage counters for the new billing period
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer.id;
  const userId = await resolveUserIdByCustomer(supabaseAdmin, customerId);
  if (userId) {
    const periodStart = new Date(invoice.period_start * 1000).toISOString();
    const periodEnd = new Date(invoice.period_end * 1000).toISOString();

    const { error: usageErr } = await supabaseAdmin
      .from('usage_tracking')
      .insert({
        user_id: userId,
        period_start: periodStart,
        period_end: periodEnd,
        leads_scraped: 0,
        dms_sent: 0,
        emails_sent: 0,
      });
    if (usageErr) console.error('[invoice.payment_succeeded] usage insert error:', usageErr);
  }

  console.log(`[invoice.payment_succeeded] sub=${subscriptionId}`);
}

/**
 * invoice.payment_failed — mark past_due
 */
async function handleInvoicePaymentFailed(supabaseAdmin, invoice) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'past_due', updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', subscriptionId);
  if (error) console.error('[invoice.payment_failed] update error:', error);

  console.log(`[invoice.payment_failed] sub=${subscriptionId}`);
}

/**
 * customer.subscription.trial_will_end — log for now, wire email later
 */
function handleTrialWillEnd(subscription) {
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : 'unknown';
  console.log(
    `[trial_will_end] sub=${subscription.id} trial_end=${trialEnd} — TODO: send reminder email`
  );
}

// ===================================================================
// Helpers
// ===================================================================

/**
 * Upsert a subscription row keyed on stripe_subscription_id.
 */
async function upsertSubscription(supabaseAdmin, userId, customerId, subscription) {
  const plan = resolvePlan(subscription);
  const statusMap = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'unpaid',
    incomplete: 'unpaid',
    incomplete_expired: 'canceled',
    paused: 'canceled',
  };
  const status = statusMap[subscription.status] || 'unpaid';

  const row = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    plan,
    status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(row, { onConflict: 'stripe_subscription_id' });

  if (error) {
    console.error('[upsertSubscription] error:', error);
    throw error;
  }
}

/**
 * Look up a Supabase auth user by email and return their id.
 */
async function resolveUserId(supabaseAdmin, email) {
  if (!email) return null;
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error('[resolveUserId] listUsers error:', error);
    return null;
  }
  const user = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  return user?.id || null;
}

/**
 * Look up a user_id from the user_stripe_mapping table by stripe_customer_id.
 */
async function resolveUserIdByCustomer(supabaseAdmin, stripeCustomerId) {
  const { data, error } = await supabaseAdmin
    .from('user_stripe_mapping')
    .select('user_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  if (error || !data) return null;
  return data.user_id;
}

export default router;
