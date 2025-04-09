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
  }
}, {
  timestamps: true
});

// Static method to get or create today's quiz
dailyQuizSchema.statics.getTodayQuiz = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let dailyQuiz = await this.findOne({ date: today });
  
  if (!dailyQuiz) {
    // Create a new daily quiz if none exists for today
    const Question = mongoose.model('Question');
    
    // Get 10 random questions
    const questions = await Question.aggregate([
      { $sample: { size: 10 } }
    ]);
    
    if (questions.length < 10) {
      throw new Error('Not enough questions in the database');
    }
    
    dailyQuiz = await this.create({
      date: today,
      questions: questions.map(q => q._id),
      active: true
    });
    
    // Populate the questions
    dailyQuiz = await this.findById(dailyQuiz._id).populate('questions');
  }
  
  return dailyQuiz;
};

const DailyQuiz = mongoose.model('DailyQuiz', dailyQuizSchema);

module.exports = DailyQuiz;
