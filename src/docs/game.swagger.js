/**
 * @swagger
 * tags:
 *   name: Game
 *   description: Multiplayer game endpoints
 * 
 * components:
 *   schemas:
 *     Lobby:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The lobby ID
 *         name:
 *           type: string
 *           description: The lobby name
 *         code:
 *           type: string
 *           description: The unique code for joining the lobby
 *         isPublic:
 *           type: boolean
 *           description: Whether the lobby is publicly visible
 *         host:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         players:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               ready:
 *                 type: boolean
 *         maxPlayers:
 *           type: integer
 *           description: Maximum number of players allowed
 *         status:
 *           type: string
 *           enum: [waiting, playing, finished]
 *           description: The current status of the lobby
 *     
 *     Game:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The game ID
 *         questions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Question'
 *         players:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               score:
 *                 type: integer
 *         status:
 *           type: string
 *           enum: [starting, active, finished]
 *           description: The current status of the game
 *
 *     PublicLobby:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         host:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         playerCount:
 *           type: integer
 *         maxPlayers:
 *           type: integer
 *         isFull:
 *           type: boolean
 *
 *     CreateLobbyRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the lobby
 *         isPublic:
 *           type: boolean
 *           default: true
 *           description: Whether the lobby should be publicly visible
 *         maxPlayers:
 *           type: integer
 *           minimum: 2
 *           maximum: 10
 *           default: 5
 *           description: Maximum number of players
 *
 *     JoinLobbyRequest:
 *       type: object
 *       required:
 *         - code
 *       properties:
 *         code:
 *           type: string
 *           description: The unique code to join the lobby
 *
 *     GameAnswerRequest:
 *       type: object
 *       required:
 *         - gameId
 *         - questionIndex
 *         - answer
 *       properties:
 *         gameId:
 *           type: string
 *           description: The game ID
 *         questionIndex:
 *           type: integer
 *           description: The index of the question being answered
 *         answer:
 *           type: integer
 *           description: The index of the selected answer
 *
 * /api/game/lobby:
 *   post:
 *     summary: Create a new lobby
 *     tags: [Game]
 *     description: Create a new multiplayer game lobby
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLobbyRequest'
 *     responses:
 *       201:
 *         description: Lobby created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 lobby:
 *                   $ref: '#/components/schemas/Lobby'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Premium subscription required
 *       500:
 *         description: Server error
 *
 * /api/game/lobbies:
 *   get:
 *     summary: Get public lobbies
 *     tags: [Game]
 *     description: Get a list of public game lobbies
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lobbies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 lobbies:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PublicLobby'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Premium subscription required
 *       500:
 *         description: Server error
 *
 * /api/game/lobby/join:
 *   post:
 *     summary: Join a lobby by code
 *     tags: [Game]
 *     description: Join a multiplayer game lobby using its unique code
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JoinLobbyRequest'
 *     responses:
 *       200:
 *         description: Joined lobby successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 lobby:
 *                   $ref: '#/components/schemas/Lobby'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Premium subscription required
 *       404:
 *         description: Lobby not found
 *       400:
 *         description: Lobby is full or not accepting players
 *       500:
 *         description: Server error
 *
 * /api/game/lobby/{lobbyId}:
 *   delete:
 *     summary: Leave a lobby
 *     tags: [Game]
 *     description: Leave a multiplayer game lobby
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lobbyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the lobby to leave
 *     responses:
 *       200:
 *         description: Left lobby successfully
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Lobby not found
 *       400:
 *         description: User not in lobby
 *       500:
 *         description: Server error
 *
 * /api/game/lobby/{lobbyId}/start:
 *   post:
 *     summary: Start a game in a lobby
 *     tags: [Game]
 *     description: Start a multiplayer game in a lobby (host only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lobbyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the lobby to start a game in
 *     responses:
 *       200:
 *         description: Game started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 game:
 *                   $ref: '#/components/schemas/Game'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Only the host can start the game
 *       404:
 *         description: Lobby not found
 *       400:
 *         description: Not enough players or game already in progress
 *       500:
 *         description: Server error
 *
 * /api/game/answer:
 *   post:
 *     summary: Submit an answer in a multiplayer game
 *     tags: [Game]
 *     description: Submit an answer to a question in a multiplayer game
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GameAnswerRequest'
 *     responses:
 *       200:
 *         description: Answer submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 result:
 *                   type: object
 *                   properties:
 *                     isCorrect:
 *                       type: boolean
 *                     correctAnswer:
 *                       type: integer
 *                     score:
 *                       type: integer
 *                     totalScore:
 *                       type: integer
 *                     allAnswered:
 *                       type: boolean
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Game not found
 *       500:
 *         description: Server error
 */

module.exports = {}; 