const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt.utils');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        subscription: user.subscription.status,
        isPremium: user.isPremium()
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user has a password (might be Apple OAuth user)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Apple Sign In. Please login with Apple.'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        subscription: user.subscription.status,
        isPremium: user.isPremium()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        subscription: user.subscription,
        stats: user.stats,
        dailyQuiz: user.dailyQuiz,
        isPremium: user.isPremium()
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Apple OAuth callback
exports.appleCallback = async (req, res) => {
  try {
    // This would be handled by Supabase in the actual implementation
    // Here we're just creating a placeholder for the integration
    const { appleId, email, name } = req.body;

    // Check if user already exists with this Apple ID
    let user = await User.findOne({ appleId });
    
    if (!user) {
      // Check if user exists with this email
      user = await User.findOne({ email });
      
      if (user) {
        // Link Apple ID to existing account
        user.appleId = appleId;
        await user.save();
      } else {
        // Create new user
        user = new User({
          email,
          name,
          appleId
        });
        await user.save();
      }
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Apple authentication successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        subscription: user.subscription.status,
        isPremium: user.isPremium()
      }
    });
  } catch (error) {
    console.error('Apple OAuth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error with Apple authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Logout (just a placeholder as JWT is stateless)
exports.logout = (req, res) => {
  // In a real implementation, you might want to blacklist the token
  // or implement a token revocation mechanism
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};
