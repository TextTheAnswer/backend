const User = require('../models/user.model');
const dailyQuizEventService = require('../services/dailyQuizEvent.service');
const logger = require('../utils/logger');

/**
 * Socket.io handler for daily quiz events
 * @param {Object} io - Socket.io instance
 * @returns {Object} - Daily Quiz namespace
 */
module.exports = function(io) {
  // Create a namespace for daily quiz events
  const dailyQuizNamespace = io.of('/daily-quiz');
  
  // Middleware to authenticate socket connections
  dailyQuizNamespace.use(async (socket, next) => {
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
  
  // Handle connections
  dailyQuizNamespace.on('connection', (socket) => {
    logger.info(`User ${socket.userId} connected to daily quiz namespace`);
    
    // Join upcoming events
    socket.on('join-upcoming-events', () => {
      socket.join('upcoming-events');
      logger.debug(`User ${socket.userId} joined upcoming events room`);
    });
    
    // Leave upcoming events
    socket.on('leave-upcoming-events', () => {
      socket.leave('upcoming-events');
      logger.debug(`User ${socket.userId} left upcoming events room`);
    });
    
    // Join a specific event
    socket.on('join-event', async (data) => {
      try {
        const { quizId, eventId } = data;
        
        if (!quizId || !eventId) {
          socket.emit('error', { message: 'Missing quiz or event ID' });
          return;
        }
        
        // Join the event room
        const eventRoom = `event:${quizId}:${eventId}`;
        socket.join(eventRoom);
        
        // Call the service to join the event
        const result = await dailyQuizEventService.joinEvent(socket.userId, quizId, eventId);
        
        if (result.success) {
          // Send current event state to the user
          socket.emit('event-joined', result);
          logger.info(`User ${socket.userId} joined event room ${eventRoom}`);
        } else {
          socket.emit('error', { message: result.message });
          logger.warn(`User ${socket.userId} failed to join event: ${result.message}`);
        }
      } catch (error) {
        logger.error('Error in join-event handler:', error);
        socket.emit('error', { message: 'Server error joining event' });
      }
    });
    
    // Leave a specific event
    socket.on('leave-event', (data) => {
      try {
        const { quizId, eventId } = data;
        
        if (!quizId || !eventId) {
          socket.emit('error', { message: 'Missing quiz or event ID' });
          return;
        }
        
        // Leave the event room
        const eventRoom = `event:${quizId}:${eventId}`;
        socket.leave(eventRoom);
        
        logger.info(`User ${socket.userId} left event room ${eventRoom}`);
      } catch (error) {
        logger.error('Error in leave-event handler:', error);
        socket.emit('error', { message: 'Server error leaving event' });
      }
    });
    
    // Submit an answer
    socket.on('submit-answer', async (data) => {
      try {
        const { quizId, eventId, questionIndex, answer, answerTime } = data;
        
        if (!quizId || !eventId || questionIndex === undefined || !answer) {
          socket.emit('error', { message: 'Missing required answer data' });
          return;
        }
        
        // Process the answer
        const result = await dailyQuizEventService.processAnswer(
          socket.userId, 
          quizId, 
          eventId, 
          questionIndex, 
          answer, 
          answerTime || Date.now()
        );
        
        // Send result back to the user
        socket.emit('answer-result', result);
        
        logger.debug(`User ${socket.userId} submitted answer for question ${questionIndex} in event ${eventId}`);
      } catch (error) {
        logger.error('Error in submit-answer handler:', error);
        socket.emit('error', { message: 'Server error submitting answer' });
      }
    });
    
    // Request leaderboard
    socket.on('get-leaderboard', async (data) => {
      try {
        const { quizId, eventId } = data;
        
        if (!quizId || !eventId) {
          socket.emit('error', { message: 'Missing quiz or event ID' });
          return;
        }
        
        // Get quiz from database
        const DailyQuiz = require('../models/dailyQuiz.model');
        const quiz = await DailyQuiz.findById(quizId);
        
        if (!quiz) {
          socket.emit('error', { message: 'Quiz not found' });
          return;
        }
        
        const event = quiz.events.id(eventId);
        if (!event) {
          socket.emit('error', { message: 'Event not found' });
          return;
        }
        
        // Get top 10 participants by score
        const leaderboard = event.participants
          .map(p => ({
            userId: p.user,
            score: p.score,
            correctAnswers: p.correctAnswers
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        
        // Send leaderboard to the user
        socket.emit('leaderboard-update', {
          quizId,
          eventId,
          leaderboard
        });
        
        logger.debug(`User ${socket.userId} requested leaderboard for event ${eventId}`);
      } catch (error) {
        logger.error('Error in get-leaderboard handler:', error);
        socket.emit('error', { message: 'Server error fetching leaderboard' });
      }
    });
    
    // Handle disconnections
    socket.on('disconnect', () => {
      logger.info(`User ${socket.userId} disconnected from daily quiz namespace`);
    });
  });
  
  return dailyQuizNamespace;
}; 