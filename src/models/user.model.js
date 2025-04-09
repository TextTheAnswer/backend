const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      // Password is required unless user is authenticated via Apple
      return !this.appleId;
    }
  },
  appleId: {
    type: String,
    sparse: true,
    unique: true
  },
  name: {
    type: String,
    trim: true
  },
  subscription: {
    status: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free'
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodEnd: Date,
    freeTrialUsed: {
      type: Boolean,
      default: false
    }
  },
  stats: {
    streak: {
      type: Number,
      default: 0
    },
    lastPlayed: Date,
    totalCorrect: {
      type: Number,
      default: 0
    },
    totalAnswered: {
      type: Number,
      default: 0
    }
  },
  dailyQuiz: {
    lastCompleted: Date,
    questionsAnswered: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  const user = this;
  
  // Only hash the password if it's modified or new
  if (!user.isModified('password') || !user.password) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Method to reset daily quiz stats
userSchema.methods.resetDailyQuiz = function() {
  this.dailyQuiz.questionsAnswered = 0;
  this.dailyQuiz.correctAnswers = 0;
  return this;
};

// Method to check if user is premium
userSchema.methods.isPremium = function() {
  return this.subscription.status === 'premium' && 
         (!this.subscription.currentPeriodEnd || 
          new Date(this.subscription.currentPeriodEnd) > new Date());
};

const User = mongoose.model('User', userSchema);

module.exports = User;
