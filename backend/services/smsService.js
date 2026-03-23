import twilio from 'twilio';

/**
 * SMS and WhatsApp Service
 * Uses Twilio for SMS and WhatsApp delivery
 */

const client = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const whatsappNumber = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER || fromNumber}`;

/**
 * Send SMS message
 */
export const smsService = {
  async sendSMS(options) {
    const { to, body, trackingId } = options;

    if (!to || !body) {
      throw new Error('Missing required SMS fields: to, body');
    }

    // Validate phone number format
    if (!this.isValidPhoneNumber(to)) {
      throw new Error(`Invalid phone number format: ${to}`);
    }

    try {
      const message = await client.messages.create({
        body: body.substring(0, 160), // SMS limit
        from: fromNumber,
        to: this.normalizePhoneNumber(to),
        statusCallback: `${process.env.BACKEND_URL}/api/webhooks/sms-status?tracking_id=${trackingId}`
      });

      console.log(`✓ SMS sent: ${message.sid}`);

      return {
        messageId: message.sid,
        success: true,
        provider: 'twilio',
        status: message.status
      };
    } catch (error) {
      console.error('SMS delivery failed:', error);
      throw error;
    }
  },

  async sendWhatsApp(options) {
    const { to, body, trackingId } = options;

    if (!to || !body) {
      throw new Error('Missing required WhatsApp fields: to, body');
    }

    // Validate phone number format
    if (!this.isValidPhoneNumber(to)) {
      throw new Error(`Invalid phone number format: ${to}`);
    }

    try {
      const message = await client.messages.create({
        from: whatsappNumber,
        body,
        to: `whatsapp:${this.normalizePhoneNumber(to)}`,
        statusCallback: `${process.env.BACKEND_URL}/api/webhooks/whatsapp-status?tracking_id=${trackingId}`
      });

      console.log(`✓ WhatsApp sent: ${message.sid}`);

      return {
        messageId: message.sid,
        success: true,
        provider: 'twilio-whatsapp',
        status: message.status
      };
    } catch (error) {
      console.error('WhatsApp delivery failed:', error);
      throw error;
    }
  },

  async getMessageStatus(messageSid) {
    try {
      const message = await client.messages(messageSid).fetch();
      return {
        sid: message.sid,
        status: message.status,
        sentAt: message.dateCreated,
        price: message.price,
        direction: message.direction
      };
    } catch (error) {
      console.error('Failed to fetch message status:', error);
      throw error;
    }
  },

  async sendBulkSMS(messages) {
    // Send multiple SMS with rate limiting
    const results = [];
    const delayMs = 100;

    for (const msg of messages) {
      try {
        const result = await this.sendSMS(msg);
        results.push({ ...result, to: msg.to });
      } catch (error) {
        results.push({ success: false, to: msg.to, error: error.message });
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    return results;
  },

  isValidPhoneNumber(phoneNumber) {
    // Accept various phone formats: +1234567890, 1234567890, (123)456-7890, etc.
    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    return phoneRegex.test(phoneNumber) && digitsOnly.length >= 10;
  },

  normalizePhoneNumber(phoneNumber) {
    // Convert to E.164 format: +country-number
    let digits = phoneNumber.replace(/\D/g, '');

    // Add country code if missing (assume US +1)
    if (digits.length === 10) {
      digits = '1' + digits;
    } else if (!digits.startsWith('1') && digits.length === 11) {
      // Already has country code
    } else if (digits.length < 11) {
      throw new Error(`Invalid phone number: ${phoneNumber}`);
    }

    return '+' + digits;
  }
};

/**
 * Webhook handler for SMS/WhatsApp status updates
 */
export const handleStatusCallback = async (req) => {
  const { MessageSid, MessageStatus, trackingId, ErrorCode } = req.body;

  if (!trackingId) {
    console.warn('Missing trackingId in webhook');
    return;
  }

  // Map Twilio status to our status
  const statusMap = {
    'queued': 'pending',
    'sending': 'sending',
    'sent': 'sent',
    'failed': 'failed',
    'delivered': 'delivered',
    'undelivered': 'bounced',
    'received': 'received'
  };

  const ourStatus = statusMap[MessageStatus] || MessageStatus;

  // Update delivery record
  try {
    const { supabase } = await import('../server.js');
    const { error } = await supabase
      .from('campaign_deliveries')
      .update({
        status: ourStatus,
        sms_message_id: MessageSid,
        metadata: {
          twilio_status: MessageStatus,
          error_code: ErrorCode || null
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', trackingId);

    if (error) {
      console.error('Failed to update delivery status:', error);
    }
  } catch (error) {
    console.error('Error handling SMS webhook:', error);
  }
};

export default smsService;
