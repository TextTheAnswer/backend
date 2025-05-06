const User = require('../models/user.model');
const Question = require('../models/question.model');
const DailyQuiz = require('../models/dailyQuiz.model');
const Category = require('../models/category.model');
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
        _id: q._id,
        text: q.text,
        category: q.category,
        difficulty: q.difficulty,
        timeLimit: 15 // Always enforce 15 seconds for daily quiz
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
      correctAnswers: user.dailyQuiz.correctAnswers,
      theme: {
        name: dailyQuiz.themeName,
        description: dailyQuiz.themeDescription
      }
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
    
    // Always enforce 15 seconds for daily quiz
    const timeLimit = 15;
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
    
    // Update question usage statistics - no need to increment here since it's already done when creating the daily quiz
    // This ensures question usage is properly tracked even for questions the user doesn't answer
    // Just update the lastUsed date to ensure accuracy
    question.lastUsed = new Date();
    await question.save();
    
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
    
    // Check for achievement unlocks for premium/education users
    if (user.subscription.status === 'premium' || user.subscription.status === 'education') {
      const achievementService = require('../services/achievement.service');
      try {
        const newAchievements = await achievementService.checkAchievements(user._id);
        
        // If user unlocked new achievements, include them in the response
        if (newAchievements && newAchievements.length > 0) {
          responseData.newAchievements = newAchievements.map(ach => ({
            name: ach.name,
            description: ach.description,
            icon: ach.icon,
            tier: ach.tier
          }));
        }
      } catch (achError) {
        console.error('Achievement check error:', achError);
        // Don't fail the whole request if achievement checking fails
      }
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

// Get daily quiz stats for the user
exports.getDailyStats = async (req, res) => {
  try {
    const user = req.user;
    
    // Get today's quiz
    const dailyQuiz = await DailyQuiz.getTodayQuiz();
    
    res.status(200).json({
      success: true,
      stats: {
        questionsAnswered: user.dailyQuiz.questionsAnswered || 0,
        correctAnswers: user.dailyQuiz.correctAnswers || 0,
        score: user.dailyQuiz.score || 0,
        streak: user.stats.streak || 0,
        totalAnswered: user.stats.totalAnswered || 0,
        totalCorrect: user.stats.totalCorrect || 0
      },
      theme: {
        name: dailyQuiz.themeName,
        description: dailyQuiz.themeDescription
      }
    });
  } catch (error) {
    console.error('Get daily stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Submit multiple answers in bulk for daily quiz
exports.submitAnswersBulk = async (req, res) => {
  try {
    const { answers } = req.body;
    const user = req.user;
    
    // Validate answers array
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid answers format. Expected an array of answers.'
      });
    }
    
    // Check if user has already completed today's quiz (free tier limitation)
    if (user.subscription.status === 'free' && 
        (user.dailyQuiz.questionsAnswered + answers.length) > 10) {
      return res.status(403).json({
        success: false,
        message: 'Free tier users can only answer 10 questions per day. Upgrade to premium for unlimited access.'
      });
    }
    
    // Get today's quiz
    const dailyQuiz = await DailyQuiz.getTodayQuiz();
    const results = [];
    let totalPoints = 0;
    
    // Process all answers
    for (const answerData of answers) {
      const { questionId, answer, timeSpent } = answerData;
      
      // Find the question
      const question = await Question.findById(questionId);
      if (!question) {
        results.push({
          questionId,
          success: false,
          message: 'Question not found'
        });
        continue;
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
      
      // Always enforce 15 seconds for daily quiz
      const timeLimit = 15;
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
        totalPoints += points;
      }
      
      // Update user's daily quiz stats
      user.dailyQuiz.questionsAnswered += 1;
      if (isCorrect) {
        user.dailyQuiz.correctAnswers += 1;
        user.stats.totalCorrect += 1;
      }
      user.stats.totalAnswered += 1;
      
      // Update question usage statistics
      question.lastUsed = new Date();
      await question.save();
      
      // Store result
      results.push({
        questionId,
        isCorrect,
        points,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        withinTimeLimit
      });
    }
    
    // Update user's score
    if (!user.dailyQuiz.score) {
      user.dailyQuiz.score = 0;
    }
    user.dailyQuiz.score += totalPoints;
    
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
    if (user.dailyQuiz.correctAnswers === 10 && 
        (user.dailyQuiz.score > dailyQuiz.highestScore || !dailyQuiz.winner)) {
      dailyQuiz.highestScore = user.dailyQuiz.score;
      dailyQuiz.winner = user._id;
      await dailyQuiz.save();
    }
    
    // Check for achievement unlocks for premium/education users
    let newAchievements = [];
    if (user.subscription.status === 'premium' || user.subscription.status === 'education') {
      const achievementService = require('../services/achievement.service');
      try {
        newAchievements = await achievementService.checkAchievements(user._id) || [];
      } catch (achError) {
        console.error('Achievement check error:', achError);
        // Don't fail the whole request if achievement checking fails
      }
    }
    
    res.status(200).json({
      success: true,
      results,
      summary: {
        questionsAnswered: user.dailyQuiz.questionsAnswered,
        correctAnswers: user.dailyQuiz.correctAnswers,
        totalScore: user.dailyQuiz.score || 0,
        totalPointsEarned: totalPoints,
        streak: user.stats.streak
      },
      // Only include achievements if user is premium/education and unlocked new ones
      newAchievements: newAchievements.length > 0 ? newAchievements.map(ach => ({
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        tier: ach.tier
      })) : undefined
    });
  } catch (error) {
    console.error('Submit answers bulk error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting answers in bulk',
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
      theme: {
        name: dailyQuiz.themeName,
        description: dailyQuiz.themeDescription
      },
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

// Get all available categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ active: true }).sort({ order: 1 });
    
    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get upcoming themes for the week
exports.getUpcomingThemes = async (req, res) => {
  try {
    // Only premium users can see upcoming themes
    if (req.user.subscription.status === 'free') {
      return res.status(403).json({
        success: false,
        message: 'Upgrade to premium to see upcoming themes'
      });
    }
    
    const today = moment().startOf('day');
    const upcomingThemes = [];
    
    // Get quizzes for the next 7 days
    for (let i = 1; i <= 7; i++) {
      const date = moment(today).add(i, 'days');
      const formattedDate = date.format('YYYY-MM-DD');
      
      // Try to get existing quiz for this date
      let quiz = await DailyQuiz.findOne({ 
        date: date.toDate() 
      }).populate('theme');
      
      if (quiz) {
        upcomingThemes.push({
          date: formattedDate,
          theme: quiz.themeName,
          description: quiz.themeDescription
        });
      }
    }
    
    res.status(200).json({
      success: true,
      upcomingThemes
    });
  } catch (error) {
    console.error('Get upcoming themes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming themes',
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
    req.user.dailyQuiz.score = 0;
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

// Admin: Create a new category
exports.createCategory = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { name, description, icon, color, order } = req.body;
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }
    
    // Create new category
    const category = await Category.create({
      name,
      description,
      icon,
      color,
      order: order || 0,
      active: true
    });
    
    res.status(201).json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Update an existing category
exports.updateCategory = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const categoryId = req.params.id;
    const { name, description, icon, color, order, active } = req.body;
    
    // Find the category by ID
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Update category fields
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (icon) category.icon = icon;
    if (color) category.color = color;
    if (order !== undefined) category.order = order;
    if (active !== undefined) category.active = active;
    
    // Save the updated category
    await category.save();
    
    res.status(200).json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const categoryId = req.params.id;
    
    // Find the category by ID
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if there are questions using this category
    const questionCount = await Question.countDocuments({ category: categoryId });
    if (questionCount > 0) {
      // Instead of deleting, mark as inactive
      category.active = false;
      await category.save();
      
      return res.status(200).json({
        success: true,
        message: `Category has ${questionCount} questions. Marked as inactive instead of deleting.`,
        category
      });
    }
    
    // If no questions are using this category, delete it
    await Category.findByIdAndDelete(categoryId);
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Schedule a theme for a specific date
exports.scheduleTheme = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { date, themeId, questionCount } = req.body;
    
    // Validate date
    if (!date || !moment(date, 'YYYY-MM-DD', true).isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }
    
    // Validate themeId
    if (!themeId) {
      return res.status(400).json({
        success: false,
        message: 'Theme ID is required'
      });
    }
    
    // Create quiz with specified theme
    const quiz = await DailyQuiz.createQuizWithTheme(
      date, 
      themeId, 
      questionCount || 10
    );
    
    res.status(201).json({
      success: true,
      quiz: {
        date: quiz.date,
        theme: quiz.themeName,
        description: quiz.themeDescription,
        questionCount: quiz.questions.length
      }
    });
  } catch (error) {
    console.error('Schedule theme error:', error);
    res.status(500).json({
      success: false,
      message: 'Error scheduling theme',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get upcoming daily quiz events
exports.getUpcomingEvents = async (req, res) => {
  try {
    // Get the user from the request
    const user = req.user;
    
    // Get upcoming events
    const DailyQuiz = require('../models/dailyQuiz.model');
    const upcomingEvents = await DailyQuiz.getUpcomingEvents();
    
    // Format the events for the response
    const formattedEvents = upcomingEvents.map(event => ({
      id: event._id,
      quizId: event.parent()._id,
      startTime: event.startTime,
      endTime: event.endTime,
      timeZone: event.timeZone,
      status: event.status,
      participantCount: event.participants.length,
      currentQuestionIndex: event.currentQuestionIndex,
      theme: {
        name: event.parent().themeName,
        description: event.parent().themeDescription
      }
    }));
    
    res.status(200).json({
      success: true,
      events: formattedEvents
    });
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming events',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get active daily quiz event details
exports.getEventDetails = async (req, res) => {
  try {
    // Get the user from the request
    const user = req.user;
    
    // Get the quiz and event IDs from the request parameters
    const { quizId, eventId } = req.params;
    
    if (!quizId || !eventId) {
      return res.status(400).json({
        success: false,
        message: 'Quiz ID and Event ID are required'
      });
    }
    
    // Get the quiz with the event
    const DailyQuiz = require('../models/dailyQuiz.model');
    const quiz = await DailyQuiz.findById(quizId);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    // Find the event
    const event = quiz.events.id(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if the user is a participant
    const isParticipant = event.participants.some(p => p.user.toString() === user._id.toString());
    
    // Format the event for the response
    const formattedEvent = {
      id: event._id,
      quizId: quiz._id,
      startTime: event.startTime,
      endTime: event.endTime,
      timeZone: event.timeZone,
      status: event.status,
      participantCount: event.participants.length,
      currentQuestionIndex: event.currentQuestionIndex,
      isParticipant,
      theme: {
        name: quiz.themeName,
        description: quiz.themeDescription
      }
    };
    
    // If the event is completed, include the winner
    if (event.status === 'completed' && event.winner) {
      // Get the winner's name
      const User = require('../models/user.model');
      const winner = await User.findById(event.winner.user, 'name');
      
      formattedEvent.winner = {
        userId: event.winner.user,
        name: winner ? winner.name : 'Unknown User',
        score: event.winner.score
      };
    }
    
    res.status(200).json({
      success: true,
      event: formattedEvent
    });
  } catch (error) {
    console.error('Get event details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get event leaderboard
exports.getEventLeaderboard = async (req, res) => {
  try {
    // Get the quiz and event IDs from the request parameters
    const { quizId, eventId } = req.params;
    
    if (!quizId || !eventId) {
      return res.status(400).json({
        success: false,
        message: 'Quiz ID and Event ID are required'
      });
    }
    
    // Get the quiz with the event
    const DailyQuiz = require('../models/dailyQuiz.model');
    const quiz = await DailyQuiz.findById(quizId);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    // Find the event
    const event = quiz.events.id(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Get the top participants by score
    const User = require('../models/user.model');
    const participants = [...event.participants].sort((a, b) => b.score - a.score);
    
    // Get user details for the top 10 participants
    const topParticipants = participants.slice(0, 10);
    const participantIds = topParticipants.map(p => p.user);
    
    // Get user details
    const users = await User.find(
      { _id: { $in: participantIds } },
      'name profile.imageUrl'
    );
    
    // Create a map of user IDs to user details
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = {
        name: user.name,
        imageUrl: user.profile ? user.profile.imageUrl : null
      };
    });
    
    // Format the leaderboard
    const leaderboard = topParticipants.map((p, index) => {
      const userInfo = userMap[p.user.toString()] || { name: 'Unknown User', imageUrl: null };
      
      return {
        rank: index + 1,
        userId: p.user,
        name: userInfo.name,
        imageUrl: userInfo.imageUrl,
        score: p.score,
        correctAnswers: p.correctAnswers
      };
    });
    
    // Find the requesting user's rank
    const userId = req.user._id.toString();
    const userRank = participants.findIndex(p => p.user.toString() === userId) + 1;
    
    res.status(200).json({
      success: true,
      leaderboard,
      userRank: userRank > 0 ? userRank : null
    });
  } catch (error) {
    console.error('Get event leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event leaderboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin - Manually start a daily quiz event
exports.startEvent = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { quizId, eventId } = req.body;
    
    if (!quizId || !eventId) {
      return res.status(400).json({
        success: false,
        message: 'Quiz ID and Event ID are required'
      });
    }
    
    // Start the event
    const dailyQuizEventService = require('../services/dailyQuizEvent.service');
    await dailyQuizEventService.startQuizEvent(quizId, eventId);
    
    res.status(200).json({
      success: true,
      message: 'Event started successfully'
    });
  } catch (error) {
    console.error('Start event error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin - Manually end a daily quiz event
exports.endEvent = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { quizId, eventId } = req.body;
    
    if (!quizId || !eventId) {
      return res.status(400).json({
        success: false,
        message: 'Quiz ID and Event ID are required'
      });
    }
    
    // End the event
    const dailyQuizEventService = require('../services/dailyQuizEvent.service');
    await dailyQuizEventService.endQuizEvent(quizId, eventId);
    
    res.status(200).json({
      success: true,
      message: 'Event ended successfully'
    });
  } catch (error) {
    console.error('End event error:', error);
    res.status(500).json({
      success: false,
      message: 'Error ending event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Create a new question
exports.createQuestion = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { 
      text, 
      category, 
      difficulty, 
      correctAnswer, 
      alternativeAnswers,
      explanation,
      isMultipleChoice,
      options
    } = req.body;
    
    // Validate required fields
    if (!text || !category || !difficulty || !correctAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Text, category, difficulty, and correctAnswer are required'
      });
    }
    
    // Check if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Create question
    const question = new Question({
      text,
      category,
      difficulty,
      correctAnswer,
      alternativeAnswers: alternativeAnswers || [],
      explanation: explanation || '',
      isMultipleChoice: isMultipleChoice || false,
      options: options || [],
      usageCount: 0,
      lastUsed: null
    });
    
    await question.save();
    
    res.status(201).json({
      success: true,
      question
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Update an existing question
exports.updateQuestion = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const questionId = req.params.id;
    const { 
      text, 
      category, 
      difficulty, 
      correctAnswer, 
      alternativeAnswers,
      explanation,
      isMultipleChoice,
      options
    } = req.body;
    
    // Find the question
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    // Update fields
    if (text) question.text = text;
    if (category) {
      // Check if category exists
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
      question.category = category;
    }
    if (difficulty) question.difficulty = difficulty;
    if (correctAnswer) question.correctAnswer = correctAnswer;
    if (alternativeAnswers) question.alternativeAnswers = alternativeAnswers;
    if (explanation !== undefined) question.explanation = explanation;
    if (isMultipleChoice !== undefined) question.isMultipleChoice = isMultipleChoice;
    if (options) question.options = options;
    
    await question.save();
    
    res.status(200).json({
      success: true,
      question
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Delete a question
exports.deleteQuestion = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const questionId = req.params.id;
    
    // Find the question
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    // Check if question is used in any daily quizzes
    const dailyQuizCount = await DailyQuiz.countDocuments({ 
      'questions._id': questionId 
    });
    
    if (dailyQuizCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete question. It is used in ${dailyQuizCount} daily quizzes.`
      });
    }
    
    // Delete the question
    await Question.findByIdAndDelete(questionId);
    
    res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all questions with filters
exports.getQuestions = async (req, res) => {
  try {
    // Parse query parameters
    const { 
      category, 
      difficulty, 
      search, 
      page = 1, 
      limit = 10,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;
    
    // Build query
    const query = {};
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (search) query.text = new RegExp(search, 'i');
    
    // Count total questions matching the query
    const total = await Question.countDocuments(query);
    
    // Get paginated questions
    const questions = await Question.find(query)
      .sort({ [sort]: order === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('category', 'name');
    
    res.status(200).json({
      success: true,
      questions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching questions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get a question by ID
exports.getQuestionById = async (req, res) => {
  try {
    const questionId = req.params.id;
    
    // Find the question
    const question = await Question.findById(questionId)
      .populate('category', 'name');
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    res.status(200).json({
      success: true,
      question
    });
  } catch (error) {
    console.error('Get question by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Generate questions using AI
exports.generateQuestions = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { category, difficulty, count, theme } = req.body;
    
    // Validate input
    if (!category || !theme) {
      return res.status(400).json({
        success: false,
        message: 'Category and theme are required'
      });
    }
    
    // Check if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Generate questions using AI service
    const aiService = require('../services/ai.service');
    const generatedQuestions = await aiService.generateQuestions({
      category: categoryExists.name,
      difficulty: difficulty || 'medium',
      count: count || 5,
      theme
    });
    
    if (!generatedQuestions || generatedQuestions.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate questions'
      });
    }
    
    // Save the generated questions
    const savedQuestions = [];
    for (const q of generatedQuestions) {
      const question = new Question({
        text: q.text,
        category,
        difficulty: q.difficulty || difficulty || 'medium',
        correctAnswer: q.correctAnswer,
        alternativeAnswers: q.alternativeAnswers || [],
        explanation: q.explanation || '',
        isMultipleChoice: q.isMultipleChoice || false,
        options: q.options || [],
        usageCount: 0,
        lastUsed: null
      });
      
      await question.save();
      savedQuestions.push(question);
    }
    
    res.status(201).json({
      success: true,
      questions: savedQuestions,
      count: savedQuestions.length
    });
  } catch (error) {
    console.error('Generate questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating questions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
