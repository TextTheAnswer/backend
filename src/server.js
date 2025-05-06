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
const apiTesterRoutes = require('./routes/api-tester.routes');
const achievementRoutes = require('./routes/achievement.routes');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: function(origin, callback) {
      // In development mode, allow all origins
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
        return;
      }
      
      // In production, use a whitelist
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'https://tta-kha7.onrender.com',
        'https://text-the-answer.vercel.app',
        'https://text-the-answer-web.vercel.app'
      ];
      
      // Allow requests with no origin (mobile apps, curl, etc)
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }
});

// Import database retry utility
const { connectWithRetry } = require('./utils/database.retry');

// Connect to MongoDB with retry mechanism
connectWithRetry(connectDB)
  .then(() => {
    logger.info('Database connection established successfully');
    
    // Initialize database with seed data after connection is established
    seedDatabase()
      .then(() => logger.info('Database seeding completed'))
      .catch(err => logger.error('Error seeding database:', err));
      
    // Schedule daily tasks after connection is established
    scheduleDailyTasks();
  })
  .catch(err => {
    logger.error('Failed to connect to the database after multiple attempts:', err);
    logger.warn('Server will continue without database connection. Some features may not work properly.');
  });

// Import utilities and services
const { seedDatabase } = require('./utils/database.utils');
const { scheduleDailyTasks } = require('./services/scheduler.service');
const logger = require('./utils/logger');

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
app.use(cors({
  origin: function(origin, callback) {
    // In development mode, allow all origins
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }
    
    // In production, use a whitelist
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://tta-kha7.onrender.com',
      'https://text-the-answer.vercel.app',
      'https://text-the-answer-web.vercel.app'
    ];
    
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
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

// API Tester route
app.get('/api-tester', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'api-tester.html'));
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Text the Answer API' });
});

// Root API route handler
app.get('/api', (req, res) => {
  res.json({
    name: 'Text The Answer API',
    version: '1.0.0',
    status: 'active',
    endpoints: [
      '/api/auth',
      '/api/quiz',
      '/api/game',
      '/api/leaderboard',
      '/api/subscription',
      '/api/mock-subscription',
      '/api/study-materials',
      '/api/demo',
      '/api/profile',
      '/api/achievements'
    ],
    documentation: '/api-docs'
  });
});

// Test email route (only in development)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/test-email', async (req, res) => {
    try {
      const emailService = require('./services/email.service');
      console.log('Server: Testing email service...');
      
      const result = await emailService.sendPasswordResetOTP(
        process.env.EMAIL_USER, // Send to self for testing
        '123456' // Test OTP
      );
      
      if (result) {
        console.log('Server: Test email sent successfully');
        res.json({ 
          success: true, 
          message: 'Test email sent successfully! Check your email inbox.',
          emailSentTo: process.env.EMAIL_USER 
        });
      } else {
        console.log('Server: Test email failed');
        res.status(500).json({ 
          success: false, 
          message: 'Failed to send test email. Check server logs for details.'
        });
      }
    } catch (error) {
      console.error('Server: Test email error -', error.message);
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
app.use('/api-tester', apiTesterRoutes);
app.use('/api/achievements', achievementRoutes);

// Import socket handlers
const gameSocket = require('./socket/game.socket')(io);
const leaderboardSocket = require('./socket/leaderboard.socket')(io);
const dailyQuizSocket = require('./socket/dailyQuiz.socket')(io);

// Initialize socket instance for use across modules
const socketInstance = require('./socket/socket.instance');
socketInstance.initialize(io);

// Default namespace for basic connections
io.on('connection', (socket) => {
  console.log('Socket: New client connected');
  
  socket.on('disconnect', () => {
    console.log('Socket: Client disconnected');
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
  console.log(`Server: Running on port ${PORT}`);
  console.log(`Server: API docs at http://localhost:${PORT}/api-docs`);
});

module.exports = { app, server, io };
