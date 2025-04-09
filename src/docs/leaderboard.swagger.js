/**
 * @swagger
 * tags:
 *   name: Leaderboard
 *   description: Leaderboard management endpoints
 * 
 * components:
 *   schemas:
 *     LeaderboardEntry:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: The user's ID
 *         name:
 *           type: string
 *           description: The user's name
 *         score:
 *           type: number
 *           description: The user's score
 *         rank:
 *           type: number
 *           description: The user's rank on the leaderboard
 * 
 *     LeaderboardResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *         leaderboard:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LeaderboardEntry'
 *         userRank:
 *           type: number
 *           nullable: true
 *           description: The authenticated user's rank (if available)
 * 
 * /api/leaderboard/daily:
 *   get:
 *     summary: Get daily leaderboard
 *     tags: [Leaderboard]
 *     description: Retrieve the daily leaderboard showing top players
 *     responses:
 *       200:
 *         description: Daily leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaderboardResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Error fetching daily leaderboard
 * 
 * /api/leaderboard/game/{gameId}:
 *   get:
 *     summary: Get multiplayer game leaderboard
 *     tags: [Leaderboard]
 *     description: Retrieve the leaderboard for a specific multiplayer game
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the multiplayer game
 *     responses:
 *       200:
 *         description: Game leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaderboardResponse'
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Authentication required
 *       404:
 *         description: Game not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Game not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Error fetching game leaderboard
 */

module.exports = {};
