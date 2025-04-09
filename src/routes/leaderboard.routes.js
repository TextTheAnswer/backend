const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Get daily leaderboard
router.get('/daily', leaderboardController.getDailyLeaderboard);

// Get multiplayer game leaderboard (requires authentication)
router.get('/game/:gameId', authenticate, leaderboardController.getGameLeaderboard);

module.exports = router;
