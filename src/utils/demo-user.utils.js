const User = require('../models/user.model');
const Subscription = require('../models/subscription.model');
const bcrypt = require('bcrypt');
const { generateToken } = require('./jwt.utils');

/**
 * Creates or updates a demo user with full premium access
 * This user can be used to test all premium features
 */
exports.createDemoUser = async () => {
  try {
    // Demo user credentials
    const demoEmail = 'demo@texttheanswer.com';
    const demoPassword = 'demo123';
    const demoName = 'Demo User';
    
    // Check if demo user already exists
    let demoUser = await User.findOne({ email: demoEmail });
    
    if (!demoUser) {
      console.log('Creating new demo user...');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(demoPassword, salt);
      
      // Create new demo user
      demoUser = new User({
        email: demoEmail,
        password: hashedPassword,
        name: demoName
      });
    } else {
      console.log('Demo user already exists, updating...');
    }
    
    // Set up premium subscription
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 10); // 10 years of premium access
    
    demoUser.subscription = {
      status: 'premium',
      stripeCustomerId: 'demo_customer',
      stripeSubscriptionId: 'demo_subscription',
      currentPeriodStart: new Date(),
      currentPeriodEnd: endDate
    };
    
    // Setup education info as well
    demoUser.education = {
      isStudent: true,
      studentEmail: 'demo@university.edu',
      yearOfStudy: 3,
      verificationStatus: 'verified'
    };
    
    // Set some stats to make the account look used
    demoUser.stats = {
      streak: 5,
      lastPlayed: new Date(),
      totalCorrect: 42,
      totalAnswered: 50
    };
    
    // Create or update subscription record
    await Subscription.findOneAndUpdate(
      { user: demoUser._id },
      {
        user: demoUser._id,
        stripeCustomerId: 'demo_customer',
        stripeSubscriptionId: 'demo_subscription',
        status: 'active',
        plan: 'premium',
        currentPeriodStart: new Date(),
        currentPeriodEnd: endDate,
        cancelAtPeriodEnd: false
      },
      { upsert: true, new: true }
    );
    
    // Save user
    await demoUser.save();
    
    console.log('Demo user created/updated successfully');
    return demoUser;
  } catch (error) {
    console.error('Error creating demo user:', error);
    throw error;
  }
};

/**
 * Creates or updates a second demo user with premium access
 * This user can be used alongside the main demo user to test multiplayer features
 */
exports.createSecondDemoUser = async () => {
  try {
    // Second demo user credentials
    const demoEmail = 'demo2@texttheanswer.com';
    const demoPassword = 'demo123';
    const demoName = 'Demo Player 2';
    
    // Check if second demo user already exists
    let demoUser = await User.findOne({ email: demoEmail });
    
    if (!demoUser) {
      console.log('Creating second demo user...');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(demoPassword, salt);
      
      // Create new demo user
      demoUser = new User({
        email: demoEmail,
        password: hashedPassword,
        name: demoName
      });
    } else {
      console.log('Second demo user already exists, updating...');
    }
    
    // Set up premium subscription
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 10); // 10 years of premium access
    
    demoUser.subscription = {
      status: 'premium',
      stripeCustomerId: 'demo_customer_2',
      stripeSubscriptionId: 'demo_subscription_2',
      currentPeriodStart: new Date(),
      currentPeriodEnd: endDate
    };
    
    // Set some stats to make the account look used
    demoUser.stats = {
      streak: 3,
      lastPlayed: new Date(),
      totalCorrect: 27,
      totalAnswered: 35
    };
    
    // Create or update subscription record
    await Subscription.findOneAndUpdate(
      { user: demoUser._id },
      {
        user: demoUser._id,
        stripeCustomerId: 'demo_customer_2',
        stripeSubscriptionId: 'demo_subscription_2',
        status: 'active',
        plan: 'premium',
        currentPeriodStart: new Date(),
        currentPeriodEnd: endDate,
        cancelAtPeriodEnd: false
      },
      { upsert: true, new: true }
    );
    
    // Save user
    await demoUser.save();
    
    console.log('Second demo user created/updated successfully');
    return demoUser;
  } catch (error) {
    console.error('Error creating second demo user:', error);
    throw error;
  }
};

/**
 * Get a JWT token for the demo user
 * This can be used for direct access
 */
exports.getDemoUserToken = async () => {
  try {
    const demoUser = await exports.createDemoUser();
    return generateToken(demoUser._id);
  } catch (error) {
    console.error('Error getting demo user token:', error);
    throw error;
  }
};

/**
 * Get a JWT token for the second demo user
 * This can be used for testing multiplayer features
 */
exports.getSecondDemoUserToken = async () => {
  try {
    const secondDemoUser = await exports.createSecondDemoUser();
    return generateToken(secondDemoUser._id);
  } catch (error) {
    console.error('Error getting second demo user token:', error);
    throw error;
  }
}; 