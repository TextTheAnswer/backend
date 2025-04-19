const mongoose = require('mongoose');
const Question = require('../models/question.model');
const seedQuestions = require('./seed-questions.json');

// Helper function to wait
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Seed database with initial questions with retry mechanism
exports.seedQuestions = async (maxRetries = 5, initialDelay = 2000) => {
  let retries = 0;
  let delay = initialDelay;
  
  while (retries < maxRetries) {
    try {
      // Check if database connection is ready
      if (mongoose.connection.readyState !== 1) {
        console.log('Waiting for database connection to be established...');
        await sleep(delay);
        retries++;
        delay *= 1.5; // Exponential backoff
        continue;
      }
      
      // Check if questions already exist
      const count = await Question.countDocuments().maxTimeMS(20000); // Set a max execution time
      
      if (count === 0) {
        console.log('Seeding database with initial questions...');
        
        // Process questions in smaller batches to prevent timeouts
        const batchSize = 50;
        for (let i = 0; i < seedQuestions.length; i += batchSize) {
          const batch = seedQuestions.slice(i, i + batchSize);
          await Question.insertMany(batch, { timeout: 30000 });
          console.log(`Inserted batch ${i/batchSize + 1}: ${batch.length} questions`);
        }
        
        console.log(`Successfully seeded database with ${seedQuestions.length} questions`);
        return;
      } else {
        console.log(`Database already has ${count} questions, skipping seed operation`);
        return;
      }
    } catch (error) {
      retries++;
      console.error(`Seeding attempt ${retries}/${maxRetries} failed:`, error.message);
      
      if (retries >= maxRetries) {
        console.error('Maximum retries reached. Failed to seed database with questions:', error);
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      console.log(`Retrying in ${delay/1000} seconds...`);
      await sleep(delay);
      delay *= 1.5; // Exponential backoff
    }
  }
};
