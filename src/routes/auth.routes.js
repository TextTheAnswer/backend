const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate, rateLimitAuth } = require('../middleware/auth.middleware');
const { validateLogin, validateRegister } = require('../middleware/validation.middleware');

// Apply rate limiting to authentication routes
router.use(rateLimitAuth);

// Register new user
router.post('/register', validateRegister, authController.register);

// Login user
router.post('/login', validateLogin, authController.login);

// Apple OAuth callback
router.post('/apple/callback', authController.appleCallback);

// Get user profile (protected route)
router.get('/profile', authenticate, authController.getProfile);

// Logout user
router.post('/logout', authenticate, authController.logout);

// Verify student email
router.get('/verify-student/:token', authController.verifyStudentEmail);

// Demo user routes
router.post('/demo/premium', authController.createDemoUser);
router.post('/demo/free', authController.createFreeDemoUser);
router.post('/demo/education', authController.createEducationDemoUser);

module.exports = router;
