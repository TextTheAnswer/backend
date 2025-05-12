const Achievement = require('../models/achievement.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');
const { awardFreePremium } = require('../controllers/subscription.controller');
const socketInstance = require('../socket/socket.instance');

/**
 * Check if user has unlocked any new achievements
 * @param {string} userId - The user ID to check for achievements
 * @returns {Promise<Array>} - Array of newly unlocked achievements
 */
async function checkAchievements(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Only process for premium or education tier users
    if (user.subscription.status !== 'premium' && user.subscription.status !== 'education') {
      logger.info(`User ${userId} is on free tier, skipping achievements check`);
      return [];
    }

    const allAchievements = await Achievement.find({});
    const newlyUnlocked = [];

    // Get IDs of already unlocked achievements
    const unlockedIds = user.achievements.map(a => a.achievementId.toString());

    for (const achievement of allAchievements) {
      // Skip if already unlocked
      if (unlockedIds.includes(achievement._id.toString())) {
        continue;
      }

      let isUnlocked = false;

      // Check achievement criteria
      switch (achievement.criteria.type) {
        case 'streak':
          isUnlocked = user.stats.streak >= achievement.criteria.value;
          break;
        case 'questions_answered':
          isUnlocked = user.stats.totalAnswered >= achievement.criteria.value;
          break;
        case 'correct_answers':
          isUnlocked = user.stats.totalCorrect >= achievement.criteria.value;
          break;
        case 'perfect_quizzes':
          // This would require tracking perfect quizzes in user stats
          // For now, we can check if they got 10/10 on the current quiz
          isUnlocked = user.dailyQuiz.correctAnswers === 10;
          break;
        case 'multiplayer_wins':
          // This would require tracking multiplayer wins in user stats
          isUnlocked = false; // Placeholder - implement when stats are available
          break;
        case 'study_materials':
          // This would require access to study materials count
          isUnlocked = false; // Placeholder - implement when stats are available
          break;
        case 'easter_egg':
          // Easter egg achievements are unlocked via specific actions
          // They'll be unlocked by direct calls to unlockAchievement
          isUnlocked = false;
          break;
      }

      // If achievement unlocked, add to user's achievements
      if (isUnlocked) {
        await unlockAchievement(user, achievement);
        newlyUnlocked.push(achievement);
      }
    }

    if (newlyUnlocked.length > 0) {
      logger.info(`User ${userId} unlocked ${newlyUnlocked.length} new achievements`);
      
      // Emit socket event for real-time notifications
      const io = socketInstance.getIO();
      if (io) {
        io.to(`user_${userId}`).emit('achievement_unlocked', { 
          achievements: newlyUnlocked.map(a => ({
            id: a._id,
            name: a.name,
            description: a.description,
            icon: a.icon,
            tier: a.tier
          }))
        });
      }
    }

    return newlyUnlocked;
  } catch (error) {
    logger.error('Error checking achievements:', error);
    throw error;
  }
}

/**
 * Unlock a specific achievement for a user
 * @param {Object} user - User object or user ID
 * @param {Object|String} achievement - Achievement object or achievement ID
 * @returns {Promise<boolean>} - Success status
 */
async function unlockAchievement(user, achievement) {
  try {
    // If user is a string (ID), fetch the user object
    if (typeof user === 'string') {
      user = await User.findById(user);
      if (!user) {
        throw new Error('User not found');
      }
    }

    // If achievement is a string (ID), fetch the achievement object
    if (typeof achievement === 'string') {
      achievement = await Achievement.findById(achievement);
      if (!achievement) {
        throw new Error('Achievement not found');
      }
    }

    // Skip if user already has this achievement
    const hasAchievement = user.achievements.some(
      a => a.achievementId.toString() === achievement._id.toString()
    );
    
    if (hasAchievement) {
      return false;
    }

    // Add achievement to user
    user.achievements.push({
      achievementId: achievement._id,
      unlockedAt: new Date(),
      viewed: false
    });

    // Process rewards
    if (achievement.reward.type === 'xp' && achievement.reward.value > 0) {
      // If we had XP in user stats, we'd update it here
      logger.info(`User ${user._id} earned ${achievement.reward.value} XP from achievement`);
    } else if (achievement.reward.type === 'premium_days' && achievement.reward.value > 0) {
      // Award free premium time
      await awardFreePremium(user, achievement.reward.value, `Achievement: ${achievement.name}`);
      logger.info(`User ${user._id} earned ${achievement.reward.value} premium days from achievement`);
    }

    await user.save();
    logger.info(`User ${user._id} unlocked achievement: ${achievement.name}`);

    // Emit socket event for real-time notifications
    const io = socketInstance.getIO();
    if (io) {
      io.to(`user_${user._id}`).emit('achievement_unlocked', { 
        achievements: [{
          id: achievement._id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          tier: achievement.tier
        }]
      });
    }

    return true;
  } catch (error) {
    logger.error('Error unlocking achievement:', error);
    throw error;
  }
}

/**
 * Get all achievements from the database
 * @param {boolean} includeHidden - Whether to include hidden achievements
 * @returns {Promise<Array>} All achievements
 */
async function getAllAchievements(includeHidden = true) {
  try {
    if (includeHidden) {
      return await Achievement.find({});
    } else {
      return await Achievement.find({ isHidden: false });
    }
  } catch (error) {
    logger.error('Error getting all achievements:', error);
    throw error;
  }
}

/**
 * Get a user's unlocked achievements
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} User's achievements
 */
async function getUserAchievements(userId) {
  try {
    const user = await User.findById(userId).populate('achievements.achievementId');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Only premium/education users can access achievements
    if (user.subscription.status !== 'premium' && user.subscription.status !== 'education') {
      return {
        achievements: [],
        isPremiumFeature: true
      };
    }
    
    return {
      achievements: user.achievements,
      isPremiumFeature: false
    };
  } catch (error) {
    logger.error('Error getting user achievements:', error);
    throw error;
  }
}

/**
 * Calculate user's progress toward achievements
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Achievement progress data
 */
async function getAchievementProgress(userId) {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Only premium/education users can access achievements
    if (user.subscription.status !== 'premium' && user.subscription.status !== 'education') {
      return {
        isPremiumFeature: true,
        progress: []
      };
    }
    
    // Get all achievements and user's unlocked achievements
    const allAchievements = await Achievement.find({ isHidden: false });
    
    // Filter out any invalid achievement references
    const safeAchievements = user.achievements.filter(ach => ach && ach.achievementId);
    const unlockedIds = safeAchievements.map(a => a.achievementId.toString());
    
    // Calculate progress for each unachieved achievement
    const progress = [];
    
    for (const achievement of allAchievements) {
      // Skip if already unlocked
      if (unlockedIds.includes(achievement._id.toString())) {
        continue;
      }
      
      let currentValue = 0;
      let totalValue = achievement.criteria.value;
      let percentComplete = 0;
      
      // Calculate current progress based on criteria type
      switch (achievement.criteria.type) {
        case 'streak':
          currentValue = user.stats.streak;
          break;
        case 'questions_answered':
          currentValue = user.stats.totalAnswered;
          break;
        case 'correct_answers':
          currentValue = user.stats.totalCorrect;
          break;
        case 'perfect_quizzes':
          // Placeholder - implement when stats are available
          currentValue = 0;
          break;
        case 'multiplayer_wins':
          // Placeholder - implement when stats are available
          currentValue = 0;
          break;
        case 'study_materials':
          // Placeholder - implement when stats are available
          currentValue = 0;
          break;
        case 'easter_egg':
          // Progress not shown for easter eggs
          continue;
      }
      
      // Calculate percentage (capped at 99% for incomplete achievements)
      percentComplete = Math.min(Math.floor((currentValue / totalValue) * 100), 99);
      
      // Add to progress array
      progress.push({
        id: achievement._id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        tier: achievement.tier,
        currentValue,
        targetValue: totalValue,
        percentComplete
      });
    }
    
    // Sort by percent complete (most progress first)
    progress.sort((a, b) => b.percentComplete - a.percentComplete);
    
    return {
      isPremiumFeature: false,
      progress
    };
  } catch (error) {
    logger.error('Error calculating achievement progress:', error);
    throw error;
  }
}

/**
 * Get hidden and easter egg achievements
 * @returns {Promise<Array>} Hidden achievements
 */
async function getHiddenAchievements() {
  try {
    const hiddenAchievements = await Achievement.find({ isHidden: true });
    
    // Return with limited information
    return hiddenAchievements.map(achievement => ({
      id: achievement._id,
      name: achievement.name,
      hint: achievement.hint || "This achievement is a secret!",
      tier: achievement.tier
    }));
  } catch (error) {
    logger.error('Error getting hidden achievements:', error);
    throw error;
  }
}

/**
 * Mark an achievement as viewed
 * @param {string} userId - User ID
 * @param {string} achievementId - Achievement ID
 * @returns {Promise<boolean>} Success or failure
 */
async function markAchievementViewed(userId, achievementId) {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Make sure achievements array exists and contains valid entries
    if (!user.achievements || !Array.isArray(user.achievements)) {
      logger.warn(`User ${userId} has invalid achievements array`);
      return false;
    }
    
    const achievementIndex = user.achievements.findIndex(
      ach => ach && ach.achievementId && ach.achievementId.toString() === achievementId
    );
    
    if (achievementIndex === -1) {
      return false;
    }
    
    user.achievements[achievementIndex].viewed = true;
    await user.save();
    
    return true;
  } catch (error) {
    logger.error('Error marking achievement as viewed:', error);
    throw error;
  }
}

module.exports = {
  checkAchievements,
  unlockAchievement,
  getAllAchievements,
  getUserAchievements,
  getAchievementProgress,
  getHiddenAchievements,
  markAchievementViewed
};