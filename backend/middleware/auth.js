/**
 * Auth Middleware — Supabase JWT verification
 *
 * Verifies the Supabase access token from the Authorization header.
 * This replaces the old custom JWT approach with Supabase Auth.
 */
import { supabase } from '../server.js';

/**
 * Require authentication via Supabase JWT
 */
export const requireAuth = async (req, res, next) => {
  // If Supabase is not configured, the service cannot authenticate users
  if (!supabase) {
    return res.status(503).json({
      error: 'Service not configured',
      message: 'Authentication service is unavailable. Please configure Supabase credentials.'
    });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Missing authorization token',
      message: 'Please provide a valid Supabase access token in the Authorization header'
    });
  }

  try {
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        message: error?.message || 'Authentication failed'
      });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      metadata: user.user_metadata,
    };

    // Attach supabase client scoped to this user's token
    req.supabaseUser = supabase;

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
};

/**
 * Optional authentication — doesn't fail if token is missing
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (token) {
    try {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        req.user = {
          userId: user.id,
          email: user.email,
          metadata: user.user_metadata,
        };
      }
    } catch (error) {
      // Token invalid but optional
    }
  }

  next();
};

/**
 * Check if user has required permission
 */
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    // Extend with role-based permissions as needed
    next();
  };
};
