/**
 * Direct MongoDB insertion script for adding a test user
 * Run with: node add_user_direct.js
 * 
 * This script uses the MongoDB driver directly rather than Mongoose
 * which may help with connection issues
 */

// Include MongoDB driver
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
require('dotenv').config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/texttheanswer';
const DB_NAME = MONGODB_URI.split('/').pop().split('?')[0]; // Extract database name from URI

// Connection options
const options = {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 30000,
  useNewUrlParser: true,
  useUnifiedTopology: true
};

console.log('Starting direct MongoDB insertion script');
console.log(`Connection URI: ${MONGODB_URI}`);
console.log(`Database: ${DB_NAME}`);

async function createTestUser() {
  let client;
  
  try {
    // Connect directly to MongoDB
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI, options);
    await client.connect();
    console.log('Connected successfully to MongoDB');
    
    // Get database
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // User details
    const email = 'test@gmail.com';
    const password = 'test123';
    const name = 'Test Demo User';
    
    // Check if user exists
    console.log('Checking if user already exists...');
    const existingUser = await usersCollection.findOne({ email });
    
    // Set end date for premium (10 years)
    const now = new Date();
    const endDate = new Date();
    endDate.setFullYear(now.getFullYear() + 10);
    
    let result;
    
    if (existingUser) {
      console.log('User already exists, updating to premium...');
      
      // Update existing user
      result = await usersCollection.updateOne(
        { email },
        { 
          $set: {
            name,
            "subscription.status": "premium",
            "subscription.stripeCustomerId": "test_demo_customer",
            "subscription.stripeSubscriptionId": "test_demo_subscription",
            "subscription.currentPeriodStart": now,
            "subscription.currentPeriodEnd": endDate,
            "subscription.cancelAtPeriodEnd": false,
            "subscription.freeTrialUsed": false,
            "education.isStudent": true,
            "education.studentEmail": "test@university.edu",
            "education.yearOfStudy": 3,
            "education.verificationStatus": "verified",
            "stats.streak": 10,
            "stats.lastPlayed": now,
            "stats.totalCorrect": 85,
            "stats.totalAnswered": 100,
            updatedAt: now
          }
        }
      );
      
      console.log(`User updated: ${result.modifiedCount} document modified`);
    } else {
      console.log('Creating new test user...');
      
      // Hash password with bcrypt
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create user document
      const userDoc = {
        email,
        password: hashedPassword,
        name,
        profile: {
          bio: 'This is a test user with premium access',
          location: 'Test City',
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
          currentPeriodStart: now,
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
          lastPlayed: now,
          totalCorrect: 85,
          totalAnswered: 100
        },
        dailyQuiz: {
          questionsAnswered: 0,
          correctAnswers: 0,
          score: 0
        },
        createdAt: now,
        updatedAt: now
      };
      
      // Insert the user
      result = await usersCollection.insertOne(userDoc);
      console.log(`New user created with ID: ${result.insertedId}`);
    }
    
    // Get the updated/created user
    const user = await usersCollection.findOne({ email });
    
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
    
    return true;
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return false;
  } finally {
    // Close the connection in the finally block to ensure it always happens
    if (client) {
      console.log('Closing MongoDB connection...');
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the script
createTestUser()
  .then(success => {
    if (success) {
      console.log('Script completed successfully');
    } else {
      console.log('Script failed');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  }); 