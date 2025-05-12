const Achievement = require('../models/achievement.model');
const achievementService = require('../services/achievement.service');
const logger = require('../utils/logger');

/**
 * Get all available achievements
 */
exports.getAllAchievements = async (req, res) => {
  try {
    // Default to not showing hidden achievements for public endpoint
    const includeHidden = false;
    const achievements = await achievementService.getAllAchievements(includeHidden);
    
    res.status(200).json({
      success: true,
      achievements
    });
  } catch (error) {
    logger.error('Error fetching all achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching achievements'
    });
  }
};

/**
 * Get user's unlocked achievements - premium/education only
 */
exports.getUserAchievements = async (req, res) => {
  try {
    // Check if user is on premium or education tier
    if (req.user.subscription.status !== 'premium' && req.user.subscription.status !== 'education') {
      return res.status(403).json({
        success: false,
        message: 'Achievements feature is only available for premium and education tier users',
        upgradeRequired: true
      });
    }
    
    // Check for new achievements first
    await achievementService.checkAchievements(req.user.id);
    
    // Get user's achievements
    const result = await achievementService.getUserAchievements(req.user.id);
    
    if (result.isPremiumFeature) {
      return res.status(403).json({
        success: false,
        message: 'Achievements feature is only available for premium and education tier users',
        upgradeRequired: true
      });
    }
    
    // Filter out any achievements with null/undefined achievementId before mapping
    const validAchievements = result.achievements.filter(ach => ach && ach.achievementId);
    
    // Format achievements for response
    const formattedAchievements = validAchievements.map(ach => ({
      id: ach.achievementId._id,
      name: ach.achievementId.name,
      description: ach.achievementId.description,
      icon: ach.achievementId.icon,
      tier: ach.achievementId.tier,
      unlockedAt: ach.unlockedAt,
      viewed: ach.viewed
    }));
    
    res.status(200).json({
      success: true,
      achievements: formattedAchievements
    });
  } catch (error) {
    logger.error('Error fetching user achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching achievements'
    });
  }
};

/**
 * Get user's achievement progress - premium/education only
 */
exports.getAchievementProgress = async (req, res) => {
  try {
    // Check if user is on premium or education tier
    if (req.user.subscription.status !== 'premium' && req.user.subscription.status !== 'education') {
      return res.status(403).json({
        success: false,
        message: 'Achievements feature is only available for premium and education tier users',
        upgradeRequired: true
      });
    }
    
    // Get achievement progress
    const result = await achievementService.getAchievementProgress(req.user.id);
    
    if (result.isPremiumFeature) {
      return res.status(403).json({
        success: false,
        message: 'Achievements feature is only available for premium and education tier users',
        upgradeRequired: true
      });
    }
    
    res.status(200).json({
      success: true,
      progress: result.progress
    });
  } catch (error) {
    logger.error('Error fetching achievement progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching achievement progress'
    });
  }
};

/**
 * Get hidden/easter egg achievements - premium/education only
 */
exports.getHiddenAchievements = async (req, res) => {
  try {
    // Check if user is on premium or education tier
    if (req.user.subscription.status !== 'premium' && req.user.subscription.status !== 'education') {
      return res.status(403).json({
        success: false,
        message: 'Achievements feature is only available for premium and education tier users',
        upgradeRequired: true
      });
    }
    
    const hiddenAchievements = await achievementService.getHiddenAchievements();
    
    res.status(200).json({
      success: true,
      hiddenAchievements
    });
  } catch (error) {
    logger.error('Error fetching hidden achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hidden achievements'
    });
  }
};

/**
 * Mark an achievement as viewed
 */
exports.markAchievementViewed = async (req, res) => {
  try {
    const { achievementId } = req.params;
    
    // Check if user is on premium or education tier
    if (req.user.subscription.status !== 'premium' && req.user.subscription.status !== 'education') {
      return res.status(403).json({
        success: false,
        message: 'Achievements feature is only available for premium and education tier users'
      });
    }
    
    const success = await achievementService.markAchievementViewed(req.user.id, achievementId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found or not unlocked by this user'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Achievement marked as viewed'
    });
  } catch (error) {
    logger.error('Error marking achievement as viewed:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating achievement'
    });
  }
};

/**
 * Create a new achievement (admin only)
 */
exports.createAchievement = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      icon, 
      criteria, 
      reward, 
      tier, 
      premiumOnly,
      isHidden,
      hint 
    } = req.body;
    
    const achievement = new Achievement({
      name,
      description,
      icon,
      criteria,
      reward: reward || { type: 'badge', value: 0 },
      tier: tier || 'bronze',
      premiumOnly: premiumOnly !== false, // Default to true if not specified
      isHidden: isHidden === true,
      hint: hint || null
    });
    
    await achievement.save();
    
    res.status(201).json({
      success: true,
      achievement
    });
  } catch (error) {
    logger.error('Error creating achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating achievement',
      error: error.message
    });
  }
};

/**
 * Delete an achievement (admin only)
 */
exports.deleteAchievement = async (req, res) => {
  try {
    const { achievementId } = req.params;
    
    const achievement = await Achievement.findByIdAndDelete(achievementId);
    
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Achievement deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting achievement'
    });
  }
};

/**
 * Trigger an easter egg achievement (admin only)
 */
exports.triggerEasterEgg = async (req, res) => {
  try {
    const { userId, achievementId } = req.body;
    
    if (!userId || !achievementId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: userId and achievementId'
      });
    }
    
    const success = await achievementService.unlockAchievement(userId, achievementId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found or already unlocked'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Easter egg achievement triggered successfully'
    });
  } catch (error) {
    logger.error('Error triggering easter egg achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Error triggering achievement',
      error: error.message
    });
  }
};