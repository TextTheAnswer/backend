const Lobby = require('../models/lobby.model');
const Game = require('../models/game.model');
const Question = require('../models/question.model');

module.exports = function(io) {
  // Namespace for game-related socket events
  const gameNamespace = io.of('/game');
  
  // Middleware to authenticate socket connections
  gameNamespace.use(async (socket, next) => {
    try {
      // Get user ID from handshake auth
      const userId = socket.handshake.auth.userId;
      if (!userId) {
        return next(new Error('Authentication required'));
      }
      
      // Store user ID in socket object
      socket.userId = userId;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });
  
  gameNamespace.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected to game namespace`);
    
    // Join a lobby room
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
        console.error('Socket join-lobby error:', error);
        socket.emit('error', { message: 'Error joining lobby room' });
      }
    });
    
    // Leave a lobby room
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
        console.error('Socket leave-lobby error:', error);
      }
    });
    
    // Set player ready status
    socket.on('set-ready', async (data) => {
      try {
        const { lobbyId, ready } = data;
        
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
        console.error('Socket set-ready error:', error);
        socket.emit('error', { message: 'Error updating ready status' });
      }
    });
    
    // Join a game room
    socket.on('join-game', async (gameId) => {
      try {
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
        console.error('Socket join-game error:', error);
        socket.emit('error', { message: 'Error joining game room' });
      }
    });
    
    // Start question timer
    socket.on('start-question', async (data) => {
      try {
        const { gameId, questionIndex } = data;
        
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
        
        // Set a timer to end the question after 20 seconds
        setTimeout(async () => {
          try {
            // Find the game again to get latest state
            const updatedGame = await Game.findById(gameId);
            
            if (!updatedGame) return;
            
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
            console.error('Question timer error:', error);
          }
        }, 20000); // 20 seconds per question
      } catch (error) {
        console.error('Socket start-question error:', error);
        socket.emit('error', { message: 'Error starting question' });
      }
    });
    
    // Disconnect event
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected from game namespace`);
    });
  });
  
  return gameNamespace;
};
