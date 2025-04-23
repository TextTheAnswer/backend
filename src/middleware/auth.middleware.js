const { verifyToken, isTokenBlacklisted } = require('../utils/jwt.utils');
const User = require('../models/user.model');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate user using JWT
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Check if token is blacklisted (logged out)
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User is logged out.'
      });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Find user by id
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }
    
    // Add user to request object
    req.user = user;
    req.token = token; // Store token for potential blacklisting on logout
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Invalid token.'
    });
  }
};

/**
 * Middleware to check if user has premium subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.requirePremium = (req, res, next) => {
  if (!req.user.subscription || req.user.subscription.status !== 'premium') {
    return res.status(403).json({
      success: false,
      message: 'Premium subscription required for this feature.'
    });
  }
  next();
};

/**
 * Middleware to check if user has education tier subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.requireEducation = (req, res, next) => {
  if (!req.user.subscription || req.user.subscription.status !== 'education') {
    return res.status(403).json({
      success: false,
      message: 'Education tier subscription required for this feature.'
    });
  }
  next();
};

/**
 * Middleware to check if user is an admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required for this feature.'
    });
  }
  next();
};

/**
 * Middleware to implement rate limiting for authentication endpoints
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.rateLimitAuth = (req, res, next) => {
  // Get client IP
  const clientIp = req.ip || req.connection.remoteAddress;
  
  // Get current timestamp
  const now = Date.now();
  
  // Check if IP is in the rate limit map
  if (rateLimitMap.has(clientIp)) {
    const rateLimitData = rateLimitMap.get(clientIp);
    
    // Check if window has expired
    if (now - rateLimitData.windowStart > RATE_LIMIT_WINDOW_MS) {
      // Reset window
      rateLimitMap.set(clientIp, {
        windowStart: now,
        count: 1
      });
      return next();
    }
    
    // Check if limit exceeded
    if (rateLimitData.count >= RATE_LIMIT_MAX_REQUESTS) {
      logger.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }
    
    // Increment count
    rateLimitData.count++;
    rateLimitMap.set(clientIp, rateLimitData);
  } else {
    // First request from this IP
    rateLimitMap.set(clientIp, {
      windowStart: now,
      count: 1
    });
  }
  
  next();
};

// Rate limiting constants
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per window

// In-memory rate limit store (would be replaced with Redis in production)
const rateLimitMap = new Map();

// Clean up rate limit map periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}, 60 * 1000); // Clean up every minute
