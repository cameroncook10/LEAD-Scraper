// Use the shared Supabase client from server.js to avoid creating a second
// instance and to honour the null-when-not-configured pattern.
import { supabase as _supabase } from '../server.js';

function getSupabase() {
  return _supabase;
}

export const qualifyLead = async (leadData) => {
  const sb = getSupabase();
  if (!sb) {
    return {
      ai_score: 0,
      ai_category: 'unconfigured',
      ai_confidence: 0,
      reasoning: 'Supabase not configured',
    };
  }
  try {
    const { data, error } = await sb.functions.invoke('ai-qualify', {
      body: leadData
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    return {
      ai_score: data.ai_score,
      ai_category: data.ai_category,
      ai_confidence: data.ai_confidence,
      reasoning: data.reasoning
    };
  } catch (error) {
    console.error('AI qualification error:', error);
    return {
      ai_score: 0,
      ai_category: 'invalid',
      ai_confidence: 0,
      reasoning: `Error: ${error.message}`
    };
  }
};

export const batchQualifyLeads = async (leads, onProgress) => {
  const results = [];
  
  for (let i = 0; i < leads.length; i++) {
    try {
      const qualification = await qualifyLead(leads[i]);
      results.push({
        ...leads[i],
        ...qualification
      });
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: leads.length,
          percent: Math.round(((i + 1) / leads.length) * 100)
        });
      }
      
      // Add small delay to respect rate limits
      await new Promise(r => setTimeout(r, 100));
    } catch (error) {
      console.error(`Error qualifying lead ${i}:`, error);
      results.push({
        ...leads[i],
        ai_score: 0,
        ai_category: 'error',
        ai_confidence: 0
      });
    }
  }
  
  return results;
};
