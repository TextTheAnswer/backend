const express = require('express');
const router = express.Router();
const path = require('path');

// Serve the API tester interface
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/api-tester/index.html'));
});

// Create demo users for testing
router.get('/demo-user/:tier', async (req, res) => {
  try {
    const { tier } = req.params;
    const User = require('../models/user.model');
    const jwt = require('jsonwebtoken');
    const bcrypt = require('bcryptjs');
    
    // Generate a random password
    const password = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create a demo user based on tier
    let user;
    const email = `demo-${tier}@texttheanswer.com`;
    
    // Check if user already exists
    let existingUser = await User.findOne({ email });
    
    if (existingUser) {
      user = existingUser;
    } else {
      // Create new user with appropriate tier
      user = new User({
        name: `Demo ${tier.charAt(0).toUpperCase() + tier.slice(1)} User`,
        email,
        password: hashedPassword
      });
      
      // Set subscription status based on tier
      if (tier === 'premium' || tier === 'education') {
        user.subscription.status = tier;
        user.subscription.stripeCustomerId = `demo_customer_${tier}`;
        
        // Set expiration date to 30 days from now
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        user.subscription.currentPeriodEnd = expiryDate;
        user.subscription.freeTrialUsed = true;
      }
      
      // Set education tier specific properties
      if (tier === 'education') {
        user.isStudent = true;
        user.studentVerification = {
          status: 'verified',
          verifiedAt: new Date()
        };
      }
      
      await user.save();
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );
    
    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Demo user creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating demo user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
