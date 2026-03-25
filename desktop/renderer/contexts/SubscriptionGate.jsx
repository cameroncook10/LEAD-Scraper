import React, { useState, useEffect } from 'react';
import { supabase } from '../../../frontend/src/lib/supabase';
import { useAuth } from './ElectronAuthContext';

const FREE_TRIAL_DAYS = 7;

/**
 * SubscriptionGate - Allows a 7-day free trial (no card required),
 * then verifies the user has an active Stripe subscription.
 */
export function SubscriptionGate({ children }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [subStatus, setSubStatus] = useState(null); // null = checking, 'active', 'trial', 'inactive'
  const [checking, setChecking] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !user?.email) {
      setSubStatus(null);
      return;
    }

    // Check free trial first
    const trialStatus = checkFreeTrial(user.email);
    if (trialStatus.active) {
      setTrialDaysLeft(trialStatus.daysLeft);
      setSubStatus('trial');
      return;
    }

    // Trial expired — check cache for subscription
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

  /**
   * Check if the user is still within their free trial period.
   * Starts the trial on first sign-in (no card required).
   */
  function checkFreeTrial(email) {
    const key = `trial_start_${email}`;
    let trialStart = localStorage.getItem(key);

    if (!trialStart) {
      // First sign-in — start the free trial now
      trialStart = Date.now().toString();
      localStorage.setItem(key, trialStart);
    }

    const elapsed = Date.now() - Number(trialStart);
    const trialMs = FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000;
    const daysLeft = Math.max(0, Math.ceil((trialMs - elapsed) / (24 * 60 * 60 * 1000)));

    return { active: elapsed < trialMs, daysLeft };
  }

  const verifySubscription = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-subscription', {
        body: { email: user.email, userId: user.id },
      });

      if (error) {
        console.error('Subscription check failed:', error);
        setSubStatus('active'); // Fail open
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
      setSubStatus('active'); // Fail open
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
          <p>Loading...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Free trial active
  if (subStatus === 'trial') {
    return (
      <>
        {/* Trial banner */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(59,130,246,0.15))',
          borderBottom: '1px solid rgba(6,182,212,0.2)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backdropFilter: 'blur(12px)',
        }}>
          <span style={{ color: '#22d3ee', fontSize: '0.85rem', fontWeight: 600 }}>
            Free Trial — {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining
          </span>
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
              padding: '4px 14px',
              borderRadius: 6,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Upgrade
          </button>
        </div>
        {/* Push content down to make room for the banner */}
        <div style={{ paddingTop: 40 }}>
          {children}
        </div>
      </>
    );
  }

  // No active subscription and trial expired — show paywall
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
            Free Trial Ended
          </h2>
          <p style={{ color: '#9ca3af', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Your {FREE_TRIAL_DAYS}-day free trial has ended.
            Subscribe to continue using AgentLead — no data is lost.
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
