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
      
      // 1. Determine daily quiz winner from yesterday
      await determineDailyQuizWinner();
      
      // 2. Reset daily quiz stats for all users
      await resetDailyQuizStats();
      
      // 3. Create new daily quiz for today with fresh questions
      await createNewDailyQuiz();
      
      // 4. Archive and clean up old questions if needed
      await cleanupOldQuizzes();
      
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
          'dailyQuiz.correctAnswers': 0,
          'dailyQuiz.score': 0
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

// Archive old quizzes and ensure cleanup
async function cleanupOldQuizzes() {
  try {
    // Find and deactivate quizzes older than 30 days that are still active
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await DailyQuiz.updateMany(
      { 
        date: { $lt: thirtyDaysAgo },
        active: true
      },
      {
        $set: { active: false }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`Archived ${result.modifiedCount} old daily quizzes`);
    }

    // Find yesterday's quiz to delete its questions from the database
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    // Get yesterday's daily quiz with its questions
    const dailyQuiz = await DailyQuiz.findOne({ date: yesterday }).populate('questions');
    
    if (dailyQuiz && dailyQuiz.questions && dailyQuiz.questions.length > 0) {
      const Question = require('../models/question.model');
      // Get the question IDs to delete
      const questionIds = dailyQuiz.questions.map(q => q._id);
      
      // Delete all questions used in yesterday's quiz
      const deleteResult = await Question.deleteMany({ _id: { $in: questionIds } });
      
      console.log(`Deleted ${deleteResult.deletedCount} questions from yesterday's quiz to avoid repetition`);
    }
  } catch (error) {
    console.error('Error cleaning up old quizzes:', error);
    throw error;
  }
}
