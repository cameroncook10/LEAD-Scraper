/**
 * Supabase Edge Function: manage-api-keys
 * 
 * Securely stores and retrieves third-party API keys
 * (Instagram, Facebook, OpenAI, etc.) in Supabase.
 * 
 * Deploy: supabase functions deploy manage-api-keys
 * 
 * Endpoints (via POST body action):
 *   { action: 'store', provider: 'instagram', key: 'abc...' }
 *   { action: 'list' }
 *   { action: 'delete', provider: 'instagram' }
 */
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with the user's JWT
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, provider, key } = await req.json();

    switch (action) {
      case 'store': {
        if (!provider || !key) {
          return jsonResponse({ error: 'provider and key are required' }, 400);
        }

        // Upsert into api_keys table
        const { error } = await supabase
          .from('api_keys')
          .upsert({
            user_id: user.id,
            provider,
            encrypted_key: key, // In production, encrypt with Vault
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,provider' });

        if (error) throw error;

        return jsonResponse({ success: true, message: `${provider} key stored` });
      }

      case 'list': {
        const { data, error } = await supabase
          .from('api_keys')
          .select('provider, created_at, updated_at')
          .eq('user_id', user.id);

        if (error) throw error;

        return jsonResponse({
          keys: (data || []).map(k => ({
            provider: k.provider,
            configured: true,
            updatedAt: k.updated_at,
          })),
        });
      }

      case 'delete': {
        if (!provider) {
          return jsonResponse({ error: 'provider is required' }, 400);
        }

        const { error } = await supabase
          .from('api_keys')
          .delete()
          .eq('user_id', user.id)
          .eq('provider', provider);

        if (error) throw error;

        return jsonResponse({ success: true, message: `${provider} key deleted` });
      }

      default:
        return jsonResponse({ error: 'Invalid action. Use: store, list, delete' }, 400);
    }
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
});

function jsonResponse(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}
