const StudyMaterial = require('../models/studyMaterial.model');
const Question = require('../models/question.model');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);

// Configure multer for file upload
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../uploads');
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Unique filename with original extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = [
      'text/plain', 
      'application/pdf',
      'image/jpeg', 
      'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Only TXT, PDF, JPG, PNG files are allowed.'));
    }
  }
}).single('studyMaterial');

// Middleware for file upload
exports.uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ 
        success: false, 
        message: `File upload error: ${err.message}` 
      });
    } else if (err) {
      return res.status(400).json({ 
        success: false, 
        message: err.message 
      });
    }
    next();
  });
};

// Upload and create new study material
exports.uploadStudyMaterial = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file was uploaded'
      });
    }
    
    // Get file path and details
    const filePath = req.file.path;
    const fileType = getFileType(req.file.mimetype);
    const { title, tags } = req.body;
    
    // Read file content
    let content = '';
    
    if (fileType === 'text') {
      // For text files, read directly
      content = await readFileAsync(filePath, 'utf8');
    } else if (fileType === 'pdf' || fileType === 'image') {
      // For PDF and images, we would normally use OCR here
      // For demo, just store the path and pretend we extracted content
      content = `Extracted content from ${req.file.originalname}`;
      // In a real implementation, use a library like tesseract.js for OCR
    }
    
    // Create new study material
    const studyMaterial = new StudyMaterial({
      user: req.user.id,
      title: title || req.file.originalname,
      content,
      fileType,
      originalFilename: req.file.originalname,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });
    
    await studyMaterial.save();
    
    res.status(201).json({
      success: true,
      message: 'Study material uploaded successfully',
      studyMaterial: {
        id: studyMaterial._id,
        title: studyMaterial.title,
        fileType: studyMaterial.fileType,
        originalFilename: studyMaterial.originalFilename,
        tags: studyMaterial.tags,
        createdAt: studyMaterial.createdAt
      }
    });
  } catch (error) {
    console.error('Upload study material error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading study material',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all study materials for a user
exports.getUserStudyMaterials = async (req, res) => {
  try {
    const studyMaterials = await StudyMaterial.find({ user: req.user.id })
      .select('-content')
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      studyMaterials
    });
  } catch (error) {
    console.error('Get study materials error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving study materials',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get a specific study material
exports.getStudyMaterial = async (req, res) => {
  try {
    const studyMaterial = await StudyMaterial.findById(req.params.id)
      .populate('questions');
    
    if (!studyMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Study material not found'
      });
    }
    
    // Check if the study material belongs to the user
    if (studyMaterial.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this study material'
      });
    }
    
    res.status(200).json({
      success: true,
      studyMaterial
    });
  } catch (error) {
    console.error('Get study material error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving study material',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Generate questions from study material
exports.generateQuestions = async (req, res) => {
  try {
    const studyMaterial = await StudyMaterial.findById(req.params.id);
    
    if (!studyMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Study material not found'
      });
    }
    
    // Check if the study material belongs to the user
    if (studyMaterial.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this study material'
      });
    }
    
    // Check if user can generate more questions
    if (!studyMaterial.canGenerateQuestions(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Daily limit reached for generating questions. Upgrade to education or premium tier for unlimited questions.'
      });
    }
    
    // Number of questions to generate (default: 5)
    const questionCount = Math.min(parseInt(req.query.count || 5), 10);
    
    // In a real implementation, this would use an AI service or NLP to generate questions
    // For this demo, we'll generate simple mock questions
    const generatedQuestions = [];
    
    // Sample questions with typed answers
    const sampleQuestions = [
      { 
        question: `What is the capital of France?`, 
        answer: 'Paris',
        alternatives: ['paris', 'Paris, France'],
        explanation: 'Paris is the capital and largest city of France.'
      },
      { 
        question: `What is the chemical symbol for water?`, 
        answer: 'H2O',
        alternatives: ['h2o', 'H₂O'],
        explanation: 'Water consists of two hydrogen atoms and one oxygen atom.'
      },
      { 
        question: `Who wrote Romeo and Juliet?`, 
        answer: 'William Shakespeare',
        alternatives: ['shakespeare', 'Shakespeare'],
        explanation: 'William Shakespeare wrote this famous tragedy around 1594-1596.'
      },
      { 
        question: `What is the largest planet in our solar system?`, 
        answer: 'Jupiter',
        alternatives: ['jupiter'],
        explanation: 'Jupiter is the fifth planet from the Sun and the largest in our solar system.'
      },
      { 
        question: `What year did World War II end?`, 
        answer: '1945',
        alternatives: ['nineteen forty-five'],
        explanation: 'World War II ended in 1945 after the surrender of Germany and Japan.'
      }
    ];
    
    for (let i = 0; i < questionCount; i++) {
      // Get a random sample question or generate based on study material content
      const sampleIndex = Math.floor(Math.random() * sampleQuestions.length);
      const sample = sampleQuestions[sampleIndex];
      
      // Create a new question
      const question = new Question({
        text: `${sample.question} (Based on ${studyMaterial.title})`,
        correctAnswer: sample.answer,
        alternativeAnswers: sample.alternatives,
        category: 'Generated',
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
        explanation: sample.explanation,
        timeLimit: Math.floor(Math.random() * 3) * 15 + 15 // 15, 30, or 45 seconds
      });
      
      await question.save();
      generatedQuestions.push(question);
      
      // Add question to study material
      studyMaterial.questions.push(question._id);
    }
    
    // Update study material's generated questions count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!studyMaterial.generatedQuestions.lastGenerated || 
        studyMaterial.generatedQuestions.lastGenerated < today) {
      studyMaterial.generatedQuestions.count = questionCount;
    } else {
      studyMaterial.generatedQuestions.count += questionCount;
    }
    
    studyMaterial.generatedQuestions.lastGenerated = new Date();
    await studyMaterial.save();
    
    res.status(200).json({
      success: true,
      message: `Successfully generated ${questionCount} questions`,
      questions: generatedQuestions
    });
  } catch (error) {
    console.error('Generate questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating questions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add a custom question to study material
exports.addCustomQuestion = async (req, res) => {
  try {
    const studyMaterial = await StudyMaterial.findById(req.params.id);
    
    if (!studyMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Study material not found'
      });
    }
    
    // Check if the study material belongs to the user
    if (studyMaterial.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this study material'
      });
    }
    
    const { text, correctAnswer, alternativeAnswers, explanation, difficulty, timeLimit } = req.body;
    
    // Validate question data
    if (!text || !correctAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question data. Please provide text and correctAnswer.'
      });
    }
    
    // Create a new question
    const question = new Question({
      text,
      correctAnswer,
      alternativeAnswers: alternativeAnswers || [],
      category: 'Custom',
      difficulty: difficulty || 'medium',
      explanation: explanation || '',
      timeLimit: timeLimit || 30
    });
    
    await question.save();
    
    // Add question to study material
    studyMaterial.questions.push(question._id);
    await studyMaterial.save();
    
    res.status(201).json({
      success: true,
      message: 'Custom question added successfully',
      question
    });
  } catch (error) {
    console.error('Add custom question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding custom question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete a study material
exports.deleteStudyMaterial = async (req, res) => {
  try {
    const studyMaterial = await StudyMaterial.findById(req.params.id);
    
    if (!studyMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Study material not found'
      });
    }
    
    // Check if the study material belongs to the user
    if (studyMaterial.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this study material'
      });
    }
    
    // Delete associated questions
    for (const questionId of studyMaterial.questions) {
      await Question.findByIdAndDelete(questionId);
    }
    
    // Delete the study material
    await StudyMaterial.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Study material and associated questions deleted successfully'
    });
  } catch (error) {
    console.error('Delete study material error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting study material',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to get file type from MIME type
function getFileType(mimeType) {
  if (mimeType === 'text/plain') {
    return 'text';
  } else if (mimeType === 'application/pdf') {
    return 'pdf';
  } else if (mimeType.startsWith('image/')) {
    return 'image';
  }
  return 'text'; // Default
} 