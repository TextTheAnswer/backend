const Lobby = require('../models/lobby.model');
const Game = require('../models/game.model');
const User = require('../models/user.model');

// Create a new lobby
exports.createLobby = async (req, res) => {
  try {
    const { name, isPublic, maxPlayers } = req.body;
    const user = req.user;
    
    // Check if user is premium
    if (!user.isPremium()) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required to create lobbies'
      });
    }
    
    // Generate a unique code
    let code;
    let isCodeUnique = false;
    
    while (!isCodeUnique) {
      code = Lobby.generateCode();
      const existingLobby = await Lobby.findOne({ code });
      if (!existingLobby) {
        isCodeUnique = true;
      }
    }
    
    // Create the lobby
    const lobby = new Lobby({
      name,
      code,
      isPublic: isPublic !== false, // Default to public if not specified
      host: user._id,
      maxPlayers: maxPlayers || 5,
      players: [{ user: user._id, ready: false }]
    });
    
    await lobby.save();
    
    res.status(201).json({
      success: true,
      lobby: {
        id: lobby._id,
        name: lobby.name,
        code: lobby.code,
        isPublic: lobby.isPublic,
        host: lobby.host,
        players: lobby.players,
        maxPlayers: lobby.maxPlayers,
        status: lobby.status
      }
    });
  } catch (error) {
    console.error('Create lobby error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating lobby',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all public lobbies
exports.getPublicLobbies = async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user is premium
    if (!user.isPremium()) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required to access multiplayer features'
      });
    }
    
    // Get all public lobbies that are waiting for players
    const lobbies = await Lobby.find({ 
      isPublic: true, 
      status: 'waiting' 
    })
    .populate('host', 'name')
    .populate('players.user', 'name')
    .select('-__v')
    .sort('-createdAt');
    
    // Format the response
    const formattedLobbies = lobbies.map(lobby => ({
      id: lobby._id,
      name: lobby.name,
      code: lobby.code,
      host: {
        id: lobby.host._id,
        name: lobby.host.name
      },
      playerCount: lobby.players.length,
      maxPlayers: lobby.maxPlayers,
      isFull: lobby.isFull()
    }));
    
    res.status(200).json({
      success: true,
      lobbies: formattedLobbies
    });
  } catch (error) {
    console.error('Get public lobbies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching public lobbies',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Join a lobby by code
exports.joinLobby = async (req, res) => {
  try {
    const { code } = req.body;
    const user = req.user;
    
    // Check if user is premium
    if (!user.isPremium()) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required to access multiplayer features'
      });
    }
    
    // Find the lobby
    const lobby = await Lobby.findOne({ code })
      .populate('host', 'name')
      .populate('players.user', 'name');
    
    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: 'Lobby not found'
      });
    }
    
    // Check if lobby is waiting for players
    if (lobby.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: 'This lobby is no longer accepting players'
      });
    }
    
    // Check if lobby is full
    if (lobby.isFull()) {
      return res.status(400).json({
        success: false,
        message: 'This lobby is full'
      });
    }
    
    // Add player to lobby
    const added = lobby.addPlayer(user._id);
    if (!added) {
      return res.status(400).json({
        success: false,
        message: 'You are already in this lobby'
      });
    }
    
    await lobby.save();
    
    // Format the response
    const formattedLobby = {
      id: lobby._id,
      name: lobby.name,
      code: lobby.code,
      isPublic: lobby.isPublic,
      host: {
        id: lobby.host._id,
        name: lobby.host.name
      },
      players: lobby.players.map(p => ({
        id: p.user._id,
        name: p.user.name,
        ready: p.ready
      })),
      maxPlayers: lobby.maxPlayers,
      status: lobby.status
    };
    
    res.status(200).json({
      success: true,
      lobby: formattedLobby
    });
  } catch (error) {
    console.error('Join lobby error:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining lobby',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Leave a lobby
exports.leaveLobby = async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const user = req.user;
    
    // Find the lobby
    const lobby = await Lobby.findById(lobbyId);
    
    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: 'Lobby not found'
      });
    }
    
    // Check if user is in the lobby
    if (!lobby.hasPlayer(user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not in this lobby'
      });
    }
    
    // Remove player from lobby
    lobby.removePlayer(user._id);
    
    // If lobby is empty, delete it
    if (lobby.players.length === 0) {
      await Lobby.findByIdAndDelete(lobbyId);
      return res.status(200).json({
        success: true,
        message: 'You left the lobby and it was deleted'
      });
    }
    
    // If host leaves, assign a new host
    if (lobby.host.toString() === user._id.toString()) {
      lobby.host = lobby.players[0].user;
    }
    
    await lobby.save();
    
    res.status(200).json({
      success: true,
      message: 'You left the lobby'
    });
  } catch (error) {
    console.error('Leave lobby error:', error);
    res.status(500).json({
      success: false,
      message: 'Error leaving lobby',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Start a game in a lobby
exports.startGame = async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const user = req.user;
    
    // Find the lobby
    const lobby = await Lobby.findById(lobbyId)
      .populate('players.user', 'name');
    
    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: 'Lobby not found'
      });
    }
    
    // Check if user is the host
    if (lobby.host.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can start the game'
      });
    }
    
    // Check if lobby has at least 2 players
    if (lobby.players.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 players are required to start a game'
      });
    }
    
    // Check if game is already in progress
    if (lobby.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: 'Game is already in progress or finished'
      });
    }
    
    // Create a new game
    const game = await Game.createForLobby(lobbyId);
    
    // Populate game with question details
    await game.populate('questions.question');
    
    // Format questions for the response (without correct answers)
    const formattedQuestions = game.questions.map(q => ({
      id: q.question._id,
      text: q.question.text,
      options: q.question.options,
      category: q.question.category,
      difficulty: q.question.difficulty
    }));
    
    res.status(200).json({
      success: true,
      game: {
        id: game._id,
        questions: formattedQuestions,
        players: game.players.map(p => ({
          id: p.user,
          score: p.score
        })),
        status: game.status
      }
    });
  } catch (error) {
    console.error('Start game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting game',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Submit an answer in a game
exports.submitGameAnswer = async (req, res) => {
  try {
    const { gameId, questionIndex, answer } = req.body;
    const user = req.user;
    
    // Find the game
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    // Submit the answer
    const result = await game.submitAnswer(user._id, questionIndex, answer);
    
    // Save the game
    await game.save();
    
    // Get updated player score
    const player = game.players.find(p => p.user.toString() === user._id.toString());
    
    res.status(200).json({
      success: true,
      result: {
        isCorrect: result.isCorrect,
        correctAnswer: result.correctAnswer,
        score: result.score,
        totalScore: player ? player.score : 0,
        allAnswered: result.allAnswered
      }
    });
  } catch (error) {
    console.error('Submit game answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting answer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get game results
exports.getGameResults = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // Find the game
    const game = await Game.findById(gameId)
      .populate('players.user', 'name')
      .populate('winner', 'name');
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    // Format the response
    const results = {
      id: game._id,
      players: game.players.map(p => ({
        id: p.user._id,
        name: p.user.name,
        score: p.score,
        correctAnswers: p.correctAnswers
      })),
      winner: game.winner ? {
        id: game.winner._id,
        name: game.winner.name
      } : null,
      status: game.status
    };
    
    res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Get game results error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching game results',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
