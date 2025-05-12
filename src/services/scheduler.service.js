const schedule = require('node-schedule');
const DailyQuiz = require('../models/dailyQuiz.model');
const User = require('../models/user.model');
const Leaderboard = require('../models/leaderboard.model');
const { awardFreePremium } = require('../controllers/subscription.controller');
const logger = require('../utils/logger');
const dailyQuizEventService = require('./dailyQuizEvent.service');

// Schedule daily tasks
exports.scheduleDailyTasks = () => {
  // Run at midnight every day
  schedule.scheduleJob('0 0 * * *', async () => {
    try {
      logger.info('Running daily scheduled tasks...');
      
      // 1. Determine daily quiz winner from yesterday
      // No longer needed as premium is awarded immediately at the end of the quiz
      // await determineDailyQuizWinner();
      
      // 2. Reset daily quiz stats for all users
      await resetDailyQuizStats();
      
      // 3. Create new daily quiz for today with fresh questions
      await createNewDailyQuiz();
      
      // 4. Archive and clean up old questions if needed
      await cleanupOldQuizzes();
      
      // 5. Schedule today's daily quiz events
      await scheduleQuizEvents();
      
      logger.info('Daily scheduled tasks completed successfully');
    } catch (error) {
      logger.error('Error running daily scheduled tasks:', error);
    }
  });
  
  // Also run scheduling tasks on server start to ensure events are scheduled properly
  scheduleQuizEvents().catch(error => {
    logger.error('Error scheduling quiz events on server start:', error);
  });
};

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
    
    logger.info(`Reset daily quiz stats for ${result.modifiedCount} users`);
  } catch (error) {
    logger.error('Error resetting daily quiz stats:', error);
    throw error;
  }
}

// Create new daily quiz for today
async function createNewDailyQuiz() {
  try {
    // Create new daily quiz for today
    const dailyQuiz = await DailyQuiz.getTodayQuiz();
    
    logger.info(`Created new daily quiz for today with ${dailyQuiz.questions.length} questions and ${dailyQuiz.events.length} events`);
  } catch (error) {
    logger.error('Error creating new daily quiz:', error);
    throw error;
  }
}

// Schedule daily quiz events
async function scheduleQuizEvents() {
  try {
    // Schedule today's events
    await dailyQuizEventService.scheduleDailyQuizEvents();
    
    logger.info('Successfully scheduled daily quiz events');
  } catch (error) {
    logger.error('Error scheduling daily quiz events:', error);
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
      logger.info(`Archived ${result.modifiedCount} old daily quizzes`);
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
      
      logger.info(`Deleted ${deleteResult.deletedCount} questions from yesterday's quiz to avoid repetition`);
    }
  } catch (error) {
    logger.error('Error cleaning up old quizzes:', error);
    throw error;
  }
}
