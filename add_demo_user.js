const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/texttheanswer';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define User schema based on the existing model
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  profile: {
    bio: {
      type: String,
      trim: true,
      maxlength: 500
    },
    location: {
      type: String,
      trim: true
    },
    imageUrl: {
      type: String
    },
    imagePublicId: {
      type: String
    },
    preferences: {
      favoriteCategories: [String],
      notificationSettings: {
        email: Boolean,
        push: Boolean
      },
      displayTheme: String
    }
  },
  subscription: {
    status: {
      type: String,
      enum: ['free', 'premium', 'education'],
      default: 'free'
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: Boolean,
    freeTrialUsed: {
      type: Boolean,
      default: false
    }
  },
  education: {
    isStudent: {
      type: Boolean,
      default: false
    },
    studentEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    yearOfStudy: {
      type: Number,
      min: 1,
      max: 7
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    }
  },
  stats: {
    streak: {
      type: Number,
      default: 0
    },
    lastPlayed: Date,
    totalCorrect: {
      type: Number,
      default: 0
    },
    totalAnswered: {
      type: Number,
      default: 0
    }
  },
  dailyQuiz: {
    lastCompleted: Date,
    questionsAnswered: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    score: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Create User model
const User = mongoose.model('User', userSchema);

// Function to create the demo user
async function createDemoUser() {
  try {
    // Demo user details
    const email = 'test@gmail.com';
    const password = 'test123';
    const name = 'Test Demo User';
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      console.log('User already exists, updating to premium...');
      
      // Update existing user with premium access
      existingUser.name = name;
      
      // Set subscription to premium
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 10); // 10 years of premium access
      
      existingUser.subscription = {
        status: 'premium',
        stripeCustomerId: 'test_demo_customer',
        stripeSubscriptionId: 'test_demo_subscription',
        currentPeriodStart: new Date(),
        currentPeriodEnd: endDate,
        cancelAtPeriodEnd: false,
        freeTrialUsed: false
      };
      
      // Set education status to verified
      existingUser.education = {
        isStudent: true,
        studentEmail: 'test@university.edu',
        yearOfStudy: 3,
        verificationStatus: 'verified'
      };
      
      // Update/set some stats
      existingUser.stats = {
        streak: 10,
        lastPlayed: new Date(),
        totalCorrect: 85,
        totalAnswered: 100
      };
      
      await existingUser.save();
      console.log('Existing user updated with premium and education privileges');
      return existingUser;
    } else {
      console.log('Creating new demo user...');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Set subscription end date (10 years from now)
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 10);
      
      // Create new user with premium access
      const newUser = new User({
        email,
        password: hashedPassword,
        name,
        profile: {
          bio: 'This is a demo user with full premium access',
          location: 'Demo City',
          preferences: {
            favoriteCategories: ['all', 'science', 'math', 'history'],
            notificationSettings: { email: true, push: true },
            displayTheme: 'light'
          }
        },
        subscription: {
          status: 'premium',
          stripeCustomerId: 'test_demo_customer',
          stripeSubscriptionId: 'test_demo_subscription',
          currentPeriodStart: new Date(),
          currentPeriodEnd: endDate,
          cancelAtPeriodEnd: false,
          freeTrialUsed: false
        },
        education: {
          isStudent: true,
          studentEmail: 'test@university.edu',
          yearOfStudy: 3,
          verificationStatus: 'verified'
        },
        stats: {
          streak: 10,
          lastPlayed: new Date(),
          totalCorrect: 85,
          totalAnswered: 100
        },
        dailyQuiz: {
          questionsAnswered: 0,
          correctAnswers: 0,
          score: 0
        }
      });
      
      await newUser.save();
      console.log('New user created with premium and education privileges');
      return newUser;
    }
  } catch (error) {
    console.error('Error creating/updating demo user:', error);
    throw error;
  }
}

// Execute function and close connection
createDemoUser()
  .then(user => {
    console.log('Demo user details:');
    console.log({
      id: user._id,
      email: user.email,
      name: user.name,
      subscription: user.subscription.status,
      education: user.education.verificationStatus,
      endDate: user.subscription.currentPeriodEnd
    });
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  })
  .catch(err => {
    console.error('Error in script execution:', err);
    mongoose.connection.close();
  }); 