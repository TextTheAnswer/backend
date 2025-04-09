const User = require('../models/user.model');
const Question = require('../models/question.model');
const DailyQuiz = require('../models/dailyQuiz.model');
const moment = require('moment');

// Get today's quiz questions
exports.getDailyQuestions = async (req, res) => {
  try {
    // Get authenticated user
    const user = req.user;
    
    // Check if user has already completed today's quiz (free tier limitation)
    if (user.subscription.status === 'free' && user.dailyQuiz.questionsAnswered >= 10) {
      return res.status(403).json({
        success: false,
        message: 'Free tier users can only answer 10 questions per day. Upgrade to premium for unlimited access.'
      });
    }
    
    // Get today's quiz
    const dailyQuiz = await DailyQuiz.getTodayQuiz();
    
    // Return questions without correct answers
    const questions = dailyQuiz.questions.map(q => ({
      id: q._id,
      text: q.text,
      options: q.options,
      category: q.category,
      difficulty: q.difficulty
    }));
    
    res.status(200).json({
      success: true,
      questions,
      questionsAnswered: user.dailyQuiz.questionsAnswered,
      correctAnswers: user.dailyQuiz.correctAnswers
    });
  } catch (error) {
    console.error('Get daily questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily questions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Submit answer for daily quiz
exports.submitAnswer = async (req, res) => {
  try {
    const { questionId, answer } = req.body;
    const user = req.user;
    
    // Check if user has already completed today's quiz (free tier limitation)
    if (user.subscription.status === 'free' && user.dailyQuiz.questionsAnswered >= 10) {
      return res.status(403).json({
        success: false,
        message: 'Free tier users can only answer 10 questions per day. Upgrade to premium for unlimited access.'
      });
    }
    
    // Find the question
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    // Check if answer is correct
    const isCorrect = question.correctAnswer === answer;
    
    // Update user's daily quiz stats
    user.dailyQuiz.questionsAnswered += 1;
    if (isCorrect) {
      user.dailyQuiz.correctAnswers += 1;
      user.stats.totalCorrect += 1;
    }
    user.stats.totalAnswered += 1;
    
    // Update streak if needed
    const today = moment().startOf('day');
    const lastPlayed = user.stats.lastPlayed ? moment(user.stats.lastPlayed).startOf('day') : null;
    
    if (!lastPlayed || !lastPlayed.isSame(today)) {
      if (lastPlayed && lastPlayed.add(1, 'days').isSame(today)) {
        // Consecutive day, increase streak
        user.stats.streak += 1;
      } else if (!lastPlayed || !lastPlayed.add(1, 'days').isSame(today)) {
        // Not consecutive, reset streak
        user.stats.streak = 1;
      }
      user.stats.lastPlayed = new Date();
    }
    
    await user.save();
    
    // Update daily quiz leaderboard if needed
    const dailyQuiz = await DailyQuiz.getTodayQuiz();
    if (user.dailyQuiz.correctAnswers > dailyQuiz.highestScore && user.dailyQuiz.questionsAnswered === 10) {
      dailyQuiz.highestScore = user.dailyQuiz.correctAnswers;
      dailyQuiz.winner = user._id;
      await dailyQuiz.save();
    }
    
    res.status(200).json({
      success: true,
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      questionsAnswered: user.dailyQuiz.questionsAnswered,
      correctAnswers: user.dailyQuiz.correctAnswers,
      streak: user.stats.streak
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting answer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get daily quiz leaderboard
exports.getDailyLeaderboard = async (req, res) => {
  try {
    // Get today's quiz
    const dailyQuiz = await DailyQuiz.getTodayQuiz();
    
    // Get top 10 users for today's quiz
    const topUsers = await User.find({
      'dailyQuiz.questionsAnswered': { $gt: 0 }
    })
    .sort({ 'dailyQuiz.correctAnswers': -1, 'dailyQuiz.questionsAnswered': 1 })
    .limit(10)
    .select('name dailyQuiz.correctAnswers');
    
    // Format leaderboard data
    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      score: user.dailyQuiz.correctAnswers
    }));
    
    // Get user's rank if not in top 10
    let userRank = null;
    if (req.user) {
      const userPosition = await User.countDocuments({
        'dailyQuiz.correctAnswers': { $gt: req.user.dailyQuiz.correctAnswers }
      });
      userRank = userPosition + 1;
    }
    
    res.status(200).json({
      success: true,
      leaderboard,
      userRank,
      winner: dailyQuiz.winner ? {
        id: dailyQuiz.winner,
        score: dailyQuiz.highestScore
      } : null
    });
  } catch (error) {
    console.error('Get daily leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily leaderboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Reset daily quiz (for testing purposes)
exports.resetDailyQuiz = async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only available in development mode'
      });
    }
    
    // Reset user's daily quiz stats
    req.user.dailyQuiz.questionsAnswered = 0;
    req.user.dailyQuiz.correctAnswers = 0;
    await req.user.save();
    
    res.status(200).json({
      success: true,
      message: 'Daily quiz reset successfully'
    });
  } catch (error) {
    console.error('Reset daily quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting daily quiz',
      error: error.message
    });
  }
};
