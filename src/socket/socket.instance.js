/**
 * Singleton Socket.IO instance that can be accessed across different modules
 * This allows us to initialize the Socket.IO server in server.js
 * and use it in other modules without circular dependencies
 */

let io;

/**
 * Initialize the Socket.IO instance
 * @param {Object} socketIoInstance - The Socket.IO server instance from server.js
 */
const initialize = (socketIoInstance) => {
  io = socketIoInstance;
};

/**
 * Get the Socket.IO instance
 * @returns {Object} The Socket.IO server instance
 */
const getIO = () => {
  return io;
};

module.exports = {
  initialize,
  getIO
}; 