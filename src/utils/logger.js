const logger = require('./logger');

/**
 * Utility for creating and managing a logger for the application
 * @module logger
 */

// Check if logger is already defined to avoid duplicate initialization
if (!global.logger) {
  // Create a simple logger that writes to console with timestamps
  global.logger = {
    /**
     * Log an info message
     * @param {...any} args - Arguments to log
     */
    info: (...args) => {
      console.log(`[${new Date().toISOString()}] [INFO]`, ...args);
    },
    
    /**
     * Log a debug message
     * @param {...any} args - Arguments to log
     */
    debug: (...args) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${new Date().toISOString()}] [DEBUG]`, ...args);
      }
    },
    
    /**
     * Log a warning message
     * @param {...any} args - Arguments to log
     */
    warn: (...args) => {
      console.warn(`[${new Date().toISOString()}] [WARN]`, ...args);
    },
    
    /**
     * Log an error message
     * @param {...any} args - Arguments to log
     */
    error: (...args) => {
      console.error(`[${new Date().toISOString()}] [ERROR]`, ...args);
    }
  };
}

module.exports = global.logger;
