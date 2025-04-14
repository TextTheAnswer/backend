const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // Timeout for server selection (increased from default)
      socketTimeoutMS: 45000, // Timeout for socket operations
      connectTimeoutMS: 30000, // Timeout for initial connection
      maxPoolSize: 10, // Maximum number of connections in the connection pool
      minPoolSize: 5, // Minimum number of connections in the connection pool
      retryWrites: true, // Retry write operations if they fail
      writeConcern: { w: 'majority' } // Write operations will wait for acknowledgment from a majority of replica set members
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
