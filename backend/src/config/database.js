/**
 * Database Configuration & Connection Pool
 * Uses mysql2/promise for async/await parameterized queries.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

function getDatabaseConfig() {
  const isSslRequired = 
    process.env.DB_SSL === 'true' || 
    process.env.DB_SSL === 'require' ||
    process.env.DB_SSL === '1';

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'enectron_db',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
    queueLimit: 0,
    timezone: '+00:00',
    charset: 'utf8mb4'
  };

  if (isSslRequired) {
    config.ssl = {
      rejectUnauthorized: false
    };
  }

  return config;
}

function getPool() {
  if (!pool) {
    const config = getDatabaseConfig();
    pool = mysql.createPool(config);
  }
  return pool;
}

/**
 * Test database connectivity and auto-initialize the enquiries table.
 */
async function initDatabase() {
  const dbPool = getPool();
  try {
    const connection = await dbPool.getConnection();
    console.log(`[Database] Connected successfully to MySQL (${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'enectron_db'})`);

    // Ensure enquiries table exists
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS enquiries (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        mobile_number VARCHAR(30) NOT NULL,
        email VARCHAR(191) NOT NULL,
        company_name VARCHAR(150) DEFAULT NULL,
        application_use_case VARCHAR(150) DEFAULT NULL,
        requirement TEXT DEFAULT NULL,
        email_status ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
        email_error TEXT DEFAULT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        user_agent VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_mobile_number (mobile_number),
        INDEX idx_created_at (created_at),
        INDEX idx_email_status (email_status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.query(createTableQuery);
    connection.release();
    console.log('[Database] Enquiries table verified / initialized.');
    return true;
  } catch (error) {
    console.error('[Database Error] Failed to connect to MySQL:', error.message);
    console.error('[Database Hint] Check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME and DB_PORT in your .env file.');
    return false;
  }
}

module.exports = {
  getPool,
  initDatabase,
  getDatabaseConfig
};
