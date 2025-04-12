const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const emailService = require('../services/email.service');
const crypto = require('crypto');

// Store OTPs temporarily (in production, use Redis or a database)
const otpStore = new Map();

/**
 * Create or update user profile
 * @route PUT /api/profile
 * @access Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update basic profile information
    if (name) user.name = name;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        subscription: user.subscription.status,
        stats: user.stats,
        isPremium: user.isPremium()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get comprehensive profile data
 * @route GET /api/profile/full
 * @access Private
 */
exports.getFullProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find user by ID with all profile data
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      profile: {
        id: user._id,
        email: user.email,
        name: user.name,
        subscription: {
          status: user.subscription.status,
          currentPeriodEnd: user.subscription.currentPeriodEnd,
          cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd
        },
        stats: {
          streak: user.stats.streak,
          lastPlayed: user.stats.lastPlayed,
          totalCorrect: user.stats.totalCorrect,
          totalAnswered: user.stats.totalAnswered,
          accuracy: user.stats.totalAnswered > 0 
            ? ((user.stats.totalCorrect / user.stats.totalAnswered) * 100).toFixed(2) + '%'
            : '0%'
        },
        dailyQuiz: user.dailyQuiz,
        isPremium: user.isPremium(),
        isEducation: user.isEducation(),
        education: user.education
      }
    });
  } catch (error) {
    console.error('Get full profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Request password reset (send OTP)
 * @route POST /api/profile/password-reset/request
 * @access Public
 */
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, don't reveal that email doesn't exist
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset OTP'
      });
    }
    
    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiration (15 minutes)
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    otpStore.set(email, {
      otp,
      expiresAt
    });
    
    // In a real implementation, send the OTP via email
    console.log(`MOCK EMAIL SERVICE: Sending password reset OTP to ${email}`);
    console.log(`Subject: Password Reset OTP for Text the Answer`);
    console.log(`Body: Your OTP for password reset is: ${otp}. It is valid for 15 minutes.`);
    
    // Update the email service to include this method
    if (emailService.sendPasswordResetOTP) {
      await emailService.sendPasswordResetOTP(email, otp);
    }
    
    res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive a password reset OTP'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Verify OTP for password reset
 * @route POST /api/profile/password-reset/verify
 * @access Public
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }
    
    // Check if OTP exists and is valid
    const otpData = otpStore.get(email);
    if (!otpData || otpData.otp !== otp || Date.now() > otpData.expiresAt) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }
    
    // Generate a temporary token for password reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Store the reset token with the OTP data
    otpStore.set(email, {
      ...otpData,
      resetToken,
      verified: true
    });
    
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      resetToken
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Reset password after OTP verification
 * @route POST /api/profile/password-reset/reset
 * @access Public
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword, confirmPassword } = req.body;
    
    // Validate input
    if (!email || !resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }
    
    // Check if reset token is valid
    const otpData = otpStore.get(email);
    if (!otpData || !otpData.verified || otpData.resetToken !== resetToken || Date.now() > otpData.expiresAt) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update password
    user.password = newPassword; // The pre-save hook will hash it
    await user.save();
    
    // Clear OTP data
    otpStore.delete(email);
    
    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Change password (for logged in users)
 * @route POST /api/profile/password/change
 * @access Private
 */
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword; // The pre-save hook will hash it
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 