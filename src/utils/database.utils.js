const mongoose = require('mongoose');
const Question = require('../models/question.model');
const seedQuestions = require('./seed-questions.json');

// Seed database with initial questions
exports.seedQuestions = async () => {
  try {
    // Check if questions already exist
    const count = await Question.countDocuments();
    
    if (count === 0) {
      console.log('Seeding database with initial questions...');
      
      // Insert seed questions
      await Question.insertMany(seedQuestions);
      
      console.log(`Successfully seeded database with ${seedQuestions.length} questions`);
    } else {
      console.log(`Database already has ${count} questions, skipping seed operation`);
    }
  } catch (error) {
    console.error('Error seeding database with questions:', error);
    throw error;
  }
};
