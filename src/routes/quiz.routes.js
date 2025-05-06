const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Debug logs
console.log('Quiz Controller Functions Available:', Object.keys(quizController));
console.log('submitAnswer exists:', !!quizController.submitAnswer);

// Public routes
// None

// Protected routes - require authentication
router.get('/daily', authMiddleware.authenticate, quizController.getDailyQuestions);
router.post('/daily/answer', authMiddleware.authenticate, quizController.submitAnswer);
router.get('/daily/stats', authMiddleware.authenticate, quizController.getDailyStats);
router.get('/daily/leaderboard', authMiddleware.authenticate, quizController.getDailyLeaderboard);

// New daily quiz event routes
router.get('/events/upcoming', authMiddleware.authenticate, quizController.getUpcomingEvents);
router.get('/events/:quizId/:eventId', authMiddleware.authenticate, quizController.getEventDetails);
router.get('/events/:quizId/:eventId/leaderboard', authMiddleware.authenticate, quizController.getEventLeaderboard);

// Admin routes
router.post('/category', authMiddleware.authenticate, authMiddleware.requireAdmin, quizController.createCategory);
router.put('/category/:id', authMiddleware.authenticate, authMiddleware.requireAdmin, quizController.updateCategory);
router.delete('/category/:id', authMiddleware.authenticate, authMiddleware.requireAdmin, quizController.deleteCategory);
router.get('/category', authMiddleware.authenticate, quizController.getCategories);

router.post('/question', authMiddleware.authenticate, authMiddleware.requireAdmin, quizController.createQuestion);
router.put('/question/:id', authMiddleware.authenticate, authMiddleware.requireAdmin, quizController.updateQuestion);
router.delete('/question/:id', authMiddleware.authenticate, authMiddleware.requireAdmin, quizController.deleteQuestion);
router.get('/question', authMiddleware.authenticate, quizController.getQuestions);
router.get('/question/:id', authMiddleware.authenticate, quizController.getQuestionById);
router.post('/questions/generate', authMiddleware.authenticate, authMiddleware.requireAdmin, quizController.generateQuestions);

// New admin routes for daily quiz events
router.post('/events/start', authMiddleware.authenticate, authMiddleware.requireAdmin, quizController.startEvent);
router.post('/events/end', authMiddleware.authenticate, authMiddleware.requireAdmin, quizController.endEvent);
router.post('/schedule-theme', authMiddleware.authenticate, authMiddleware.requireAdmin, quizController.scheduleTheme);

// Premium routes - require premium subscription
router.get('/upcoming-themes', 
  authMiddleware.authenticate, 
  authMiddleware.requirePremium, 
  quizController.getUpcomingThemes
);

// Development routes
if (process.env.NODE_ENV === 'development') {
  router.post('/reset', authMiddleware.authenticate, quizController.resetDailyQuiz);
}

module.exports = router;
