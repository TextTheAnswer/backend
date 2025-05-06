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
 *         _id:
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
 *           default: 15
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
 *     BulkAnswerSubmission:
 *       type: object
 *       required:
 *         - answers
 *       properties:
 *         answers:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - questionId
 *               - answer
 *             properties:
 *               questionId:
 *                 type: string
 *                 description: The ID of the question being answered
 *               answer:
 *                 type: string
 *                 description: The text of the user's answer
 *               timeSpent:
 *                 type: integer
 *                 description: The time spent answering in seconds
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
 *         points:
 *           type: integer
 *           description: Points earned for this answer
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
 *         totalScore:
 *           type: integer
 *           description: Total score for the day
 *         streak:
 *           type: integer
 *           description: The user's current streak
 *         withinTimeLimit:
 *           type: boolean
 *           description: Whether the answer was submitted within the time limit
 *         newAchievements:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               tier:
 *                 type: string
 *
 *     BulkAnswerResult:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *         results:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               questionId:
 *                 type: string
 *               isCorrect:
 *                 type: boolean
 *               points:
 *                 type: integer
 *               correctAnswer:
 *                 type: string
 *               explanation:
 *                 type: string
 *               withinTimeLimit:
 *                 type: boolean
 *         summary:
 *           type: object
 *           properties:
 *             questionsAnswered:
 *               type: integer
 *             correctAnswers:
 *               type: integer
 *             totalScore:
 *               type: integer
 *             totalPointsEarned:
 *               type: integer
 *             streak:
 *               type: integer
 *         newAchievements:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               tier:
 *                 type: string
 *
 *     DailyStats:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         stats:
 *           type: object
 *           properties:
 *             questionsAnswered:
 *               type: integer
 *             correctAnswers:
 *               type: integer
 *             score:
 *               type: integer
 *             streak:
 *               type: integer
 *             totalAnswered:
 *               type: integer
 *             totalCorrect:
 *               type: integer
 *         theme:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             description:
 *               type: string
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
 *                 theme:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Free tier limit reached
 *       500:
 *         description: Server error
 *
 * /api/quiz/daily/answer:
 *   post:
 *     summary: Submit answer for daily quiz
 *     tags: [Quiz]
 *     description: Submit a single answer to a daily quiz question
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
 * /api/quiz/daily/answers/bulk:
 *   post:
 *     summary: Submit multiple answers in bulk for daily quiz
 *     tags: [Quiz]
 *     description: Submit multiple answers at once to daily quiz questions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkAnswerSubmission'
 *     responses:
 *       200:
 *         description: Answers submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BulkAnswerResult'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Free tier limit reached
 *       400:
 *         description: Invalid answers format
 *       500:
 *         description: Server error
 *
 * /api/quiz/daily/stats:
 *   get:
 *     summary: Get daily quiz stats for the user
 *     tags: [Quiz]
 *     description: Get user's progress and stats for today's quiz
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DailyStats'
 *       401:
 *         description: Unauthorized - authentication required
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
 *                       correctAnswers:
 *                         type: integer
 *                       score:
 *                         type: integer
 *                       isPerfectScore:
 *                         type: boolean
 *                 userRank:
 *                   type: integer
 *                   nullable: true
 *                 userScore:
 *                   type: integer
 *                   nullable: true
 *                 theme:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
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
 *
 * /api/quiz/events/upcoming:
 *   get:
 *     summary: Get upcoming daily quiz events
 *     tags: [Quiz]
 *     description: Get a list of upcoming quiz events
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Server error
 *
 * /api/quiz/upcoming-themes:
 *   get:
 *     summary: Get upcoming themes for the week
 *     tags: [Quiz]
 *     description: Get upcoming themes for the next 7 days (premium users only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upcoming themes retrieved successfully
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Premium subscription required
 *       500:
 *         description: Server error
 */

module.exports = {}; 