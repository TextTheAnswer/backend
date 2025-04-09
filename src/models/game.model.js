const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  lobby: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lobby',
    required: true
  },
  questions: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    startTime: Date,
    endTime: Date,
    answers: [{
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      answer: Number,
      isCorrect: Boolean,
      answerTime: Date
    }]
  }],
  players: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    }
  }],
  status: {
    type: String,
    enum: ['starting', 'in_progress', 'finished'],
    default: 'starting'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  startTime: Date,
  endTime: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Automatically delete after 24 hours
  }
});

// Static method to create a new game for a lobby
gameSchema.statics.createForLobby = async function(lobbyId) {
  const Lobby = mongoose.model('Lobby');
  const Question = mongoose.model('Question');
  
  // Get the lobby
  const lobby = await Lobby.findById(lobbyId).populate('players.user');
  if (!lobby) {
    throw new Error('Lobby not found');
  }
  
  // Get 5 random questions
  const questions = await Question.aggregate([
    { $sample: { size: 5 } }
  ]);
  
  if (questions.length < 5) {
    throw new Error('Not enough questions in the database');
  }
  
  // Create game object
  const game = await this.create({
    lobby: lobbyId,
    questions: questions.map(q => ({ question: q._id })),
    players: lobby.players.map(p => ({ user: p.user._id, score: 0, correctAnswers: 0 })),
    status: 'starting',
    startTime: new Date()
  });
  
  // Update lobby with game reference
  lobby.status = 'playing';
  lobby.gameId = game._id;
  await lobby.save();
  
  return game;
};

// Method to submit an answer
gameSchema.methods.submitAnswer = async function(userId, questionIndex, answer) {
  // Check if game is in progress
  if (this.status !== 'in_progress') {
    throw new Error('Game is not in progress');
  }
  
  // Check if question exists
  if (!this.questions[questionIndex]) {
    throw new Error('Question not found');
  }
  
  // Check if player is in the game
  const playerIndex = this.players.findIndex(p => p.user.toString() === userId.toString());
  if (playerIndex === -1) {
    throw new Error('Player not in game');
  }
  
  // Check if player already answered this question
  const alreadyAnswered = this.questions[questionIndex].answers.some(
    a => a.player.toString() === userId.toString()
  );
  if (alreadyAnswered) {
    throw new Error('Already answered this question');
  }
  
  // Get the correct answer
  const Question = mongoose.model('Question');
  const question = await Question.findById(this.questions[questionIndex].question);
  if (!question) {
    throw new Error('Question not found in database');
  }
  
  // Check if answer is correct
  const isCorrect = question.correctAnswer === answer;
  
  // Calculate score based on time (faster answers get more points)
  let score = 0;
  if (isCorrect) {
    const now = new Date();
    const startTime = this.questions[questionIndex].startTime;
    const timeElapsed = Math.min(10000, now - startTime); // Cap at 10 seconds
    score = Math.round(1000 - (timeElapsed / 10000) * 500); // 500-1000 points based on time
    
    // Update player score
    this.players[playerIndex].score += score;
    this.players[playerIndex].correctAnswers += 1;
  }
  
  // Add answer to question
  this.questions[questionIndex].answers.push({
    player: userId,
    answer,
    isCorrect,
    answerTime: new Date()
  });
  
  // Check if all players have answered or time is up
  const allAnswered = this.players.length === this.questions[questionIndex].answers.length;
  
  // Return result
  return {
    isCorrect,
    correctAnswer: question.correctAnswer,
    score,
    allAnswered
  };
};

// Method to end the game
gameSchema.methods.endGame = async function() {
  this.status = 'finished';
  this.endTime = new Date();
  
  // Determine winner
  if (this.players.length > 0) {
    const sortedPlayers = [...this.players].sort((a, b) => b.score - a.score);
    this.winner = sortedPlayers[0].user;
  }
  
  // Update lobby
  const Lobby = mongoose.model('Lobby');
  const lobby = await Lobby.findById(this.lobby);
  if (lobby) {
    lobby.status = 'finished';
    await lobby.save();
  }
  
  return this;
};

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
