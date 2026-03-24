import express from 'express';

const router = express.Router();

/**
 * Settings Routes
 * - User profile management
 * - Account deletion
 * - Notification preferences
 */

// Get user settings
router.get('/', async (req, res, next) => {
  try {
    const userId = req.query.userId || 'default';

    // For now, return mock settings
    // TODO: Implement with Supabase auth
    res.json({
      userId,
      profile: {
        name: 'User',
        email: 'user@example.com',
        avatar: null,
      },
      notifications: {
        emailDigest: true,
        webhookAlerts: true,
        weeklyReport: true,
      },
      channels: {
        instagram: null,
        facebook: null,
        email: null,
      },
      apiKeys: [],
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', async (req, res, next) => {
  try {
    const { name, email } = req.body;
    
    // TODO: Implement with Supabase
    res.json({
      success: true,
      message: 'Profile updated',
      profile: { name, email },
    });
  } catch (error) {
    next(error);
  }
});

// Delete account
router.delete('/account', async (req, res, next) => {
  try {
    // TODO: Implement with Supabase
    // - Delete user from auth
    // - Delete all user's data
    // - Delete credentials
    
    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Update notification settings
router.put('/notifications', async (req, res, next) => {
  try {
    const { emailDigest, webhookAlerts, weeklyReport } = req.body;
    
    // TODO: Implement with Supabase
    res.json({
      success: true,
      notifications: { emailDigest, webhookAlerts, weeklyReport },
    });
  } catch (error) {
    next(error);
  }
});

// Connect Instagram/Facebook channel
router.post('/channels/instagram', async (req, res, next) => {
  try {
    const { accessToken, businessId } = req.body;
    
    // TODO: Validate token and store credentials
    res.json({
      success: true,
      channel: 'instagram',
      connected: true,
    });
  } catch (error) {
    next(error);
  }
});

// Disconnect channel
router.delete('/channels/:channelType', async (req, res, next) => {
  try {
    const { channelType } = req.params;
    
    // TODO: Remove credentials from database
    res.json({
      success: true,
      message: `${channelType} disconnected`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
