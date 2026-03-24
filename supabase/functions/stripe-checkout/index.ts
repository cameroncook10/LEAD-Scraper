/**
 * Supabase Edge Function: stripe-checkout
 * 
 * Creates Stripe Checkout Sessions using the STRIPE_SECRET_KEY
 * stored as a Supabase secret — never exposed in client code.
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
    amount: 9700,
    description: '5,000 leads/mo, 500 DMs, basic AI qualification',
  },
  growth: {
    name: 'Agent Lead Growth',
    amount: 29700,
    description: 'Unlimited leads, unlimited DMs, CRM sync, priority support',
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

    const { plan, email, successUrl, cancelUrl } = await req.json();

    if (!plan || !PLANS[plan]) {
      return jsonResponse({ error: `Invalid plan. Use: ${Object.keys(PLANS).join(', ')}` }, 400);
    }

    const planData = PLANS[plan];
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';

    // Call Stripe API directly (no SDK needed in Deno)
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'success_url': successUrl || `${frontendUrl}/dashboard?tab=Overview&payment=success`,
        'cancel_url': cancelUrl || `${frontendUrl}/#pricing`,
        ...(email ? { 'customer_email': email } : {}),
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][recurring][interval]': 'month',
        'line_items[0][price_data][product_data][name]': planData.name,
        'line_items[0][price_data][product_data][description]': planData.description,
        'line_items[0][price_data][unit_amount]': planData.amount.toString(),
        'line_items[0][quantity]': '1',
        'metadata[plan]': plan,
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Stripe API error: ${data.error?.message || response.statusText}`);
    }

    return jsonResponse({ sessionId: data.id, url: data.url });

  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
