const express = require('express');
const router = express.Router();
const studyMaterialController = require('../controllers/studyMaterial.controller');
const { authenticate, requirePremium } = require('../middleware/auth.middleware');

// Middleware to check if user has education tier
const requireEducation = (req, res, next) => {
  if (req.user.subscription.status === 'education' && req.user.education.verificationStatus === 'verified') {
    return next();
  }
  
  // Allow premium users as well
  if (req.user.subscription.status === 'premium') {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    message: 'This feature requires an education tier or premium subscription.'
  });
};

// Get all study materials for the authenticated user
router.get('/', authenticate, studyMaterialController.getUserStudyMaterials);

// Upload new study material
router.post(
  '/upload',
  authenticate,
  studyMaterialController.uploadMiddleware,
  studyMaterialController.uploadStudyMaterial
);

// Get a specific study material
router.get('/:id', authenticate, studyMaterialController.getStudyMaterial);

// Generate questions from study material
router.post('/:id/generate-questions', authenticate, studyMaterialController.generateQuestions);

// Add a custom question to study material
router.post('/:id/questions', authenticate, studyMaterialController.addCustomQuestion);

// Delete a study material
router.delete('/:id', authenticate, studyMaterialController.deleteStudyMaterial);

module.exports = router; 