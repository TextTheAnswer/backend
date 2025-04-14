const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const emailService = require('../services/email.service');
const crypto = require('crypto');
const { uploadImage, deleteImage } = require('../config/cloudinary');

// Store OTPs temporarily (in production, use Redis or a database)
const otpStore = new Map();

/**
 * Create user profile
 * @route POST /api/profile/create
 * @access Private (requires authentication)
 */
exports.createProfile = async (req, res) => {
  try {
    // Get user ID from the authenticated request
    const userId = req.user.id;
    
    // Get profile data from request body
    const { bio, location, preferences, profilePicture } = req.body;
    
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Initialize profile object if it doesn't exist
    if (!user.profile) {
      user.profile = {};
    }
    
    // Update profile fields if provided
    if (bio !== undefined) user.profile.bio = bio;
    if (location !== undefined) user.profile.location = location;
    
    // Handle profile picture
    if (profilePicture) {
      // If user already has a profile image and we're not using a default, delete the old one
      if (user.profile.imagePublicId && 
          !profilePicture.startsWith('default-') && 
          user.profile.imagePublicId !== profilePicture) {
        try {
          await deleteImage(user.profile.imagePublicId);
        } catch (err) {
          console.error('Error deleting previous profile image:', err);
          // Continue with the process even if image deletion fails
        }
      }
      
      // Set the profile picture based on the type
      if (profilePicture.startsWith('default-')) {
        // Use a default image (default-1 or default-2)
        const defaultImageNumber = profilePicture.split('-')[1];
        const defaultImageUrl = `https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1/default/profile-${defaultImageNumber}.png`;
        
        user.profile.imageUrl = defaultImageUrl;
        user.profile.imagePublicId = `default/profile-${defaultImageNumber}`;
      } else if (profilePicture.startsWith('data:image')) {
        // Handle base64 image data
        const uploadResponse = await uploadImage(profilePicture);
        user.profile.imageUrl = uploadResponse.url;
        user.profile.imagePublicId = uploadResponse.publicId;
      } else {
        // Assume it's a public ID from Cloudinary
        user.profile.imagePublicId = profilePicture;
        user.profile.imageUrl = `https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/${profilePicture}`;
      }
    }
    
    // Update preferences if provided
    if (preferences) {
      if (!user.profile.preferences) {
        user.profile.preferences = {};
      }
      
      if (preferences.favoriteCategories) {
        user.profile.preferences.favoriteCategories = preferences.favoriteCategories;
      }
      
      if (preferences.notificationSettings) {
        user.profile.preferences.notificationSettings = preferences.notificationSettings;
      }
      
      if (preferences.displayTheme) {
        user.profile.preferences.displayTheme = preferences.displayTheme;
      }
    }
    
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      profile: {
        id: user._id,
        bio: user.profile.bio,
        location: user.profile.location,
        imageUrl: user.profile.imageUrl,
        preferences: user.profile.preferences
      }
    });
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/profile
 * @access Private (requires authentication)
 */
exports.updateProfile = async (req, res) => {
  try {
    // Get user ID from the authenticated request
    const userId = req.user.id;
    const { name, bio, location } = req.body;

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
    
    // Initialize profile object if it doesn't exist
    if (!user.profile) {
      user.profile = {};
    }
    
    // Update profile fields if provided
    if (bio !== undefined) user.profile.bio = bio;
    if (location !== undefined) user.profile.location = location;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profile: user.profile,
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
 * Upload profile image
 * @route POST /api/profile/image
 * @access Private (requires authentication)
 */
exports.uploadProfileImage = async (req, res) => {
  try {
    // Get user ID from the authenticated request
    const userId = req.user.id;
    
    // Check if image file is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }
    
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // If user already has a profile image, delete the old one
    if (user.profile && user.profile.imagePublicId) {
      await deleteImage(user.profile.imagePublicId);
    }
    
    // Upload image to Cloudinary
    const cloudinaryResponse = await uploadImage(req.file.path);
    
    // Initialize profile object if it doesn't exist
    if (!user.profile) {
      user.profile = {};
    }
    
    // Update user profile with new image details
    user.profile.imageUrl = cloudinaryResponse.url;
    user.profile.imagePublicId = cloudinaryResponse.publicId;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      profile: {
        imageUrl: user.profile.imageUrl
      }
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading profile image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get comprehensive profile data
 * @route GET /api/profile/full
 * @access Private (requires authentication)
 */
exports.getFullProfile = async (req, res) => {
  try {
    // Get user ID from the authenticated request
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
        profile: {
          bio: user.profile?.bio || '',
          location: user.profile?.location || '',
          imageUrl: user.profile?.imageUrl || null,
          preferences: user.profile?.preferences || {}
        },
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
 * Delete profile image
 * @route DELETE /api/profile/image
 * @access Private (requires authentication)
 */
exports.deleteProfileImage = async (req, res) => {
  try {
    // Get user ID from the authenticated request
    const userId = req.user.id;
    
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user has a profile image to delete
    if (!user.profile || !user.profile.imagePublicId) {
      return res.status(400).json({
        success: false,
        message: 'No profile image to delete'
      });
    }
    
    // Delete image from Cloudinary
    await deleteImage(user.profile.imagePublicId);
    
    // Remove image details from user profile
    user.profile.imageUrl = undefined;
    user.profile.imagePublicId = undefined;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile image deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting profile image',
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
    
    // Send OTP via email service
    const emailSent = await emailService.sendPasswordResetOTP(email, otp);
    
    if (!emailSent) {
      console.error(`Failed to send OTP email to ${email}`);
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
 * Change user password
 * @route POST /api/profile/password/change
 * @access Private (requires authentication)
 */
exports.changePassword = async (req, res) => {
  try {
    // Get user ID from the authenticated request
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validate passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required'
      });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match'
      });
    }
    
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update user password
    user.password = hashedPassword;
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