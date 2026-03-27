import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../../frontend/src/lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);

      // Persist tokens on successful auth
      if (session?.refresh_token) {
        try {
          await window.electronAPI?.setAuthToken?.({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
        } catch (err) {
          console.error('Failed to persist auth token:', err);
        }
      }

      // Clear stored tokens on sign out
      if (!session) {
        try {
          await window.electronAPI?.clearAuthToken?.();
        } catch {}
      }
    });

    // Listen for OAuth callback from Electron main process
    if (window.electronAPI?.onAuthCallback) {
      window.electronAPI.onAuthCallback(async (url) => {
        try {
          const hashPart = url.split('#')[1];
          if (!hashPart) return;

          const params = new URLSearchParams(hashPart);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error) {
              console.error('Failed to set session from OAuth callback:', error);
              setError(error);
            }
          }
        } catch (err) {
          console.error('Error handling auth callback:', err);
          setError(err);
        }
      });
    }

    return () => subscription?.unsubscribe();
  }, []);

  /**
   * Initialize auth: try to restore session from encrypted store,
   * then fall back to Supabase's own session check.
   */
  async function initializeAuth() {
    try {
      // First, check if Supabase already has a valid session in memory
      const { data: { session: existingSession } } = await supabase.auth.getSession();

      if (existingSession) {
        setSession(existingSession);
        setUser(existingSession.user || null);
        setLoading(false);
        return;
      }

      // No in-memory session — try to restore from encrypted electron-store
      const storedToken = await window.electronAPI?.getAuthToken?.();

      if (storedToken?.access_token && storedToken?.refresh_token) {
        const { data, error: restoreError } = await supabase.auth.setSession({
          access_token: storedToken.access_token,
          refresh_token: storedToken.refresh_token,
        });

        if (restoreError) {
          console.error('Failed to restore session from stored token:', restoreError);
          // Token is stale/invalid — clear it
          try {
            await window.electronAPI?.clearAuthToken?.();
          } catch {}
          setSession(null);
          setUser(null);
        } else if (data?.session) {
          setSession(data.session);
          setUser(data.session.user || null);
          // Update stored tokens with refreshed values
          try {
            await window.electronAPI?.setAuthToken?.({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            });
          } catch {}
        }
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
    } finally {
      setLoading(false);
    }
  }

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the OAuth URL from Supabase but don't redirect in Electron
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'agentlead://auth/callback',
          skipBrowserRedirect: true,
        },
      });

      if (signInError) {
        setError(signInError);
        return { error: signInError };
      }

      // Open the auth URL in the system browser
      if (data?.url) {
        if (window.electronAPI?.openExternal) {
          window.electronAPI.openExternal(data.url);
        } else {
          window.open(data.url, '_blank');
        }
      }

      return { data };
    } catch (err) {
      setError(err);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      // Clear stored tokens
      try {
        await window.electronAPI?.clearAuthToken?.();
        await window.electronAPI?.clearSubscriptionCache?.();
      } catch {}

      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error);
        return { error };
      }
      setUser(null);
      setSession(null);
      return {};
    } catch (err) {
      setError(err);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
