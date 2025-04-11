const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Register new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Apple OAuth callback
router.post('/apple/callback', authController.appleCallback);

// Get user profile (protected route)
router.get('/profile', authenticate, authController.getProfile);

// Logout user
router.post('/logout', authenticate, authController.logout);

// Verify student email
router.get('/verify-student/:token', authController.verifyStudentEmail);

module.exports = router;
