const Achievement = require('../models/achievement.model');
const achievementService = require('../services/achievement.service');
const logger = require('../utils/logger');

/**
 * Get all available achievements
 */
exports.getAllAchievements = async (req, res) => {
  try {
    const achievements = await achievementService.getAllAchievements();
    
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
    
    // Format achievements for response
    const formattedAchievements = result.achievements.map(ach => ({
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
    const { name, description, icon, criteria, reward, tier, premiumOnly } = req.body;
    
    const achievement = new Achievement({
      name,
      description,
      icon,
      criteria,
      reward: reward || { type: 'badge', value: 0 },
      tier: tier || 'bronze',
      premiumOnly: premiumOnly !== false // Default to true if not specified
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