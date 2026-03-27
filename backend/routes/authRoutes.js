import express from 'express';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * Email/Password Auth Routes
 *
 * POST /auth/signup          - Register with email/password
 * POST /auth/login           - Sign in with email/password
 * POST /auth/logout          - Sign out (invalidate token)
 * POST /auth/forgot-password - Send password reset email
 * POST /auth/reset-password  - Set new password (requires active session)
 * POST /auth/verify-email    - Handle email verification callback
 */

/**
 * Validate password strength:
 *  - Minimum 8 characters
 *  - At least 1 uppercase letter
 *  - At least 1 number
 */
function validatePasswordStrength(password) {
  const errors = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least 1 uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least 1 number');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate email format
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// POST /auth/signup - Register a new user
router.post('/signup', loginLimiter, async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    if (!supabase) {
      return res.status(503).json({ error: 'Authentication service is unavailable' });
    }

    const { email, password, name } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        details: passwordCheck.errors,
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: name?.trim() || '',
          full_name: name?.trim() || '',
        },
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Supabase returns a user even if email confirmation is required
    const needsConfirmation = data.user && !data.session;

    console.log(`[Auth] Signup: ${email} (confirmation needed: ${needsConfirmation})`);

    res.status(201).json({
      success: true,
      message: needsConfirmation
        ? 'Account created. Please check your email to verify your account.'
        : 'Account created and verified.',
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
      session: data.session ? {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      } : null,
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/login - Sign in with email/password
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    if (!supabase) {
      return res.status(503).json({ error: 'Authentication service is unavailable' });
    }

    const { email, password } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    console.log(`[Auth] Login: ${email}`);

    res.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || '',
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/logout - Sign out and invalidate token
router.post('/logout', async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    if (!supabase) {
      return res.status(503).json({ error: 'Authentication service is unavailable' });
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[Auth] Logout error:', error.message);
      // Don't fail the request — the client should clear its tokens regardless
    }

    res.json({
      success: true,
      message: 'Signed out successfully',
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/forgot-password - Send password reset email
router.post('/forgot-password', loginLimiter, async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    if (!supabase) {
      return res.status(503).json({ error: 'Authentication service is unavailable' });
    }

    const { email } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    const redirectTo = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo }
    );

    if (error) {
      console.error('[Auth] Password reset error:', error.message);
      // Don't reveal whether the email exists
    }

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/reset-password - Set new password (user has a valid session from the reset link)
router.post('/reset-password', async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    if (!supabase) {
      return res.status(503).json({ error: 'Authentication service is unavailable' });
    }

    const { password, access_token } = req.body;

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        details: passwordCheck.errors,
      });
    }

    // If an access_token is provided (from the reset email redirect), verify it first
    if (access_token) {
      const { data: { user }, error: verifyError } = await supabase.auth.getUser(access_token);
      if (verifyError || !user) {
        return res.status(401).json({ error: 'Invalid or expired reset token' });
      }
    }

    const { data, error } = await supabase.auth.updateUser({ password });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    console.log(`[Auth] Password reset completed for user ${data.user?.id}`);

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/verify-email - Handle email verification callback
router.post('/verify-email', async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    if (!supabase) {
      return res.status(503).json({ error: 'Authentication service is unavailable' });
    }

    const { token_hash, type } = req.body;

    if (!token_hash || !type) {
      return res.status(400).json({ error: 'token_hash and type are required' });
    }

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type || 'email',
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    console.log(`[Auth] Email verified for user ${data.user?.id}`);

    res.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
      session: data.session ? {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      } : null,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
