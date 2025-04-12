const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['text', 'pdf', 'image'],
    default: 'text'
  },
  originalFilename: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  generatedQuestions: {
    count: {
      type: Number,
      default: 0
    },
    lastGenerated: Date
  }
}, {
  timestamps: true
});

// Method to check if user can generate more questions
studyMaterialSchema.methods.canGenerateQuestions = function(user) {
  // Education tier users can generate unlimited questions
  if (user.subscription.status === 'education' && user.education.verificationStatus === 'verified') {
    return true;
  }
  
  // Premium users can generate unlimited questions
  if (user.subscription.status === 'premium') {
    return true;
  }
  
  // Free tier users can generate up to 5 questions per day per study material
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!this.generatedQuestions.lastGenerated || 
      this.generatedQuestions.lastGenerated < today || 
      this.generatedQuestions.count < 5) {
    return true;
  }
  
  return false;
};

const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);

module.exports = StudyMaterial; 