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

/**
 * Get user's game history
 * Returns paginated list of games the user has participated in
 */
exports.getGameHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Build query to find games the user participated in
    const query = { 'participants.userId': req.user.id };
    
    // Add filter for game status if provided
    if (status && ['completed', 'in-progress'].includes(status)) {
      query.status = status;
    }
    
    // Find games and count total
    const games = await Game.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('category', 'name')
      .populate('winner', 'name')
      .populate('createdBy', 'name');
      
    const total = await Game.countDocuments(query);
    
    // Format the response for each game
    const formattedGames = games.map(game => {
      // Find user's data in participants array
      const userParticipant = game.participants.find(
        p => p.userId.toString() === req.user.id
      );
      
      return {
        gameId: game._id,
        date: game.createdAt,
        name: game.name,
        theme: game.theme,
        category: game.category ? game.category.name : null,
        participants: game.participants.length,
        userPosition: userParticipant ? userParticipant.position : null,
        userScore: userParticipant ? userParticipant.score : 0,
        status: game.status,
        winnerName: game.winner ? game.winner.name : null
      };
    });
    
    res.status(200).json({
      success: true,
      games: formattedGames,
      pagination: {
        total,
        pages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        hasMore: pageNum * limitNum < total
      }
    });
  } catch (error) {
    console.error('Get game history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving game history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get detailed information about a specific game
 * Includes questions, participants, and user's answers
 */
exports.getGameDetails = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // Find the game with populated fields
    const game = await Game.findById(gameId)
      .populate('questions', 'text category difficulty correctAnswer')
      .populate('category', 'name')
      .populate('createdBy', 'name')
      .populate('participants.userId', 'name');
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    // Check if user participated in this game
    const userParticipant = game.participants.find(
      p => p.userId._id.toString() === req.user.id
    );
    
    if (!userParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this game data'
      });
    }
    
    // Format the detailed game data
    const detailedGame = {
      id: game._id,
      name: game.name || `Game #${game._id.toString().substr(-6)}`,
      date: game.createdAt,
      category: game.category ? game.category.name : null,
      difficulty: game.difficulty,
      createdBy: game.createdBy ? game.createdBy.name : 'Unknown',
      status: game.status,
      questions: game.questions.map(q => ({
        id: q._id,
        question: q.text,
        correctAnswer: q.correctAnswer
      })),
      participants: game.participants.map(p => ({
        userId: p.userId._id,
        name: p.userId.name,
        score: p.score,
        position: p.position,
        answeredCorrect: p.answers.filter(a => a.isCorrect).length,
        answeredIncorrect: p.answers.filter(a => !a.isCorrect).length,
        timeToComplete: p.answers.reduce((sum, a) => sum + (a.timeSpent || 0), 0)
      })),
      userAnswers: userParticipant.answers.map(a => ({
        questionId: a.questionId,
        answer: a.answer,
        isCorrect: a.isCorrect,
        timeSpent: a.timeSpent
      }))
    };
    
    res.status(200).json({
      success: true,
      game: detailedGame
    });
  } catch (error) {
    console.error('Get game details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving game details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get user's game statistics
 * Provides aggregated stats about multiplayer game performance
 */
exports.getGameStats = async (req, res) => {
  try {
    // Find all games the user has participated in
    const games = await Game.find({
      'participants.userId': req.user.id,
      'status': 'completed'
    });
    
    if (games.length === 0) {
      return res.status(200).json({
        success: true,
        stats: {
          totalGamesPlayed: 0,
          gamesWon: 0,
          averagePosition: null,
          averageScore: null,
          totalQuestionsAnswered: 0,
          correctAnswerRate: null,
          fastestTime: null,
          favoriteCategory: null,
          mostPlayedWith: []
        }
      });
    }
    
    // Calculate statistics
    let totalGamesPlayed = games.length;
    let gamesWon = 0;
    let totalPosition = 0;
    let totalScore = 0;
    let totalQuestionsAnswered = 0;
    let correctAnswers = 0;
    let fastestTime = Number.MAX_VALUE;
    let categoryCount = {};
    let playedWith = {};
    
    // Process each game for stats
    games.forEach(game => {
      // Find user's participant data
      const userParticipant = game.participants.find(
        p => p.userId.toString() === req.user.id
      );
      
      if (!userParticipant) return;
      
      // Track wins
      if (game.winner && game.winner.toString() === req.user.id) {
        gamesWon++;
      }
      
      // Track positions and scores
      if (userParticipant.position) {
        totalPosition += userParticipant.position;
      }
      totalScore += userParticipant.score || 0;
      
      // Track questions and correct answers
      const userAnswers = userParticipant.answers || [];
      totalQuestionsAnswered += userAnswers.length;
      correctAnswers += userAnswers.filter(a => a.isCorrect).length;
      
      // Track fastest time
      const gameTime = userAnswers.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
      if (gameTime > 0 && gameTime < fastestTime) {
        fastestTime = gameTime;
      }
      
      // Track categories
      if (game.category) {
        const categoryId = game.category.toString();
        categoryCount[categoryId] = (categoryCount[categoryId] || 0) + 1;
      }
      
      // Track other players
      game.participants.forEach(p => {
        if (p.userId.toString() !== req.user.id) {
          const otherId = p.userId.toString();
          playedWith[otherId] = (playedWith[otherId] || 0) + 1;
        }
      });
    });
    
    // Find favorite category
    let favoriteCategory = null;
    let maxCategoryCount = 0;
    for (const [categoryId, count] of Object.entries(categoryCount)) {
      if (count > maxCategoryCount) {
        favoriteCategory = categoryId;
        maxCategoryCount = count;
      }
    }
    
    // Find most played with users
    const playedWithArray = Object.entries(playedWith)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, count]) => userId);
      
    // If we have a favorite category, get its name
    let favoriteCategoryName = null;
    if (favoriteCategory) {
      const category = await require('../models/category.model').findById(favoriteCategory);
      if (category) {
        favoriteCategoryName = category.name;
      }
    }
    
    // Get names of most played with users
    let mostPlayedWithNames = [];
    if (playedWithArray.length > 0) {
      const users = await require('../models/user.model').find({
        _id: { $in: playedWithArray }
      }).select('name');
      
      mostPlayedWithNames = users.map(u => u.name);
    }
    
    // Format the final statistics
    const stats = {
      totalGamesPlayed,
      gamesWon,
      averagePosition: totalGamesPlayed > 0 ? (totalPosition / totalGamesPlayed).toFixed(1) : null,
      averageScore: totalGamesPlayed > 0 ? (totalScore / totalGamesPlayed).toFixed(1) : null,
      totalQuestionsAnswered,
      correctAnswerRate: totalQuestionsAnswered > 0 ? (correctAnswers / totalQuestionsAnswered).toFixed(2) : null,
      fastestTime: fastestTime !== Number.MAX_VALUE ? fastestTime.toFixed(1) : null,
      favoriteCategory: favoriteCategoryName,
      mostPlayedWith: mostPlayedWithNames
    };
    
    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get game stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving game statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
