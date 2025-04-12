const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt.utils');
const emailService = require('../services/email.service');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { email, password, name, isStudent, studentEmail, yearOfStudy } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user with basic info
    const user = new User({
      email,
      password,
      name
    });

    // Handle education tier registration if applicable
    if (isStudent) {
      // Check if a valid student email is provided
      if (!studentEmail || !studentEmail.endsWith('.edu')) {
        return res.status(400).json({
          success: false,
          message: 'Valid student email with .edu domain is required for education tier'
        });
      }

      // Check if year of study is provided and valid
      if (!yearOfStudy || yearOfStudy < 1 || yearOfStudy > 7) {
        return res.status(400).json({
          success: false,
          message: 'Valid year of study (1-7) is required for education tier'
        });
      }

      // Set education tier specific fields
      user.subscription.status = 'education';
      user.education = {
        isStudent: true,
        studentEmail,
        yearOfStudy,
        verificationStatus: 'pending' // Will require verification
      };
    }

    await user.save();

    // Send verification email for student accounts
    if (isStudent) {
      await emailService.sendStudentVerificationEmail(
        user.education.studentEmail,
        user.name,
        user._id
      );
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: isStudent ? 'Student account registered successfully. Please check your student email for verification.' : 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        subscription: user.subscription.status,
        isPremium: user.isPremium(),
        education: isStudent ? {
          status: 'pending',
          studentEmail: user.education.studentEmail,
          yearOfStudy: user.education.yearOfStudy
        } : undefined
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
        isPremium: user.isPremium(),
        education: user.education && user.education.isStudent ? {
          status: user.education.verificationStatus,
          studentEmail: user.education.studentEmail,
          yearOfStudy: user.education.yearOfStudy
        } : undefined
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

// Verify student email
exports.verifyStudentEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    // In a real implementation, this would validate a verification token
    // Here we're just simulating the verification process
    
    // Decode the token to get the user ID (this is simplified)
    const userId = token.split('_')[0]; // Just an example of token format
    
    const user = await User.findById(userId);
    if (!user || !user.education || !user.education.isStudent) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }
    
    // Update verification status
    user.education.verificationStatus = 'verified';
    await user.save();
    
    // Send confirmation email
    await emailService.sendVerificationSuccessEmail(
      user.education.studentEmail,
      user.name
    );
    
    res.status(200).json({
      success: true,
      message: 'Student email verified successfully. You now have access to education tier benefits.'
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying student email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
