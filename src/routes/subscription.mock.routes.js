const express = require('express');
const router = express.Router();
const subscriptionMockController = require('../controllers/subscription.mock.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Create a mock subscription
router.post('/create', authenticate, subscriptionMockController.createMockSubscription);

// Cancel a mock subscription
router.post('/cancel', authenticate, subscriptionMockController.cancelMockSubscription);

// Verify education status and create education tier subscription
router.post('/verify-education', authenticate, subscriptionMockController.verifyEducation);

// Get subscription details
router.get('/details', authenticate, subscriptionMockController.getMockSubscription);

module.exports = router; 