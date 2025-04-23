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
  // New fields for category-based themes
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
  }
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
      // For more control, you could implement a rotation system instead of random selection
      const randomIndex = Math.floor(Math.random() * categories.length);
      const todayTheme = categories[randomIndex];
      
      // Get 10 questions from today's theme category
      // If not enough questions in the selected category, get questions from other categories
      let questions = await Question.find({ 
        category: todayTheme.name,
        // Add additional filters if needed (e.g., difficulty level)
      }).limit(10);
      
      // If not enough questions in the selected category, get random questions to fill the gap
      if (questions.length < 10) {
        const additionalQuestions = await Question.aggregate([
          { $match: { category: { $ne: todayTheme.name } } },
          { $sample: { size: 10 - questions.length } }
        ]);
        
        questions = [...questions, ...additionalQuestions];
      }
      
      if (questions.length < 5) {
        throw new Error('Not enough questions in the database. Minimum 5 questions required.');
      }
      
      dailyQuiz = await this.create({
        date: today,
        questions: questions.map(q => q._id),
        active: true,
        theme: todayTheme._id,
        themeName: todayTheme.name,
        themeDescription: todayTheme.description || `Today's theme is ${todayTheme.name}`
      });
      
      // Populate the questions and theme
      dailyQuiz = await this.findById(dailyQuiz._id).populate('questions').populate('theme');
    }
    
    return dailyQuiz;
  } catch (error) {
    console.error('Error in getTodayQuiz:', error);
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
    
    const quiz = await this.create({
      date: targetDate,
      questions: questions.map(q => q._id),
      active: true,
      theme: theme._id,
      themeName: theme.name,
      themeDescription: theme.description || `The theme is ${theme.name}`
    });
    
    return await this.findById(quiz._id).populate('questions').populate('theme');
  } catch (error) {
    console.error('Error in createQuizWithTheme:', error);
    throw error;
  }
};

const DailyQuiz = mongoose.model('DailyQuiz', dailyQuizSchema);

module.exports = DailyQuiz;
