const Lobby = require('../models/lobby.model');
const Game = require('../models/game.model');
const Question = require('../models/question.model');
const User = require('../models/user.model'); // Added missing User model import
const logger = require('../utils/logger'); // Use consistent logging

/**
 * Socket.io handler for game-related events
 * @param {Object} io - Socket.io instance
 * @returns {Object} - Game namespace
 */
module.exports = function(io) {
  // Namespace for game-related socket events
  const gameNamespace = io.of('/game');
  
  // Store active timers to prevent memory leaks
  const questionTimers = new Map();
  
  // Middleware to authenticate socket connections
  gameNamespace.use(async (socket, next) => {
    try {
      // Get user ID from handshake auth
      const userId = socket.handshake.auth.userId;
      if (!userId) {
        return next(new Error('Authentication required'));
      }
      
      // Verify user exists in database
      const user = await User.findById(userId);
      if (!user) {
        return next(new Error('User not found'));
      }
      
      // Store user ID in socket object
      socket.userId = userId;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });
  
  gameNamespace.on('connection', (socket) => {
    logger.info(`User ${socket.userId} connected to game namespace`);
    
    /**
     * Join a lobby room
     * @param {string} lobbyId - ID of the lobby to join
     */
    socket.on('join-lobby', async (lobbyId) => {
      try {
        // Find the lobby
        const lobby = await Lobby.findById(lobbyId)
          .populate('host', 'name')
          .populate('players.user', 'name');
        
        if (!lobby) {
          return socket.emit('error', { message: 'Lobby not found' });
        }
        
        // Check if user is in the lobby
        if (!lobby.hasPlayer(socket.userId)) {
          return socket.emit('error', { message: 'You are not in this lobby' });
        }
        
        // Join the lobby room
        socket.join(`lobby:${lobbyId}`);
        
        // Notify other players
        socket.to(`lobby:${lobbyId}`).emit('player-joined', {
          userId: socket.userId,
          playerCount: lobby.players.length
        });
        
        // Send lobby data to the joining player
        socket.emit('lobby-data', {
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
        });
      } catch (error) {
        logger.error('Socket join-lobby error:', error);
        socket.emit('error', { message: 'Error joining lobby room' });
      }
    });
    
    /**
     * Leave a lobby room
     * @param {string} lobbyId - ID of the lobby to leave
     */
    socket.on('leave-lobby', async (lobbyId) => {
      try {
        // Leave the lobby room
        socket.leave(`lobby:${lobbyId}`);
        
        // Find the lobby
        const lobby = await Lobby.findById(lobbyId);
        
        if (lobby) {
          // Notify other players
          socket.to(`lobby:${lobbyId}`).emit('player-left', {
            userId: socket.userId
          });
        }
      } catch (error) {
        logger.error('Socket leave-lobby error:', error);
        socket.emit('error', { message: 'Error leaving lobby' });
      }
    });
    
    /**
     * Set player ready status
     * @param {Object} data - Contains lobbyId and ready status
     */
    socket.on('set-ready', async (data) => {
      try {
        const { lobbyId, ready } = data;
        
        // Validate input
        if (!lobbyId) {
          return socket.emit('error', { message: 'Lobby ID is required' });
        }
        
        if (typeof ready !== 'boolean') {
          return socket.emit('error', { message: 'Ready status must be a boolean' });
        }
        
        // Find the lobby
        const lobby = await Lobby.findById(lobbyId);
        
        if (!lobby) {
          return socket.emit('error', { message: 'Lobby not found' });
        }
        
        // Find the player
        const playerIndex = lobby.players.findIndex(p => p.user.toString() === socket.userId);
        
        if (playerIndex === -1) {
          return socket.emit('error', { message: 'You are not in this lobby' });
        }
        
        // Update ready status
        lobby.players[playerIndex].ready = ready;
        await lobby.save();
        
        // Notify all players in the lobby
        gameNamespace.to(`lobby:${lobbyId}`).emit('player-ready-changed', {
          userId: socket.userId,
          ready
        });
        
        // Check if all players are ready
        const allReady = lobby.players.every(p => p.ready);
        if (allReady && lobby.players.length >= 2) {
          gameNamespace.to(`lobby:${lobbyId}`).emit('all-players-ready');
        }
      } catch (error) {
        logger.error('Socket set-ready error:', error);
        socket.emit('error', { message: 'Error updating ready status' });
      }
    });
    
    /**
     * Join a game room
     * @param {string} gameId - ID of the game to join
     */
    socket.on('join-game', async (gameId) => {
      try {
        // Validate input
        if (!gameId) {
          return socket.emit('error', { message: 'Game ID is required' });
        }
        
        // Find the game
        const game = await Game.findById(gameId);
        
        if (!game) {
          return socket.emit('error', { message: 'Game not found' });
        }
        
        // Check if user is in the game
        const playerIndex = game.players.findIndex(p => p.user.toString() === socket.userId);
        
        if (playerIndex === -1) {
          return socket.emit('error', { message: 'You are not in this game' });
        }
        
        // Join the game room
        socket.join(`game:${gameId}`);
        
        // Notify other players
        socket.to(`game:${gameId}`).emit('player-joined-game', {
          userId: socket.userId
        });
      } catch (error) {
        logger.error('Socket join-game error:', error);
        socket.emit('error', { message: 'Error joining game room' });
      }
    });
    
    /**
     * Start question timer
     * @param {Object} data - Contains gameId and questionIndex
     */
    socket.on('start-question', async (data) => {
      try {
        const { gameId, questionIndex } = data;
        
        // Validate input
        if (!gameId) {
          return socket.emit('error', { message: 'Game ID is required' });
        }
        
        if (typeof questionIndex !== 'number' || questionIndex < 0) {
          return socket.emit('error', { message: 'Valid question index is required' });
        }
        
        // Find the game
        const game = await Game.findById(gameId);
        
        if (!game) {
          return socket.emit('error', { message: 'Game not found' });
        }
        
        // Check if user is the host
        const lobby = await Lobby.findById(game.lobby);
        if (!lobby || lobby.host.toString() !== socket.userId) {
          return socket.emit('error', { message: 'Only the host can start questions' });
        }
        
        // Check if question exists
        if (!game.questions[questionIndex]) {
          return socket.emit('error', { message: 'Question not found' });
        }
        
        // Set question start time
        game.questions[questionIndex].startTime = new Date();
        
        // If it's the first question, set game status to in_progress
        if (questionIndex === 0) {
          game.status = 'in_progress';
        }
        
        await game.save();
        
        // Get the question details
        const questionId = game.questions[questionIndex].question;
        const question = await Question.findById(questionId);
        
        if (!question) {
          return socket.emit('error', { message: 'Question not found in database' });
        }
        
        // Notify all players in the game
        gameNamespace.to(`game:${gameId}`).emit('question-started', {
          questionIndex,
          question: {
            id: question._id,
            text: question.text,
            options: question.options,
            category: question.category,
            difficulty: question.difficulty
          },
          startTime: game.questions[questionIndex].startTime
        });
        
        // Clear any existing timer for this game and question
        if (questionTimers.has(`${gameId}-${questionIndex}`)) {
          clearTimeout(questionTimers.get(`${gameId}-${questionIndex}`));
        }
        
        // Set a timer to end the question after 20 seconds
        const timerId = setTimeout(async () => {
          try {
            // Remove timer from map once executed
            questionTimers.delete(`${gameId}-${questionIndex}`);
            
            // Find the game again to get latest state
            const updatedGame = await Game.findById(gameId);
            
            if (!updatedGame) {
              logger.warn(`Game ${gameId} not found during question timer completion`);
              return;
            }
            
            // Set question end time
            updatedGame.questions[questionIndex].endTime = new Date();
            await updatedGame.save();
            
            // Get the correct answer
            const correctAnswer = question.correctAnswer;
            
            // Notify all players that time is up
            gameNamespace.to(`game:${gameId}`).emit('question-ended', {
              questionIndex,
              correctAnswer,
              explanation: question.explanation
            });
            
            // If this was the last question, end the game
            if (questionIndex === updatedGame.questions.length - 1) {
              await updatedGame.endGame();
              
              // Get winner details
              let winner = null;
              if (updatedGame.winner) {
                const winnerUser = await User.findById(updatedGame.winner).select('name');
                if (winnerUser) {
                  winner = {
                    id: winnerUser._id,
                    name: winnerUser.name
                  };
                }
              }
              
              // Notify all players that the game has ended
              gameNamespace.to(`game:${gameId}`).emit('game-ended', {
                winner,
                players: updatedGame.players.map(p => ({
                  id: p.user,
                  score: p.score,
                  correctAnswers: p.correctAnswers
                }))
              });
            }
          } catch (error) {
            logger.error('Question timer error:', error);
          }
        }, 20000); // 20 seconds per question
        
        // Store timer reference to allow cancellation if needed
        questionTimers.set(`${gameId}-${questionIndex}`, timerId);
        
      } catch (error) {
        logger.error('Socket start-question error:', error);
        socket.emit('error', { message: 'Error starting question' });
      }
    });
    
    /**
     * Submit answer for a question
     * @param {Object} data - Contains gameId, questionIndex, and answer
     */
    socket.on('submit-answer', async (data) => {
      try {
        const { gameId, questionIndex, answer } = data;
        
        // Validate input
        if (!gameId || typeof questionIndex !== 'number' || answer === undefined) {
          return socket.emit('error', { message: 'Invalid input parameters' });
        }
        
        // Find the game
        const game = await Game.findById(gameId);
        if (!game) {
          return socket.emit('error', { message: 'Game not found' });
        }
        
        // Check if user is in the game
        const playerIndex = game.players.findIndex(p => p.user.toString() === socket.userId);
        if (playerIndex === -1) {
          return socket.emit('error', { message: 'You are not in this game' });
        }
        
        // Check if question exists and is active
        if (!game.questions[questionIndex] || !game.questions[questionIndex].startTime) {
          return socket.emit('error', { message: 'Question not active' });
        }
        
        // Check if answer already submitted
        if (game.questions[questionIndex].answers.some(a => a.player.toString() === socket.userId)) {
          return socket.emit('error', { message: 'Answer already submitted' });
        }
        
        // Get question details
        const questionId = game.questions[questionIndex].question;
        const question = await Question.findById(questionId);
        if (!question) {
          return socket.emit('error', { message: 'Question not found in database' });
        }
        
        // Calculate score based on answer time
        const startTime = new Date(game.questions[questionIndex].startTime);
        const answerTime = new Date();
        const timeElapsed = (answerTime - startTime) / 1000; // in seconds
        
        // Check if answer is correct
        const isCorrect = answer === question.correctAnswer;
        
        // Base score calculation
        let score = 0;
        if (isCorrect) {
          // Base score for correct answer
          const baseScore = 100;
          
          // Time bonus (max 100 points, decreases as time passes)
          const timeBonus = Math.max(0, Math.floor(100 * (1 - timeElapsed / 20)));
          
          // Difficulty multiplier
          let difficultyMultiplier = 1;
          if (question.difficulty === 'medium') difficultyMultiplier = 1.5;
          if (question.difficulty === 'hard') difficultyMultiplier = 2;
          
          score = Math.floor((baseScore + timeBonus) * difficultyMultiplier);
        }
        
        // Record the answer
        game.questions[questionIndex].answers.push({
          player: socket.userId,
          answer,
          isCorrect,
          score,
          answerTime
        });
        
        // Update player's score
        game.players[playerIndex].score += score;
        if (isCorrect) {
          game.players[playerIndex].correctAnswers += 1;
        }
        
        await game.save();
        
        // Send result to the player
        socket.emit('answer-result', {
          isCorrect,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          score,
          totalScore: game.players[playerIndex].score
        });
        
        // Check if all players have answered
        const allAnswered = game.players.length === game.questions[questionIndex].answers.length;
        
        // Notify all players about the progress
        gameNamespace.to(`game:${gameId}`).emit('answer-progress', {
          questionIndex,
          answeredCount: game.questions[questionIndex].answers.length,
          totalPlayers: game.players.length,
          allAnswered
        });
        
        // If all players have answered, end the question early
        if (allAnswered && questionTimers.has(`${gameId}-${questionIndex}`)) {
          clearTimeout(questionTimers.get(`${gameId}-${questionIndex}`));
          questionTimers.delete(`${gameId}-${questionIndex}`);
          
          // Set question end time
          game.questions[questionIndex].endTime = new Date();
          await game.save();
          
          // Notify all players that all have answered
          gameNamespace.to(`game:${gameId}`).emit('question-ended', {
            questionIndex,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            allAnswered: true
          });
          
          // If this was the last question, end the game
          if (questionIndex === game.questions.length - 1) {
            await game.endGame();
            
            // Get winner details
            let winner = null;
            if (game.winner) {
              const winnerUser = await User.findById(game.winner).select('name');
              if (winnerUser) {
                winner = {
                  id: winnerUser._id,
                  name: winnerUser.name
                };
              }
            }
            
            // Notify all players that the game has ended
            gameNamespace.to(`game:${gameId}`).emit('game-ended', {
              winner,
              players: game.players.map(p => ({
                id: p.user,
                score: p.score,
                correctAnswers: p.correctAnswers
              }))
            });
          }
        }
      } catch (error) {
        logger.error('Socket submit-answer error:', error);
        socket.emit('error', { message: 'Error submitting answer' });
      }
    });
    
    // Clean up on disconnect
    socket.on('disconnect', () => {
      logger.info(`User ${socket.userId} disconnected from game namespace`);
      
      // Any additional cleanup can be added here
    });
  });
  
  return gameNamespace;
};
