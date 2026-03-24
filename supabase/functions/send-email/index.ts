/**
 * Supabase Edge Function: send-email
 * 
 * Sends emails using SMTP credentials stored as Supabase secrets.
 * Uses the built-in Deno SMTP client (no npm packages needed).
 * 
 * Deploy:
 *   supabase functions deploy send-email
 *   supabase secrets set SMTP_HOST=smtp.gmail.com SMTP_PORT=587 SMTP_USER=you@gmail.com SMTP_PASS=your-app-password
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const smtpHost = Deno.env.get('SMTP_HOST');
    const smtpPort = Deno.env.get('SMTP_PORT') || '587';
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');

    if (!smtpHost || !smtpUser || !smtpPass) {
      return jsonResponse({ 
        error: 'SMTP credentials not set. Run: supabase secrets set SMTP_HOST=... SMTP_USER=... SMTP_PASS=...' 
      }, 500);
    }

    const { to, subject, text, html } = await req.json();

    if (!to || !subject) {
      return jsonResponse({ error: 'to and subject are required' }, 400);
    }

    // Use Resend/SMTP relay via fetch (works in Deno edge runtime)
    // For Gmail, we use the Gmail SMTP relay via a simple raw SMTP connection
    // Alternative: Use Resend API or SendGrid API for edge-compatible email
    
    // Since Deno Edge Functions can't do raw SMTP, we'll use a REST-based
    // email API. If user has RESEND_API_KEY, use Resend. Otherwise, fall back
    // to a simple webhook approach.
    
    const resendKey = Deno.env.get('RESEND_API_KEY');
    
    if (resendKey) {
      // Resend API (recommended for edge functions)
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Agent Lead <${smtpUser}>`,
          to: Array.isArray(to) ? to : [to],
          subject,
          text,
          html: html || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Email API error: ${JSON.stringify(data)}`);
      }
      return jsonResponse({ success: true, messageId: data.id });
    }

    // Fallback: Forward to backend SMTP endpoint
    const backendUrl = Deno.env.get('BACKEND_URL') || 'http://localhost:3002';
    const response = await fetch(`${backendUrl}/api/outreach/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, text, html }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email via backend');
    }
    
    return jsonResponse({ success: true, data });

  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
