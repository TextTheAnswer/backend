const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Create checkout session for premium subscription (requires authentication)
router.post('/checkout', authenticate, subscriptionController.createCheckoutSession);

// Get user's subscription details (requires authentication)
router.get('/details', authenticate, subscriptionController.getSubscription);

// Cancel subscription (requires authentication)
router.post('/cancel', authenticate, subscriptionController.cancelSubscription);

// Stripe webhook handler (no authentication, uses Stripe signature)
router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);

// Award free premium month (admin only)
router.post('/award-free-month', authenticate, subscriptionController.awardFreePremiumMonth);

module.exports = router;
