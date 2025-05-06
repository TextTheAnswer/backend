const Achievement = require('../models/achievement.model');
const logger = require('./logger');

/**
 * Seeds initial achievements into the database
 * This function will only run if no achievements exist in the database yet
 */
async function seedAchievements() {
  try {
    // Check if achievements already exist
    const count = await Achievement.countDocuments();
    
    if (count > 0) {
      logger.info('Achievements already seeded, skipping...');
      return;
    }
    
    const achievements = [
      {
        name: 'Quiz Novice',
        description: 'Answer your first 10 questions',
        icon: 'medal-bronze',
        criteria: {
          type: 'questions_answered',
          value: 10
        },
        tier: 'bronze',
        premiumOnly: true
      },
      {
        name: 'Quiz Enthusiast',
        description: 'Answer 100 questions',
        icon: 'medal-silver',
        criteria: {
          type: 'questions_answered',
          value: 100
        },
        tier: 'silver',
        premiumOnly: true,
        reward: {
          type: 'xp',
          value: 500
        }
      },
      {
        name: 'Quiz Master',
        description: 'Answer 500 questions',
        icon: 'medal-gold',
        criteria: {
          type: 'questions_answered',
          value: 500
        },
        tier: 'gold',
        premiumOnly: true,
        reward: {
          type: 'xp',
          value: 2000
        }
      },
      {
        name: 'Knowledge Seeker',
        description: 'Get 10 questions correct',
        icon: 'lightbulb-bronze',
        criteria: {
          type: 'correct_answers',
          value: 10
        },
        tier: 'bronze',
        premiumOnly: true
      },
      {
        name: 'Knowledge Explorer',
        description: 'Get 100 questions correct',
        icon: 'lightbulb-silver',
        criteria: {
          type: 'correct_answers',
          value: 100
        },
        tier: 'silver',
        premiumOnly: true,
        reward: {
          type: 'xp',
          value: 1000
        }
      },
      {
        name: 'Knowledge Sage',
        description: 'Get 500 questions correct',
        icon: 'lightbulb-gold',
        criteria: {
          type: 'correct_answers',
          value: 500
        },
        tier: 'gold',
        premiumOnly: true,
        reward: {
          type: 'premium_days',
          value: 7
        }
      },
      {
        name: 'First Streak',
        description: 'Maintain a 3-day streak',
        icon: 'streak-bronze',
        criteria: {
          type: 'streak',
          value: 3
        },
        tier: 'bronze',
        premiumOnly: true
      },
      {
        name: 'Committed Learner',
        description: 'Maintain a 7-day streak',
        icon: 'streak-silver',
        criteria: {
          type: 'streak',
          value: 7
        },
        tier: 'silver',
        premiumOnly: true,
        reward: {
          type: 'xp',
          value: 700
        }
      },
      {
        name: 'Dedicated Scholar',
        description: 'Maintain a 30-day streak',
        icon: 'streak-gold',
        criteria: {
          type: 'streak',
          value: 30
        },
        tier: 'gold',
        premiumOnly: true,
        reward: {
          type: 'premium_days',
          value: 3
        }
      },
      {
        name: 'Legendary Learner',
        description: 'Maintain a 100-day streak',
        icon: 'streak-platinum',
        criteria: {
          type: 'streak',
          value: 100
        },
        tier: 'platinum',
        premiumOnly: true,
        reward: {
          type: 'premium_days',
          value: 30
        }
      },
      {
        name: 'Perfect Quiz',
        description: 'Get all questions correct in a daily quiz',
        icon: 'perfect-bronze',
        criteria: {
          type: 'perfect_quizzes',
          value: 1
        },
        tier: 'bronze',
        premiumOnly: true
      },
      {
        name: 'Perfection Streak',
        description: 'Complete 5 perfect daily quizzes',
        icon: 'perfect-silver',
        criteria: {
          type: 'perfect_quizzes',
          value: 5
        },
        tier: 'silver',
        premiumOnly: true,
        reward: {
          type: 'xp',
          value: 1000
        }
      }
    ];
    
    await Achievement.insertMany(achievements);
    logger.info(`Seeded ${achievements.length} initial achievements`);
  } catch (error) {
    logger.error('Error seeding achievements:', error);
    throw error;
  }
}

module.exports = {
  seedAchievements
};