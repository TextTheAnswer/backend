const mongoose = require('mongoose');

const dailyQuizSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  highestScore: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  },
  // Theme fields
  theme: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  themeName: {
    type: String,
    required: true
  },
  themeDescription: {
    type: String
  },
  // New fields for live multiplayer functionality
  events: [{
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    timeZone: {
      type: String,
      default: 'UTC'
    },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'completed'],
      default: 'scheduled'
    },
    participants: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      joinedAt: {
        type: Date,
        default: Date.now
      },
      score: {
        type: Number,
        default: 0
      },
      correctAnswers: {
        type: Number,
        default: 0
      },
      answerTimes: [Number], // Response times in milliseconds for each question
      answers: [Boolean],     // Correctness of each answer
      completed: {
        type: Boolean,
        default: false
      }
    }],
    currentQuestionIndex: {
      type: Number,
      default: -1 // -1 means not started
    },
    winner: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      score: Number
    }
  }]
}, {
  timestamps: true
});

// Static method to get or create today's quiz
dailyQuizSchema.statics.getTodayQuiz = async function() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let dailyQuiz = await this.findOne({ date: today }).populate('questions').populate('theme');
    
    if (!dailyQuiz) {
      // Create a new daily quiz if none exists for today
      const Question = mongoose.model('Question');
      const Category = mongoose.model('Category');
      
      // Get all active categories
      const categories = await Category.find({ active: true });
      
      if (categories.length === 0) {
        throw new Error('No active categories found in the database');
      }
      
      // Select a random category for today's theme
      const randomIndex = Math.floor(Math.random() * categories.length);
      const todayTheme = categories[randomIndex];
      
      // Get unused questions from today's theme category (not used in the last 30 days)
      let themeQuestions = await Question.getUnusedQuestions(30, 10, []);
      themeQuestions = themeQuestions.filter(q => q.category === todayTheme.name);
      
      // Limit to 10 questions
      if (themeQuestions.length > 10) {
        themeQuestions = themeQuestions.slice(0, 10);
      }
      
      // If not enough theme questions, get questions from other categories
      const themeQuestionsCount = themeQuestions.length;
      let remainingQuestions = [];
      
      if (themeQuestionsCount < 10) {
        // Exclude the current theme from the search
        remainingQuestions = await Question.getUnusedQuestions(30, 10 - themeQuestionsCount, [todayTheme.name]);
      }
      
      // Combine questions
      let selectedQuestions = [...themeQuestions, ...remainingQuestions];
      
      // If still not enough, get any questions that have been used least recently
      if (selectedQuestions.length < 10) {
        console.log(`Not enough unused questions available. Adding ${10 - selectedQuestions.length} least recently used questions.`);
        
        // Get IDs of already selected questions to exclude them
        const selectedIds = selectedQuestions.map(q => q._id);
        
        const additionalQuestions = await Question.find({
          _id: { $nin: selectedIds },
          isApproved: true
        })
        .sort({ lastUsed: 1, usageCount: 1 })
        .limit(10 - selectedQuestions.length);
        
        selectedQuestions = [...selectedQuestions, ...additionalQuestions];
      }
      
      // Verify we have enough questions
      if (selectedQuestions.length < 5) {
        throw new Error('Not enough questions in the database. Minimum 5 questions required.');
      }
      
      // Ensure we have exactly 10 questions (or at least what we could find)
      selectedQuestions = selectedQuestions.slice(0, 10);
      
      // Create default event times (9AM, 3PM, 9PM UTC)
      const eventTimes = [
        { hour: 9, minute: 0 },
        { hour: 15, minute: 0 },
        { hour: 21, minute: 0 }
      ];
      
      // Create event objects
      const events = eventTimes.map(time => {
        const startTime = new Date(today);
        startTime.setHours(time.hour, time.minute, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 30); // 30-minute event
        
        return {
          startTime,
          endTime,
          timeZone: 'UTC',
          status: 'scheduled',
          participants: [],
          currentQuestionIndex: -1
        };
      });
      
      // Create the daily quiz
      dailyQuiz = await this.create({
        date: today,
        questions: selectedQuestions.map(q => q._id),
        active: true,
        theme: todayTheme._id,
        themeName: todayTheme.name,
        themeDescription: todayTheme.description || `Today's theme is ${todayTheme.name}`,
        events: events
      });
      
      // Update usage statistics for all selected questions
      for (const question of selectedQuestions) {
        question.usageCount += 1;
        question.lastUsed = new Date();
        await question.save();
      }
      
      console.log(`Created new daily quiz with ${selectedQuestions.length} questions. Theme: ${todayTheme.name}`);
      console.log(`Scheduled ${events.length} live events for today`);
      
      // Populate the questions and theme
      dailyQuiz = await this.findById(dailyQuiz._id).populate('questions').populate('theme');
    }
    
    return dailyQuiz;
  } catch (error) {
    console.error('Error in getTodayQuiz:', error);
    throw error;
  }
};

// Method to get upcoming and active events
dailyQuizSchema.statics.getUpcomingEvents = async function() {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const dailyQuiz = await this.findOne({ date: today });
    if (!dailyQuiz) {
      return [];
    }
    
    // Filter for upcoming and active events
    return dailyQuiz.events.filter(event => {
      return event.endTime > now && 
            (event.status === 'scheduled' || event.status === 'active');
    });
  } catch (error) {
    console.error('Error in getUpcomingEvents:', error);
    throw error;
  }
};

// Method to find a specific event by ID
dailyQuizSchema.statics.findEventById = async function(quizId, eventId) {
  try {
    const quiz = await this.findById(quizId);
    if (!quiz) {
      return null;
    }
    
    return quiz.events.id(eventId);
  } catch (error) {
    console.error('Error in findEventById:', error);
    throw error;
  }
};

// Static method to get quiz by date
dailyQuizSchema.statics.getQuizByDate = async function(date) {
  try {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const quiz = await this.findOne({ date: targetDate }).populate('questions').populate('theme');
    return quiz;
  } catch (error) {
    console.error('Error in getQuizByDate:', error);
    throw error;
  }
};

// Static method to get quizzes by theme
dailyQuizSchema.statics.getQuizzesByTheme = async function(themeId) {
  try {
    const quizzes = await this.find({ theme: themeId }).populate('theme').sort({ date: -1 });
    return quizzes;
  } catch (error) {
    console.error('Error in getQuizzesByTheme:', error);
    throw error;
  }
};

// Static method to create a quiz for a specific date with a specific theme
dailyQuizSchema.statics.createQuizWithTheme = async function(date, themeId, questionCount = 10) {
  try {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // Check if quiz already exists for this date
    const existingQuiz = await this.findOne({ date: targetDate });
    if (existingQuiz) {
      throw new Error(`Quiz already exists for ${targetDate.toDateString()}`);
    }
    
    const Question = mongoose.model('Question');
    const Category = mongoose.model('Category');
    
    // Get the specified theme
    const theme = await Category.findById(themeId);
    if (!theme) {
      throw new Error('Theme not found');
    }
    
    // Get questions from the specified theme
    let questions = await Question.find({ 
      category: theme.name 
    }).limit(questionCount);
    
    // If not enough questions in the selected category, get random questions to fill the gap
    if (questions.length < questionCount) {
      const additionalQuestions = await Question.aggregate([
        { $match: { category: { $ne: theme.name } } },
        { $sample: { size: questionCount - questions.length } }
      ]);
      
      questions = [...questions, ...additionalQuestions];
    }
    
    if (questions.length < 5) {
      throw new Error('Not enough questions in the database. Minimum 5 questions required.');
    }
    
    // Create default event times (9AM, 3PM, 9PM UTC)
    const eventTimes = [
      { hour: 9, minute: 0 },
      { hour: 15, minute: 0 },
      { hour: 21, minute: 0 }
    ];
    
    // Create event objects
    const events = eventTimes.map(time => {
      const startTime = new Date(targetDate);
      startTime.setHours(time.hour, time.minute, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 30); // 30-minute event
      
      return {
        startTime,
        endTime,
        timeZone: 'UTC',
        status: 'scheduled',
        participants: [],
        currentQuestionIndex: -1
      };
    });
    
    const quiz = await this.create({
      date: targetDate,
      questions: questions.map(q => q._id),
      active: true,
      theme: theme._id,
      themeName: theme.name,
      themeDescription: theme.description || `The theme is ${theme.name}`,
      events: events
    });
    
    return await this.findById(quiz._id).populate('questions').populate('theme');
  } catch (error) {
    console.error('Error in createQuizWithTheme:', error);
    throw error;
  }
};

const DailyQuiz = mongoose.model('DailyQuiz', dailyQuizSchema);

module.exports = DailyQuiz;
