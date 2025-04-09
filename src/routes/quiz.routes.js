const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const { authenticate, requirePremium } = require('../middleware/auth.middleware');

// Get today's quiz questions (protected route)
router.get('/daily', authenticate, quizController.getDailyQuestions);

// Submit answer for daily quiz (protected route)
router.post('/daily/submit', authenticate, quizController.submitAnswer);

// Get daily quiz leaderboard
router.get('/daily/leaderboard', authenticate, quizController.getDailyLeaderboard);

// Reset daily quiz (development only)
router.post('/daily/reset', authenticate, quizController.resetDailyQuiz);

module.exports = router;
