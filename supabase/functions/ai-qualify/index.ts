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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return jsonResponse({ error: 'ANTHROPIC_API_KEY not set. Run: supabase secrets set ANTHROPIC_API_KEY=your-key' }, 500);
    }

    const leadData = await req.json();

    const prompt = `You are a lead qualification expert. Analyze this lead data and provide a structured JSON response.

Lead Data:
${JSON.stringify(leadData, null, 2)}

Provide your analysis in this exact JSON format (no markdown, just JSON):
{
  "score": <number 0-100>,
  "category": "<string: 'hot', 'warm', 'cold', 'invalid'>",
  "confidence": <number 0-1>,
  "reasoning": "<brief explanation of score>"
}

Score: 80-100 = hot lead, 50-79 = warm lead, 20-49 = cold lead, 0-19 = invalid
Category: Determine if this is a qualified business lead based on available information
Confidence: How confident you are in this assessment (0-1 scale)`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${data.error?.message || response.statusText}`);
    }

    const responseText = data.content?.[0]?.text || '';
    
    // Extract JSON from response
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const result = JSON.parse(jsonMatch[0]);

    return jsonResponse({
      ai_score: Math.min(100, Math.max(0, result.score || 0)),
      ai_category: result.category || 'cold',
      ai_confidence: Math.min(1, Math.max(0, result.confidence || 0)),
      reasoning: result.reasoning || ''
    });

  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
});

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
