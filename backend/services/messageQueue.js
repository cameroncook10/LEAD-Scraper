import { supabase } from '../server.js';
import { emailService } from './emailService.js';
import { smsService } from './smsService.js';

/**
 * Message Queue Service
 * Handles asynchronous queuing and processing of messages
 */

const messageQueue = [];
let isProcessing = false;

/**
 * Enqueue email campaign delivery
 */
export const enqueueEmailCampaign = async ({
  campaignId,
  deliveryId,
  leadId,
  templateId,
  scheduleTime
}) => {
  return new Promise((resolve, reject) => {
    messageQueue.push({
      type: 'email',
      campaignId,
      deliveryId,
      leadId,
      templateId,
      scheduleTime,
      createdAt: new Date(),
      retries: 0,
      maxRetries: 3
    });

    processQueue().catch(reject);
    resolve();
  });
};

/**
 * Enqueue SMS/WhatsApp campaign delivery
 */
export const enqueueSMSCampaign = async ({
  campaignId,
  deliveryId,
  leadId,
  templateId,
  messageType,
  scheduleTime
}) => {
  return new Promise((resolve, reject) => {
    messageQueue.push({
      type: 'sms',
      messageType, // 'sms' or 'whatsapp'
      campaignId,
      deliveryId,
      leadId,
      templateId,
      scheduleTime,
      createdAt: new Date(),
      retries: 0,
      maxRetries: 3
    });

    processQueue().catch(reject);
    resolve();
  });
};

/**
 * Process message queue
 */
export const processQueue = async () => {
  if (isProcessing || messageQueue.length === 0) {
    return;
  }

  isProcessing = true;

  try {
    while (messageQueue.length > 0) {
      const message = messageQueue[0];

      // Check if message should be sent now
      if (message.scheduleTime && new Date(message.scheduleTime) > new Date()) {
        // Not yet time to send
        messageQueue.shift();
        messageQueue.push(message); // Re-queue at the end
        continue;
      }

      try {
        if (message.type === 'email') {
          await processEmailMessage(message);
        } else if (message.type === 'sms') {
          await processSMSMessage(message);
        }

        messageQueue.shift(); // Remove from queue on success
      } catch (error) {
        console.error(`Error processing message ${message.deliveryId}:`, error);

        message.retries++;
        if (message.retries >= message.maxRetries) {
          // Move to failed
          await updateDeliveryStatus(message.deliveryId, 'failed', error.message);
          messageQueue.shift();
        } else {
          // Re-queue for retry
          messageQueue.shift();
          message.nextRetry = new Date(Date.now() + 5 * 60 * 1000); // 5 min retry
          messageQueue.push(message);
        }
      }

      // Process one message at a time with rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } finally {
    isProcessing = false;
  }
};

/**
 * Process email message
 */
const processEmailMessage = async (message) => {
  const { campaignId, deliveryId, leadId, templateId } = message;

  // Get lead email
  const { data: lead } = await supabase
    .from('leads')
    .select('name, email, company, title, quality_score, data')
    .eq('id', leadId)
    .single();

  if (!lead?.email) {
    throw new Error('No email found for lead');
  }

  // Get template
  const { data: template } = await supabase
    .from('message_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (!template) {
    throw new Error('Template not found');
  }

  // Prepare email content
  const emailData = {
    name: lead.name,
    email: lead.email,
    company: lead.company,
    title: lead.title,
    ...(lead.data || {})
  };

  let subject = template.subject || 'Message from LeadScraper';
  let body = template.body;

  // Replace variables
  template.variables?.forEach(variable => {
    const placeholder = new RegExp(`{{${variable}}}`, 'g');
    const value = emailData[variable] || '';
    subject = subject.replace(placeholder, value);
    body = body.replace(placeholder, value);
  });

  // Add unsubscribe link
  const unsubscribeLink = `${process.env.FRONTEND_URL}/unsubscribe?delivery=${deliveryId}`;
  body += `\n\n<a href="${unsubscribeLink}">Unsubscribe</a>`;

  // Send email
  const result = await emailService.sendEmail({
    to: lead.email,
    subject,
    html: body,
    headers: {
      'X-Campaign-ID': campaignId,
      'X-Delivery-ID': deliveryId,
      'X-Lead-ID': leadId
    }
  });

  // Update delivery status
  await updateDeliveryStatus(deliveryId, 'sent', null, {
    email_message_id: result.messageId
  });

  console.log(`✓ Email sent to ${lead.email} (delivery: ${deliveryId})`);
};

/**
 * Process SMS/WhatsApp message
 */
const processSMSMessage = async (message) => {
  const { campaignId, deliveryId, leadId, templateId, messageType } = message;

  // Get lead phone
  const { data: lead } = await supabase
    .from('leads')
    .select('name, phone, company, title, quality_score, data')
    .eq('id', leadId)
    .single();

  if (!lead?.phone) {
    throw new Error('No phone number found for lead');
  }

  // Get template
  const { data: template } = await supabase
    .from('message_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (!template) {
    throw new Error('Template not found');
  }

  // Prepare message content
  const messageData = {
    name: lead.name,
    company: lead.company,
    title: lead.title,
    ...(lead.data || {})
  };

  let messageBody = template.body;

  // Replace variables
  template.variables?.forEach(variable => {
    const placeholder = new RegExp(`{{${variable}}}`, 'g');
    const value = messageData[variable] || '';
    messageBody = messageBody.replace(placeholder, value);
  });

  // Send message
  let result;
  if (messageType === 'whatsapp') {
    result = await smsService.sendWhatsApp({
      to: lead.phone,
      body: messageBody,
      trackingId: deliveryId
    });
  } else {
    result = await smsService.sendSMS({
      to: lead.phone,
      body: messageBody,
      trackingId: deliveryId
    });
  }

  // Update delivery status
  await updateDeliveryStatus(deliveryId, 'sent', null, {
    sms_message_id: result.messageId
  });

  console.log(`✓ ${messageType.toUpperCase()} sent to ${lead.phone} (delivery: ${deliveryId})`);
};

/**
 * Update delivery status
 */
const updateDeliveryStatus = async (deliveryId, status, error = null, metadata = {}) => {
  const { error: updateError } = await supabase
    .from('campaign_deliveries')
    .update({
      status,
      error_message: error,
      metadata: metadata || {},
      updated_at: new Date().toISOString()
    })
    .eq('id', deliveryId);

  if (updateError) {
    console.error('Error updating delivery status:', updateError);
  }
};

/**
 * Get queue status
 */
export const getQueueStatus = () => ({
  pending: messageQueue.length,
  isProcessing,
  lastUpdated: new Date().toISOString()
});

/**
 * Start periodic queue processing
 */
export const startQueueProcessor = (intervalMs = 10000) => {
  console.log('🔄 Starting message queue processor...');
  return setInterval(processQueue, intervalMs);
};
