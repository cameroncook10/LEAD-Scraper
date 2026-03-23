import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

/**
 * Email Service
 * Supports both Nodemailer and SendGrid
 */

let emailTransporter = null;
const emailProvider = process.env.EMAIL_SERVICE || 'sendgrid';

/**
 * Initialize email service
 */
export const initEmailService = async () => {
  if (emailProvider === 'sendgrid') {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('✓ SendGrid email service initialized');
  } else if (emailProvider === 'nodemailer') {
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Verify connection
    try {
      await emailTransporter.verify();
      console.log('✓ Nodemailer SMTP connection verified');
    } catch (error) {
      console.error('SMTP connection failed:', error);
    }
  } else {
    console.error('Invalid EMAIL_SERVICE. Use "sendgrid" or "nodemailer"');
  }
};

/**
 * Send email via configured provider
 */
export const emailService = {
  async sendEmail(options) {
    const {
      to,
      subject,
      html,
      text,
      headers = {},
      trackingPixel = true
    } = options;

    if (!to || !subject || !html) {
      throw new Error('Missing required email fields: to, subject, html');
    }

    let messageId;

    try {
      if (emailProvider === 'sendgrid') {
        messageId = await sendViaSegdGrid({
          to,
          subject,
          html,
          text,
          headers,
          trackingPixel
        });
      } else if (emailProvider === 'nodemailer') {
        messageId = await sendViaNodemailer({
          to,
          subject,
          html,
          text,
          headers,
          trackingPixel
        });
      }

      return {
        messageId,
        success: true,
        provider: emailProvider
      };
    } catch (error) {
      console.error(`Email delivery failed (${emailProvider}):`, error);
      throw error;
    }
  },

  async sendBulk(emails) {
    // Send multiple emails with rate limiting
    const results = [];
    const delayMs = 100; // Rate limiting

    for (const email of emails) {
      try {
        const result = await this.sendEmail(email);
        results.push({ ...result, to: email.to });
      } catch (error) {
        results.push({ success: false, to: email.to, error: error.message });
      }

      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    return results;
  }
};

/**
 * Send via SendGrid
 */
const sendViaSegdGrid = async (options) => {
  const { to, subject, html, text, headers, trackingPixel } = options;

  // Add tracking pixel if enabled
  let htmlContent = html;
  if (trackingPixel) {
    htmlContent += `<img src="${process.env.FRONTEND_URL}/api/tracking/pixel" alt="" style="display:none;" />`;
  }

  const msg = {
    to,
    from: process.env.EMAIL_FROM,
    subject,
    html: htmlContent,
    text: text || htmlContent.replace(/<[^>]*>/g, ''),
    headers: {
      'X-SMTPAPI': JSON.stringify({
        category: ['lead-campaign']
      }),
      ...headers
    },
    trackingSettings: {
      clickTracking: {
        enable: true
      },
      openTracking: {
        enable: true
      },
      unsubscribeTracking: {
        enable: true
      }
    }
  };

  const response = await sgMail.send(msg);
  return response[0].headers['x-message-id'];
};

/**
 * Send via Nodemailer
 */
const sendViaNodemailer = async (options) => {
  const { to, subject, html, text, headers, trackingPixel } = options;

  // Add tracking pixel
  let htmlContent = html;
  if (trackingPixel) {
    htmlContent += `<img src="${process.env.FRONTEND_URL}/api/tracking/pixel?id=#{id}" alt="" style="display:none;" />`;
  }

  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME || 'LeadScraper'} <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html: htmlContent,
    text: text || htmlContent.replace(/<[^>]*>/g, ''),
    headers: {
      'List-Unsubscribe': `<${process.env.FRONTEND_URL}/unsubscribe>`,
      ...headers
    }
  };

  const info = await emailTransporter.sendMail(mailOptions);
  return info.messageId;
};

/**
 * Template rendering utility
 */
export const renderTemplate = (template, data) => {
  let content = template;

  Object.entries(data).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(placeholder, value || '');
  });

  return content;
};

/**
 * Validate email address
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check for disposable email domains
 */
const disposableDomains = [
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'mailinator.com',
  'temp-mail.org'
  // Add more as needed
];

export const isDisposableEmail = (email) => {
  const domain = email.split('@')[1];
  return disposableDomains.includes(domain);
};

export default emailService;
