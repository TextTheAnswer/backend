const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Profile routes (protected)
router.put('/', authenticate, profileController.updateProfile);
router.get('/full', authenticate, profileController.getFullProfile);
router.post('/password/change', authenticate, profileController.changePassword);

// Password reset routes (public)
router.post('/password-reset/request', profileController.requestPasswordReset);
router.post('/password-reset/verify', profileController.verifyOTP);
router.post('/password-reset/reset', profileController.resetPassword);

module.exports = router; 