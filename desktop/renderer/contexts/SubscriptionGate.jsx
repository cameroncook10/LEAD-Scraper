import React, { useState, useEffect } from 'react';
import { supabase } from '../../../frontend/src/lib/supabase';
import { useAuth } from './ElectronAuthContext';

/**
 * SubscriptionGate - Verifies the user has an active Stripe subscription.
 * No free trial — users must purchase a plan to use the app.
 */
export function SubscriptionGate({ children }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [subStatus, setSubStatus] = useState(null); // null = checking, 'active', 'inactive'
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.email) {
      setSubStatus(null);
      return;
    }

    // Check cache first
    const cached = localStorage.getItem('sub_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.email === user.email && Date.now() - parsed.ts < 3600000) {
          setSubStatus(parsed.active ? 'active' : 'inactive');
          return;
        }
      } catch {}
    }

    verifySubscription();
  }, [isAuthenticated, user?.email]);

  const verifySubscription = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-subscription', {
        body: { email: user.email, userId: user.id },
      });

      if (error) {
        console.error('Subscription check failed:', error);
        setSubStatus('inactive'); // Fail closed
        return;
      }

      const active = data?.active === true;
      setSubStatus(active ? 'active' : 'inactive');

      localStorage.setItem('sub_cache', JSON.stringify({
        email: user.email,
        active,
        ts: Date.now(),
      }));
    } catch (err) {
      console.error('Subscription verification error:', err);
      setSubStatus('inactive'); // Fail closed
    } finally {
      setChecking(false);
    }
  };

  // Still loading auth
  if (authLoading) return null;

  // Not authenticated — let children handle (LoginPage will show)
  if (!isAuthenticated) return children;

  // Checking subscription
  if (subStatus === null || checking) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#050505',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40,
            border: '3px solid rgba(34, 211, 238, 0.15)',
            borderTopColor: '#22d3ee',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p>Verifying subscription...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // No active subscription — show paywall
  if (subStatus === 'inactive') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#050505',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: 420,
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          background: 'rgba(255,255,255,0.03)',
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
            Subscription Required
          </h2>
          <p style={{ color: '#9ca3af', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Purchase a plan to start using AgentLead.
            Visit our website to subscribe.
          </p>
          <button
            onClick={() => {
              const url = 'https://agentlead.io/#pricing';
              if (window.electronAPI?.openExternal) {
                window.electronAPI.openExternal(url);
              } else {
                window.open(url, '_blank');
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: 10,
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '1rem',
              width: '100%',
            }}
          >
            Subscribe Now
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('sub_cache');
              setSubStatus(null);
              verifySubscription();
            }}
            style={{
              background: 'transparent',
              color: '#22d3ee',
              border: '1px solid rgba(34, 211, 238, 0.3)',
              padding: '0.5rem 1.5rem',
              borderRadius: 10,
              fontSize: '0.85rem',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            I've subscribed — Refresh
          </button>
        </div>
      </div>
    );
  }

  // Active subscription — render the app
  return children;
}
