/**
 * Supabase Edge Function: ai-qualify
 *
 * Uses Anthropic API (Claude) to qualify leads.
 * The Anthropic API key is stored as a Supabase secret.
 *
 * Deploy:
 *   supabase functions deploy ai-qualify
 *   supabase secrets set ANTHROPIC_API_KEY=your-key-here
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_CATEGORIES = ['hot', 'warm', 'cold', 'invalid'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return jsonResponse({ error: 'ANTHROPIC_API_KEY not set. Run: supabase secrets set ANTHROPIC_API_KEY=your-key' }, 500);
    }

    let leadData: Record<string, unknown>;
    try {
      leadData = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    if (!leadData || typeof leadData !== 'object') {
      return jsonResponse({ error: 'Request body must be a JSON object' }, 400);
    }

    // Extract only relevant fields for qualification (no raw HTML/data blobs)
    const leadSummary: Record<string, unknown> = {};
    const relevantFields = [
      'name', 'business_type', 'phone', 'email', 'website',
      'address', 'source', 'industry', 'rating', 'review_count',
    ];
    for (const field of relevantFields) {
      if (leadData[field] !== undefined && leadData[field] !== null && leadData[field] !== '') {
        leadSummary[field] = leadData[field];
      }
    }

    const prompt = `You are a B2B lead qualification expert for a service-business outreach platform. Analyze this lead and determine its quality for sales outreach.

Lead Data:
${JSON.stringify(leadSummary, null, 2)}

QUALIFICATION CRITERIA:
- A "hot" lead (80-100) has: a clear business name, a reachable contact method (phone OR email OR website), and is a service-based business (HVAC, plumbing, roofing, landscaping, dental, legal, home services, contractors, restaurants, retail, etc.)
- A "warm" lead (50-79) has: a business name and SOME contact info, but may be missing key details or the business type is unclear
- A "cold" lead (20-49) has: minimal info — maybe just a name or address, no clear way to reach them
- An "invalid" lead (0-19) is: not a real business, spam, duplicate placeholder text, or has no useful data at all

IMPORTANT NOTES:
- Missing email alone does NOT make a lead cold — many businesses don't list email publicly but have phone/website
- Google Maps leads often lack email — that's normal and should not heavily penalize the score
- A business with a phone number and address is very reachable even without email
- Rating and review count indicate an established business (bonus points)
- If the business type/industry is clearly identifiable, that's a strong positive signal

CONFIDENCE SCALE:
- 0.8-1.0: Enough data to make a reliable assessment
- 0.5-0.8: Some uncertainty, missing a few fields
- 0.2-0.5: Significant data gaps, best guess
- 0.0-0.2: Almost no useful data

Respond with ONLY this JSON (no markdown, no explanation outside the JSON):
{
  "score": <number 0-100>,
  "category": "<hot|warm|cold|invalid>",
  "confidence": <number 0.0-1.0>,
  "reasoning": "<one sentence explaining the score>"
}`;

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        }),
        signal: controller.signal
      });
    } catch (err: unknown) {
      clearTimeout(timeout);
      const errorName = err instanceof Error ? err.name : 'Unknown';
      if (errorName === 'AbortError') {
        return jsonResponse({ error: 'Anthropic API request timed out (30s)' }, 504);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${data.error?.message || response.statusText}`);
    }

    const responseText = data.content?.[0]?.text || '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate and sanitize the response
    const score = typeof result.score === 'number' && !isNaN(result.score)
      ? Math.min(100, Math.max(0, Math.round(result.score)))
      : 0;

    const category = VALID_CATEGORIES.includes(result.category)
      ? result.category
      : score >= 80 ? 'hot' : score >= 50 ? 'warm' : score >= 20 ? 'cold' : 'invalid';

    const confidence = typeof result.confidence === 'number' && !isNaN(result.confidence)
      ? Math.min(1, Math.max(0, result.confidence))
      : 0.5;

    const reasoning = typeof result.reasoning === 'string'
      ? result.reasoning.substring(0, 500)
      : '';

    return jsonResponse({
      ai_score: score,
      ai_category: category,
      ai_confidence: confidence,
      reasoning,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
