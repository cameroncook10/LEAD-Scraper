/**
 * Stripe Service — calls Stripe API directly using STRIPE_SECRET_KEY
 *
 * Plans and pricing are defined here server-side only.
 * The frontend never sees the secret key.
 */

import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key, { apiVersion: '2023-10-16' });
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://agentlead.co';

const PLANS = {
  starter: {
    name: 'Agent Lead Starter',
    amount: 49700,   // $497/mo in cents
    description: '5,000 leads/mo, 500 DMs, AI qualification, basic analytics',
    interval: 'month',
  },
  growth: {
    name: 'Agent Lead Growth',
    amount: 200000,  // $2,000/mo in cents
    description: 'Unlimited leads, unlimited DMs, CRM sync, priority support',
    interval: 'month',
  },
  starter_annual: {
    name: 'Agent Lead Starter (Annual)',
    amount: 476400,  // $397/mo × 12 billed annually
    description: '5,000 leads/mo, 500 DMs, AI qualification, basic analytics — annual billing',
    interval: 'year',
  },
  growth_annual: {
    name: 'Agent Lead Growth (Annual)',
    amount: 1920000, // $1,600/mo × 12 billed annually
    description: 'Unlimited leads, unlimited DMs, CRM sync, priority support — annual billing',
    interval: 'year',
  },
};

/**
 * Create a Stripe Checkout Session with a 3-day free trial.
 */
export async function createCheckoutSession(planKey, email) {
  const plan = PLANS[planKey];
  if (!plan) {
    throw new Error(`Invalid plan "${planKey}". Valid options: ${Object.keys(PLANS).join(', ')}`);
  }

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email || undefined,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: plan.name,
          description: plan.description,
        },
        recurring: { interval: plan.interval },
        unit_amount: plan.amount,
      },
      quantity: 1,
    }],
    subscription_data: {
      trial_period_days: 3,
      metadata: { plan: planKey },
    },
    metadata: { plan: planKey },
    payment_method_collection: 'always',
    success_url: `${FRONTEND_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${FRONTEND_URL}/#pricing`,
  });

  return { sessionId: session.id, url: session.url };
}

/**
 * Create a Stripe Customer Portal Session.
 */
export async function createPortalSession(checkoutSessionId, returnUrl) {
  const stripe = getStripe();

  // Resolve the customer from the original checkout session
  const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId);
  if (!checkoutSession.customer) {
    throw new Error('No customer found for this session');
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: checkoutSession.customer,
    return_url: returnUrl || `${FRONTEND_URL}/dashboard`,
  });

  return { url: portal.url };
}

/**
 * Pricing plan metadata exposed to the frontend (no secret data).
 */
export const PLAN_DISPLAY = {
  starter: {
    name: 'Starter',
    monthlyPrice: '$497',
    annualPrice: '$397',
    features: ['5,000 leads/mo', '500 DMs', 'AI qualification', 'Basic analytics'],
  },
  growth: {
    name: 'Growth',
    monthlyPrice: '$2,000',
    annualPrice: '$1,600',
    features: ['Unlimited leads', 'Unlimited DMs', 'CRM sync', 'Priority support'],
  },
};

export { PLAN_DISPLAY as PLANS };
