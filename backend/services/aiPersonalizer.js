/**
 * AI Message Personalizer — Gemini via Supabase Edge Function
 * 
 * Calls the `ai-personalize` Edge Function which uses Google Gemini.
 * The Gemini API key lives in Supabase secrets, not in the backend .env.
 * 
 * Falls back to simple variable substitution if the Edge Function is unavailable.
 */
import { supabase } from '../server.js';

/**
 * Personalize a message template for a specific lead.
 */
export async function personalizeMessage({ template, lead, industry, tone = 'friendly-professional' }) {
  try {
    const { data, error } = await supabase.functions.invoke('ai-personalize', {
      body: {
        action: 'personalize',
        template,
        lead,
        industry: industry || lead?.business_type,
        tone,
      },
    });

    if (error) {
      console.warn('[Personalizer] Edge Function error, using fallback:', error.message);
      return simplePersonalize(template, lead);
    }

    if (data?.personalizedMessage) {
      console.log(`[Personalizer] Gemini personalized message for ${lead?.name}`);
      return data.personalizedMessage;
    }

    return simplePersonalize(template, lead);
  } catch (error) {
    console.warn('[Personalizer] Error calling Edge Function:', error.message);
    return simplePersonalize(template, lead);
  }
}

/**
 * Generate follow-up variants via Gemini Edge Function.
 */
export async function generateFollowUps({ originalMessage, lead, industry }) {
  try {
    const { data, error } = await supabase.functions.invoke('ai-personalize', {
      body: {
        action: 'follow-ups',
        template: originalMessage,
        lead,
        industry: industry || lead?.business_type,
      },
    });

    if (error || !data?.followups) {
      return getDefaultFollowUps(lead);
    }

    return data.followups;
  } catch (error) {
    console.warn('[Personalizer] Follow-up generation failed:', error.message);
    return getDefaultFollowUps(lead);
  }
}

/**
 * Simple variable replacement (fallback).
 */
function simplePersonalize(template, lead) {
  return template
    .replace(/{{name}}/gi, lead?.name || 'there')
    .replace(/{{firstName}}/gi, (lead?.name || 'there').split(' ')[0])
    .replace(/{{business}}/gi, lead?.name || 'your business')
    .replace(/{{company}}/gi, lead?.name || 'your company')
    .replace(/{{industry}}/gi, lead?.business_type || 'your industry')
    .replace(/{{location}}/gi, lead?.address || 'your area')
    .replace(/{{website}}/gi, lead?.website || 'your website')
    .replace(/{{email}}/gi, lead?.email || '')
    .replace(/{{phone}}/gi, lead?.phone || '');
}

function getDefaultFollowUps(lead) {
  const name = (lead?.name || 'there').split(' ')[0];
  return [
    `Hey ${name}, just circling back on my last message. Would love to chat about how we can help grow ${lead?.name || 'your business'}. Any interest?`,
    `Hi ${name}, I shared some ideas that could help with lead generation for ${lead?.business_type || 'your industry'}. Happy to jump on a quick 10-min call if you're curious.`,
    `Last follow-up, ${name} — I know you're busy. If now's not the right time, no worries at all. Just wanted to make sure you saw my first note. Best of luck!`,
  ];
}
