/**
 * Instagram DM Provider — Per-User Token Version
 * 
 * Pulls the user's Instagram access token from the `api_keys` table
 * instead of using a global .env token.
 */
import { supabase } from '../../server.js';

const INSTAGRAM_API_BASE = 'https://graph.instagram.com/v21.0';

/**
 * Get a user's Instagram credentials from the database.
 */
async function getUserInstagramCreds(userId) {
  const { data, error } = await supabase
    .from('api_keys')
    .select('encrypted_key, metadata')
    .eq('user_id', userId)
    .eq('provider', 'instagram')
    .single();

  if (error || !data) return null;

  return {
    accessToken: data.encrypted_key,
    businessAccountId: data.metadata?.ig_business_id,
    pageId: data.metadata?.page_id,
    expiresAt: data.metadata?.expires_at,
  };
}

/**
 * Send a DM to an Instagram user.
 */
export async function sendInstagramDM(delivery, userId) {
  // Try per-user token first, fall back to .env
  let accessToken, businessAccountId;
  
  if (userId) {
    const creds = await getUserInstagramCreds(userId);
    if (creds) {
      accessToken = creds.accessToken;
      businessAccountId = creds.businessAccountId;
    }
  }
  
  // Fallback to .env (for testing or admin use)
  accessToken = accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;
  businessAccountId = businessAccountId || process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !businessAccountId) {
    return { 
      success: false, 
      error: 'Instagram not connected. Please connect your Instagram account in Settings.' 
    };
  }

  try {
    const lead = delivery?.leads;
    const campaign = delivery?.email_campaigns;

    if (!lead) {
      return { success: false, error: 'No lead data found for delivery' };
    }

    const igUserId = lead.raw_data?.instagram_user_id;
    
    if (!igUserId) {
      return { success: false, error: 'Lead has no Instagram user ID' };
    }

    // Build the message
    let messageText = delivery?.metadata?.personalizedMessage || campaign?.body || '';
    
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

    return { success: true, messageId: data.message_id || data.id };
  } catch (error) {
    return { success: false, error: `Instagram send failed: ${error.message}` };
  }
}

/**
 * Check if an Instagram conversation has a reply.
 */
export async function checkInstagramReply(conversationId, userId) {
  let accessToken, businessId;
  
  if (userId) {
    const creds = await getUserInstagramCreds(userId);
    if (creds) {
      accessToken = creds.accessToken;
      businessId = creds.businessAccountId;
    }
  }
  
  accessToken = accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;
  businessId = businessId || process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  
  if (!accessToken) return { hasReply: false };

  try {
    const response = await fetch(
      `${INSTAGRAM_API_BASE}/${conversationId}/messages?fields=message,from,created_time&limit=5`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    const data = await response.json();
    if (!response.ok || !data.data) return { hasReply: false };

    const replies = data.data.filter(msg => msg.from?.id !== businessId);
    
    return { 
      hasReply: replies.length > 0,
      latestReply: replies[0] || null,
    };
  } catch (error) {
    return { hasReply: false };
  }
}
