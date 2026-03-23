import jwt from 'jsonwebtoken';

/**
 * JWT Authentication Middleware
 */

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Missing authorization token',
      message: 'Please provide a valid JWT token in the Authorization header'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId || decoded.sub,
      email: decoded.email
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please refresh your token.'
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid or malformed.'
      });
    }

    return res.status(401).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
};

/**
 * Generate JWT token
 */
export const generateToken = (userId, email) => {
  const payload = {
    userId,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };

  return jwt.sign(payload, process.env.JWT_SECRET);
};

/**
 * Optional authentication - doesn't fail if token is missing
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        userId: decoded.userId || decoded.sub,
        email: decoded.email
      };
    } catch (error) {
      // Token invalid but optional, just log and continue
      console.debug('Optional auth token validation failed:', error.message);
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

    // Check user permissions (implement based on your permission system)
    // This is a placeholder - extend as needed
    req.userHasPermission = (perm) => true; // Implement your logic

    if (!req.userHasPermission(permission)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires the "${permission}" permission`
      });
    }

    next();
  };
};
