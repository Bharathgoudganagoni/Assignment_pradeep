/**
 * Database Configuration & Connection (MongoDB / Mongoose)
 */

const mongoose = require('mongoose');
require('dotenv').config();

const DEFAULT_LOCAL_URI = 'mongodb://127.0.0.1:27017/enectron_db';

function getMongoUri() {
  return process.env.MONGODB_URI || DEFAULT_LOCAL_URI;
}

/**
 * Connect to MongoDB
 */
async function initDatabase() {
  const uri = getMongoUri();
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of hanging
    });

    console.log(`[Database] Connected successfully to MongoDB (${conn.connection.host}:${conn.connection.port}/${conn.connection.name})`);
    return true;
  } catch (error) {
    console.error('[Database Error] Failed to connect to MongoDB:', error.message);
    console.error('[Database Hint] Ensure MongoDB is running locally on 127.0.0.1:27017 or provide MONGODB_URI in .env');
    return false;
  }
}

async function closeDatabase() {
  try {
    await mongoose.connection.close();
    console.log('[Database] MongoDB connection closed.');
  } catch (err) {
    console.error('[Database Error] Error closing MongoDB connection:', err.message);
  }
}

function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = {
  initDatabase,
  closeDatabase,
  isDatabaseConnected,
  getMongoUri
};
