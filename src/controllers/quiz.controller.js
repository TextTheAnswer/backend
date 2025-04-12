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
    const questions = dailyQuiz.questions.map(q => {
      const questionData = {
        id: q._id,
        text: q.text,
        category: q.category,
        difficulty: q.difficulty,
        timeLimit: q.timeLimit || 30
      };

      // For backward compatibility with old multiple choice questions
      if (q.isMultipleChoice) {
        questionData.isMultipleChoice = true;
        questionData.options = q.options;
      }
      
      return questionData;
    });
    
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
    const { questionId, answer, timeSpent } = req.body;
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
    let isCorrect = false;
    
    if (question.isMultipleChoice) {
      // For legacy multiple choice questions
      isCorrect = parseInt(answer) === question.correctAnswer;
    } else {
      // For new free-text questions - perform case-insensitive match
      const userAnswer = answer.trim().toLowerCase();
      const correctAnswer = question.correctAnswer.toLowerCase();
      const alternatives = question.alternativeAnswers.map(alt => alt.toLowerCase());
      
      isCorrect = userAnswer === correctAnswer || alternatives.includes(userAnswer);
    }
    
    // Check if the answer was submitted within the time limit
    const timeLimit = question.timeLimit || 30;
    const withinTimeLimit = !timeSpent || timeSpent <= timeLimit;
    
    // If answer was submitted after time limit, mark it as incorrect
    if (!withinTimeLimit) {
      isCorrect = false;
    }
    
    // Calculate points based on time spent (faster answers get more points)
    // Only if answer is correct and within time limit
    let points = 0;
    if (isCorrect && withinTimeLimit) {
      // Base points for correct answer
      const basePoints = 100;
      
      // Time bonus: faster answers get more points
      // Formula: Bonus = (1 - timeSpent/timeLimit) * 100
      // This gives a range of 0-100 bonus points
      const timeBonus = Math.round((1 - (timeSpent / timeLimit)) * 100);
      
      // Difficulty multiplier
      const difficultyMultiplier = 
        question.difficulty === 'easy' ? 1 :
        question.difficulty === 'medium' ? 1.5 : 2; // hard = 2x
      
      // Calculate total points
      points = Math.round((basePoints + timeBonus) * difficultyMultiplier);
    }
    
    // Update user's daily quiz stats
    user.dailyQuiz.questionsAnswered += 1;
    if (isCorrect) {
      user.dailyQuiz.correctAnswers += 1;
      user.stats.totalCorrect += 1;
      
      // Add points to the user's score for the day
      if (!user.dailyQuiz.score) {
        user.dailyQuiz.score = 0;
      }
      user.dailyQuiz.score += points;
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
    // If user got all 10 questions correct and has a higher score than current leader
    if (user.dailyQuiz.correctAnswers === 10 && 
        (user.dailyQuiz.score > dailyQuiz.highestScore || !dailyQuiz.winner)) {
      dailyQuiz.highestScore = user.dailyQuiz.score;
      dailyQuiz.winner = user._id;
      await dailyQuiz.save();
    }
    
    const responseData = {
      success: true,
      isCorrect,
      points,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      questionsAnswered: user.dailyQuiz.questionsAnswered,
      correctAnswers: user.dailyQuiz.correctAnswers,
      totalScore: user.dailyQuiz.score || 0,
      streak: user.stats.streak,
      withinTimeLimit
    };
    
    // For backward compatibility with old multiple choice questions
    if (question.isMultipleChoice) {
      responseData.correctAnswerIndex = question.correctAnswer;
    }
    
    res.status(200).json(responseData);
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
    
    // Get top 10 users for today's quiz - sort by score (speed) rather than just correct answers
    const topUsers = await User.find({
      'dailyQuiz.questionsAnswered': { $gt: 0 }
    })
    .sort({ 'dailyQuiz.score': -1, 'dailyQuiz.correctAnswers': -1 })
    .limit(10)
    .select('name dailyQuiz.correctAnswers dailyQuiz.score');
    
    // Format leaderboard data
    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      correctAnswers: user.dailyQuiz.correctAnswers,
      score: user.dailyQuiz.score || 0, // Include score in leaderboard
      isPerfectScore: user.dailyQuiz.correctAnswers === 10 // Show if user got all questions correct
    }));
    
    // Get user's rank if not in top 10
    let userRank = null;
    let userScore = null;
    if (req.user) {
      const userPosition = await User.countDocuments({
        'dailyQuiz.score': { $gt: (req.user.dailyQuiz.score || 0) }
      });
      userRank = userPosition + 1;
      userScore = req.user.dailyQuiz.score || 0;
    }
    
    res.status(200).json({
      success: true,
      leaderboard,
      userRank,
      userScore,
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
