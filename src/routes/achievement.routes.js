const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievement.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public routes
router.get('/', achievementController.getAllAchievements);

// Protected routes (premium/education only)
router.get('/user', authMiddleware.authenticate, achievementController.getUserAchievements);
router.post('/:achievementId/viewed', authMiddleware.authenticate, achievementController.markAchievementViewed);

// Admin routes
router.post('/', 
  authMiddleware.authenticate, 
  authMiddleware.requireAdmin, 
  achievementController.createAchievement
);

router.delete('/:achievementId', 
  authMiddleware.authenticate, 
  authMiddleware.requireAdmin, 
  achievementController.deleteAchievement
);

module.exports = router;