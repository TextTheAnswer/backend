require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB connection string from environment variable
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is not set');
  process.exit(1);
}

console.log('Connecting to MongoDB...');

// Connect to the database
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000
})
.then(async () => {
  console.log('Connected to MongoDB successfully');
  
  try {
    // Load the Achievement model
    const Achievement = require('./src/models/achievement.model');
    
    // Check if achievements already exist
    const count = await Achievement.countDocuments();
    console.log(`Found ${count} existing achievements in the database`);
    
    if (count > 0) {
      // Option to delete existing achievements and reseed
      console.log('Deleting existing achievements...');
      await Achievement.deleteMany({});
      console.log('Existing achievements deleted successfully');
    }
    
    // Define the achievements to seed
    const achievements = [
      {
        name: 'Quiz Novice',
        description: 'Answer your first 10 questions',
        icon: 'medal-bronze',
        criteria: {
          type: 'questions_answered',
          value: 10
        },
        tier: 'bronze',
        premiumOnly: true,
        isHidden: false
      },
      {
        name: 'Quiz Enthusiast',
        description: 'Answer 100 questions',
        icon: 'medal-silver',
        criteria: {
          type: 'questions_answered',
          value: 100
        },
        tier: 'silver',
        premiumOnly: true,
        isHidden: false,
        reward: {
          type: 'xp',
          value: 500
        }
      },
      {
        name: 'Quiz Master',
        description: 'Answer 500 questions',
        icon: 'medal-gold',
        criteria: {
          type: 'questions_answered',
          value: 500
        },
        tier: 'gold',
        premiumOnly: true,
        isHidden: false,
        reward: {
          type: 'xp',
          value: 2000
        }
      },
      {
        name: 'Knowledge Seeker',
        description: 'Get 10 questions correct',
        icon: 'lightbulb-bronze',
        criteria: {
          type: 'correct_answers',
          value: 10
        },
        tier: 'bronze',
        premiumOnly: true,
        isHidden: false
      },
      {
        name: 'Knowledge Explorer',
        description: 'Get 100 questions correct',
        icon: 'lightbulb-silver',
        criteria: {
          type: 'correct_answers',
          value: 100
        },
        tier: 'silver',
        premiumOnly: true,
        isHidden: false,
        reward: {
          type: 'xp',
          value: 1000
        }
      },
      {
        name: 'Knowledge Sage',
        description: 'Get 500 questions correct',
        icon: 'lightbulb-gold',
        criteria: {
          type: 'correct_answers',
          value: 500
        },
        tier: 'gold',
        premiumOnly: true,
        isHidden: false,
        reward: {
          type: 'premium_days',
          value: 7
        }
      },
      {
        name: 'First Streak',
        description: 'Maintain a 3-day streak',
        icon: 'streak-bronze',
        criteria: {
          type: 'streak',
          value: 3
        },
        tier: 'bronze',
        premiumOnly: true,
        isHidden: false
      },
      {
        name: 'Committed Learner',
        description: 'Maintain a 7-day streak',
        icon: 'streak-silver',
        criteria: {
          type: 'streak',
          value: 7
        },
        tier: 'silver',
        premiumOnly: true,
        isHidden: false,
        reward: {
          type: 'xp',
          value: 700
        }
      },
      {
        name: 'Dedicated Scholar',
        description: 'Maintain a 30-day streak',
        icon: 'streak-gold',
        criteria: {
          type: 'streak',
          value: 30
        },
        tier: 'gold',
        premiumOnly: true,
        isHidden: false,
        reward: {
          type: 'premium_days',
          value: 3
        }
      },
      {
        name: 'Legendary Learner',
        description: 'Maintain a 100-day streak',
        icon: 'streak-platinum',
        criteria: {
          type: 'streak',
          value: 100
        },
        tier: 'platinum',
        premiumOnly: true,
        isHidden: false,
        reward: {
          type: 'premium_days',
          value: 30
        }
      },
      {
        name: 'Perfect Quiz',
        description: 'Get all questions correct in a daily quiz',
        icon: 'perfect-bronze',
        criteria: {
          type: 'perfect_quizzes',
          value: 1
        },
        tier: 'bronze',
        premiumOnly: true,
        isHidden: false
      },
      {
        name: 'Perfection Streak',
        description: 'Complete 5 perfect daily quizzes',
        icon: 'perfect-silver',
        criteria: {
          type: 'perfect_quizzes',
          value: 5
        },
        tier: 'silver',
        premiumOnly: true,
        isHidden: false,
        reward: {
          type: 'xp',
          value: 1000
        }
      },
      // Easter Egg Achievement (hidden)
      {
        name: 'Easter Egg Hunter',
        description: 'Find a hidden feature in the app',
        icon: 'easter-egg',
        criteria: {
          type: 'easter_egg',
          value: 1
        },
        tier: 'gold',
        premiumOnly: true,
        isHidden: true,
        hint: 'Look for unusual things in the app',
        reward: {
          type: 'premium_days',
          value: 1
        }
      }
    ];
    
    // Also add some non-premium achievements for testing
    const publicAchievements = [
      {
        name: 'Welcome',
        description: 'Join Text the Answer',
        icon: 'welcome',
        criteria: {
          type: 'questions_answered',
          value: 1
        },
        tier: 'bronze',
        premiumOnly: false,
        isHidden: false
      },
      {
        name: 'Getting Started',
        description: 'Complete your first quiz',
        icon: 'start',
        criteria: {
          type: 'questions_answered',
          value: 5
        },
        tier: 'bronze',
        premiumOnly: false,
        isHidden: false
      }
    ];
    
    // Combine all achievements
    const allAchievements = [...achievements, ...publicAchievements];
    
    // Insert achievements into the database
    const result = await Achievement.insertMany(allAchievements);
    console.log(`Successfully seeded ${result.length} achievements`);
    
    // List the achievements that were seeded
    console.log("Seeded achievements:");
    for (const achievement of result) {
      console.log(`- ${achievement.name} (${achievement.tier}, Premium: ${achievement.premiumOnly}, Hidden: ${achievement.isHidden})`);
    }
    
    // Now verify that the achievements can be queried
    const visibleAchievements = await Achievement.find({ isHidden: false });
    console.log(`\nVerification: Found ${visibleAchievements.length} visible achievements`);
    
  } catch (error) {
    console.error('Error seeding achievements:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log('Database connection closed');
  }
})
.catch(error => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
}); 