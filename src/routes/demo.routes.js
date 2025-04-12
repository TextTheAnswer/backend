const express = require('express');
const router = express.Router();
const demoController = require('../controllers/demo.controller');

// Get demo user with premium access
router.get('/user', demoController.getDemoUser);

// Get second demo user for testing multiplayer
router.get('/user2', demoController.getSecondDemoUser);

module.exports = router; 