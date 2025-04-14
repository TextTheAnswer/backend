const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/database');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth.routes');
const quizRoutes = require('./routes/quiz.routes');
const gameRoutes = require('./routes/game.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const subscriptionMockRoutes = require('./routes/subscription.mock.routes');
const studyMaterialRoutes = require('./routes/studyMaterial.routes');
const demoRoutes = require('./routes/demo.routes');
const profileRoutes = require('./routes/profile.routes');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Connect to MongoDB
connectDB()
  .then(() => {
    console.log('Database connection established successfully');
    
    // Initialize database with seed data after connection is established
    seedQuestions()
      .then(() => console.log('Database seeding completed'))
      .catch(err => console.error('Error seeding database:', err));
      
    // Schedule daily tasks after connection is established
    scheduleDailyTasks();
  })
  .catch(err => {
    console.error('Failed to connect to the database. Server will continue without seeding:', err);
  });

// Import utilities and services
const { seedQuestions } = require('./utils/database.utils');
const { scheduleDailyTasks } = require('./services/scheduler.service');

// Import Swagger documentation
require('./docs/auth.swagger');
require('./docs/quiz.swagger');
require('./docs/game.swagger');
require('./docs/leaderboard.swagger');
require('./docs/subscription.swagger');
require('./docs/studyMaterial.swagger');
require('./docs/profile.swagger');

// Swagger setup
const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'swagger.yaml'));

// Dynamically load Swagger documentation from modules
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerOptions = {
  definition: swaggerDocument,
  apis: ['./src/docs/*.swagger.js'],
};
const swaggerSpec = swaggerJsDoc(swaggerOptions);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static('src/public')); // Add this line to serve static files

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Text the Answer API Documentation",
  swaggerOptions: {
    persistAuthorization: false,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    supportedSubmitMethods: ['get', 'post', 'put', 'delete'],
    tagsSorter: 'alpha'
  }
}));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Text the Answer API' });
});

// Test email route (only in development)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/test-email', async (req, res) => {
    try {
      const emailService = require('./services/email.service');
      const result = await emailService.sendPasswordResetOTP(
        process.env.EMAIL_USER, // Send to self for testing
        '123456' // Test OTP
      );
      
      if (result) {
        res.json({ 
          success: true, 
          message: 'Test email sent successfully! Check your email inbox.',
          emailSentTo: process.env.EMAIL_USER 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to send test email. Check server logs for details.'
        });
      }
    } catch (error) {
      console.error('Error in test email route:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error sending test email', 
        error: error.message 
      });
    }
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/mock-subscription', subscriptionMockRoutes);
app.use('/api/study-materials', studyMaterialRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/profile', profileRoutes);

// Socket.IO setup
// Initialize socket handlers
const gameSocket = require('./socket/game.socket')(io);
const leaderboardSocket = require('./socket/leaderboard.socket')(io);

// Default namespace for basic connections
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});

module.exports = { app, server, io };
