const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  correctAnswer: {
    type: String,
    required: true,
    trim: true
  },
  alternativeAnswers: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    required: true,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  explanation: {
    type: String,
    trim: true
  },
  timeLimit: {
    type: Number,
    default: 30,
    min: 10,
    max: 120
  },
  isMultipleChoice: {
    type: Boolean,
    default: false
  },
  options: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
