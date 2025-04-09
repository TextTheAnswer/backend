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
connectDB();

// Import utilities and services
const { seedQuestions } = require('./utils/database.utils');
const { scheduleDailyTasks } = require('./services/scheduler.service');

// Initialize services
seedQuestions().catch(err => console.error('Error seeding database:', err));
scheduleDailyTasks();

// Import Swagger documentation
require('./docs/leaderboard.swagger');

// Swagger setup
const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'swagger.yaml'));

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static('src/public')); // Add this line to serve static files

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Text the Answer API' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/subscription', subscriptionRoutes);

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
});

module.exports = { app, server, io };
