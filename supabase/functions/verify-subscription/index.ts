import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, userId } = await req.json();

    if (!email) {
      return jsonResponse({ error: 'email is required' }, 400);
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return jsonResponse({ error: 'Stripe not configured' }, 500);
    }

    // Look up Stripe customer by email
    const customerRes = await fetch(
      `https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=1`,
      {
        headers: { Authorization: `Bearer ${stripeKey}` },
      }
    );
    const customers = await customerRes.json();

    if (!customers.data?.length) {
      return jsonResponse({ active: false, reason: 'no_customer' });
    }

    const customerId = customers.data[0].id;

    // Check for active subscriptions
    const activeRes = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=active&limit=1`,
      {
        headers: { Authorization: `Bearer ${stripeKey}` },
      }
    );
    const activeSubs = await activeRes.json();

    // Check for trialing subscriptions
    const trialRes = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=trialing&limit=1`,
      {
        headers: { Authorization: `Bearer ${stripeKey}` },
      }
    );
    const trialSubs = await trialRes.json();

    const sub = activeSubs.data?.[0] || trialSubs.data?.[0];
    const hasActive = !!sub;

    return jsonResponse({
      active: hasActive,
      plan: sub?.metadata?.plan || null,
      status: sub?.status || null,
      currentPeriodEnd: sub?.current_period_end || null,
    });
  } catch (err) {
    console.error('verify-subscription error:', err);
    return jsonResponse({ error: err.message || 'Internal error' }, 500);
  }
});
