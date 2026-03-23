/**
 * Facebook Messenger Provider — Per-User Token Version
 */
import { supabase } from '../../server.js';

const FB_API_BASE = 'https://graph.facebook.com/v21.0';

async function getUserFacebookCreds(userId) {
  const { data, error } = await supabase
    .from('api_keys')
    .select('encrypted_key, metadata')
    .eq('user_id', userId)
    .eq('provider', 'facebook')
    .single();

  if (error || !data) return null;

  return {
    pageAccessToken: data.encrypted_key,
    pageId: data.metadata?.page_id,
    expiresAt: data.metadata?.expires_at,
  };
}

export async function sendFacebookMessage(delivery, userId) {
  let pageAccessToken, pageId;
  
  if (userId) {
    const creds = await getUserFacebookCreds(userId);
    if (creds) {
      pageAccessToken = creds.pageAccessToken;
      pageId = creds.pageId;
    }
  }
  
  pageAccessToken = pageAccessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  pageId = pageId || process.env.FACEBOOK_PAGE_ID;

  if (!pageAccessToken || !pageId) {
    return { 
      success: false, 
      error: 'Facebook not connected. Please connect your Facebook Page in Settings.' 
    };
  }

  try {
    const lead = delivery?.leads;
    const fbPsid = lead?.raw_data?.facebook_psid;
    
    if (!fbPsid) {
      return { success: false, error: 'Lead has no Facebook PSID' };
    }

    let messageText = delivery?.metadata?.personalizedMessage || '';
    
    messageText = messageText
      .replace(/{{name}}/g, lead.name || 'there')
      .replace(/{{business}}/g, lead.name || 'your business')
      .replace(/{{industry}}/g, lead.business_type || 'your industry')
      .replace(/{{location}}/g, lead.address || 'your area');

    const response = await fetch(`${FB_API_BASE}/${pageId}/messages?access_token=${pageAccessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: fbPsid },
        messaging_type: 'MESSAGE_TAG',
        tag: 'CONFIRMED_EVENT_UPDATE',
        message: { text: messageText },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: `Facebook API error: ${data.error?.message}` };
    }

    return { success: true, messageId: data.message_id };
  } catch (error) {
    return { success: false, error: `Facebook send failed: ${error.message}` };
  }
}
