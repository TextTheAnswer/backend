/**
 * @swagger
 * tags:
 *   name: Subscription
 *   description: Subscription management endpoints
 * 
 * components:
 *   schemas:
 *     SubscriptionDetails:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [free, premium, education]
 *           description: The current subscription status
 *         stripeCustomerId:
 *           type: string
 *           description: The Stripe customer ID
 *         currentPeriodEnd:
 *           type: string
 *           format: date-time
 *           description: When the current subscription period ends
 *
 *     CheckoutRequest:
 *       type: object
 *       required:
 *         - plan
 *       properties:
 *         plan:
 *           type: string
 *           enum: [monthly, yearly]
 *           description: The subscription plan to purchase
 *
 *     CheckoutResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         sessionId:
 *           type: string
 *           description: The Stripe checkout session ID
 *         url:
 *           type: string
 *           description: The URL to redirect the user to for payment
 *
 * /api/subscription/checkout:
 *   post:
 *     summary: Create checkout session
 *     tags: [Subscription]
 *     description: Create a Stripe checkout session for subscription purchase
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckoutRequest'
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckoutResponse'
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Server error
 *
 * /api/subscription/webhook:
 *   post:
 *     summary: Stripe webhook handler
 *     tags: [Subscription]
 *     description: Handles Stripe webhook events for subscription updates
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature
 *       500:
 *         description: Server error
 *
 * /api/subscription/details:
 *   get:
 *     summary: Get subscription details
 *     tags: [Subscription]
 *     description: Get the authenticated user's subscription details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 subscription:
 *                   $ref: '#/components/schemas/SubscriptionDetails'
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Server error
 *
 * /api/subscription/cancel:
 *   post:
 *     summary: Cancel subscription
 *     tags: [Subscription]
 *     description: Cancel the authenticated user's premium subscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription canceled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - authentication required
 *       400:
 *         description: No active subscription to cancel
 *       500:
 *         description: Server error
 *
 * /api/subscription/verify-education:
 *   post:
 *     summary: Verify education status
 *     tags: [Subscription]
 *     description: Submit verification for education tier status
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentEmail
 *               - yearOfStudy
 *             properties:
 *               studentEmail:
 *                 type: string
 *                 format: email
 *                 description: Student's educational email (.edu domain)
 *               yearOfStudy:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 7
 *                 description: Year of study
 *     responses:
 *       200:
 *         description: Verification request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - authentication required
 *       400:
 *         description: Invalid student email or year of study
 *       500:
 *         description: Server error
 */

module.exports = {}; 