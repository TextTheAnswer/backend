const jwt = require('jsonwebtoken');
require('dotenv').config();
const logger = require('./logger');

/**
 * Generate JWT token for user authentication
 * @param {string} userId - User ID to encode in the token
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  try {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );
  } catch (error) {
    logger.error('Error generating JWT token:', error);
    throw new Error('Failed to generate authentication token');
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.error('JWT verification error:', error);
    throw new Error('Invalid or expired token');
  }
};

/**
 * Add token to blacklist for logout functionality
 * @param {string} token - JWT token to blacklist
 * @returns {boolean} Success status
 */
const blacklistToken = (token) => {
  try {
    // Decode token without verification to get expiry
    const decoded = jwt.decode(token);
    if (!decoded) {
      return false;
    }
    
    // Calculate TTL (time to live) for Redis storage
    const expiryTime = decoded.exp;
    const currentTime = Math.floor(Date.now() / 1000);
    const ttl = expiryTime - currentTime;
    
    if (ttl <= 0) {
      // Token already expired, no need to blacklist
      return true;
    }
    
    // In a real implementation, we would store this in Redis with TTL
    // For now, we'll use a simple in-memory store with setTimeout for cleanup
    tokenBlacklist.set(token, true);
    setTimeout(() => {
      tokenBlacklist.delete(token);
    }, ttl * 1000);
    
    return true;
  } catch (error) {
    logger.error('Error blacklisting token:', error);
    return false;
  }
};

/**
 * Check if token is blacklisted
 * @param {string} token - JWT token to check
 * @returns {boolean} True if blacklisted, false otherwise
 */
const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

// In-memory token blacklist (would be replaced with Redis in production)
const tokenBlacklist = new Map();

module.exports = {
  generateToken,
  verifyToken,
  blacklistToken,
  isTokenBlacklisted
};
