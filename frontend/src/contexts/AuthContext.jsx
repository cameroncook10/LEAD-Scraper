import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * AuthContext - Provides authentication state and methods
 * 
 * Usage:
 *   const { user, signInWithGoogle, signOut } = useAuth();
 */

// Dev-mode bypass — when Supabase is not configured, provide a mock user.
// Gated behind import.meta.env.DEV (true only under `vite` dev server, false in
// any production `vite build`) so a misconfigured prod build can NEVER fail open
// and hand out a mock authenticated user.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const IS_DEV_MODE = import.meta.env.DEV &&
  (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl.includes('YOUR_PROJECT'));

const DEV_USER = {
  id: 'dev-local-user',
  email: 'dev@localhost',
  user_metadata: { full_name: 'Local Developer' },
};

const DEV_SESSION = IS_DEV_MODE ? { access_token: 'dev-token', user: DEV_USER } : null;

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(IS_DEV_MODE ? DEV_USER : null);
  const [session, setSession] = useState(DEV_SESSION);
  const [loading, setLoading] = useState(!IS_DEV_MODE);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Skip Supabase auth in dev mode
    if (IS_DEV_MODE) return;

    // Check if user is already signed in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (signInError) {
        setError(signInError);
        return { error: signInError };
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
    // Convenience shortcut so consumers don't need to reach into session
    accessToken: session?.access_token || null,
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
