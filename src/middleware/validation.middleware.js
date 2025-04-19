/**
 * Validation middleware for request validation
 */
const logger = require('../utils/logger');

/**
 * Validates login request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required' 
    });
  }
  
  if (!password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password is required' 
    });
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  next();
};

/**
 * Validates registration request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.validateRegister = (req, res, next) => {
  const { email, password, name, isStudent, studentEmail, yearOfStudy } = req.body;
  
  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required' 
    });
  }
  
  if (!password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password is required' 
    });
  }
  
  if (!name) {
    return res.status(400).json({ 
      success: false, 
      message: 'Name is required' 
    });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  // Password strength check
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long'
    });
  }

  // Check student-specific fields if the user is registering as a student
  if (isStudent) {
    if (!studentEmail) {
      return res.status(400).json({
        success: false,
        message: 'Student email is required for education tier'
      });
    }

    if (!studentEmail.endsWith('.edu')) {
      return res.status(400).json({
        success: false,
        message: 'Student email must have a .edu domain'
      });
    }

    if (!yearOfStudy || yearOfStudy < 1 || yearOfStudy > 7) {
      return res.status(400).json({
        success: false,
        message: 'Year of study must be between 1-7'
      });
    }
  }

  next();
};