/**
 * Supabase Edge Function: ai-personalize
 * 
 * Uses Google Gemini API to personalize outreach messages.
 * The Gemini API key is stored as a Supabase secret, never exposed to the client.
 * 
 * Deploy:
 *   supabase functions deploy ai-personalize
 *   supabase secrets set GEMINI_API_KEY=your-key-here
 * 
 * Usage (from backend):
 *   POST /functions/v1/ai-personalize
 *   Body: { action: 'personalize' | 'follow-ups', template, lead, industry, tone }
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      return jsonResponse({ error: 'GEMINI_API_KEY not set. Run: supabase secrets set GEMINI_API_KEY=your-key' }, 500);
    }

    const { action, template, lead, industry, tone = 'friendly-professional' } = await req.json();

    if (action === 'personalize') {
      const prompt = `You are a sales outreach expert. Rewrite the given message template to feel personal, warm, and specific to the recipient's business. Keep it under 200 words. Never use emojis excessively. Sound human, not robotic. Match the requested tone exactly.

TEMPLATE:
${template}

RECIPIENT INFO:
- Business Name: ${lead?.name || 'Unknown'}
- Industry: ${industry || lead?.business_type || 'Service Business'}
- Location: ${lead?.address || 'Unknown'}
- Website: ${lead?.website || 'N/A'}
- AI Score: ${lead?.ai_score || 'N/A'}/100

TONE: ${tone}

Rewrite the template to feel personally written for this specific business. Reference their industry or location naturally. Keep the same CTA. Output ONLY the message body, nothing else.`;

      const result = await callGemini(geminiKey, prompt);
      return jsonResponse({ personalizedMessage: result });

    } else if (action === 'follow-ups') {
      const { originalMessage } = await req.json().catch(() => ({ originalMessage: template }));

      const prompt = `Generate 3 follow-up messages for a sales outreach that got no reply. Each should escalate slightly in urgency but remain professional.

Original message:
${originalMessage || template}

Recipient: ${lead?.name || 'Unknown'} (${industry || lead?.business_type || 'Service Business'})

Return ONLY a JSON object with this exact format:
{"followups": ["message1", "message2", "message3"]}

The 3 messages should be:
1. Casual check-in (sent after 24h)
2. Value-add (sent after 48h)  
3. Final friendly touch (sent after 72h)`;

      const result = await callGemini(geminiKey, prompt);
      
      try {
        const parsed = JSON.parse(result);
        return jsonResponse(parsed);
      } catch {
        return jsonResponse({ followups: [result] });
      }

    } else {
      return jsonResponse({ error: 'Invalid action. Use: personalize, follow-ups' }, 400);
    }
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
});

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Gemini API error: ${data.error?.message || response.statusText}`);
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
