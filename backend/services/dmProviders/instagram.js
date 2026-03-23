/**
 * Instagram DM Provider
 * 
 * Sends direct messages via the Instagram Graph API (Messenger Platform).
 * Requires a Facebook Business account linked to an Instagram Professional account.
 * 
 * Setup:
 * 1. Create a Facebook App at developers.facebook.com
 * 2. Add the "Instagram" product
 * 3. Generate a long-lived access token
 * 4. Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID in .env
 */

const INSTAGRAM_API_BASE = 'https://graph.instagram.com/v21.0';

/**
 * Send a DM to an Instagram user.
 * 
 * @param {Object} delivery - The delivery object with lead + campaign data
 * @returns {{ success: boolean, messageId?: string, error?: string }}
 */
export async function sendInstagramDM(delivery) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !businessAccountId) {
    return { 
      success: false, 
      error: 'Instagram API not configured. Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID in .env' 
    };
  }

  try {
    const lead = delivery?.leads;
    const campaign = delivery?.email_campaigns;

    if (!lead) {
      return { success: false, error: 'No lead data found for delivery' };
    }

    // Get the Instagram user ID for the lead
    // In production, you'd look this up from scraped social data
    const igUserId = lead.raw_data?.instagram_user_id;
    
    if (!igUserId) {
      return { success: false, error: 'Lead has no Instagram user ID' };
    }

    // Build the message (template body with variable substitution)
    let messageText = campaign?.body || delivery?.metadata?.personalizedMessage || '';
    
    // Simple variable replacement
    messageText = messageText
      .replace(/{{name}}/g, lead.name || 'there')
      .replace(/{{business}}/g, lead.name || 'your business')
      .replace(/{{industry}}/g, lead.business_type || 'your industry')
      .replace(/{{location}}/g, lead.address || 'your area');

    // Send via Instagram Messaging API
    const response = await fetch(`${INSTAGRAM_API_BASE}/${businessAccountId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        recipient: { id: igUserId },
        message: { text: messageText },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        error: `Instagram API error: ${data.error?.message || response.statusText}` 
      };
    }

    return { 
      success: true, 
      messageId: data.message_id || data.id,
    };
  } catch (error) {
    return { 
      success: false, 
      error: `Instagram send failed: ${error.message}` 
    };
  }
}

/**
 * Check if an Instagram conversation has a reply.
 * Useful for follow-up workflow logic.
 */
export async function checkInstagramReply(conversationId) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  
  if (!accessToken) return { hasReply: false };

  try {
    const response = await fetch(
      `${INSTAGRAM_API_BASE}/${conversationId}/messages?fields=message,from,created_time&limit=5`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    const data = await response.json();
    
    if (!response.ok || !data.data) {
      return { hasReply: false };
    }

    // Check if any message is NOT from our business account
    const businessId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    const replies = data.data.filter(msg => msg.from?.id !== businessId);
    
    return { 
      hasReply: replies.length > 0,
      latestReply: replies[0] || null,
    };
  } catch (error) {
    console.error('[Instagram] Reply check failed:', error);
    return { hasReply: false };
  }
}
