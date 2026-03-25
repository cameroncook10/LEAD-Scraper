/**
 * Supabase Edge Function: stripe-checkout
 * 
 * Creates Stripe Checkout Sessions using the STRIPE_SECRET_KEY
 * stored as a Supabase secret — never exposed in client code.
 * 
 * Supports:
 * - Subscription checkout with 3-day free trial
 * - Customer portal for billing management
 * 
 * Deploy:
 *   supabase functions deploy stripe-checkout
 *   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLANS: Record<string, { name: string; amount: number; description: string }> = {
  starter: {
    name: 'Agent Lead Starter',
    amount: 49700, // $497/mo
    description: '5,000 leads/mo, 500 DMs, AI qualification, basic analytics',
  },
  growth: {
    name: 'Agent Lead Growth',
    amount: 200000, // $2,000/mo
    description: 'Unlimited leads, unlimited DMs, CRM sync, priority support',
  },
  starter_annual: {
    name: 'Agent Lead Starter (Annual)',
    amount: 39700, // $397/mo billed annually
    description: '5,000 leads/mo, 500 DMs, AI qualification, basic analytics — annual billing',
  },
  growth_annual: {
    name: 'Agent Lead Growth (Annual)',
    amount: 160000, // $1,600/mo billed annually
    description: 'Unlimited leads, unlimited DMs, CRM sync, priority support — annual billing',
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return jsonResponse({ error: 'STRIPE_SECRET_KEY not set. Run: supabase secrets set STRIPE_SECRET_KEY=sk_test_...' }, 500);
    }

    const body = await req.json();
    const { action } = body;

    // Route to different handlers
    if (action === 'create-portal-session') {
      return await handlePortalSession(stripeKey, body);
    }

    // Default: create checkout session
    return await handleCheckout(stripeKey, body);

  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});

async function handleCheckout(stripeKey: string, body: Record<string, unknown>) {
  const { plan, email, successUrl, cancelUrl } = body;

  if (!plan || !PLANS[plan as string]) {
    return jsonResponse({ error: `Invalid plan. Use: ${Object.keys(PLANS).join(', ')}` }, 400);
  }

  const planData = PLANS[plan as string];
  const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';
  const isAnnual = (plan as string).includes('annual');

  // Build form params
  const params = new URLSearchParams({
    'mode': 'subscription',
    'success_url': (successUrl as string) || `${frontendUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
    'cancel_url': (cancelUrl as string) || `${frontendUrl}/#pricing`,
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][recurring][interval]': isAnnual ? 'year' : 'month',
    'line_items[0][price_data][product_data][name]': planData.name,
    'line_items[0][price_data][product_data][description]': planData.description,
    'line_items[0][price_data][unit_amount]': planData.amount.toString(),
    'line_items[0][quantity]': '1',
    'metadata[plan]': plan as string,
    // 3-day free trial
    'subscription_data[trial_period_days]': '3',
    'subscription_data[metadata][plan]': plan as string,
    // Payment method collection — collect card upfront but don't charge until trial ends
    'payment_method_collection': 'always',
  });

  if (email) {
    params.set('customer_email', email as string);
  }

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Stripe API error: ${data.error?.message || response.statusText}`);
  }

  return jsonResponse({ sessionId: data.id, url: data.url });
}

async function handlePortalSession(stripeKey: string, body: Record<string, unknown>) {
  const { sessionId, returnUrl } = body;
  const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';

  // First get customer from checkout session
  const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: { 'Authorization': `Bearer ${stripeKey}` },
  });
  const session = await sessionRes.json();

  if (!session.customer) {
    return jsonResponse({ error: 'No customer found for this session' }, 400);
  }

  // Create portal session
  const portalRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'customer': session.customer,
      'return_url': (returnUrl as string) || `${frontendUrl}/dashboard?tab=Settings`,
    }).toString(),
  });

  const portalData = await portalRes.json();

  if (!portalRes.ok) {
    throw new Error(`Portal error: ${portalData.error?.message || portalRes.statusText}`);
  }

  return jsonResponse({ url: portalData.url });
}

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
