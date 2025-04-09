const mongoose = require('mongoose');

const lobbySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  players: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: {
      type: Number,
      default: 0
    },
    ready: {
      type: Boolean,
      default: false
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  maxPlayers: {
    type: Number,
    default: 5,
    min: 2,
    max: 10
  },
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting'
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Automatically delete after 1 hour
  }
});

// Generate a random 6-character code
lobbySchema.statics.generateCode = function() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Check if lobby is full
lobbySchema.methods.isFull = function() {
  return this.players.length >= this.maxPlayers;
};

// Add player to lobby
lobbySchema.methods.addPlayer = function(userId) {
  if (this.isFull()) {
    throw new Error('Lobby is full');
  }
  
  // Check if player is already in the lobby
  const existingPlayer = this.players.find(p => p.user.toString() === userId.toString());
  if (existingPlayer) {
    return false;
  }
  
  this.players.push({ user: userId });
  return true;
};

// Remove player from lobby
lobbySchema.methods.removePlayer = function(userId) {
  const initialLength = this.players.length;
  this.players = this.players.filter(p => p.user.toString() !== userId.toString());
  return initialLength !== this.players.length;
};

// Check if user is in lobby
lobbySchema.methods.hasPlayer = function(userId) {
  return this.players.some(p => p.user.toString() === userId.toString());
};

const Lobby = mongoose.model('Lobby', lobbySchema);

module.exports = Lobby;
