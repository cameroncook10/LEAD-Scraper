/**
 * Stripe Service — Proxied through Supabase Edge Function
 * 
 * The STRIPE_SECRET_KEY is stored as a Supabase secret and accessed
 * only by the `stripe-checkout` edge function. This backend service
 * proxies checkout requests through that function.
 * 
 * Setup:
 *   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
 *   supabase functions deploy stripe-checkout
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

/**
 * Create a Stripe Checkout Session via Supabase Edge Function.
 * The Stripe secret key is stored in Supabase secrets — never local.
 */
export async function createCheckoutSession(plan, email, successUrl, cancelUrl) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
  }

  const res = await fetch(`${SUPABASE_URL}/functions/v1/stripe-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ plan, email, successUrl, cancelUrl }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Stripe checkout edge function failed');
  return data;
}

/**
 * Pricing plan metadata (for display purposes only — 
 * actual pricing is enforced in the edge function).
 */
export const PLANS = {
  starter: {
    name: 'Starter',
    price: '$97/mo',
    features: ['5,000 leads/mo', '500 DMs', 'Basic AI qualification'],
  },
  growth: {
    name: 'Growth',
    price: '$297/mo',
    features: ['Unlimited leads', 'Unlimited DMs', 'CRM sync', 'Priority support'],
  },
};
