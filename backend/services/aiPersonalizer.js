/**
 * AI Message Personalizer
 * 
 * Uses OpenAI to rewrite message templates with context
 * from the lead's data (name, industry, location, pain points).
 * 
 * Falls back to simple variable substitution if OpenAI is unavailable.
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Personalize a message template for a specific lead.
 * 
 * @param {Object} params
 * @param {string} params.template - The message template body
 * @param {Object} params.lead - Lead data from Supabase
 * @param {string} params.industry - Industry category
 * @param {string} params.tone - Tone of voice (default: 'friendly-professional')
 * @returns {Promise<string>} The personalized message
 */
export async function personalizeMessage({ template, lead, industry, tone = 'friendly-professional' }) {
  const openaiKey = process.env.OPENAI_API_KEY;

  // Fall back to simple variable replacement if no OpenAI key
  if (!openaiKey) {
    console.log('[Personalizer] No OpenAI key — using simple variable replacement');
    return simplePersonalize(template, lead);
  }

  try {
    const prompt = buildPrompt({ template, lead, industry, tone });

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a sales outreach expert. Rewrite the given message template to feel personal, warm, and specific to the recipient's business. Keep it under 200 words. Never use emojis excessively. Sound human, not robotic. Match the requested tone exactly.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Personalizer] OpenAI error:', data.error);
      return simplePersonalize(template, lead);
    }

    const personalizedText = data.choices?.[0]?.message?.content?.trim();
    
    if (!personalizedText) {
      return simplePersonalize(template, lead);
    }

    console.log(`[Personalizer] AI-personalized message for ${lead.name}`);
    return personalizedText;
  } catch (error) {
    console.error('[Personalizer] Error:', error.message);
    return simplePersonalize(template, lead);
  }
}

/**
 * Build the prompt for OpenAI.
 */
function buildPrompt({ template, lead, industry, tone }) {
  return `
TEMPLATE:
${template}

RECIPIENT INFO:
- Business Name: ${lead.name || 'Unknown'}
- Industry: ${industry || lead.business_type || 'Service Business'}
- Location: ${lead.address || 'Unknown'}
- Website: ${lead.website || 'N/A'}
- AI Score: ${lead.ai_score || 'N/A'}/100
${lead.raw_data?.recent_activity ? `- Recent Activity: ${lead.raw_data.recent_activity}` : ''}

TONE: ${tone}

Rewrite the template to feel personally written for this specific business. Reference their industry or location naturally. Keep the same CTA. Do NOT include a subject line — just the message body.
  `.trim();
}

/**
 * Simple variable replacement (fallback when OpenAI is unavailable).
 */
function simplePersonalize(template, lead) {
  return template
    .replace(/{{name}}/gi, lead.name || 'there')
    .replace(/{{firstName}}/gi, (lead.name || 'there').split(' ')[0])
    .replace(/{{business}}/gi, lead.name || 'your business')
    .replace(/{{company}}/gi, lead.name || 'your company')
    .replace(/{{industry}}/gi, lead.business_type || 'your industry')
    .replace(/{{location}}/gi, lead.address || 'your area')
    .replace(/{{website}}/gi, lead.website || 'your website')
    .replace(/{{email}}/gi, lead.email || '')
    .replace(/{{phone}}/gi, lead.phone || '');
}

/**
 * Generate follow-up variants based on the original message.
 * Returns 3 follow-up messages at different urgency levels.
 */
export async function generateFollowUps({ originalMessage, lead, industry }) {
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openaiKey) {
    return getDefaultFollowUps(lead);
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Generate 3 follow-up messages for a sales outreach that got no reply. Each should escalate slightly in urgency but remain professional. Return as JSON array of 3 strings.'
          },
          {
            role: 'user',
            content: `Original message:\n${originalMessage}\n\nRecipient: ${lead.name} (${industry || lead.business_type})\n\nGenerate 3 follow-ups: casual check-in (24h), value-add (48h), final touch (72h).`
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    const content = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    
    return content.followups || content.messages || getDefaultFollowUps(lead);
  } catch (error) {
    console.error('[Personalizer] Follow-up generation failed:', error.message);
    return getDefaultFollowUps(lead);
  }
}

function getDefaultFollowUps(lead) {
  const name = (lead.name || 'there').split(' ')[0];
  return [
    `Hey ${name}, just circling back on my last message. Would love to chat about how we can help grow ${lead.name || 'your business'}. Any interest?`,
    `Hi ${name}, I shared some ideas that could help with lead generation for ${lead.business_type || 'your industry'}. Happy to jump on a quick 10-min call if you're curious.`,
    `Last follow-up, ${name} — I know you're busy. If now's not the right time, no worries at all. Just wanted to make sure you saw my first note. Best of luck!`,
  ];
}
