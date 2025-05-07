const DailyQuiz = require('../models/dailyQuiz.model');
const User = require('../models/user.model');
const Question = require('../models/question.model');
const schedule = require('node-schedule');
const logger = require('../utils/logger');

// Store active quiz sessions
const activeQuizSessions = new Map();

// Schedule daily quiz events
exports.scheduleDailyQuizEvents = async () => {
  try {
    // Get today's quiz
    const dailyQuiz = await DailyQuiz.getTodayQuiz();
    
    if (!dailyQuiz || !dailyQuiz.events || dailyQuiz.events.length === 0) {
      logger.error('No daily quiz or events found for today');
      return;
    }
    
    // Get current time
    const now = new Date();
    
    // Schedule each event that hasn't started yet
    dailyQuiz.events.forEach((event, index) => {
      // Only schedule events that are in the future and not completed
      if (event.startTime > now && event.status !== 'completed') {
        // Schedule event start
        scheduleEventStart(dailyQuiz._id, event._id);
        
        // Schedule event end
        scheduleEventEnd(dailyQuiz._id, event._id);
        
        logger.info(`Scheduled event ${index + 1} to start at ${event.startTime.toISOString()}`);
      }
    });
    
    logger.info(`Scheduled ${dailyQuiz.events.length} daily quiz events for today`);
  } catch (error) {
    logger.error('Error scheduling daily quiz events:', error);
  }
};

// Schedule the start of an event
function scheduleEventStart(quizId, eventId) {
  try {
    // Find the quiz and event
    DailyQuiz.findById(quizId).then(quiz => {
      if (!quiz) {
        logger.error(`Quiz not found: ${quizId}`);
        return;
      }
      
      const event = quiz.events.id(eventId);
      if (!event) {
        logger.error(`Event not found: ${eventId}`);
        return;
      }
      
      // Create a job that runs at the event start time
      const job = schedule.scheduleJob(event.startTime, async () => {
        await startQuizEvent(quizId, eventId);
      });
      
      logger.info(`Scheduled start of quiz event: ${eventId} at ${event.startTime}`);
    }).catch(error => {
      logger.error('Error finding quiz for scheduling:', error);
    });
  } catch (error) {
    logger.error('Error scheduling event start:', error);
  }
}

// Schedule the end of an event
function scheduleEventEnd(quizId, eventId) {
  try {
    // Find the quiz and event
    DailyQuiz.findById(quizId).then(quiz => {
      if (!quiz) {
        logger.error(`Quiz not found: ${quizId}`);
        return;
      }
      
      const event = quiz.events.id(eventId);
      if (!event) {
        logger.error(`Event not found: ${eventId}`);
        return;
      }
      
      // Create a job that runs at the event end time
      const job = schedule.scheduleJob(event.endTime, async () => {
        await endQuizEvent(quizId, eventId);
      });
      
      logger.info(`Scheduled end of quiz event: ${eventId} at ${event.endTime}`);
    }).catch(error => {
      logger.error('Error finding quiz for scheduling:', error);
    });
  } catch (error) {
    logger.error('Error scheduling event end:', error);
  }
}

// Start a quiz event
async function startQuizEvent(quizId, eventId) {
  try {
    // Find the quiz
    const quiz = await DailyQuiz.findById(quizId).populate('questions');
    if (!quiz) {
      logger.error(`Quiz not found: ${quizId}`);
      return;
    }
    
    // Find the event
    const event = quiz.events.id(eventId);
    if (!event) {
      logger.error(`Event not found: ${eventId}`);
      return;
    }
    
    // Update event status to active
    event.status = 'active';
    event.currentQuestionIndex = 0;
    await quiz.save();
    
    // Initialize session data
    const sessionId = `${quizId}:${eventId}`;
    activeQuizSessions.set(sessionId, {
      quizId,
      eventId,
      currentQuestionIndex: 0,
      questionStartTime: new Date(),
      questions: quiz.questions,
      participantsAnswered: new Set(),
      timeoutId: null
    });
    
    // Get the socket.io instance
    const socketInstance = require('../socket/socket.instance');
    const io = socketInstance.getIO();
    if (!io) {
      logger.error('Socket.IO instance not found');
      return;
    }
    
    // Emit event start to all connected clients in the daily-quiz namespace
    io.of('/daily-quiz').emit('event-started', {
      quizId,
      eventId,
      event: {
        startTime: event.startTime,
        endTime: event.endTime,
        timeZone: event.timeZone,
        currentQuestionIndex: 0,
        totalQuestions: quiz.questions.length
      },
      theme: {
        name: quiz.themeName,
        description: quiz.themeDescription
      }
    });
    
    // Start the first question
    startNextQuestion(sessionId);
    
    logger.info(`Daily quiz event started: ${sessionId}`);
  } catch (error) {
    logger.error('Error starting quiz event:', error);
  }
}

// End a quiz event
async function endQuizEvent(quizId, eventId) {
  try {
    // Find the quiz
    const quiz = await DailyQuiz.findById(quizId);
    if (!quiz) {
      logger.error(`Quiz not found: ${quizId}`);
      return;
    }
    
    // Find the event
    const event = quiz.events.id(eventId);
    if (!event) {
      logger.error(`Event not found: ${eventId}`);
      return;
    }
    
    // If the event is already completed, do nothing
    if (event.status === 'completed') {
      logger.info(`Event already completed: ${eventId}`);
      return;
    }
    
    // Update event status
    event.status = 'completed';
    
    // Determine the winner
    if (event.participants.length > 0) {
      // Sort participants by score (descending)
      const sortedParticipants = [...event.participants].sort((a, b) => b.score - a.score);
      const winner = sortedParticipants[0];
      
      // Set the winner
      event.winner = {
        user: winner.user,
        score: winner.score
      };
    }
    
    await quiz.save();
    
    // Clear any active session
    const sessionId = `${quizId}:${eventId}`;
    const session = activeQuizSessions.get(sessionId);
    
    if (session && session.timeoutId) {
      clearTimeout(session.timeoutId);
    }
    
    activeQuizSessions.delete(sessionId);
    
    // Get the socket.io instance
    const socketInstance = require('../socket/socket.instance');
    const io = socketInstance.getIO();
    if (!io) {
      logger.error('Socket.IO instance not found');
      return;
    }
    
    // Emit event end to all connected clients in the event room
    io.of('/daily-quiz').to(`event:${quizId}:${eventId}`).emit('event-ended', {
      quizId,
      eventId,
      winner: event.winner ? {
        userId: event.winner.user,
        score: event.winner.score
      } : null,
      leaderboard: event.participants.map(p => ({
        userId: p.user,
        score: p.score,
        correctAnswers: p.correctAnswers
      })).sort((a, b) => b.score - a.score).slice(0, 10)
    });
    
    logger.info(`Daily quiz event ended: ${sessionId}`);
  } catch (error) {
    logger.error('Error ending quiz event:', error);
  }
}

// Start the next question in an event
async function startNextQuestion(sessionId) {
  try {
    const session = activeQuizSessions.get(sessionId);
    if (!session) {
      logger.error(`Session not found: ${sessionId}`);
      return;
    }
    
    // Clear any existing timeout
    if (session.timeoutId) {
      clearTimeout(session.timeoutId);
      session.timeoutId = null;
    }
    
    // Check if we've reached the end of questions
    if (session.currentQuestionIndex >= session.questions.length) {
      // End the event early if all questions have been answered
      await endQuizEvent(session.quizId, session.eventId);
      return;
    }
    
    // Get the current question
    const currentQuestion = session.questions[session.currentQuestionIndex];
    
    // Reset the participants answered set
    session.participantsAnswered = new Set();
    
    // Set the question start time
    session.questionStartTime = new Date();
    
    // Update the quiz document
    const quiz = await DailyQuiz.findById(session.quizId);
    if (!quiz) {
      logger.error(`Quiz not found: ${session.quizId}`);
      return;
    }
    
    const event = quiz.events.id(session.eventId);
    if (!event) {
      logger.error(`Event not found: ${session.eventId}`);
      return;
    }
    
    event.currentQuestionIndex = session.currentQuestionIndex;
    await quiz.save();
    
    // Get the socket.io instance
    const socketInstance = require('../socket/socket.instance');
    const io = socketInstance.getIO();
    if (!io) {
      logger.error('Socket.IO instance not found');
      return;
    }
    
    // Prepare the question data (without the correct answer)
    const questionData = {
      id: currentQuestion._id,
      text: currentQuestion.text,
      category: currentQuestion.category,
      difficulty: currentQuestion.difficulty,
      timeLimit: 15 // Always 15 seconds for daily quiz
    };
    
    // Emit new question to all participants
    io.of('/daily-quiz').to(`event:${session.quizId}:${session.eventId}`).emit('question-started', {
      quizId: session.quizId,
      eventId: session.eventId,
      questionIndex: session.currentQuestionIndex,
      totalQuestions: session.questions.length,
      question: questionData,
      startTime: session.questionStartTime
    });
    
    logger.info(`Started question ${session.currentQuestionIndex + 1} for session ${sessionId}`);
    
    // Set a timeout to end the question after 15 seconds (plus a small buffer)
    session.timeoutId = setTimeout(() => {
      endCurrentQuestion(sessionId);
    }, 16000); // 16 seconds (15s + 1s buffer)
    
    // Update the session
    activeQuizSessions.set(sessionId, session);
  } catch (error) {
    logger.error('Error starting next question:', error);
  }
}

// End the current question and move to the next
async function endCurrentQuestion(sessionId) {
  try {
    const session = activeQuizSessions.get(sessionId);
    if (!session) {
      logger.error(`Session not found: ${sessionId}`);
      return;
    }
    
    // Get the current question
    const currentQuestion = session.questions[session.currentQuestionIndex];
    
    // Get the socket.io instance
    const socketInstance = require('../socket/socket.instance');
    const io = socketInstance.getIO();
    if (!io) {
      logger.error('Socket.IO instance not found');
      return;
    }
    
    // Emit question ended event with correct answer
    io.of('/daily-quiz').to(`event:${session.quizId}:${session.eventId}`).emit('question-ended', {
      quizId: session.quizId,
      eventId: session.eventId,
      questionIndex: session.currentQuestionIndex,
      correctAnswer: currentQuestion.correctAnswer,
      explanation: currentQuestion.explanation
    });
    
    logger.info(`Ended question ${session.currentQuestionIndex + 1} for session ${sessionId}`);
    
    // Increment question index
    session.currentQuestionIndex++;
    
    // Wait 3 seconds before starting the next question
    setTimeout(() => {
      startNextQuestion(sessionId);
    }, 3000);
    
    // Update the session
    activeQuizSessions.set(sessionId, session);
  } catch (error) {
    logger.error('Error ending current question:', error);
  }
}

// Process a participant's answer
exports.processAnswer = async (userId, quizId, eventId, questionIndex, answer, answerTime) => {
  try {
    // Validate the session
    const sessionId = `${quizId}:${eventId}`;
    const session = activeQuizSessions.get(sessionId);
    
    if (!session) {
      logger.error(`Session not found: ${sessionId}`);
      return { success: false, message: 'Quiz session not found' };
    }
    
    // Ensure the question index matches
    if (session.currentQuestionIndex !== questionIndex) {
      logger.warn(`Question index mismatch: expected ${session.currentQuestionIndex}, got ${questionIndex}`);
      return { success: false, message: 'Invalid question index' };
    }
    
    // Ensure user hasn't already answered this question
    if (session.participantsAnswered.has(userId)) {
      logger.warn(`User ${userId} already answered question ${questionIndex}`);
      return { success: false, message: 'Already answered this question' };
    }
    
    // Mark user as having answered
    session.participantsAnswered.add(userId);
    
    // Get the current question
    const currentQuestion = session.questions[questionIndex];
    
    // Check if the answer is correct
    const isCorrect = (currentQuestion.correctAnswer === answer);
    
    // Calculate response time in milliseconds
    const responseTime = answerTime - session.questionStartTime.getTime();
    
    // Calculate score (max 1000 points, decreases with time)
    // Full points if answered within 1 second, decreases linearly to 250 points at 15 seconds
    let score = 0;
    if (isCorrect) {
      const maxScore = 1000;
      const minScore = 250;
      const maxTime = 15000; // 15 seconds in milliseconds
      
      if (responseTime <= 1000) {
        score = maxScore;
      } else if (responseTime <= maxTime) {
        // Linear decrease from maxScore to minScore over time
        score = maxScore - ((responseTime - 1000) / (maxTime - 1000)) * (maxScore - minScore);
      } else {
        score = minScore;
      }
      
      score = Math.round(score);
    }
    
    // Update user's score in the database
    const quiz = await DailyQuiz.findById(quizId);
    if (!quiz) {
      logger.error(`Quiz not found: ${quizId}`);
      return { success: false, message: 'Quiz not found' };
    }
    
    const event = quiz.events.id(eventId);
    if (!event) {
      logger.error(`Event not found: ${eventId}`);
      return { success: false, message: 'Event not found' };
    }
    
    // Find participant or add them if this is their first answer
    let participant = event.participants.find(p => p.user.toString() === userId);
    
    if (!participant) {
      // Add new participant
      event.participants.push({
        user: userId,
        joinedAt: new Date(),
        score: 0,
        correctAnswers: 0,
        answerTimes: [],
        answers: []
      });
      participant = event.participants[event.participants.length - 1];
    }
    
    // Update participant stats
    participant.score += score;
    if (isCorrect) {
      participant.correctAnswers += 1;
    }
    participant.answerTimes[questionIndex] = responseTime;
    participant.answers[questionIndex] = isCorrect;
    
    // Save the quiz
    await quiz.save();
    
    // Update the session
    activeQuizSessions.set(sessionId, session);
    
    // Get the socket.io instance
    const socketInstance = require('../socket/socket.instance');
    const io = socketInstance.getIO();
    if (io) {
      // Emit updated leaderboard
      const leaderboard = event.participants
        .map(p => ({
          userId: p.user,
          score: p.score,
          correctAnswers: p.correctAnswers
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      
      io.of('/daily-quiz').to(`event:${quizId}:${eventId}`).emit('leaderboard-update', {
        quizId,
        eventId,
        leaderboard
      });
    }
    
    return {
      success: true,
      isCorrect,
      score,
      correctAnswer: currentQuestion.correctAnswer,
      explanation: currentQuestion.explanation
    };
  } catch (error) {
    logger.error('Error processing answer:', error);
    return { success: false, message: 'Server error processing answer' };
  }
};

// Join a quiz event
exports.joinEvent = async (userId, quizId, eventId) => {
  try {
    // Find the quiz
    const quiz = await DailyQuiz.findById(quizId).populate('questions');
    if (!quiz) {
      logger.error(`Quiz not found: ${quizId}`);
      return { success: false, message: 'Quiz not found' };
    }
    
    // Find the event
    const event = quiz.events.id(eventId);
    if (!event) {
      logger.error(`Event not found: ${eventId}`);
      return { success: false, message: 'Event not found' };
    }
    
    // Check if event is active
    if (event.status !== 'active') {
      return { success: false, message: `Event is not active (current status: ${event.status})` };
    }
    
    // Check if user is already a participant
    let isNewParticipant = true;
    let participant = event.participants.find(p => p.user.toString() === userId);
    
    if (!participant) {
      // Add participant
      event.participants.push({
        user: userId,
        joinedAt: new Date(),
        score: 0,
        correctAnswers: 0,
        answerTimes: [],
        answers: []
      });
      await quiz.save();
    } else {
      isNewParticipant = false;
    }
    
    // Get the socket.io instance
    const socketInstance = require('../socket/socket.instance');
    const io = socketInstance.getIO();
    if (!io) {
      logger.error('Socket.IO instance not found');
      return { success: true, message: 'Joined event but socket notification failed' };
    }
    
    // Get current session info
    const sessionId = `${quizId}:${eventId}`;
    const session = activeQuizSessions.get(sessionId);
    
    // Prepare response
    const response = {
      success: true,
      event: {
        startTime: event.startTime,
        endTime: event.endTime,
        timeZone: event.timeZone,
        currentQuestionIndex: event.currentQuestionIndex,
        totalQuestions: quiz.questions.length,
        theme: {
          name: quiz.themeName,
          description: quiz.themeDescription
        }
      }
    };
    
    // If there's an active session and a question in progress, include that info
    if (session && session.currentQuestionIndex === event.currentQuestionIndex) {
      const currentQuestion = session.questions[session.currentQuestionIndex];
      
      if (currentQuestion) {
        // Prepare the question data (without the correct answer)
        const questionData = {
          id: currentQuestion._id,
          text: currentQuestion.text,
          category: currentQuestion.category,
          difficulty: currentQuestion.difficulty,
          timeLimit: 15 // Always 15 seconds for daily quiz
        };
        
        response.currentQuestion = {
          questionIndex: session.currentQuestionIndex,
          question: questionData,
          startTime: session.questionStartTime,
          timeElapsed: new Date() - session.questionStartTime
        };
      }
    }
    
    // If this is a new participant, notify other participants
    if (isNewParticipant) {
      // Get user info
      const User = require('../models/user.model');
      const user = await User.findById(userId, 'name profile.imageUrl');
      
      if (user) {
        io.of('/daily-quiz').to(`event:${quizId}:${eventId}`).emit('participant-joined', {
          quizId,
          eventId,
          participant: {
            userId: user._id,
            name: user.name,
            imageUrl: user.profile ? user.profile.imageUrl : null
          }
        });
      }
    }
    
    return response;
  } catch (error) {
    logger.error('Error joining event:', error);
    return { success: false, message: 'Server error joining event' };
  }
};

// Export the active sessions for testing
exports.getActiveSessions = () => activeQuizSessions;

// Export the functions for use in controllers and tests
exports.startQuizEvent = startQuizEvent;
exports.endQuizEvent = endQuizEvent;
exports.startNextQuestion = startNextQuestion;
exports.endCurrentQuestion = endCurrentQuestion; 