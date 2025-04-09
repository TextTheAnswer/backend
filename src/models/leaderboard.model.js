const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['daily', 'multiplayer'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    sparse: true // Only required for multiplayer leaderboards
  },
  entries: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    score: {
      type: Number,
      default: 0
    },
    rank: {
      type: Number
    },
    name: String // Denormalized for performance
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
leaderboardSchema.index({ type: 1, date: 1 }, { unique: true });
leaderboardSchema.index({ gameId: 1 }, { sparse: true });

// Static method to get or create daily leaderboard
leaderboardSchema.statics.getDailyLeaderboard = async function(date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  let leaderboard = await this.findOne({ 
    type: 'daily', 
    date: startOfDay 
  }).populate('entries.user', 'name');
  
  if (!leaderboard) {
    leaderboard = await this.create({
      type: 'daily',
      date: startOfDay,
      entries: []
    });
  }
  
  return leaderboard;
};

// Static method to get or create multiplayer leaderboard
leaderboardSchema.statics.getMultiplayerLeaderboard = async function(gameId) {
  const game = await mongoose.model('Game').findById(gameId);
  if (!game) {
    throw new Error('Game not found');
  }
  
  let leaderboard = await this.findOne({ 
    type: 'multiplayer', 
    gameId 
  }).populate('entries.user', 'name');
  
  if (!leaderboard) {
    // Create with current date
    leaderboard = await this.create({
      type: 'multiplayer',
      date: new Date(),
      gameId,
      entries: []
    });
  }
  
  return leaderboard;
};

// Method to update user score
leaderboardSchema.methods.updateScore = async function(userId, score, userName) {
  // Find if user already has an entry
  const entryIndex = this.entries.findIndex(e => e.user.toString() === userId.toString());
  
  if (entryIndex === -1) {
    // Add new entry
    this.entries.push({
      user: userId,
      score,
      name: userName
    });
  } else {
    // Update existing entry
    this.entries[entryIndex].score = score;
    if (userName) {
      this.entries[entryIndex].name = userName;
    }
  }
  
  // Sort entries by score (descending)
  this.entries.sort((a, b) => b.score - a.score);
  
  // Update ranks
  this.entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  this.lastUpdated = new Date();
  return this.save();
};

// Method to get top entries
leaderboardSchema.methods.getTopEntries = function(limit = 10) {
  return this.entries.slice(0, limit).map(entry => ({
    userId: entry.user,
    name: entry.name,
    score: entry.score,
    rank: entry.rank
  }));
};

// Method to get user rank
leaderboardSchema.methods.getUserRank = function(userId) {
  const entry = this.entries.find(e => e.user.toString() === userId.toString());
  return entry ? entry.rank : null;
};

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

module.exports = Leaderboard;
