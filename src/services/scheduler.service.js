const schedule = require('node-schedule');
const DailyQuiz = require('../models/dailyQuiz.model');
const User = require('../models/user.model');
const Leaderboard = require('../models/leaderboard.model');
const { awardFreePremium } = require('../controllers/subscription.controller');

// Schedule daily tasks
exports.scheduleDailyTasks = () => {
  // Run at midnight every day
  schedule.scheduleJob('0 0 * * *', async () => {
    try {
      console.log('Running daily scheduled tasks...');
      
      // 1. Determine daily quiz winner
      await determineDailyQuizWinner();
      
      // 2. Reset daily quiz stats for all users
      await resetDailyQuizStats();
      
      // 3. Create new daily quiz for today
      await createNewDailyQuiz();
      
      console.log('Daily scheduled tasks completed successfully');
    } catch (error) {
      console.error('Error running daily scheduled tasks:', error);
    }
  });
};

// Determine daily quiz winner and award free premium month
async function determineDailyQuizWinner() {
  try {
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    // Find yesterday's daily quiz
    const dailyQuiz = await DailyQuiz.findOne({ 
      date: yesterday,
      active: true
    });
    
    if (!dailyQuiz) {
      console.log('No active daily quiz found for yesterday');
      return;
    }
    
    // Find user with highest score (must have all 10 questions correct)
    const topUser = await User.findOne({
      'dailyQuiz.questionsAnswered': 10,
      'dailyQuiz.correctAnswers': 10
    }).sort({ 'dailyQuiz.score': -1 }).limit(1);
    
    if (!topUser) {
      console.log('No eligible winner found for yesterday\'s daily quiz (no perfect scores)');
      return;
    }
    
    // Update daily quiz with winner
    dailyQuiz.winner = topUser._id;
    dailyQuiz.highestScore = topUser.dailyQuiz.score || 0;
    dailyQuiz.active = false;
    await dailyQuiz.save();
    
    // Award free premium month to winner
    const awarded = await awardFreePremium(topUser);
    
    if (awarded) {
      console.log(`Daily quiz winner ${topUser._id} awarded 1 month free premium subscription! Score: ${topUser.dailyQuiz.score}`);
      
      // Reset all users' daily quiz stats
      await resetDailyQuizStats();
    } else {
      console.log(`Failed to award premium to user ${topUser._id}`);
    }
  } catch (error) {
    console.error('Error determining daily quiz winner:', error);
    throw error;
  }
}

// Reset daily quiz stats for all users
async function resetDailyQuizStats() {
  try {
    // Reset daily quiz stats for all users
    const result = await User.updateMany(
      {},
      { 
        $set: { 
          'dailyQuiz.questionsAnswered': 0,
          'dailyQuiz.correctAnswers': 0
        }
      }
    );
    
    console.log(`Reset daily quiz stats for ${result.modifiedCount} users`);
  } catch (error) {
    console.error('Error resetting daily quiz stats:', error);
    throw error;
  }
}

// Create new daily quiz for today
async function createNewDailyQuiz() {
  try {
    // Create new daily quiz for today
    const dailyQuiz = await DailyQuiz.getTodayQuiz();
    
    console.log(`Created new daily quiz for today with ${dailyQuiz.questions.length} questions`);
  } catch (error) {
    console.error('Error creating new daily quiz:', error);
    throw error;
  }
}
