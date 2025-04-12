/**
 * @swagger
 * tags:
 *   name: Study Materials
 *   description: Study material management (Education Tier)
 * 
 * components:
 *   schemas:
 *     StudyMaterial:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The study material ID
 *         user:
 *           type: string
 *           description: The user ID who owns this material
 *         title:
 *           type: string
 *           description: The title of the study material
 *         content:
 *           type: string
 *           description: The text content of the study material
 *         fileType:
 *           type: string
 *           enum: [text, pdf, image]
 *           description: The type of the original file
 *         originalFilename:
 *           type: string
 *           description: The original filename
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags for categorizing the material
 *         questions:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs of questions generated from this material
 *         generatedQuestions:
 *           type: object
 *           properties:
 *             count:
 *               type: integer
 *               description: Number of questions generated today
 *             lastGenerated:
 *               type: string
 *               format: date-time
 *               description: When questions were last generated
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the material was created
 *     
 *     GeneratedQuestion:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The question ID
 *         text:
 *           type: string
 *           description: The question text
 *         options:
 *           type: array
 *           items:
 *             type: string
 *           description: Available answer options
 *         correctAnswer:
 *           type: integer
 *           description: Index of the correct answer
 *         category:
 *           type: string
 *           description: Question category
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *           description: Difficulty level
 *         explanation:
 *           type: string
 *           description: Explanation of the answer
 *
 *     CustomQuestion:
 *       type: object
 *       required:
 *         - text
 *         - correctAnswer
 *       properties:
 *         text:
 *           type: string
 *           description: The question text
 *         correctAnswer:
 *           type: string
 *           description: The correct answer
 *         alternativeAnswers:
 *           type: array
 *           items:
 *             type: string
 *           description: Alternative acceptable answers
 *         explanation:
 *           type: string
 *           description: Explanation of the answer
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *           default: medium
 *           description: Difficulty level
 *         timeLimit:
 *           type: integer
 *           minimum: 10
 *           maximum: 120
 *           default: 30
 *           description: Time limit in seconds to answer the question
 *
 * /api/study-materials:
 *   get:
 *     summary: Get all study materials
 *     tags: [Study Materials]
 *     description: Retrieve all study materials for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Study materials retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 studyMaterials:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StudyMaterial'
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Server error
 *
 * /api/study-materials/upload:
 *   post:
 *     summary: Upload study material
 *     tags: [Study Materials]
 *     description: Upload a new study material file (text, PDF, or image)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               studyMaterial:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload
 *               title:
 *                 type: string
 *                 description: Optional title for the material
 *               tags:
 *                 type: string
 *                 description: Comma-separated list of tags
 *     responses:
 *       201:
 *         description: Study material uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 studyMaterial:
 *                   $ref: '#/components/schemas/StudyMaterial'
 *       400:
 *         description: Bad request - Invalid file
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Server error
 *
 * /api/study-materials/{id}:
 *   get:
 *     summary: Get study material
 *     tags: [Study Materials]
 *     description: Retrieve a specific study material by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the study material
 *     responses:
 *       200:
 *         description: Study material retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 studyMaterial:
 *                   $ref: '#/components/schemas/StudyMaterial'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - study material belongs to another user
 *       404:
 *         description: Study material not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete study material
 *     tags: [Study Materials]
 *     description: Delete a specific study material and its associated questions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the study material
 *     responses:
 *       200:
 *         description: Study material deleted successfully
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - study material belongs to another user
 *       404:
 *         description: Study material not found
 *       500:
 *         description: Server error
 *
 * /api/study-materials/{id}/generate-questions:
 *   post:
 *     summary: Generate questions
 *     tags: [Study Materials]
 *     description: Generate questions from the study material
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the study material
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           default: 5
 *           minimum: 1
 *           maximum: 10
 *         description: Number of questions to generate (default 5, max 10)
 *     responses:
 *       200:
 *         description: Questions generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 questions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GeneratedQuestion'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - daily limit reached or not education tier
 *       404:
 *         description: Study material not found
 *       500:
 *         description: Server error
 *
 * /api/study-materials/{id}/questions:
 *   post:
 *     summary: Add custom question
 *     tags: [Study Materials]
 *     description: Add a custom question to the study material
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the study material
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomQuestion'
 *     responses:
 *       201:
 *         description: Custom question added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 question:
 *                   $ref: '#/components/schemas/GeneratedQuestion'
 *       400:
 *         description: Bad request - Invalid question data
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - study material belongs to another user
 *       404:
 *         description: Study material not found
 *       500:
 *         description: Server error
 */

module.exports = {}; 