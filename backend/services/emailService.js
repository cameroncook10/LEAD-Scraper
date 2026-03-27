import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

/**
 * Email Service
 * Supports both Nodemailer (SMTP) and SendGrid.
 * Configurable via environment variables.
 */

let emailTransporter = null;
const emailProvider = process.env.EMAIL_SERVICE || 'sendgrid';
const fromAddress = process.env.EMAIL_FROM || 'noreply@leadscraper.app';
const fromName = process.env.EMAIL_FROM_NAME || 'LeadScraper';
const frontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:3001';

/**
 * Initialize email service
 */
export const initEmailService = async () => {
  if (emailProvider === 'sendgrid') {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('[Email] SENDGRID_API_KEY not set. Email sending will fail.');
      return;
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('[Email] SendGrid email service initialized');
  } else if (emailProvider === 'nodemailer') {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.warn('[Email] SMTP_HOST/SMTP_USER not set. Email sending will fail.');
      return;
    }
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify connection
    try {
      await emailTransporter.verify();
      console.log('[Email] Nodemailer SMTP connection verified');
    } catch (error) {
      console.error('[Email] SMTP connection failed:', error.message);
    }
  } else {
    console.error('[Email] Invalid EMAIL_SERVICE. Use "sendgrid" or "nodemailer"');
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
      trackingPixel = true,
      template,
      templateData,
    } = options;

    // If a template name is provided, render it
    let htmlContent = html;
    let textContent = text;
    if (template && EMAIL_TEMPLATES[template]) {
      htmlContent = renderTemplate(EMAIL_TEMPLATES[template].html, templateData || {});
      textContent = renderTemplate(EMAIL_TEMPLATES[template].text, templateData || {});
    }

    if (!to || !subject || !htmlContent) {
      throw new Error('Missing required email fields: to, subject, html');
    }

    let messageId;

    try {
      if (emailProvider === 'sendgrid') {
        messageId = await sendViaSendGrid({
          to,
          subject,
          html: htmlContent,
          text: textContent,
          headers,
          trackingPixel,
        });
      } else if (emailProvider === 'nodemailer') {
        messageId = await sendViaNodemailer({
          to,
          subject,
          html: htmlContent,
          text: textContent,
          headers,
          trackingPixel,
        });
      } else {
        throw new Error(`Email provider "${emailProvider}" is not configured`);
      }

      console.log(`[Email] Sent to ${to} via ${emailProvider} (${messageId})`);

      return {
        messageId,
        success: true,
        provider: emailProvider,
      };
    } catch (error) {
      console.error(`[Email] Delivery failed (${emailProvider}) to ${to}:`, error.message);
      throw error;
    }
  },

  async sendBulk(emails) {
    const results = [];
    const delayMs = 100;

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
  },

  /**
   * Send a templated email (convenience method)
   */
  async sendTemplateEmail(to, templateName, data) {
    if (!EMAIL_TEMPLATES[templateName]) {
      throw new Error(`Unknown email template: ${templateName}`);
    }

    const tmpl = EMAIL_TEMPLATES[templateName];
    return this.sendEmail({
      to,
      subject: renderTemplate(tmpl.subject, data),
      html: renderTemplate(tmpl.html, data),
      text: renderTemplate(tmpl.text, data),
    });
  },
};

/**
 * CAN-SPAM compliant unsubscribe footer
 */
function getUnsubscribeFooter(unsubscribeUrl) {
  const url = unsubscribeUrl || `${frontendUrl()}/unsubscribe`;
  return `
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999;text-align:center;">
      <p>You received this email because you are a contact of a LeadScraper user.</p>
      <p><a href="${url}" style="color:#999;">Unsubscribe</a> |
      <a href="${frontendUrl()}/privacy" style="color:#999;">Privacy Policy</a></p>
    </div>`;
}

/**
 * Send via SendGrid
 */
const sendViaSendGrid = async (options) => {
  const { to, subject, html, text, headers, trackingPixel } = options;

  let htmlContent = html;
  if (trackingPixel) {
    htmlContent += `<img src="${frontendUrl()}/api/tracking/pixel" alt="" width="1" height="1" style="display:none;" />`;
  }

  // Append CAN-SPAM unsubscribe footer
  htmlContent += getUnsubscribeFooter();

  const unsubscribeUrl = `${frontendUrl()}/unsubscribe`;

  const msg = {
    to,
    from: { email: fromAddress, name: fromName },
    subject,
    html: htmlContent,
    text: text || htmlContent.replace(/<[^>]*>/g, ''),
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      ...headers,
    },
    trackingSettings: {
      clickTracking: { enable: true },
      openTracking: { enable: true },
    },
  };

  const response = await sgMail.send(msg);
  return response[0].headers['x-message-id'];
};

/**
 * Send via Nodemailer
 */
const sendViaNodemailer = async (options) => {
  const { to, subject, html, text, headers, trackingPixel } = options;

  if (!emailTransporter) {
    throw new Error('SMTP transporter not initialized. Call initEmailService() first.');
  }

  let htmlContent = html;
  if (trackingPixel) {
    htmlContent += `<img src="${frontendUrl()}/api/tracking/pixel" alt="" width="1" height="1" style="display:none;" />`;
  }

  // Append CAN-SPAM unsubscribe footer
  htmlContent += getUnsubscribeFooter();

  const unsubscribeUrl = `${frontendUrl()}/unsubscribe`;

  const mailOptions = {
    from: `${fromName} <${fromAddress}>`,
    to,
    subject,
    html: htmlContent,
    text: text || htmlContent.replace(/<[^>]*>/g, ''),
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      ...headers,
    },
  };

  const info = await emailTransporter.sendMail(mailOptions);
  return info.messageId;
};

// ─────────────────────────────────────
// Email Templates
// ─────────────────────────────────────

const EMAIL_TEMPLATES = {
  welcome: {
    subject: 'Welcome to LeadScraper, {{name}}!',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#2563eb;">Welcome to LeadScraper!</h1>
        <p>Hi {{name}},</p>
        <p>Thanks for signing up. Your account is ready and you can start scraping leads immediately.</p>
        <p>Here are some things you can do:</p>
        <ul>
          <li>Set up your first scrape job</li>
          <li>Connect your outreach channels (Instagram, Facebook, Email)</li>
          <li>Configure AI-powered lead scoring</li>
        </ul>
        <p>
          <a href="{{dashboardUrl}}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
            Go to Dashboard
          </a>
        </p>
        <p>If you have questions, reply to this email or check our docs.</p>
        <p>Best,<br/>The LeadScraper Team</p>
      </div>`,
    text: `Welcome to LeadScraper, {{name}}!\n\nThanks for signing up. Your account is ready.\n\nGet started: {{dashboardUrl}}\n\nBest,\nThe LeadScraper Team`,
  },

  passwordReset: {
    subject: 'Reset your LeadScraper password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#2563eb;">Password Reset</h1>
        <p>Hi {{name}},</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <p>
          <a href="{{resetUrl}}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
            Reset Password
          </a>
        </p>
        <p>If you did not request this, you can safely ignore this email. The link expires in 1 hour.</p>
        <p>Best,<br/>The LeadScraper Team</p>
      </div>`,
    text: `Password Reset\n\nHi {{name}},\n\nReset your password here: {{resetUrl}}\n\nIf you did not request this, ignore this email.\n\nBest,\nThe LeadScraper Team`,
  },

  trialEnding: {
    subject: 'Your LeadScraper trial ends in {{daysLeft}} days',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#f59e0b;">Your trial is ending soon</h1>
        <p>Hi {{name}},</p>
        <p>Your free trial ends in <strong>{{daysLeft}} days</strong> on {{endDate}}.</p>
        <p>To keep access to all your leads and outreach tools, upgrade to a paid plan:</p>
        <p>
          <a href="{{upgradeUrl}}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
            Upgrade Now
          </a>
        </p>
        <p>After your trial ends, you will lose access to:</p>
        <ul>
          <li>Automated scraping jobs</li>
          <li>AI lead scoring</li>
          <li>Outreach campaigns</li>
        </ul>
        <p>Your data will be retained for 30 days after expiration.</p>
        <p>Best,<br/>The LeadScraper Team</p>
      </div>`,
    text: `Your trial ends in {{daysLeft}} days\n\nHi {{name}},\n\nYour free trial ends on {{endDate}}.\n\nUpgrade here: {{upgradeUrl}}\n\nBest,\nThe LeadScraper Team`,
  },

  paymentFailed: {
    subject: 'Action required: Payment failed for your LeadScraper subscription',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#ef4444;">Payment Failed</h1>
        <p>Hi {{name}},</p>
        <p>We were unable to process your payment of <strong>{{amount}}</strong> for your {{planName}} subscription.</p>
        <p>Please update your payment method to avoid service interruption:</p>
        <p>
          <a href="{{billingUrl}}" style="display:inline-block;padding:12px 24px;background:#ef4444;color:#fff;text-decoration:none;border-radius:6px;">
            Update Payment Method
          </a>
        </p>
        <p>If your payment is not updated within 7 days, your account will be downgraded.</p>
        <p>If you believe this is an error, please contact our support team.</p>
        <p>Best,<br/>The LeadScraper Team</p>
      </div>`,
    text: `Payment Failed\n\nHi {{name}},\n\nWe could not process your payment of {{amount}} for {{planName}}.\n\nUpdate your payment method: {{billingUrl}}\n\nBest,\nThe LeadScraper Team`,
  },
};

/**
 * Template rendering utility - replaces {{key}} placeholders with data values
 */
export const renderTemplate = (template, data) => {
  let content = template;

  Object.entries(data).forEach(([key, value]) => {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
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
  'temp-mail.org',
  'throwaway.email',
  'yopmail.com',
  'sharklasers.com',
  'guerrillamailblock.com',
  'grr.la',
];

export const isDisposableEmail = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  return disposableDomains.includes(domain);
};

export { EMAIL_TEMPLATES };
export default emailService;
