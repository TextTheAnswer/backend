const Achievement = require('../models/achievement.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');
const { awardFreePremium } = require('../controllers/subscription.controller');

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
      }

      // If achievement unlocked, add to user's achievements
      if (isUnlocked) {
        user.achievements.push({
          achievementId: achievement._id,
          unlockedAt: new Date(),
          viewed: false
        });

        // Process rewards
        if (achievement.reward.type === 'xp' && achievement.reward.value > 0) {
          // If we had XP in user stats, we'd update it here
          logger.info(`User ${userId} earned ${achievement.reward.value} XP from achievement`);
        } else if (achievement.reward.type === 'premium_days' && achievement.reward.value > 0) {
          // Award free premium time
          await awardFreePremium(user, achievement.reward.value, `Achievement: ${achievement.name}`);
          logger.info(`User ${userId} earned ${achievement.reward.value} premium days from achievement`);
        }

        newlyUnlocked.push(achievement);
        logger.info(`User ${userId} unlocked achievement: ${achievement.name}`);
      }
    }

    if (newlyUnlocked.length > 0) {
      await user.save();
      
      // If we had socket.io integration for achievements, we'd emit an event here
      // io.to(`user_${user._id}`).emit('achievement_unlocked', { achievements: newlyUnlocked });
      
      logger.info(`User ${userId} unlocked ${newlyUnlocked.length} new achievements`);
    }

    return newlyUnlocked;
  } catch (error) {
    logger.error('Error checking achievements:', error);
    throw error;
  }
}

/**
 * Get all achievements from the database
 * @returns {Promise<Array>} All achievements
 */
async function getAllAchievements() {
  try {
    return await Achievement.find({});
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
    
    const achievementIndex = user.achievements.findIndex(
      ach => ach.achievementId.toString() === achievementId
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
  getAllAchievements,
  getUserAchievements,
  markAchievementViewed
};