/**
 * Pending-checkout handoff for the signup-first billing flow.
 *
 * When an anonymous visitor clicks a paid plan we stash their choice, send them
 * to /login, and resume the (authenticated) checkout once they're signed in —
 * see components/CheckoutResume.jsx. This guarantees the Stripe subscription is
 * created against a real user so the webhook can link it.
 */
const KEY = 'pendingCheckout';

export function savePendingCheckout(plan, isAnnual) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ plan, isAnnual: !!isAnnual }));
  } catch {
    /* localStorage unavailable — non-fatal */
  }
}

/** Returns the saved checkout (and clears it), or null. */
export function takePendingCheckout() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    localStorage.removeItem(KEY);
    const parsed = JSON.parse(raw);
    return parsed && parsed.plan ? parsed : null;
  } catch {
    return null;
  }
}

/** Non-destructive check used to tailor copy on the login page. */
export function hasPendingCheckout() {
  try {
    return !!localStorage.getItem(KEY);
  } catch {
    return false;
  }
}
