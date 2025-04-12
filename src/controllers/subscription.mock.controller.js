const User = require('../models/user.model');
const Subscription = require('../models/subscription.model');

// Create a mock premium subscription without Stripe
exports.createMockSubscription = async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user already has an active subscription
    if (user.isPremium()) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active premium subscription'
      });
    }
    
    // Set mock customer ID if not exists
    if (!user.subscription.stripeCustomerId) {
      user.subscription.stripeCustomerId = `mock_customer_${user._id}`;
    }
    
    // Set subscription ID
    const mockSubId = `mock_subscription_${Date.now()}`;
    user.subscription.stripeSubscriptionId = mockSubId;
    
    // Update user subscription status
    user.subscription.status = req.body.plan === 'education' ? 'education' : 'premium';
    
    // Set period dates
    const currentDate = new Date();
    user.subscription.currentPeriodStart = currentDate;
    
    // Set period end date based on plan
    const endDate = new Date();
    if (req.body.plan === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1); // Default to monthly
    }
    user.subscription.currentPeriodEnd = endDate;
    
    // Save user
    await user.save();
    
    // Create subscription record
    const subscription = new Subscription({
      user: user._id,
      stripeCustomerId: user.subscription.stripeCustomerId,
      stripeSubscriptionId: mockSubId,
      status: 'active',
      plan: req.body.plan === 'education' ? 'education' : 'premium',
      currentPeriodStart: currentDate,
      currentPeriodEnd: endDate,
      cancelAtPeriodEnd: false
    });
    
    await subscription.save();
    
    res.status(200).json({
      success: true,
      message: `Mock ${req.body.plan || 'premium'} subscription created successfully`,
      subscription: {
        id: mockSubId,
        status: subscription.status,
        plan: subscription.plan,
        currentPeriodEnd: subscription.currentPeriodEnd,
        isPremium: true
      }
    });
  } catch (error) {
    console.error('Create mock subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating mock subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Cancel a mock subscription
exports.cancelMockSubscription = async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user has an active subscription
    if (!user.isPremium()) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription to cancel'
      });
    }
    
    // Get subscription document
    const subscription = await Subscription.findOne({
      user: user._id,
      stripeSubscriptionId: user.subscription.stripeSubscriptionId
    });
    
    if (subscription) {
      subscription.status = 'canceled';
      subscription.cancelAtPeriodEnd = true;
      await subscription.save();
    }
    
    // Update user subscription
    user.subscription.status = 'free'; // Immediate cancellation for simplicity
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Mock subscription canceled successfully'
    });
  } catch (error) {
    console.error('Cancel mock subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error canceling mock subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mock education verification
exports.verifyEducation = async (req, res) => {
  try {
    const { studentEmail, yearOfStudy } = req.body;
    const user = req.user;
    
    // Basic validation
    if (!studentEmail || !studentEmail.includes('.edu') || !yearOfStudy) {
      return res.status(400).json({
        success: false,
        message: 'Valid student email (.edu) and year of study required'
      });
    }
    
    // Update user education info
    user.education = {
      isStudent: true,
      studentEmail,
      yearOfStudy,
      verificationStatus: 'verified' // Auto-verify for testing
    };
    
    // Update subscription status
    user.subscription.status = 'education';
    
    // Set mock customer ID if not exists
    if (!user.subscription.stripeCustomerId) {
      user.subscription.stripeCustomerId = `mock_edu_${user._id}`;
    }
    
    // Set period dates (give 1 year of access)
    const currentDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    user.subscription.currentPeriodStart = currentDate;
    user.subscription.currentPeriodEnd = endDate;
    
    await user.save();
    
    // Create subscription record
    const subscription = new Subscription({
      user: user._id,
      stripeCustomerId: user.subscription.stripeCustomerId,
      status: 'active',
      plan: 'education',
      currentPeriodStart: currentDate,
      currentPeriodEnd: endDate,
      cancelAtPeriodEnd: false
    });
    
    await subscription.save();
    
    res.status(200).json({
      success: true,
      message: 'Education status verified and subscription activated for testing',
      education: {
        status: 'verified',
        studentEmail,
        yearOfStudy
      }
    });
  } catch (error) {
    console.error('Education verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing education verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get mock subscription details
exports.getMockSubscription = async (req, res) => {
  try {
    const user = req.user;
    
    res.status(200).json({
      success: true,
      subscription: {
        status: user.subscription.status,
        plan: user.subscription.status === 'education' ? 'education' : 'premium',
        currentPeriodEnd: user.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: false,
        isPremium: user.isPremium(),
        mock: true
      }
    });
  } catch (error) {
    console.error('Get mock subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching mock subscription details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 