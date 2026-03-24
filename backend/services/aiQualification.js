import { createClient } from '@supabase/supabase-js';

let _supabase;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  }
  return _supabase;
}

export const qualifyLead = async (leadData) => {
  try {
    const { data, error } = await getSupabase().functions.invoke('ai-qualify', {
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
