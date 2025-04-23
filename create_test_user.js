/**
 * Simple script to create a test user with premium and education privileges
 * Run with: node create_test_user.js
 */

// Include required modules
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/texttheanswer';

// Connection options with increased timeout
const options = {
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  family: 4 // Force IPv4
};

console.log('Connecting to MongoDB...');
console.log(`Connection string: ${MONGODB_URI}`);

// Define minimal User model based on the existing schema
const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  profile: {
    bio: String,
    location: String,
    imageUrl: String,
    imagePublicId: String,
    preferences: mongoose.Schema.Types.Mixed
  },
  subscription: {
    status: String,
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: Boolean,
    freeTrialUsed: Boolean
  },
  education: {
    isStudent: Boolean,
    studentEmail: String,
    yearOfStudy: Number,
    verificationStatus: String
  },
  stats: {
    streak: Number,
    lastPlayed: Date,
    totalCorrect: Number,
    totalAnswered: Number
  },
  dailyQuiz: {
    lastCompleted: Date,
    questionsAnswered: Number,
    correctAnswers: Number,
    score: Number
  }
}, { timestamps: true });

async function createTestUser() {
  try {
    // User credentials
    const email = 'test@gmail.com';
    const password = 'test123';
    
    // Connect to MongoDB first (await the connection)
    await mongoose.connect(MONGODB_URI, options);
    console.log('MongoDB connected successfully');
    
    // Create the User model after connection
    const User = mongoose.model('User', UserSchema);
    
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
      existingUser.name = 'Test Demo User';
      existingUser.subscription = {
        status: 'premium',
        stripeCustomerId: 'test_demo_customer',
        stripeSubscriptionId: 'test_demo_subscription',
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
      
      await existingUser.save();
      console.log('User updated with premium and education privileges');
      user = existingUser;
    } else {
      console.log('Creating new test user...');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create new user
      const newUser = new User({
        email,
        password: hashedPassword,
        name: 'Test Demo User',
        profile: {
          bio: 'This is a test user with premium access',
          location: 'Test City'
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
      
      user = await newUser.save();
      console.log('New test user created with premium and education privileges');
    }
    
    // Display user details
    console.log('\nTest user details:');
    console.log(`ID: ${user._id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: test123 (unhashed)`);
    console.log(`Name: ${user.name}`);
    console.log(`Subscription: ${user.subscription.status}`);
    console.log(`Education Status: ${user.education.verificationStatus}`);
    console.log(`Premium Until: ${user.subscription.currentPeriodEnd}`);
    console.log('\nYou can now log in with test@gmail.com and test123');
    
    // Close the connection
    console.log('Closing MongoDB connection...');
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
    return true;
  } catch (error) {
    console.error('Error:', error);
    // Try to close connection even if there was an error
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log('MongoDB connection closed after error');
      }
    } catch (closeError) {
      console.error('Error closing MongoDB connection:', closeError);
    }
    process.exit(1);
  }
}

// Run the function
createTestUser(); 