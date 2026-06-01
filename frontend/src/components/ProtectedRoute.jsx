import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

// Dev-mode bypass — when Supabase is not configured, skip auth entirely so the
// full app (dashboard, leads, scrapers, etc.) is usable locally. Gated behind
// import.meta.env.DEV so a production build never bypasses auth, even if the
// Supabase env vars are missing or still set to placeholders.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const IS_DEV_MODE = import.meta.env.DEV &&
  (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl.includes('YOUR_PROJECT'));

const DEV_USER = {
  id: 'dev-local-user',
  email: 'dev@localhost',
  user_metadata: { full_name: 'Local Developer' },
};

/**
 * ProtectedRoute - Wraps dashboard and authenticated pages
 * 
 * - In dev mode (no Supabase), allows access with a mock user
 * - In production, checks Supabase auth
 * - Shows loading state while checking
 * - Redirects to login if not authenticated
 */
export function ProtectedRoute({ children }) {
  const [user, setUser] = useState(IS_DEV_MODE ? DEV_USER : null);
  const [loading, setLoading] = useState(!IS_DEV_MODE);
  const navigate = useNavigate();

  useEffect(() => {
    // Skip auth checks in dev mode
    if (IS_DEV_MODE) return;

    checkAuth();
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (session?.user) {
        setUser(session.user);
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('User authenticated:', session.user.email);
        setUser(session.user);
      } else {
        console.log('No authenticated user');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return children;
}

// useAuth is exported from AuthContext.jsx — import from there instead of here.
