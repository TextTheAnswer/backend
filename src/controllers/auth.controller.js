const User = require('../models/user.model');
const { generateToken, blacklistToken } = require('../utils/jwt.utils');
const emailService = require('../services/email.service');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
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
    logger.info(`New user registered with email: ${email}`);

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
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user'
    });
  }
};

/**
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      logger.debug(`Login attempt failed for non-existent email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user has a password (might be Apple OAuth user)
    if (!user.password) {
      logger.debug(`Login attempt for Apple OAuth user: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'This account uses Apple Sign In. Please login with Apple.'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.debug(`Login attempt with incorrect password for: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);
    logger.info(`User logged in: ${email}`);

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
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in'
    });
  }
};

/**
 * Get user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      logger.warn(`Profile request for non-existent user ID: ${req.user.id}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.debug(`Profile retrieved for user: ${user.email}`);
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
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile'
    });
  }
};

/**
 * Apple OAuth callback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.appleCallback = async (req, res) => {
  try {
    const { appleId, email, name } = req.body;
    
    if (!appleId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Apple ID and email are required'
      });
    }
    
    logger.info(`Apple OAuth callback received for email: ${email}`);

    // Check if user already exists with this Apple ID
    let user = await User.findOne({ appleId });
    
    if (!user) {
      // Check if user exists with this email
      user = await User.findOne({ email });
      
      if (user) {
        // Link Apple ID to existing account
        logger.info(`Linking Apple ID to existing account: ${email}`);
        user.appleId = appleId;
        await user.save();
      } else {
        // Create new user
        logger.info(`Creating new user via Apple OAuth: ${email}`);
        user = new User({
          email,
          name: name || email.split('@')[0], // Use part of email as name if not provided
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
    logger.error('Apple OAuth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error with Apple authentication'
    });
  }
};

/**
 * Logout user by blacklisting the token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.logout = (req, res) => {
  try {
    // Blacklist the token
    const token = req.token;
    const success = blacklistToken(token);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Error logging out'
      });
    }
    
    logger.info(`User logged out: ${req.user.id}`);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out'
    });
  }
};

/**
 * Verify student email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.verifyStudentEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }
    
    // In a real implementation, this would validate a verification token
    // Here we're implementing a more secure version
    
    // Split the token to get the user ID and verification code
    const [userId, verificationCode] = token.split('_');
    
    if (!userId || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token format'
      });
    }
    
    const user = await User.findById(userId);
    if (!user || !user.education || !user.education.isStudent) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }
    
    // In a real implementation, we would verify the code against a stored value
    // For now, we'll simulate verification
    
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
    logger.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying student email'
    });
  }
};

/**
 * Create a demo user with premium tier access
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createDemoUser = async (req, res) => {
    try {
        // Check if demo user already exists
        const existingUser = await User.findOne({ email: 'demo-premium@texttheanswer.com' });
        
        if (existingUser) {
            // Return the existing demo user
            const token = generateToken(existingUser._id);
            return res.status(200).json({
                success: true,
                message: 'Premium demo user logged in',
                token,
                user: {
                    id: existingUser._id,
                    name: existingUser.name,
                    email: existingUser.email,
                    subscription: existingUser.subscription
                }
            });
        }
        
        // Generate a secure random password
        const demoPassword = crypto.randomBytes(12).toString('hex');
        
        // Create a new demo user
        const newUser = new User({
            name: 'Premium Demo User',
            email: 'demo-premium@texttheanswer.com',
            password: await bcrypt.hash(demoPassword, 10),
            subscription: {
                status: 'premium',
                stripeCustomerId: 'demo_customer_premium',
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                freeTrialUsed: true
            },
            stats: {
                streak: 5,
                lastPlayed: new Date(),
                totalCorrect: 150,
                totalAnswered: 200
            }
        });
        
        await newUser.save();
        
        // Generate JWT token
        const token = generateToken(newUser._id);
        
        res.status(201).json({
            success: true,
            message: 'Premium demo user created successfully',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                subscription: newUser.subscription,
                isPremium: true
            }
        });
    } catch (error) {
        logger.error('Error creating premium demo user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating premium demo user' 
        });
    }
};

/**
 * Create a free tier demo user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createFreeDemoUser = async (req, res) => {
    try {
        // Check if demo user already exists
        const existingUser = await User.findOne({ email: 'demo-free@texttheanswer.com' });
        
        if (existingUser) {
            // Return the existing demo user
            const token = generateToken(existingUser._id);
            return res.status(200).json({
                success: true,
                message: 'Free demo user logged in',
                token,
                user: {
                    id: existingUser._id,
                    name: existingUser.name,
                    email: existingUser.email,
                    subscription: existingUser.subscription
                }
            });
        }
        
        // Generate a secure random password
        const demoPassword = crypto.randomBytes(12).toString('hex');
        
        // Create a new demo user
        const newUser = new User({
            name: 'Free Demo User',
            email: 'demo-free@texttheanswer.com',
            password: await bcrypt.hash(demoPassword, 10),
            subscription: {
                status: 'free'
            },
            stats: {
                streak: 2,
                lastPlayed: new Date(),
                totalCorrect: 45,
                totalAnswered: 70
            }
        });
        
        await newUser.save();
        
        // Generate JWT token
        const token = generateToken(newUser._id);
        
        res.status(201).json({
            success: true,
            message: 'Free demo user created successfully',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                subscription: newUser.subscription,
                isPremium: false
            }
        });
    } catch (error) {
        logger.error('Error creating free demo user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating free demo user' 
        });
    }
};

/**
 * Create an education tier demo user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createEducationDemoUser = async (req, res) => {
    try {
        // Check if demo user already exists
        const existingUser = await User.findOne({ email: 'demo-education@texttheanswer.com' });
        
        if (existingUser) {
            // Return the existing demo user
            const token = generateToken(existingUser._id);
            return res.status(200).json({
                success: true,
                message: 'Education demo user logged in',
                token,
                user: {
                    id: existingUser._id,
                    name: existingUser.name,
                    email: existingUser.email,
                    subscription: existingUser.subscription
                }
            });
        }
        
        // Generate a secure random password
        const demoPassword = crypto.randomBytes(12).toString('hex');
        
        // Create a new demo user
        const newUser = new User({
            name: 'Education Demo User',
            email: 'demo-education@texttheanswer.com',
            password: await bcrypt.hash(demoPassword, 10),
            subscription: {
                status: 'education',
                stripeCustomerId: 'demo_customer_education',
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            },
            education: {
                isStudent: true,
                studentEmail: 'student@university.edu',
                yearOfStudy: 3,
                verificationStatus: 'verified'
            },
            stats: {
                streak: 7,
                lastPlayed: new Date(),
                totalCorrect: 200,
                totalAnswered: 250
            }
        });
        
        await newUser.save();
        
        // Generate JWT token
        const token = generateToken(newUser._id);
        
        res.status(201).json({
            success: true,
            message: 'Education demo user created successfully',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                subscription: newUser.subscription,
                education: newUser.education,
                isPremium: true,
                isEducation: true
            }
        });
    } catch (error) {
        logger.error('Error creating education demo user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating education demo user' 
        });
    }
};
