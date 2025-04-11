const { createDemoUser, getDemoUserToken, createSecondDemoUser, getSecondDemoUserToken } = require('../utils/demo-user.utils');

/**
 * Get the demo user details and token
 * @route GET /api/demo/user
 * @access Public
 */
exports.getDemoUser = async (req, res) => {
  try {
    // Create/update demo user and get token
    const demoUser = await createDemoUser();
    const token = await getDemoUserToken();
    
    // Return user details and token
    res.status(200).json({
      success: true,
      message: 'Demo user retrieved successfully',
      demoUser: {
        id: demoUser._id,
        email: demoUser.email,
        name: demoUser.name,
        password: 'demo123', // Show the password since it's a demo account
        isPremium: true,
        isEducation: true
      },
      token: token
    });
  } catch (error) {
    console.error('Demo user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving demo user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get the second demo user details and token
 * @route GET /api/demo/user2
 * @access Public
 */
exports.getSecondDemoUser = async (req, res) => {
  try {
    // Create/update second demo user and get token
    const demoUser = await createSecondDemoUser();
    const token = await getSecondDemoUserToken();
    
    // Return user details and token
    res.status(200).json({
      success: true,
      message: 'Second demo user retrieved successfully',
      demoUser: {
        id: demoUser._id,
        email: demoUser.email,
        name: demoUser.name,
        password: 'demo123', // Show the password since it's a demo account
        isPremium: true
      },
      token: token
    });
  } catch (error) {
    console.error('Second demo user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving second demo user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 