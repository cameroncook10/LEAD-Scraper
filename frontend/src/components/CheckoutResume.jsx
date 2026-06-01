/**
 * CheckoutResume — completes a signup-first purchase.
 *
 * Rendered once at the app root. After a visitor signs in (Google OAuth lands
 * them on /dashboard), if they had picked a plan before authenticating we kick
 * off the authenticated backend checkout and redirect to Stripe.
 */
import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createStripeCheckout } from '../services/api';
import { takePendingCheckout } from '../lib/checkout';

export default function CheckoutResume() {
  const { isAuthenticated, loading } = useAuth();
  const started = useRef(false);

  useEffect(() => {
    if (loading || !isAuthenticated || started.current) return;

    const pending = takePendingCheckout();
    if (!pending) return;

    started.current = true;
    (async () => {
      try {
        const { url } = await createStripeCheckout(pending.plan, pending.isAnnual);
        if (url) window.location.href = url;
      } catch (err) {
        console.error('Could not resume checkout after sign-in:', err);
        started.current = false; // allow a retry on next auth change
      }
    })();
  }, [isAuthenticated, loading]);

  return null;
}
