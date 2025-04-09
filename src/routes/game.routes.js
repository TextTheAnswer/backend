const express = require('express');
const router = express.Router();
const gameController = require('../controllers/game.controller');
const { authenticate, requirePremium } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Create a new lobby (premium only)
router.post('/lobby', requirePremium, gameController.createLobby);

// Get all public lobbies (premium only)
router.get('/lobbies', requirePremium, gameController.getPublicLobbies);

// Join a lobby by code (premium only)
router.post('/lobby/join', requirePremium, gameController.joinLobby);

// Leave a lobby
router.delete('/lobby/:lobbyId', gameController.leaveLobby);

// Start a game in a lobby (host only)
router.post('/lobby/:lobbyId/start', gameController.startGame);

// Submit an answer in a game
router.post('/answer', gameController.submitGameAnswer);

// Get game results
router.get('/results/:gameId', gameController.getGameResults);

module.exports = router;
