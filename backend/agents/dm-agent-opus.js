import Anthropic from '@anthropic-ai/sdk';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Email transporter (SendGrid)
const emailTransporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});

// Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export class DMAgent {
  /**
   * Generate personalized message using Claude Opus 4.6
   */
  async generatePersonalizedMessage(lead, context = {}) {
    const prompt = this.buildPrompt(lead, context);

    try {
      const message = await anthropic.messages.create({
        model: 'claude-opus-4-20250805',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      return message.content[0].type === 'text' ? message.content[0].text : '';
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  /**
   * Build context-aware prompt for Claude
   */
  buildPrompt(lead, context) {
    return `You are an expert B2B sales copywriter. Write a personalized, compelling outreach message to this prospect.

Lead Information:
- Name: ${lead.name}
- Company: ${lead.company}
- Business Type: ${lead.businessType || 'Unknown'}
- Company Size: ${lead.companySize || 'Unknown'}
- Location: ${lead.location || 'Unknown'}
- Phone: ${lead.phone || 'Not provided'}
- Email: ${lead.email}
- Website: ${lead.website || 'Not provided'}
- Budget Indicators: ${context.budgetIndicators || 'Not specified'}
- Lead Source: ${lead.source || 'Web'}
- Previous Interactions: ${context.previousInteractions || 'None'}

Guidelines:
- Keep it SHORT and PERSONAL (3-4 sentences max for email, 1-2 for SMS)
- Reference something specific about their business or location
- Mention a clear value proposition
- Include a single, specific call to action
- For email: Professional but conversational tone
- For SMS: Natural, brief, no marketing speak
- DO NOT: Use generic templates, fake personal details, or aggressive sales tactics
- DO match their industry with relevant examples
- DO highlight ROI or specific benefits

Write a ${context.channel === 'sms' ? 'SMS' : 'email'} message NOW, with no preamble or explanation:`;
  }

  /**
   * Send personalized message to lead
   */
  async sendPersonalizedMessage(lead, channel, campaignId = null) {
    try {
      // Generate personalized message
      const message = await this.generatePersonalizedMessage(lead);

      if (!message) {
        throw new Error('Failed to generate message');
      }

      let result = {};

      // Send via appropriate channel
      if (channel === 'email') {
        result = await this.sendEmail(lead, message);
      } else if (channel === 'sms') {
        result = await this.sendSMS(lead, message);
      } else if (channel === 'whatsapp') {
        result = await this.sendWhatsApp(lead, message);
      }

      // Log message in database
      if (campaignId) {
        await this.logMessage(lead, campaignId, channel, message, result);
      }

      return result;
    } catch (error) {
      console.error(`Failed to send ${channel} to ${lead.email}:`, error);
      throw error;
    }
  }

  /**
   * Send email using SendGrid
   */
  async sendEmail(lead, message) {
    try {
      const senderEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@agentlead.com';
      const senderName = process.env.SENDGRID_FROM_NAME || 'Agent Lead';

      const result = await emailTransporter.sendMail({
        from: `${senderName} <${senderEmail}>`,
        to: lead.email,
        subject: `Quick opportunity for ${lead.company || lead.name}`,
        html: this.htmlTemplate(message),
        text: message,
        headers: {
          'X-Lead-ID': lead.id,
          'X-Company': lead.company || 'Unknown',
        },
      });

      return {
        channel: 'email',
        status: 'sent',
        messageId: result.messageId,
        sentAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }

  /**
   * Send SMS using Twilio
   */
  async sendSMS(lead, message) {
    try {
      if (!lead.phone) {
        throw new Error('No phone number for SMS');
      }

      const result = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: lead.phone,
      });

      return {
        channel: 'sms',
        status: 'sent',
        messageId: result.sid,
        sentAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('SMS send error:', error);
      throw error;
    }
  }

  /**
   * Send WhatsApp using Twilio
   */
  async sendWhatsApp(lead, message) {
    try {
      if (!lead.phone) {
        throw new Error('No phone number for WhatsApp');
      }

      const result = await twilioClient.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${lead.phone}`,
      });

      return {
        channel: 'whatsapp',
        status: 'sent',
        messageId: result.sid,
        sentAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('WhatsApp send error:', error);
      throw error;
    }
  }

  /**
   * Simple HTML email template
   */
  htmlTemplate(message) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .message { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="message">${this.escapeHtml(message)}</div>
            <div class="footer">
              <p>© Agent Lead - Your AI-powered lead engagement platform</p>
              <p><a href="https://agentlead.com/unsubscribe">Unsubscribe</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Log message in database for tracking
   */
  async logMessage(lead, campaignId, channel, content, result) {
    try {
      const { error } = await supabase.from('messages').insert([
        {
          campaign_id: campaignId,
          lead_id: lead.id,
          channel,
          content,
          status: result.status,
          external_message_id: result.messageId,
          sent_at: result.sentAt,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error('Failed to log message:', error);
      }
    } catch (error) {
      console.error('Message logging error:', error);
    }
  }

  /**
   * Handle webhook for message opens/clicks
   */
  async handleTrackingWebhook(eventType, messageId, metadata) {
    try {
      const updates = {
        updated_at: new Date().toISOString(),
      };

      if (eventType === 'open') {
        updates.opened_at = new Date().toISOString();
      } else if (eventType === 'click') {
        updates.clicked_at = new Date().toISOString();
      } else if (eventType === 'bounce') {
        updates.bounced_at = new Date().toISOString();
      } else if (eventType === 'reply') {
        updates.replied_at = new Date().toISOString();
      }

      await supabase
        .from('message_tracking')
        .update(updates)
        .eq('external_message_id', messageId);
    } catch (error) {
      console.error('Tracking webhook error:', error);
    }
  }

  /**
   * Auto follow-up logic
   */
  async checkForFollowUps() {
    try {
      // Get messages sent 3 days ago that haven't been opened
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const { data: messagesThatNeedFollowUp, error } = await supabase
        .from('messages')
        .select('*')
        .eq('status', 'sent')
        .is('opened_at', null)
        .lt('sent_at', threeDaysAgo.toISOString())
        .limit(50);

      if (error) {
        console.error('Follow-up query error:', error);
        return;
      }

      // Send follow-ups
      for (const message of messagesThatNeedFollowUp) {
        const { data: lead } = await supabase
          .from('leads')
          .select('*')
          .eq('id', message.lead_id)
          .single();

        if (lead) {
          const followUpMessage = `Following up on my previous message - still interested in exploring how we can help ${lead.company}?`;
          
          // Send follow-up
          if (message.channel === 'email') {
            await this.sendEmail(lead, followUpMessage);
          } else if (message.channel === 'sms') {
            await this.sendSMS(lead, followUpMessage);
          }

          // Log follow-up
          await this.logMessage(lead, message.campaign_id, message.channel, followUpMessage, {
            status: 'sent',
            messageId: `followup_${message.id}`,
            sentAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Follow-up check error:', error);
    }
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

export default DMAgent;
