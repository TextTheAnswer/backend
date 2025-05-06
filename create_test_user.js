/**
 * Script to create a test user with full access to all features
 * Run with: node create_test_user.js
 */

// Include required modules
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI;

// MongoDB connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

// Define user schema to match the application model
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
    required: function() {
      return !this.appleId;
    }
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
    freeTrialUsed: Boolean
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

// Add password hashing middleware
userSchema.pre('save', async function(next) {
  const user = this;
  
  // Only hash the password if it's modified or new
  if (!user.isModified('password') || !user.password) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

async function createTestUser() {
  try {
    // User credentials
    const email = 'test@gmail.com';
    const password = 'test123';
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, options);
    console.log('MongoDB connected successfully');
    
    // Create User model
    const User = mongoose.model('User', userSchema);
    
    // Check if user exists
    console.log('Checking if user already exists...');
    const existingUser = await User.findOne({ email });
    
    // Set end date 10 years from now
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 10);
    
    let user;
    
    if (existingUser) {
      console.log('User already exists, updating to premium...');
      
      // Update existing user with premium access
      existingUser.name = 'Test User';
      existingUser.subscription = {
        status: 'premium',
        stripeCustomerId: 'test_customer',
        stripeSubscriptionId: 'test_subscription',
        currentPeriodStart: new Date(),
        currentPeriodEnd: endDate,
        cancelAtPeriodEnd: false,
        freeTrialUsed: false
      };
      
      existingUser.education = {
        isStudent: true,
        studentEmail: 'test@university.edu',
        yearOfStudy: 3,
        verificationStatus: 'verified'
      };
      
      // If password was changed, make sure to update it
      if (password !== 'test123') {
        const salt = await bcrypt.genSalt(10);
        existingUser.password = await bcrypt.hash(password, salt);
      }
      
      await existingUser.save();
      console.log('User updated with premium and education privileges');
      user = existingUser;
    } else {
      console.log('Creating new test user...');
      
      // Create new user
      const newUser = new User({
        email,
        password, // Password will be hashed by pre-save hook
        name: 'Test User',
        profile: {
          bio: 'This is a test user with full premium access',
          location: 'Test City'
        },
        subscription: {
          status: 'premium',
          stripeCustomerId: 'test_customer',
          stripeSubscriptionId: 'test_subscription',
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
      
      user = await newUser.save();
      console.log('New test user created with premium and education privileges');
    }
    
    // Display user details
    console.log('\nTest user details:');
    console.log(`ID: ${user._id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: test123 (will be hashed in the database)`);
    console.log(`Name: ${user.name}`);
    console.log(`Subscription: ${user.subscription.status}`);
    console.log(`Education Status: ${user.education.verificationStatus}`);
    console.log(`Premium Until: ${user.subscription.currentPeriodEnd}`);
    console.log('\nYou can now log in with test@gmail.com and test123');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
    return user;
  } catch (error) {
    console.error('Error creating test user:', error);
    
    // Close the connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
    
    // Exit with error
    process.exit(1);
  }
}

// Run the function
createTestUser(); 