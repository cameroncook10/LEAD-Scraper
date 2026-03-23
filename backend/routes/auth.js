import express from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user in Supabase
    const { data: user, error: authError } = await supabase.auth.signUpWithPassword({
      email,
      password,
    });

    if (authError) {
      return res.status(400).json({ message: authError.message });
    }

    // Store user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: user.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          created_at: new Date().toISOString(),
        },
      ]);

    if (profileError) {
      return res.status(400).json({ message: 'Failed to create user profile' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.user.id, email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: user.user.id,
        email,
        firstName,
        lastName,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/login
 * Login a user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email or password' });
    }

    // Authenticate with Supabase
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      return res.status(400).json({ message: 'User profile not found' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: data.user.id, email: data.user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, timezone')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      timezone: user.timezone,
    });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, timezone } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        timezone: timezone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: 'Failed to update profile' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      timezone: user.timezone,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Missing passwords' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Verify current password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: req.user.email,
      password: currentPassword,
    });

    if (authError) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return res.status(400).json({ message: 'Failed to change password' });
    }

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/auth/preferences
 * Update user preferences
 */
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const { scrapingSources, leadLimit, autoQualify, dailySchedule } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({
        preferences: {
          scrapingSources,
          leadLimit,
          autoQualify,
          dailySchedule,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: 'Failed to update preferences' });
    }

    return res.json({ message: 'Preferences updated' });
  } catch (error) {
    console.error('Preferences error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
