const Leaderboard = require('../models/leaderboard.model');

module.exports = function(io) {
  // Namespace for leaderboard-related socket events
  const leaderboardNamespace = io.of('/leaderboard');
  
  // Middleware to authenticate socket connections
  leaderboardNamespace.use(async (socket, next) => {
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
  
  leaderboardNamespace.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected to leaderboard namespace`);
    
    // Subscribe to daily leaderboard updates
    socket.on('subscribe-daily', async () => {
      try {
        // Join the daily leaderboard room
        socket.join('daily-leaderboard');
        
        // Get current daily leaderboard and send to client
        const leaderboard = await Leaderboard.getDailyLeaderboard();
        const topEntries = leaderboard.getTopEntries(10);
        const userRank = leaderboard.getUserRank(socket.userId);
        
        socket.emit('daily-leaderboard-update', {
          leaderboard: topEntries,
          userRank
        });
      } catch (error) {
        console.error('Socket subscribe-daily error:', error);
        socket.emit('error', { message: 'Error subscribing to daily leaderboard' });
      }
    });
    
    // Subscribe to game leaderboard updates
    socket.on('subscribe-game', async (gameId) => {
      try {
        // Join the game leaderboard room
        socket.join(`game-leaderboard:${gameId}`);
        
        // Get current game leaderboard and send to client
        const leaderboard = await Leaderboard.getMultiplayerLeaderboard(gameId);
        const entries = leaderboard.getTopEntries(10);
        const userRank = leaderboard.getUserRank(socket.userId);
        
        socket.emit('game-leaderboard-update', {
          gameId,
          leaderboard: entries,
          userRank
        });
      } catch (error) {
        console.error('Socket subscribe-game error:', error);
        socket.emit('error', { message: 'Error subscribing to game leaderboard' });
      }
    });
    
    // Unsubscribe from daily leaderboard updates
    socket.on('unsubscribe-daily', () => {
      socket.leave('daily-leaderboard');
    });
    
    // Unsubscribe from game leaderboard updates
    socket.on('unsubscribe-game', (gameId) => {
      socket.leave(`game-leaderboard:${gameId}`);
    });
    
    // Disconnect event
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected from leaderboard namespace`);
    });
  });
  
  // Function to broadcast daily leaderboard updates
  const broadcastDailyLeaderboard = async (leaderboard) => {
    const topEntries = leaderboard.getTopEntries(10);
    leaderboardNamespace.to('daily-leaderboard').emit('daily-leaderboard-update', {
      leaderboard: topEntries
    });
  };
  
  // Function to broadcast game leaderboard updates
  const broadcastGameLeaderboard = async (gameId, leaderboard) => {
    const entries = leaderboard.getTopEntries(10);
    leaderboardNamespace.to(`game-leaderboard:${gameId}`).emit('game-leaderboard-update', {
      gameId,
      leaderboard: entries
    });
  };
  
  return {
    namespace: leaderboardNamespace,
    broadcastDailyLeaderboard,
    broadcastGameLeaderboard
  };
};
