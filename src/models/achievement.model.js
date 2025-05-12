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
      enum: ['streak', 'questions_answered', 'correct_answers', 'perfect_quizzes', 'multiplayer_wins', 'study_materials', 'easter_egg'],
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    additionalData: {
      type: mongoose.Schema.Types.Mixed,
      default: null
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
  isHidden: {
    type: Boolean,
    default: false
  },
  hint: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Achievement', achievementSchema);