/**
 * Auto-DM Workflow Orchestrator
 * 
 * The main brain that ties leads → qualification → personalization → sending → follow-ups.
 * 
 * Workflow:
 * 1. New lead with ai_score ≥ 70 triggers the pipeline
 * 2. Template is selected based on industry
 * 3. Message is personalized via AI
 * 4. Delivery record is created
 * 5. Message is queued for sending (respects rate limits)
 * 6. Follow-up sequence is scheduled if no reply in 24/48/72h
 */
import { supabase } from '../server.js';
import { personalizeMessage, generateFollowUps } from '../services/aiPersonalizer.js';
import { enqueueDM } from '../services/messageQueue.js';

// Follow-up cadence in hours
const FOLLOW_UP_CADENCE = [24, 48, 72];

// Default templates per industry (used if no custom template exists)
const INDUSTRY_TEMPLATES = {
  hvac: `Hey {{firstName}}, I noticed {{business}} in {{location}}. Helping HVAC companies book 20+ jobs/month through automated outreach. Interested in a quick demo?`,
  roofing: `Hi {{firstName}}, do you get enough roofing leads in {{location}}? We help contractors like {{business}} fill their pipeline on autopilot. Want to see how?`,
  plumbing: `Hey {{firstName}}, {{business}} caught my eye. We help plumbers in {{location}} get 3x more service calls. Quick question — is lead gen a bottleneck for you right now?`,
  landscaping: `Hi {{firstName}}, spring's coming! Is {{business}} booked up? We help landscapers in {{location}} fill their calendar year-round. Want to learn more?`,
  dental: `Hey {{firstName}}, does {{business}} need more new patients? We help dental practices in {{location}} get 30+ new patient leads per month. Interested?`,
  legal: `Hi {{firstName}}, is {{business}} looking for more qualified case leads in {{location}}? We help law firms automate client acquisition. Worth a chat?`,
  default: `Hey {{firstName}}, I came across {{business}} and was impressed. We help service businesses like yours in {{location}} get more qualified leads on autopilot. Interested in learning how?`,
};

/**
 * Process a newly scraped/qualified lead through the Auto-DM pipeline.
 * 
 * @param {Object} lead - Lead object from Supabase
 * @param {Object} options
 * @param {string} options.provider - 'instagram' | 'facebook' (default: 'instagram')
 * @param {string} options.templateOverride - Custom template to use instead of industry default
 * @param {number} options.minScore - Minimum AI score to proceed (default: 70)
 */
export async function processLeadForAutoDM(lead, options = {}) {
  const { 
    provider = 'instagram', 
    templateOverride = null,
    minScore = 70 
  } = options;

  try {
    // 1. Check qualification
    if ((lead.ai_score || 0) < minScore) {
      console.log(`[Workflow] Lead ${lead.name} score ${lead.ai_score} < ${minScore}, skipping`);
      return { skipped: true, reason: 'Below score threshold' };
    }

    // 2. Check if we already DM'd this lead
    const { data: existing } = await supabase
      .from('campaign_deliveries')
      .select('id')
      .eq('lead_id', lead.id)
      .in('status', ['sent', 'delivered', 'pending', 'sending'])
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`[Workflow] Lead ${lead.name} already has active delivery, skipping`);
      return { skipped: true, reason: 'Already contacted' };
    }

    // 3. Select template
    const industry = (lead.business_type || 'default').toLowerCase().replace(/\s+/g, '_');
    const templateBody = templateOverride || INDUSTRY_TEMPLATES[industry] || INDUSTRY_TEMPLATES.default;

    // 4. Personalize with AI
    const personalizedMessage = await personalizeMessage({
      template: templateBody,
      lead,
      industry: lead.business_type,
      tone: 'friendly-professional',
    });

    // 5. Create or find a campaign for auto-DMs today
    const todayCampaignName = `Auto-DM ${new Date().toISOString().split('T')[0]}`;
    
    let campaign;
    const { data: existingCampaign } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('name', todayCampaignName)
      .eq('type', provider)
      .single();

    if (existingCampaign) {
      campaign = existingCampaign;
    } else {
      // Create today's auto-DM campaign
      const { data: newCampaign, error } = await supabase
        .from('email_campaigns')
        .insert({
          name: todayCampaignName,
          type: provider,
          template_id: 1, // Default template
          status: 'sent',
          quality_threshold: minScore / 100,
        })
        .select()
        .single();

      if (error) {
        console.error('[Workflow] Failed to create campaign:', error);
        return { success: false, error: error.message };
      }
      campaign = newCampaign;
    }

    // 6. Create delivery record
    const { data: delivery, error: deliveryError } = await supabase
      .from('campaign_deliveries')
      .insert({
        campaign_id: campaign.id,
        lead_id: lead.id,
        status: 'pending',
        metadata: { personalizedMessage, provider, industry },
      })
      .select()
      .single();

    if (deliveryError) {
      console.error('[Workflow] Failed to create delivery:', deliveryError);
      return { success: false, error: deliveryError.message };
    }

    // 7. Queue for sending
    await enqueueDM({ deliveryId: delivery.id, provider });

    // 8. Schedule follow-ups
    await scheduleFollowUps({
      lead,
      campaign,
      originalMessage: personalizedMessage,
      provider,
    });

    console.log(`[Workflow] ✓ Queued ${provider} DM for ${lead.name} (score: ${lead.ai_score})`);
    
    return { 
      success: true, 
      deliveryId: delivery.id,
      campaignId: campaign.id,
      message: personalizedMessage,
    };
  } catch (error) {
    console.error('[Workflow] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Schedule follow-up messages at 24h, 48h, 72h intervals.
 */
async function scheduleFollowUps({ lead, campaign, originalMessage, provider }) {
  try {
    const followUpTexts = await generateFollowUps({
      originalMessage,
      lead,
      industry: lead.business_type,
    });

    for (let i = 0; i < Math.min(followUpTexts.length, FOLLOW_UP_CADENCE.length); i++) {
      const scheduleTime = new Date(Date.now() + FOLLOW_UP_CADENCE[i] * 3600000).toISOString();

      const { data: delivery, error } = await supabase
        .from('campaign_deliveries')
        .insert({
          campaign_id: campaign.id,
          lead_id: lead.id,
          status: 'pending',
          metadata: { 
            personalizedMessage: followUpTexts[i],
            provider,
            isFollowUp: true,
            followUpNumber: i + 1,
          },
        })
        .select()
        .single();

      if (!error && delivery) {
        await enqueueDM({ 
          deliveryId: delivery.id, 
          provider,
          scheduleTime,
        });
      }
    }

    console.log(`[Workflow] Scheduled ${FOLLOW_UP_CADENCE.length} follow-ups for ${lead.name}`);
  } catch (error) {
    console.error('[Workflow] Follow-up scheduling failed:', error);
  }
}

/**
 * Batch process all uncontacted high-score leads.
 * Call this manually or on a cron schedule.
 */
export async function batchProcessLeads(options = {}) {
  const { provider = 'instagram', minScore = 70, limit = 50 } = options;

  try {
    // Get qualified leads that haven't been contacted
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .gte('ai_score', minScore)
      .order('ai_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!leads || leads.length === 0) {
      console.log('[Workflow] No uncontacted leads above threshold');
      return { processed: 0 };
    }

    let processed = 0;
    let skipped = 0;

    for (const lead of leads) {
      const result = await processLeadForAutoDM(lead, { provider, minScore });
      if (result.success) processed++;
      else if (result.skipped) skipped++;
    }

    console.log(`[Workflow] Batch complete: ${processed} queued, ${skipped} skipped`);
    return { processed, skipped, total: leads.length };
  } catch (error) {
    console.error('[Workflow] Batch processing error:', error);
    return { processed: 0, error: error.message };
  }
}
