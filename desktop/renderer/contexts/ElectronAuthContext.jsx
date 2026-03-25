import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../../frontend/src/lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
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
