/**
 * Message Queue Service
 * 
 * Processes the `message_queue` table in Supabase.
 * Handles rate limiting, retries, and delivery status tracking.
 */
import { supabase } from '../server.js';
import { emailService, renderTemplate } from './emailService.js';
import { smsService } from './smsService.js';

// Rate limits per provider (messages per hour)
const RATE_LIMITS = {
  instagram: 30,
  facebook: 200,
  email: 500,
  sms: 100,
  whatsapp: 50,
};

// Track sends per provider in current window
const sendCounts = {};
const windowStart = {};

function checkRateLimit(provider) {
  const now = Date.now();
  const limit = RATE_LIMITS[provider] || 50;
  
  if (!windowStart[provider] || now - windowStart[provider] > 3600000) {
    // Reset window
    windowStart[provider] = now;
    sendCounts[provider] = 0;
  }
  
  if (sendCounts[provider] >= limit) {
    const waitMs = 3600000 - (now - windowStart[provider]);
    return { allowed: false, waitMs, remaining: 0 };
  }
  
  return { allowed: true, waitMs: 0, remaining: limit - sendCounts[provider] };
}

function incrementSendCount(provider) {
  sendCounts[provider] = (sendCounts[provider] || 0) + 1;
}

/**
 * Enqueue an email campaign delivery
 */
export async function enqueueEmailCampaign({ campaignId, deliveryId, leadId, templateId, scheduleTime }) {
  try {
    const queueEntry = {
      delivery_id: deliveryId,
      message_type: 'email',
      retry_count: 0,
      max_retries: 3,
      next_retry_at: scheduleTime || new Date().toISOString(),
    };

    const { error } = await supabase
      .from('message_queue')
      .insert(queueEntry);

    if (error) throw error;
    
    console.log(`[Queue] Enqueued email delivery ${deliveryId} for campaign ${campaignId}`);
    return { success: true };
  } catch (error) {
    console.error('[Queue] Failed to enqueue email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Enqueue an SMS/WhatsApp campaign delivery
 */
export async function enqueueSMSCampaign({ campaignId, deliveryId, leadId, templateId, messageType, scheduleTime }) {
  try {
    const queueEntry = {
      delivery_id: deliveryId,
      message_type: messageType,
      retry_count: 0,
      max_retries: 3,
      next_retry_at: scheduleTime || new Date().toISOString(),
    };

    const { error } = await supabase
      .from('message_queue')
      .insert(queueEntry);

    if (error) throw error;
    
    console.log(`[Queue] Enqueued ${messageType} delivery ${deliveryId} for campaign ${campaignId}`);
    return { success: true };
  } catch (error) {
    console.error(`[Queue] Failed to enqueue ${messageType}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Enqueue a DM (Instagram/Facebook direct message)
 */
export async function enqueueDM({ deliveryId, provider, scheduleTime }) {
  try {
    const queueEntry = {
      delivery_id: deliveryId,
      message_type: provider, // 'instagram' or 'facebook'
      retry_count: 0,
      max_retries: 3,
      next_retry_at: scheduleTime || new Date().toISOString(),
    };

    const { error } = await supabase
      .from('message_queue')
      .insert(queueEntry);

    if (error) throw error;
    
    console.log(`[Queue] Enqueued ${provider} DM delivery ${deliveryId}`);
    return { success: true };
  } catch (error) {
    console.error(`[Queue] Failed to enqueue DM:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Process the message queue.
 * Call this on an interval (e.g., every 30 seconds).
 */
export async function processQueue() {
  if (!supabase) return;

  try {
    // Get pending messages that are ready to send
    const { data: pending, error } = await supabase
      .from('message_queue')
      .select(`
        *,
        campaign_deliveries (
          *,
          email_campaigns (*),
          leads (*)
        )
      `)
      .lte('next_retry_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('[Queue] Error fetching pending messages:', error);
      return;
    }

    if (!pending || pending.length === 0) return;

    console.log(`[Queue] Processing ${pending.length} pending messages`);

    for (const item of pending) {
      const provider = item.message_type;
      
      // Check rate limit
      const rateCheck = checkRateLimit(provider);
      if (!rateCheck.allowed) {
        console.log(`[Queue] Rate limited for ${provider}, waiting ${Math.ceil(rateCheck.waitMs / 60000)} min`);
        continue;
      }

      try {
        let sendResult;
        const delivery = item.campaign_deliveries;
        const lead = delivery?.leads;
        const campaign = delivery?.email_campaigns;
        const userId = campaign?.user_id;

        switch (provider) {
          case 'instagram': {
            const { sendInstagramDM } = await import('./dmProviders/instagram.js');
            sendResult = await sendInstagramDM(delivery, userId);
            break;
          }
          case 'facebook': {
            const { sendFacebookMessage } = await import('./dmProviders/facebook.js');
            sendResult = await sendFacebookMessage(delivery, userId);
            break;
          }
          case 'email': {
            if (!lead?.email) {
              sendResult = { success: false, error: 'Lead has no email address' };
              break;
            }
            try {
              // Get template body or use personalized message
              let htmlBody = delivery?.metadata?.personalizedMessage || campaign?.body || '';
              htmlBody = renderTemplate(htmlBody, {
                name: lead.name || 'there',
                business: lead.name || 'your business',
                industry: lead.business_type || 'your industry',
                location: lead.address || 'your area',
              });
              const result = await emailService.sendEmail({
                to: lead.email,
                subject: campaign?.subject || campaign?.name || 'Hello',
                html: htmlBody,
                text: htmlBody.replace(/<[^>]*>/g, ''),
              });
              sendResult = { success: true, messageId: result.messageId };
            } catch (emailErr) {
              sendResult = { success: false, error: emailErr.message };
            }
            break;
          }
          case 'sms': {
            if (!lead?.phone) {
              sendResult = { success: false, error: 'Lead has no phone number' };
              break;
            }
            try {
              let body = delivery?.metadata?.personalizedMessage || campaign?.body || '';
              body = renderTemplate(body, {
                name: lead.name || 'there',
                business: lead.name || 'your business',
              });
              const result = await smsService.sendSMS({
                to: lead.phone,
                body,
                trackingId: item.delivery_id,
              });
              sendResult = { success: true, messageId: result.messageId };
            } catch (smsErr) {
              sendResult = { success: false, error: smsErr.message };
            }
            break;
          }
          case 'whatsapp': {
            if (!lead?.phone) {
              sendResult = { success: false, error: 'Lead has no phone number' };
              break;
            }
            try {
              let body = delivery?.metadata?.personalizedMessage || campaign?.body || '';
              body = renderTemplate(body, {
                name: lead.name || 'there',
                business: lead.name || 'your business',
              });
              const result = await smsService.sendWhatsApp({
                to: lead.phone,
                body,
                trackingId: item.delivery_id,
              });
              sendResult = { success: true, messageId: result.messageId };
            } catch (waErr) {
              sendResult = { success: false, error: waErr.message };
            }
            break;
          }
          default:
            sendResult = { success: false, error: `Unknown provider: ${provider}` };
        }

        if (sendResult.success) {
          incrementSendCount(provider);
          
          // Update delivery status
          const messageIdField = provider === 'email' ? 'email_message_id' : 'sms_message_id';
          await supabase
            .from('campaign_deliveries')
            .update({
              status: 'sent',
              [messageIdField]: sendResult.messageId,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.delivery_id);

          // Remove from queue
          await supabase
            .from('message_queue')
            .delete()
            .eq('id', item.id);

          console.log(`[Queue] ✓ Sent ${provider} message (delivery ${item.delivery_id})`);
        } else {
          // Handle failure — retry or mark as failed
          const newRetryCount = item.retry_count + 1;
          
          if (newRetryCount >= item.max_retries) {
            // Max retries — mark as failed
            await supabase
              .from('campaign_deliveries')
              .update({ 
                status: 'failed',
                error_message: sendResult.error,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.delivery_id);

            await supabase
              .from('message_queue')
              .delete()
              .eq('id', item.id);

            console.error(`[Queue] ✗ Failed permanently (delivery ${item.delivery_id}): ${sendResult.error}`);
          } else {
            // Exponential backoff: 1min, 4min, 9min
            const backoffMs = Math.pow(newRetryCount, 2) * 60000;
            const nextRetry = new Date(Date.now() + backoffMs).toISOString();
            
            await supabase
              .from('message_queue')
              .update({
                retry_count: newRetryCount,
                next_retry_at: nextRetry,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.id);

            console.log(`[Queue] ↻ Retry ${newRetryCount}/${item.max_retries} for delivery ${item.delivery_id} at ${nextRetry}`);
          }
        }
      } catch (sendError) {
        console.error(`[Queue] Error processing item ${item.id}:`, sendError);
      }
    }
  } catch (error) {
    console.error('[Queue] Process error:', error);
  }
}

/**
 * Start the queue processor on an interval.
 */
let processorInterval = null;

export function startQueueProcessor(intervalMs = 30000) {
  if (processorInterval) {
    console.warn('[Queue] Processor already running');
    return;
  }
  
  console.log(`[Queue] Starting processor (every ${intervalMs / 1000}s)`);
  processorInterval = setInterval(processQueue, intervalMs);
  
  // Run immediately on start
  processQueue();
}

export function stopQueueProcessor() {
  if (processorInterval) {
    clearInterval(processorInterval);
    processorInterval = null;
    console.log('[Queue] Processor stopped');
  }
}
