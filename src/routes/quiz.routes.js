const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public routes
// None

// Protected routes - require authentication
router.get('/daily', authMiddleware.authenticate, quizController.getDailyQuestions);
router.post('/daily/submit', authMiddleware.authenticate, quizController.submitAnswer);
router.post('/daily/submit-bulk', authMiddleware.authenticate, quizController.submitAnswersBulk);
router.get('/daily/leaderboard', authMiddleware.authenticate, quizController.getDailyLeaderboard);
router.get('/categories', authMiddleware.authenticate, quizController.getCategories);

// Premium routes - require premium subscription
router.get('/upcoming-themes', 
  authMiddleware.authenticate, 
  authMiddleware.requirePremium, 
  quizController.getUpcomingThemes
);

// Admin routes
router.post('/categories', 
  authMiddleware.authenticate, 
  authMiddleware.requireAdmin, 
  quizController.createCategory
);

router.post('/schedule-theme', 
  authMiddleware.authenticate, 
  authMiddleware.requireAdmin, 
  quizController.scheduleTheme
);

// Development routes
if (process.env.NODE_ENV === 'development') {
  router.post('/reset', authMiddleware.authenticate, quizController.resetDailyQuiz);
}

module.exports = router;
