const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  criteria: {
    type: {
      type: String,
      enum: ['streak', 'questions_answered', 'correct_answers', 'perfect_quizzes', 'multiplayer_wins', 'study_materials'],
      required: true
    },
    value: {
      type: Number,
      required: true
    }
  },
  reward: {
    type: {
      type: String,
      enum: ['xp', 'premium_days', 'badge'],
      default: 'badge'
    },
    value: {
      type: Number,
      default: 0
    }
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  premiumOnly: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Achievement', achievementSchema);