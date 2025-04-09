const Leaderboard = require('../models/leaderboard.model');
const User = require('../models/user.model');

// Get daily leaderboard
exports.getDailyLeaderboard = async (req, res) => {
  try {
    // Get today's leaderboard
    const leaderboard = await Leaderboard.getDailyLeaderboard();
    
    // Get top 10 entries
    const topEntries = leaderboard.getTopEntries(10);
    
    // Get user's rank if authenticated
    let userRank = null;
    if (req.user) {
      userRank = leaderboard.getUserRank(req.user._id);
    }
    
    res.status(200).json({
      success: true,
      leaderboard: topEntries,
      userRank
    });
  } catch (error) {
    console.error('Get daily leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily leaderboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get multiplayer game leaderboard
exports.getGameLeaderboard = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // Get game leaderboard
    const leaderboard = await Leaderboard.getMultiplayerLeaderboard(gameId);
    
    // Get all entries (multiplayer games typically have few players)
    const entries = leaderboard.getTopEntries(10);
    
    // Get user's rank if authenticated
    let userRank = null;
    if (req.user) {
      userRank = leaderboard.getUserRank(req.user._id);
    }
    
    res.status(200).json({
      success: true,
      leaderboard: entries,
      userRank
    });
  } catch (error) {
    console.error('Get game leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching game leaderboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update daily leaderboard (internal use)
exports.updateDailyLeaderboard = async (userId, score) => {
  try {
    // Get user details
    const user = await User.findById(userId).select('name');
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get today's leaderboard
    const leaderboard = await Leaderboard.getDailyLeaderboard();
    
    // Update user's score
    await leaderboard.updateScore(userId, score, user.name);
    
    return leaderboard;
  } catch (error) {
    console.error('Update daily leaderboard error:', error);
    throw error;
  }
};

// Update multiplayer leaderboard (internal use)
exports.updateGameLeaderboard = async (gameId, userId, score) => {
  try {
    // Get user details
    const user = await User.findById(userId).select('name');
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get game leaderboard
    const leaderboard = await Leaderboard.getMultiplayerLeaderboard(gameId);
    
    // Update user's score
    await leaderboard.updateScore(userId, score, user.name);
    
    return leaderboard;
  } catch (error) {
    console.error('Update game leaderboard error:', error);
    throw error;
  }
};
