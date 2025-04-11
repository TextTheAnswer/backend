const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/user.model');
const Subscription = require('../models/subscription.model');

// Create a checkout session for premium subscription
exports.createCheckoutSession = async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user already has an active subscription
    if (user.isPremium()) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active premium subscription'
      });
    }
    
    // Create or retrieve Stripe customer
    let stripeCustomerId;
    
    if (user.subscription.stripeCustomerId) {
      stripeCustomerId = user.subscription.stripeCustomerId;
    } else {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString()
        }
      });
      
      stripeCustomerId = customer.id;
      
      // Update user with Stripe customer ID
      user.subscription.stripeCustomerId = stripeCustomerId;
      await user.save();
    }
    
    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Text the Answer Premium Subscription',
              description: 'Monthly subscription for premium features including multiplayer games'
            },
            unit_amount: 999, // $9.99 in cents
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/subscription/cancel`,
      metadata: {
        userId: user._id.toString()
      }
    });
    
    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating checkout session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Handle Stripe webhook events
exports.handleWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get user's subscription details
exports.getSubscription = async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user has a subscription
    if (!user.subscription.stripeCustomerId) {
      return res.status(200).json({
        success: true,
        subscription: {
          status: 'free',
          isPremium: false
        }
      });
    }
    
    // If user has a subscription ID, get details from Stripe
    if (user.subscription.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(
        user.subscription.stripeSubscriptionId
      );
      
      res.status(200).json({
        success: true,
        subscription: {
          status: user.subscription.status,
          plan: 'premium',
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          isPremium: user.isPremium()
        }
      });
    } else {
      // User has a customer ID but no active subscription
      res.status(200).json({
        success: true,
        subscription: {
          status: user.subscription.status,
          isPremium: user.isPremium()
        }
      });
    }
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user has an active subscription
    if (!user.subscription.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found'
      });
    }
    
    // Cancel subscription at period end
    const subscription = await stripe.subscriptions.update(
      user.subscription.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );
    
    // Update user subscription status
    user.subscription.cancelAtPeriodEnd = true;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Subscription will be canceled at the end of the current billing period',
      subscription: {
        status: user.subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: true
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error canceling subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Award free month of premium
exports.awardFreePremiumMonth = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Admin check
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required'
      });
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Award free month
    await exports.awardFreePremium(user);
    
    res.status(200).json({
      success: true,
      message: 'Free premium month awarded successfully'
    });
  } catch (error) {
    console.error('Award free premium month error:', error);
    res.status(500).json({
      success: false,
      message: 'Error awarding free premium month',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to handle checkout.session.completed event
async function handleCheckoutSessionCompleted(session) {
  try {
    // Get user ID from metadata
    const userId = session.metadata.userId;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    
    // Update user subscription status
    user.subscription.status = 'premium';
    user.subscription.stripeCustomerId = session.customer;
    
    // Save subscription details
    const subscription = new Subscription({
      user: user._id,
      stripeCustomerId: session.customer,
      status: 'active',
      plan: 'premium'
    });
    
    await Promise.all([user.save(), subscription.save()]);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

// Helper function to handle subscription updated event
async function handleSubscriptionUpdated(subscription) {
  try {
    // Get customer ID
    const stripeCustomerId = subscription.customer;
    
    // Find user by Stripe customer ID
    const user = await User.findOne({ 'subscription.stripeCustomerId': stripeCustomerId });
    if (!user) {
      throw new Error(`User not found for customer: ${stripeCustomerId}`);
    }
    
    // Update user subscription details
    user.subscription.stripeSubscriptionId = subscription.id;
    user.subscription.status = subscription.status === 'active' ? 'premium' : 'free';
    user.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    user.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    user.subscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;
    
    // Update subscription in database
    const subscriptionDoc = await Subscription.findOne({ 
      stripeCustomerId,
      user: user._id
    });
    
    if (subscriptionDoc) {
      subscriptionDoc.stripeSubscriptionId = subscription.id;
      subscriptionDoc.status = subscription.status;
      subscriptionDoc.currentPeriodStart = new Date(subscription.current_period_start * 1000);
      subscriptionDoc.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      subscriptionDoc.cancelAtPeriodEnd = subscription.cancel_at_period_end;
      
      await Promise.all([user.save(), subscriptionDoc.save()]);
    } else {
      // Create new subscription document
      const newSubscription = new Subscription({
        user: user._id,
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        plan: 'premium',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      });
      
      await Promise.all([user.save(), newSubscription.save()]);
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

// Helper function to handle subscription deleted event
async function handleSubscriptionDeleted(subscription) {
  try {
    // Get customer ID
    const stripeCustomerId = subscription.customer;
    
    // Find user by Stripe customer ID
    const user = await User.findOne({ 'subscription.stripeCustomerId': stripeCustomerId });
    if (!user) {
      throw new Error(`User not found for customer: ${stripeCustomerId}`);
    }
    
    // Update user subscription status
    user.subscription.status = 'free';
    user.subscription.stripeSubscriptionId = null;
    user.subscription.currentPeriodEnd = null;
    user.subscription.cancelAtPeriodEnd = false;
    
    // Update subscription in database
    const subscriptionDoc = await Subscription.findOne({ 
      stripeCustomerId,
      user: user._id
    });
    
    if (subscriptionDoc) {
      subscriptionDoc.status = 'canceled';
      subscriptionDoc.stripeSubscriptionId = null;
      
      await Promise.all([user.save(), subscriptionDoc.save()]);
    } else {
      await user.save();
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

// Helper function to handle invoice payment succeeded event
async function handleInvoicePaymentSucceeded(invoice) {
  try {
    // Only process subscription invoices
    if (invoice.subscription) {
      // Get customer ID
      const stripeCustomerId = invoice.customer;
      
      // Find user by Stripe customer ID
      const user = await User.findOne({ 'subscription.stripeCustomerId': stripeCustomerId });
      if (!user) {
        throw new Error(`User not found for customer: ${stripeCustomerId}`);
      }
      
      // Update user subscription status
      user.subscription.status = 'premium';
      
      await user.save();
    }
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

// Helper function to handle invoice payment failed event
async function handleInvoicePaymentFailed(invoice) {
  try {
    // Only process subscription invoices
    if (invoice.subscription) {
      // Get customer ID
      const stripeCustomerId = invoice.customer;
      
      // Find user by Stripe customer ID
      const user = await User.findOne({ 'subscription.stripeCustomerId': stripeCustomerId });
      if (!user) {
        throw new Error(`User not found for customer: ${stripeCustomerId}`);
      }
      
      // Update user subscription status if payment fails repeatedly
      if (invoice.attempt_count > 3) {
        user.subscription.status = 'free';
      }
      
      await user.save();
    }
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

// Helper function to award free premium month to a user
exports.awardFreePremium = async function(user) {
  try {
    // Calculate end date (1 month from now)
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    
    // Update user's subscription
    user.subscription.status = 'premium';
    user.subscription.currentPeriodEnd = endDate;
    user.subscription.isFreeAward = true; // Flag to indicate this was a free award
    
    await user.save();
    
    // Create a record in the Subscription model
    const subscription = new Subscription({
      user: user._id,
      status: 'active',
      plan: 'premium',
      isFreeAward: true,
      currentPeriodStart: new Date(),
      currentPeriodEnd: endDate,
      notes: 'Free month awarded for daily quiz leaderboard win'
    });
    
    await subscription.save();
    
    console.log(`Free premium month awarded to user ${user._id} until ${endDate}`);
    return true;
  } catch (error) {
    console.error('Error awarding free premium:', error);
    return false;
  }
};
