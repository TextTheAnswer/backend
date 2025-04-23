// MongoDB script to insert a demo user with premium and education privileges
// Run with: mongo insert_demo_user.mongo.js

// Connect to the database - replace with your actual database name
db = db.getSiblingDB('texttheanswer');

// Generate a hashed password for 'test123'
// Note: In a real script, you should use bcrypt. This is a simplified version.
// The hash below is a placeholder and not a real bcrypt hash.
// In production, you would need to generate this properly.
const hashedPassword = "$2b$10$AZIGJgHlGEZ1BDB4GYFWgu5n4qnVwYw97SYvIS15kDDtZnXI7VvPK"; // placeholder for 'test123'

// Set an end date 10 years from now
const currentDate = new Date();
const endDate = new Date();
endDate.setFullYear(currentDate.getFullYear() + 10);

// Check if user already exists
const existingUser = db.users.findOne({ email: "test@gmail.com" });

if (existingUser) {
  // Update the existing user
  print("User test@gmail.com already exists, updating to premium...");
  
  db.users.updateOne(
    { email: "test@gmail.com" },
    {
      $set: {
        name: "Test Demo User",
        "subscription.status": "premium",
        "subscription.stripeCustomerId": "test_demo_customer",
        "subscription.stripeSubscriptionId": "test_demo_subscription",
        "subscription.currentPeriodStart": currentDate,
        "subscription.currentPeriodEnd": endDate,
        "subscription.cancelAtPeriodEnd": false,
        "subscription.freeTrialUsed": false,
        "education.isStudent": true,
        "education.studentEmail": "test@university.edu",
        "education.yearOfStudy": 3,
        "education.verificationStatus": "verified",
        "stats.streak": 10,
        "stats.lastPlayed": currentDate,
        "stats.totalCorrect": 85,
        "stats.totalAnswered": 100
      }
    }
  );
  
  print("User updated with premium and education privileges");
} else {
  // Insert a new user
  print("Creating new demo user test@gmail.com...");
  
  db.users.insertOne({
    email: "test@gmail.com",
    password: hashedPassword,
    name: "Test Demo User",
    profile: {
      bio: "This is a demo user with full premium access",
      location: "Demo City",
      preferences: {
        favoriteCategories: ["all", "science", "math", "history"],
        notificationSettings: { email: true, push: true },
        displayTheme: "light"
      }
    },
    subscription: {
      status: "premium",
      stripeCustomerId: "test_demo_customer",
      stripeSubscriptionId: "test_demo_subscription",
      currentPeriodStart: currentDate,
      currentPeriodEnd: endDate,
      cancelAtPeriodEnd: false,
      freeTrialUsed: false
    },
    education: {
      isStudent: true,
      studentEmail: "test@university.edu",
      yearOfStudy: 3,
      verificationStatus: "verified"
    },
    stats: {
      streak: 10,
      lastPlayed: currentDate,
      totalCorrect: 85,
      totalAnswered: 100
    },
    dailyQuiz: {
      questionsAnswered: 0,
      correctAnswers: 0,
      score: 0
    },
    createdAt: currentDate,
    updatedAt: currentDate
  });
  
  print("New user created with premium and education privileges");
}

// Show the user details
const userDetails = db.users.findOne({ email: "test@gmail.com" });
print("Demo user details:");
printjson({
  id: userDetails._id,
  email: userDetails.email,
  name: userDetails.name,
  subscription: userDetails.subscription.status,
  education: userDetails.education.verificationStatus,
  endDate: userDetails.subscription.currentPeriodEnd
});

print("Done."); 