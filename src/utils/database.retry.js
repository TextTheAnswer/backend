const mongoose = require('mongoose');

// Database connection with retry mechanism
const connectWithRetry = async (connectFn) => {
  const maxRetries = 5;
  let retries = 0;
  let connected = false;

  while (retries < maxRetries && !connected) {
    try {
      console.log(`MongoDB connection attempt ${retries + 1}/${maxRetries}...`);
      
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
      connected = true;
      console.log('MongoDB connected successfully');
      
      // Initialize database with required data
      await initializeDatabase();
      
    } catch (error) {
      retries++;
      console.error(`MongoDB connection error (attempt ${retries}/${maxRetries}):`, error.message);
      
      if (retries < maxRetries) {
        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, retries) * 1000;
        console.log(`Retrying in ${waitTime / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        console.error('Failed to connect to MongoDB after multiple attempts');
        throw error;
      }
    }
  }
};

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
};

// Initialize database with required data
const initializeDatabase = async () => {
  try {
    // Import models
    const Category = mongoose.model('Category');
    const Question = mongoose.model('Question');
    
    // Check if categories exist, if not create default categories
    const categoriesCount = await Category.countDocuments();
    if (categoriesCount === 0) {
      console.log('No categories found. Creating default categories...');
      
      const defaultCategories = [
        {
          name: 'Sports',
          description: 'Questions about various sports and athletic competitions',
          icon: '🏆',
          color: '#e74c3c',
          order: 1
        },
        {
          name: 'Science',
          description: 'Questions about scientific discoveries, theories, and facts',
          icon: '🔬',
          color: '#3498db',
          order: 2
        },
        {
          name: 'History',
          description: 'Questions about historical events, figures, and periods',
          icon: '📜',
          color: '#f39c12',
          order: 3
        },
        {
          name: 'Entertainment',
          description: 'Questions about movies, TV shows, music, and celebrities',
          icon: '🎬',
          color: '#9b59b6',
          order: 4
        },
        {
          name: 'Geography',
          description: 'Questions about countries, cities, landmarks, and natural features',
          icon: '🌎',
          color: '#2ecc71',
          order: 5
        },
        {
          name: 'Technology',
          description: 'Questions about computers, gadgets, and technological innovations',
          icon: '💻',
          color: '#1abc9c',
          order: 6
        },
        {
          name: 'Anime',
          description: 'Questions about anime series, characters, and creators',
          icon: '🎭',
          color: '#e91e63',
          order: 7
        },
        {
          name: 'Food',
          description: 'Questions about cuisine, cooking, and culinary traditions',
          icon: '🍔',
          color: '#ff5722',
          order: 8
        },
        {
          name: 'Art',
          description: 'Questions about paintings, sculptures, artists, and art movements',
          icon: '🎨',
          color: '#795548',
          order: 9
        },
        {
          name: 'Literature',
          description: 'Questions about books, authors, and literary works',
          icon: '📚',
          color: '#607d8b',
          order: 10
        }
      ];
      
      await Category.insertMany(defaultCategories);
      console.log(`Created ${defaultCategories.length} default categories`);
    }
    
    // Check if questions exist, if not create sample questions
    const questionsCount = await Question.countDocuments();
    if (questionsCount < 50) {
      console.log('Not enough questions found. Creating sample questions...');
      
      // Get categories to associate questions with
      const categories = await Category.find();
      
      // Sample questions for each category
      const sampleQuestions = [];
      
      // Sports questions
      if (categories.find(c => c.name === 'Sports')) {
        sampleQuestions.push(
          {
            text: 'Which country won the FIFA World Cup in 2018?',
            correctAnswer: 'France',
            alternativeAnswers: [],
            category: 'Sports',
            difficulty: 'easy',
            explanation: 'France defeated Croatia 4-2 in the final match.',
            tags: ['soccer', 'world cup', 'international']
          },
          {
            text: 'How many players are on a standard basketball team on the court?',
            correctAnswer: '5',
            alternativeAnswers: ['five'],
            category: 'Sports',
            difficulty: 'easy',
            explanation: 'Basketball is played with 5 players from each team on the court.',
            tags: ['basketball', 'rules']
          },
          {
            text: 'In which city were the 2016 Summer Olympics held?',
            correctAnswer: 'Rio de Janeiro',
            alternativeAnswers: ['Rio'],
            category: 'Sports',
            difficulty: 'medium',
            explanation: 'The 2016 Summer Olympics were held in Rio de Janeiro, Brazil.',
            tags: ['olympics', 'international']
          },
          {
            text: 'Who holds the record for the most Grand Slam tennis titles in men\'s singles?',
            correctAnswer: 'Novak Djokovic',
            alternativeAnswers: ['Djokovic'],
            category: 'Sports',
            difficulty: 'medium',
            explanation: 'As of 2025, Novak Djokovic holds the record with 24 Grand Slam titles.',
            tags: ['tennis', 'records']
          },
          {
            text: 'Which NFL quarterback has won the most Super Bowl titles?',
            correctAnswer: 'Tom Brady',
            alternativeAnswers: ['Brady'],
            category: 'Sports',
            difficulty: 'medium',
            explanation: 'Tom Brady has won 7 Super Bowl championships.',
            tags: ['football', 'NFL', 'records']
          }
        );
      }
      
      // Science questions
      if (categories.find(c => c.name === 'Science')) {
        sampleQuestions.push(
          {
            text: 'What is the chemical symbol for gold?',
            correctAnswer: 'Au',
            alternativeAnswers: [],
            category: 'Science',
            difficulty: 'easy',
            explanation: 'Au comes from the Latin word for gold, "aurum".',
            tags: ['chemistry', 'elements']
          },
          {
            text: 'What is the closest planet to the Sun?',
            correctAnswer: 'Mercury',
            alternativeAnswers: [],
            category: 'Science',
            difficulty: 'easy',
            explanation: 'Mercury is the first planet from the Sun at an average distance of about 36 million miles.',
            tags: ['astronomy', 'planets']
          },
          {
            text: 'What is the hardest natural substance on Earth?',
            correctAnswer: 'Diamond',
            alternativeAnswers: [],
            category: 'Science',
            difficulty: 'easy',
            explanation: 'Diamond is the hardest known natural material, scoring 10 on the Mohs scale of mineral hardness.',
            tags: ['geology', 'minerals']
          },
          {
            text: 'What is the process by which plants make their own food using sunlight?',
            correctAnswer: 'Photosynthesis',
            alternativeAnswers: [],
            category: 'Science',
            difficulty: 'easy',
            explanation: 'Photosynthesis is the process used by plants to convert light energy into chemical energy.',
            tags: ['biology', 'plants']
          },
          {
            text: 'What is the largest organ in the human body?',
            correctAnswer: 'Skin',
            alternativeAnswers: [],
            category: 'Science',
            difficulty: 'easy',
            explanation: 'The skin is the largest organ of the human body, with a surface area of about 2 square meters.',
            tags: ['biology', 'human body']
          }
        );
      }
      
      // Anime questions
      if (categories.find(c => c.name === 'Anime')) {
        sampleQuestions.push(
          {
            text: 'Which anime features a boy named Monkey D. Luffy who has the power of the Gum-Gum Fruit?',
            correctAnswer: 'One Piece',
            alternativeAnswers: [],
            category: 'Anime',
            difficulty: 'easy',
            explanation: 'One Piece follows the adventures of Monkey D. Luffy and his crew as they search for the world\'s ultimate treasure.',
            tags: ['shonen', 'pirates']
          },
          {
            text: 'In "Attack on Titan," what are the giant humanoid creatures that threaten humanity called?',
            correctAnswer: 'Titans',
            alternativeAnswers: [],
            category: 'Anime',
            difficulty: 'easy',
            explanation: 'Titans are giant humanoid creatures that eat humans and are the main antagonists in Attack on Titan.',
            tags: ['shonen', 'dark fantasy']
          },
          {
            text: 'Which anime features a Death Note that can kill anyone whose name is written in it?',
            correctAnswer: 'Death Note',
            alternativeAnswers: [],
            category: 'Anime',
            difficulty: 'easy',
            explanation: 'Death Note follows Light Yagami, who finds a supernatural notebook that allows him to kill anyone by writing their name in it.',
            tags: ['supernatural', 'thriller']
          },
          {
            text: 'In "Naruto," what is the name of the nine-tailed fox sealed within Naruto?',
            correctAnswer: 'Kurama',
            alternativeAnswers: ['Nine-Tails', 'Kyuubi'],
            category: 'Anime',
            difficulty: 'medium',
            explanation: 'Kurama, also known as the Nine-Tails, is one of the nine tailed beasts in the Naruto universe.',
            tags: ['shonen', 'ninja']
          },
          {
            text: 'Which studio produced "Spirited Away"?',
            correctAnswer: 'Studio Ghibli',
            alternativeAnswers: ['Ghibli'],
            category: 'Anime',
            difficulty: 'medium',
            explanation: 'Studio Ghibli, co-founded by Hayao Miyazaki, produced "Spirited Away" which won an Academy Award for Best Animated Feature.',
            tags: ['movies', 'studios']
          }
        );
      }
      
      // Add more sample questions for other categories as needed
      
      // Insert questions if we have any
      if (sampleQuestions.length > 0) {
        await Question.insertMany(sampleQuestions);
        console.log(`Created ${sampleQuestions.length} sample questions`);
      }
    }
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

module.exports = { connectDB, connectWithRetry, initializeDatabase };
