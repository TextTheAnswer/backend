/**
 * @swagger
 * tags:
 *   name: Quiz
 *   description: Daily quiz related endpoints
 * 
 * components:
 *   schemas:
 *     Question:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The question ID
 *         text:
 *           type: string
 *           description: The question text
 *         correctAnswer:
 *           type: string
 *           description: The correct answer text
 *         alternativeAnswers:
 *           type: array
 *           items:
 *             type: string
 *           description: List of acceptable alternative answers
 *         category:
 *           type: string
 *           description: Question category
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *           description: Difficulty level
 *         timeLimit:
 *           type: integer
 *           description: Time limit in seconds to answer the question
 *           default: 30
 *         explanation:
 *           type: string
 *           description: Explanation of the answer
 *         isMultipleChoice:
 *           type: boolean
 *           description: Whether this is a legacy multiple choice question
 *         options:
 *           type: array
 *           items:
 *             type: string
 *           description: Answer options (for legacy MCQ questions only)
 *     
 *     QuestionResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The question ID
 *         text:
 *           type: string
 *           description: The question text
 *         category:
 *           type: string
 *           description: Question category
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *           description: Difficulty level
 *         timeLimit:
 *           type: integer
 *           description: Time limit in seconds to answer the question
 *           default: 30
 *         isMultipleChoice:
 *           type: boolean
 *           description: Whether this is a legacy multiple choice question
 *         options:
 *           type: array
 *           items:
 *             type: string
 *           description: Answer options (for legacy MCQ questions only)
 *     
 *     AnswerSubmission:
 *       type: object
 *       required:
 *         - questionId
 *         - answer
 *       properties:
 *         questionId:
 *           type: string
 *           description: The ID of the question being answered
 *         answer:
 *           type: string
 *           description: The text of the user's answer
 *         timeSpent:
 *           type: integer
 *           description: The time spent answering in seconds
 *
 *     AnswerResult:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *         isCorrect:
 *           type: boolean
 *           description: Whether the submitted answer was correct
 *         correctAnswer:
 *           type: string
 *           description: The correct answer text
 *         explanation:
 *           type: string
 *           description: Explanation of the correct answer
 *         questionsAnswered:
 *           type: integer
 *           description: Number of questions the user has answered today
 *         correctAnswers:
 *           type: integer
 *           description: Number of correct answers the user has given today
 *         streak:
 *           type: integer
 *           description: The user's current streak
 *         withinTimeLimit:
 *           type: boolean
 *           description: Whether the answer was submitted within the time limit
 *
 * /api/quiz/daily:
 *   get:
 *     summary: Get daily quiz questions
 *     tags: [Quiz]
 *     description: Get today's quiz questions for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Quiz questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 questions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/QuestionResponse'
 *                 questionsAnswered:
 *                   type: integer
 *                 correctAnswers:
 *                   type: integer
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Free tier limit reached
 *       500:
 *         description: Server error
 *
 * /api/quiz/daily/submit:
 *   post:
 *     summary: Submit answer for daily quiz
 *     tags: [Quiz]
 *     description: Submit an answer to a daily quiz question
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnswerSubmission'
 *     responses:
 *       200:
 *         description: Answer submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnswerResult'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Free tier limit reached
 *       404:
 *         description: Question not found
 *       500:
 *         description: Server error
 *
 * /api/quiz/daily/leaderboard:
 *   get:
 *     summary: Get daily quiz leaderboard
 *     tags: [Quiz]
 *     description: Get the leaderboard for today's daily quiz
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rank:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       score:
 *                         type: integer
 *                 userRank:
 *                   type: integer
 *                   nullable: true
 *                 winner:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: string
 *                     score:
 *                       type: integer
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Server error
 */

module.exports = {}; 