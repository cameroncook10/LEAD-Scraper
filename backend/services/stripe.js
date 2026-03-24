/**
 * Stripe Integration Service
 * 
 * Creates Checkout Sessions for subscription plans.
 * Handles webhook events for payment completion.
 * 
 * Setup:
 *   1. Create a Stripe account at stripe.com
 *   2. Get your test-mode keys from Dashboard → Developers → API keys
 *   3. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia'
});

// ── Pricing Plans ──
const PLANS = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_PRICE_STARTER || null,
    amount: 9700,  // $97/mo in cents
    description: '5,000 leads/mo, 500 DMs, basic AI'
  },
  growth: {
    name: 'Growth',
    priceId: process.env.STRIPE_PRICE_GROWTH || null,
    amount: 29700, // $297/mo in cents
    description: 'Unlimited leads, unlimited DMs, CRM sync'
  }
};

/**
 * Create a Stripe Checkout Session for a subscription plan.
 */
export async function createCheckoutSession(planKey, customerEmail, successUrl, cancelUrl) {
  const plan = PLANS[planKey];
  if (!plan) throw new Error(`Invalid plan: ${planKey}`);

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not configured. Add it to your .env file.');
  }

  const sessionConfig = {
    mode: 'subscription',
    success_url: successUrl || `${process.env.FRONTEND_URL}/dashboard?tab=Overview&payment=success`,
    cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/#pricing`,
    customer_email: customerEmail || undefined,
    line_items: [],
    metadata: { plan: planKey }
  };

  // If a Stripe Price ID is configured, use it. Otherwise create an ad-hoc price.
  if (plan.priceId) {
    sessionConfig.line_items.push({ price: plan.priceId, quantity: 1 });
  } else {
    sessionConfig.line_items.push({
      price_data: {
        currency: 'usd',
        recurring: { interval: 'month' },
        product_data: { name: `Agent Lead ${plan.name}`, description: plan.description },
        unit_amount: plan.amount
      },
      quantity: 1
    });
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);
  return { sessionId: session.id, url: session.url };
}

/**
 * Verify and parse a Stripe webhook event.
 */
export function constructWebhookEvent(rawBody, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}

/**
 * Handle successful checkout — activate subscription in your DB.
 */
export async function handleCheckoutCompleted(session, supabase) {
  const customerEmail = session.customer_email || session.customer_details?.email;
  const plan = session.metadata?.plan || 'starter';

  // Upsert subscription record in Supabase
  if (supabase && customerEmail) {
    await supabase.from('subscriptions').upsert({
      email: customerEmail,
      plan,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      status: 'active',
      created_at: new Date().toISOString()
    }, { onConflict: 'email' });
  }

  console.log(`[Stripe] Subscription activated: ${customerEmail} → ${plan}`);
  return { email: customerEmail, plan };
}

export { PLANS };
