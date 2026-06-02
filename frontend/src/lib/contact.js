/**
 * "Book a setup call" target.
 *
 * Set VITE_CALENDLY_URL (e.g. https://calendly.com/your-handle/setup-call) and
 * every "Book a setup call" button links straight to it. Until then it falls
 * back to a mailto so the buttons always work.
 */
const CALENDLY_URL = (import.meta.env.VITE_CALENDLY_URL || '').trim();
const SALES_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'sales@agentlead.io';

export const BOOK_CALL_HREF =
  CALENDLY_URL ||
  `mailto:${SALES_EMAIL}?subject=${encodeURIComponent('Agent Lead — setup call')}`;

// Calendly opens in a new tab; a mailto should not.
export const BOOK_CALL_IS_EXTERNAL = !!CALENDLY_URL;

// Spread onto an <a> to get target/rel only when it's an external link.
export const bookCallLinkProps = BOOK_CALL_IS_EXTERNAL
  ? { target: '_blank', rel: 'noopener noreferrer' }
  : {};
