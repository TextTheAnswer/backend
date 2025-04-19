/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and management endpoints. Registration and login endpoints are publicly accessible, while profile and logout endpoints require authentication.
 * 
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The user's ID
 *         email:
 *           type: string
 *           description: The user's email address
 *         name:
 *           type: string
 *           description: The user's name
 *         subscription:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               enum: [free, premium, education]
 *               description: The user's subscription status
 *             currentPeriodEnd:
 *               type: string
 *               format: date-time
 *               description: When the current subscription period ends
 *         isPremium:
 *           type: boolean
 *           description: Whether the user has premium access
 *         education:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               enum: [pending, verified, rejected]
 *               description: Status of the student verification
 *             studentEmail:
 *               type: string
 *               description: The student's educational email
 *             yearOfStudy:
 *               type: integer
 *               description: Year of study (1-7)
 *     
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *         name:
 *           type: string
 *           description: User's full name
 *         isStudent:
 *           type: boolean
 *           description: Whether the user is registering as a student
 *         studentEmail:
 *           type: string
 *           format: email
 *           description: Student's educational email (required if isStudent is true)
 *         yearOfStudy:
 *           type: integer
 *           minimum: 1
 *           maximum: 7
 *           description: Year of study (required if isStudent is true)
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *         message:
 *           type: string
 *           description: Response message
 *         token:
 *           type: string
 *           description: JWT authentication token
 *         user:
 *           $ref: '#/components/schemas/User'
 *
 * /api/auth/register:
 *   post:
 *     summary: Register a new user (No authentication required)
 *     tags: [Authentication]
 *     description: Create a new user account. This endpoint is publicly accessible.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request - validation error or user already exists
 *       500:
 *         description: Server error
 *
 * /api/auth/login:
 *   post:
 *     summary: Login user (No authentication required)
 *     tags: [Authentication]
 *     description: Login with email and password. This endpoint is publicly accessible.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 *
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile (Authentication required)
 *     tags: [Authentication]
 *     description: Get the authenticated user's profile. This endpoint requires a valid JWT token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *
 * /api/auth/logout:
 *   post:
 *     summary: Logout user (Authentication required)
 *     tags: [Authentication]
 *     description: Logout the authenticated user. This endpoint requires a valid JWT token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Server error
 *
 * /api/auth/verify-student/{token}:
 *   get:
 *     summary: Verify student email (No authentication required)
 *     tags: [Authentication]
 *     description: Verify a student's email using the verification token. This endpoint is publicly accessible.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The verification token sent to the student's email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid verification token
 *       500:
 *         description: Server error
 */

module.exports = {}; 