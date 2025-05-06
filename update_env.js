/**
 * Script to update the .env file with required JWT settings
 * Run with: node update_env.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Path to .env file
const envPath = path.join(process.cwd(), '.env');

// Generate a random JWT secret
const generateJwtSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Update the .env file
const updateEnvFile = () => {
  try {
    console.log('Reading .env file...');
    
    // Check if .env file exists
    if (!fs.existsSync(envPath)) {
      console.log('.env file not found. Creating a new one...');
      fs.writeFileSync(envPath, '');
    }
    
    // Read existing .env file
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check if JWT_SECRET already exists
    if (envContent.includes('JWT_SECRET=')) {
      console.log('JWT_SECRET already exists in .env file');
    } else {
      // Generate a new JWT secret
      const jwtSecret = generateJwtSecret();
      
      // Add JWT_SECRET to .env file
      envContent += `\n# JWT Configuration\nJWT_SECRET=${jwtSecret}\n`;
      console.log('Added JWT_SECRET to .env file');
    }
    
    // Check if JWT_EXPIRY already exists
    if (envContent.includes('JWT_EXPIRY=')) {
      console.log('JWT_EXPIRY already exists in .env file');
    } else {
      // Add JWT_EXPIRY to .env file with default value of 30 days
      envContent += `JWT_EXPIRY=30d\n`;
      console.log('Added JWT_EXPIRY to .env file');
    }
    
    // Write updated content back to .env file
    fs.writeFileSync(envPath, envContent);
    
    console.log('Successfully updated .env file');
    console.log('You can now restart your server and try logging in again');
  } catch (error) {
    console.error('Error updating .env file:', error);
    process.exit(1);
  }
};

// Run the function
updateEnvFile(); 