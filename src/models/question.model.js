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
    default: 15,
    min: 15,
    max: 120
  },
  // isMultipleChoice and options fields removed as we're focusing solely on free-text answers
  // New fields for improved categorization
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient category-based queries
questionSchema.index({ category: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ isApproved: 1 });

// Static method to get questions by category
questionSchema.statics.getByCategory = async function(category, limit = 10) {
  try {
    return await this.find({ 
      category, 
      isApproved: true 
    })
    .sort({ lastUsed: 1, usageCount: 1 }) // Prioritize questions used less recently and less frequently
    .limit(limit);
  } catch (error) {
    console.error('Error in getByCategory:', error);
    throw error;
  }
};

// Static method to get random questions
questionSchema.statics.getRandom = async function(limit = 10, excludeCategories = []) {
  try {
    const query = { isApproved: true };
    
    if (excludeCategories && excludeCategories.length > 0) {
      query.category = { $nin: excludeCategories };
    }
    
    return await this.aggregate([
      { $match: query },
      { $sample: { size: limit } }
    ]);
  } catch (error) {
    console.error('Error in getRandom:', error);
    throw error;
  }
};

// Method to update usage statistics when a question is used
questionSchema.methods.updateUsage = async function() {
  // Update usage count
  this.usageCount += 1;
  
  // Set lastUsed to current date
  this.lastUsed = new Date();
  
  return this.save();
};

// Static method to get questions by difficulty
questionSchema.statics.getByDifficulty = async function(difficulty, limit = 10) {
  try {
    return await this.find({ 
      difficulty, 
      isApproved: true 
    })
    .sort({ lastUsed: 1, usageCount: 1 })
    .limit(limit);
  } catch (error) {
    console.error('Error in getByDifficulty:', error);
    throw error;
  }
};

// Static method to get questions by tags
questionSchema.statics.getByTags = async function(tags, limit = 10) {
  try {
    return await this.find({ 
      tags: { $in: tags }, 
      isApproved: true 
    })
    .sort({ lastUsed: 1, usageCount: 1 })
    .limit(limit);
  } catch (error) {
    console.error('Error in getByTags:', error);
    throw error;
  }
};

// Static method to get unused questions or least recently used
questionSchema.statics.getUnusedQuestions = async function(daysAgo = 30, limit = 10, excludeCategories = []) {
  try {
    // Calculate the date X days ago
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    // Base query for approved questions
    const query = { 
      isApproved: true,
      $or: [
        { lastUsed: { $lt: cutoffDate } },
        { lastUsed: { $exists: false } }
      ]
    };
    
    // Add category exclusion if provided
    if (excludeCategories && excludeCategories.length > 0) {
      query.category = { $nin: excludeCategories };
    }
    
    // Get questions that haven't been used in the specified days
    return await this.find(query)
      .sort({ usageCount: 1, lastUsed: 1 }) // Prioritize least used and oldest used first
      .limit(limit);
  } catch (error) {
    console.error('Error in getUnusedQuestions:', error);
    throw error;
  }
};

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
