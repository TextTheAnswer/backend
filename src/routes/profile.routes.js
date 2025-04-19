const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { upload, cleanupFiles } = require('../middleware/upload.middleware');
const { authenticate } = require('../middleware/auth.middleware');

// Profile routes (now authenticated)
router.post('/create', authenticate, profileController.createProfile);
router.put('/', authenticate, profileController.updateProfile);
router.get('/full', authenticate, profileController.getFullProfile);
router.post('/password/change', authenticate, profileController.changePassword);

// Profile image routes
router.post('/image', authenticate, cleanupFiles, upload.single('image'), profileController.uploadProfileImage);
router.delete('/image', authenticate, profileController.deleteProfileImage);

// Password reset routes (these remain public)
router.post('/password-reset/request', profileController.requestPasswordReset);
router.post('/password-reset/verify', profileController.verifyOTP);
router.post('/password-reset/reset', profileController.resetPassword);

module.exports = router; 