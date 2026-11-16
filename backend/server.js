/**
 * Backend Server Entry Point
 * Initializes Database, verifies SMTP, and starts HTTP server.
 */

require('dotenv').config();
const app = require('./src/app');
const { initDatabase, closeDatabase } = require('./src/config/database');
const { verifySmtp } = require('./src/config/smtp');

const PORT = parseInt(process.env.PORT, 10) || 5000;

let server = null;

async function startServer() {
  console.log('========================================================');
  console.log('🚀 Starting ENECTRON Enquiry Management Backend...');
  console.log(`[Environment] NODE_ENV=${process.env.NODE_ENV || 'development'}`);
  console.log('========================================================');

  // 1. Initialize MySQL database connection & schema
  const dbOk = await initDatabase();
  if (!dbOk) {
    console.warn('[Warning] Running with unverified or offline MySQL connection. Requests needing database will fail until credentials in .env are configured.');
  }

  // 2. Verify SMTP connection
  await verifySmtp();

  // 3. Start Express HTTP Server
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is listening on http://0.0.0.0:${PORT}`);
    console.log(`   Health check endpoint: http://localhost:${PORT}/api/health`);
    console.log(`   Enquiries endpoint:    POST http://localhost:${PORT}/api/enquiries`);
    console.log('========================================================');
  });
}

// Graceful shutdown handling
function gracefulShutdown(signal) {
  console.log(`\n[Shutdown] Received ${signal}. Closing HTTP server and database pool...`);
  if (server) {
    server.close(async () => {
      console.log('[Shutdown] HTTP server closed.');
      try {
        await closeDatabase();
      } catch (err) {
        console.error('[Shutdown Error] Failed to close database connection:', err.message);
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer().catch((err) => {
  console.error('[Fatal Error] Failed to bootstrap server:', err);
  process.exit(1);
});
