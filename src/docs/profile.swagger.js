/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User profile management including image handling. Authentication is required for all endpoints in this section.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProfilePreferences:
 *       type: object
 *       properties:
 *         favoriteCategories:
 *           type: array
 *           items:
 *             type: string
 *           description: List of user's favorite trivia categories
 *           example: ["Science", "History", "Sports"]
 *         notificationSettings:
 *           type: object
 *           properties:
 *             dailyQuizReminder:
 *               type: boolean
 *               description: Whether to send daily quiz reminders
 *               example: true
 *             multiplayerInvites:
 *               type: boolean
 *               description: Whether to receive multiplayer game invites
 *               example: true
 *         displayTheme:
 *           type: string
 *           enum: [light, dark, system]
 *           description: User's preferred display theme
 *           example: dark
 *     
 *     Profile:
 *       type: object
 *       properties:
 *         bio:
 *           type: string
 *           description: User's biography or description
 *           example: A passionate trivia enthusiast
 *         location:
 *           type: string
 *           description: User's location (city, country, etc.)
 *           example: New York, USA
 *         imageUrl:
 *           type: string
 *           description: URL to the user's profile image on Cloudinary
 *           example: https://res.cloudinary.com/demo/image/upload/v1631234567/profile-image.jpg
 *         imagePublicId:
 *           type: string
 *           description: Cloudinary public ID for the user's profile image
 *           example: users/profile-image-123456
 *         preferences:
 *           $ref: '#/components/schemas/ProfilePreferences'
 */

/**
 * @swagger
 * /api/profile/create:
 *   post:
 *     summary: Create user profile (Authentication required)
 *     description: Creates or initializes a user profile with optional details like bio, location, profile picture, and preferences.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *                 description: User's biography or description
 *                 maxLength: 500
 *               location:
 *                 type: string
 *                 description: User's location (city, country, etc.)
 *               profilePicture:
 *                 type: string
 *                 description: |
 *                   User's profile picture in one of these formats:
 *                   - A default image identifier (e.g., "default-1", "default-2")
 *                   - A base64 encoded image string starting with "data:image/"
 *                   - A Cloudinary public ID for an existing image
 *               preferences:
 *                 type: object
 *                 properties:
 *                   favoriteCategories:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: List of user's favorite trivia categories
 *                   notificationSettings:
 *                     type: object
 *                     properties:
 *                       dailyQuizReminder:
 *                         type: boolean
 *                         description: Whether to send daily quiz reminders
 *                       multiplayerInvites:
 *                         type: boolean
 *                         description: Whether to receive multiplayer game invites
 *                   displayTheme:
 *                     type: string
 *                     enum: [light, dark, system]
 *                     description: User's preferred display theme
 *     responses:
 *       201:
 *         description: Profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile created successfully
 *                 profile:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 5f7d1d1b1c9d440000e1c8d6
 *                     bio:
 *                       type: string
 *                       example: A passionate trivia enthusiast
 *                     location:
 *                       type: string
 *                       example: New York, USA
 *                     imageUrl:
 *                       type: string
 *                       example: https://res.cloudinary.com/demo/image/upload/v1631234567/profile-image.jpg
 *                     preferences:
 *                       $ref: '#/components/schemas/ProfilePreferences'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Server Error
 */

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update user profile (Authentication required)
 *     description: Updates a user's profile information including name, bio, location, and profile picture. User is identified by their authentication token.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's name
 *               bio:
 *                 type: string
 *                 description: User's biography or description
 *                 maxLength: 500
 *               location:
 *                 type: string
 *                 description: User's location (city, country, etc.)
 *               profilePicture:
 *                 type: string
 *                 description: |
 *                   User's profile picture in one of these formats:
 *                   - A default image identifier (e.g., "default-1", "default-2")
 *                   - A base64 encoded image string starting with "data:image/"
 *                   - A Cloudinary public ID for an existing image
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 5f7d1d1b1c9d440000e1c8d6
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     profile:
 *                       type: object
 *                       properties:
 *                         bio:
 *                           type: string
 *                           example: A passionate trivia enthusiast
 *                         location:
 *                           type: string
 *                           example: New York, USA
 *                         imageUrl:
 *                           type: string
 *                           example: https://res.cloudinary.com/demo/image/upload/v1631234567/profile-image.jpg
 *                     subscription:
 *                       type: string
 *                       example: premium
 *                     stats:
 *                       type: object
 *                     isPremium:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: User ID is required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server Error
 */

/**
 * @swagger
 * /api/profile/full:
 *   get:
 *     summary: Get comprehensive profile data (Authentication required)
 *     description: Retrieves the complete profile data for the authenticated user.
 *     tags: [Profile]
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
 *                   example: true
 *                 profile:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 5f7d1d1b1c9d440000e1c8d6
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     profile:
 *                       $ref: '#/components/schemas/Profile'
 *                     subscription:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: premium
 *                         currentPeriodEnd:
 *                           type: string
 *                           format: date-time
 *                         cancelAtPeriodEnd:
 *                           type: boolean
 *                     stats:
 *                       type: object
 *                       properties:
 *                         streak:
 *                           type: number
 *                           example: 5
 *                         lastPlayed:
 *                           type: string
 *                           format: date-time
 *                         totalCorrect:
 *                           type: number
 *                           example: 250
 *                         totalAnswered:
 *                           type: number
 *                           example: 300
 *                         accuracy:
 *                           type: string
 *                           example: "83.33%"
 *                     isPremium:
 *                       type: boolean
 *                       example: true
 *                     isEducation:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: User ID is required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server Error
 */

/**
 * @swagger
 * /api/profile/password/change:
 *   post:
 *     summary: Change password (Authentication required)
 *     description: Changes the authenticated user's password by verifying their current password first.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 description: New password
 *               confirmPassword:
 *                 type: string
 *                 description: Confirm new password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password changed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Current password is incorrect
 *       404:
 *         description: User not found
 *       500:
 *         description: Server Error
 */

/**
 * @swagger
 * /api/profile/password-reset/request:
 *   post:
 *     summary: Request password reset (No authentication required)
 *     description: Initiates a password reset process by sending an OTP to the user's email.
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: User's email address
 *     responses:
 *       200:
 *         description: OTP sent if email exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: If your email is registered, you will receive a password reset OTP
 *       400:
 *         description: Email is required
 *       500:
 *         description: Server Error
 */

/**
 * @swagger
 * /api/profile/password-reset/verify:
 *   post:
 *     summary: Verify OTP for password reset (No authentication required)
 *     description: Verifies the OTP sent to the user's email for password reset and returns a reset token.
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 description: User's email address
 *               otp:
 *                 type: string
 *                 description: One-time password received via email
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: OTP verified successfully
 *                 resetToken:
 *                   type: string
 *                   example: a8b5c7d9e2f4a6b8c0d2e4f6a8b0c2d4
 *       400:
 *         description: Email and OTP are required
 *       401:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Server Error
 */

/**
 * @swagger
 * /api/profile/password-reset/reset:
 *   post:
 *     summary: Reset password after OTP verification (No authentication required)
 *     description: Completes the password reset process using the token received after OTP verification.
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - resetToken
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *                 description: User's email address
 *               resetToken:
 *                 type: string
 *                 description: Reset token received after OTP verification
 *               newPassword:
 *                 type: string
 *                 description: New password
 *               confirmPassword:
 *                 type: string
 *                 description: Confirm new password
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password reset successful. You can now log in with your new password.
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid or expired reset token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server Error
 */

/**
 * @swagger
 * /api/profile/image:
 *   post:
 *     summary: Upload profile image (Authentication required)
 *     description: Uploads a profile image for the authenticated user.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file (JPG, PNG, etc.)
 *     responses:
 *       200:
 *         description: Profile image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile image uploaded successfully
 *                 profile:
 *                   type: object
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                       example: https://res.cloudinary.com/demo/image/upload/v1631234567/profile-image.jpg
 *       400:
 *         description: No image file uploaded
 *       404:
 *         description: User not found
 *       500:
 *         description: Server Error
 * 
 *   delete:
 *     summary: Delete profile image (Authentication required)
 *     description: Removes the authenticated user's profile image from both Cloudinary and their profile.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile image deleted successfully
 *       400:
 *         description: No profile image to delete
 *       404:
 *         description: User not found
 *       500:
 *         description: Server Error
 */ 