/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Profile management and password reset
 */

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update user profile
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
 *                     subscription:
 *                       type: string
 *                       example: premium
 *                     stats:
 *                       type: object
 *                     isPremium:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server Error
 */

/**
 * @swagger
 * /api/profile/full:
 *   get:
 *     summary: Get comprehensive profile data
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server Error
 */

/**
 * @swagger
 * /api/profile/password/change:
 *   post:
 *     summary: Change password (for logged in users)
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
 *     summary: Request password reset (send OTP)
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
 *     summary: Verify OTP for password reset
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
 *     summary: Reset password after OTP verification
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