/**
 * Facebook Messenger Provider
 * 
 * Sends messages via the Facebook Send API (Messenger Platform).
 * Requires a Facebook Page with Messenger enabled.
 * 
 * Setup:
 * 1. Create a Facebook App at developers.facebook.com
 * 2. Add "Messenger" product
 * 3. Generate a Page Access Token
 * 4. Set FACEBOOK_PAGE_ACCESS_TOKEN and FACEBOOK_PAGE_ID in .env
 */

const FB_API_BASE = 'https://graph.facebook.com/v21.0';

/**
 * Send a message via Facebook Messenger.
 * 
 * @param {Object} delivery - The delivery object with lead + campaign data
 * @returns {{ success: boolean, messageId?: string, error?: string }}
 */
export async function sendFacebookMessage(delivery) {
  const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;

  if (!pageAccessToken || !pageId) {
    return { 
      success: false, 
      error: 'Facebook API not configured. Set FACEBOOK_PAGE_ACCESS_TOKEN and FACEBOOK_PAGE_ID in .env' 
    };
  }

  try {
    const lead = delivery?.leads;
    const campaign = delivery?.email_campaigns;

    if (!lead) {
      return { success: false, error: 'No lead data found for delivery' };
    }

    // Get the Facebook PSID (Page-Scoped ID) for the lead
    const fbPsid = lead.raw_data?.facebook_psid;
    
    if (!fbPsid) {
      return { success: false, error: 'Lead has no Facebook PSID' };
    }

    // Build the message
    let messageText = campaign?.body || delivery?.metadata?.personalizedMessage || '';
    
    messageText = messageText
      .replace(/{{name}}/g, lead.name || 'there')
      .replace(/{{business}}/g, lead.name || 'your business')
      .replace(/{{industry}}/g, lead.business_type || 'your industry')
      .replace(/{{location}}/g, lead.address || 'your area');

    // Send via Facebook Send API
    const response = await fetch(`${FB_API_BASE}/${pageId}/messages?access_token=${pageAccessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: fbPsid },
        messaging_type: 'MESSAGE_TAG',
        tag: 'CONFIRMED_EVENT_UPDATE', // Required for non-24h window
        message: { text: messageText },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        error: `Facebook API error: ${data.error?.message || response.statusText}` 
      };
    }

    return { 
      success: true, 
      messageId: data.message_id,
    };
  } catch (error) {
    return { 
      success: false, 
      error: `Facebook send failed: ${error.message}` 
    };
  }
}
