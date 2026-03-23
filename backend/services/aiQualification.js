import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export const qualifyLead = async (leadData) => {
  try {
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

    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseText = response.content[0].text;
    
    // Extract JSON from response (handle case where it might be wrapped in markdown)
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const result = JSON.parse(jsonMatch[0]);

    return {
      ai_score: Math.min(100, Math.max(0, result.score || 0)),
      ai_category: result.category || 'cold',
      ai_confidence: Math.min(1, Math.max(0, result.confidence || 0)),
      reasoning: result.reasoning || ''
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
