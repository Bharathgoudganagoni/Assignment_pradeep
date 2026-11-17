/**
 * Backend Server Entry Point
 * Verifies SMTP connectivity and starts Express HTTP server serving both static frontend and API.
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables (from backend/.env first, then root .env if present)
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = require('./src/app');
const { verifySmtp } = require('./src/config/smtp');

const PORT = parseInt(process.env.PORT, 10) || 5000;
let server = null;

async function startServer() {
  console.log('========================================================');
  console.log('🚀 Starting ENECTRON Enquiry Management Backend...');
  console.log(`[Environment] NODE_ENV=${process.env.NODE_ENV || 'development'}`);
  console.log(`[Email] Receiver configured: ${Boolean(process.env.RECEIVER_EMAIL || process.env.OWNER_EMAIL)}`);
  console.log('========================================================');

  // 1. Verify email connectivity
  if (process.env.GOOGLE_SCRIPT_URL) {
    console.log('✅ [Email Mode] Google Apps Script HTTPS Webhook (Port 443 - Render Free compatible)');
    console.log('   Endpoint URL configured: YES');
  } else {
    console.log('ℹ️ [Email Mode] Nodemailer SMTP (Ports 587/465)');
    await verifySmtp();
  }

  // 2. Start Express HTTP Server
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
    console.log(`   Website frontend:   http://localhost:${PORT}`);
    console.log(`   Health check:       http://localhost:${PORT}/api/health`);
    console.log(`   Enquiry endpoint:   POST http://localhost:${PORT}/api/enquiry`);
    console.log('========================================================');
  });
}

// Graceful shutdown handling
function gracefulShutdown(signal) {
  console.log(`\n[Shutdown] Received ${signal}. Closing HTTP server...`);
  if (server) {
    server.close(() => {
      console.log('[Shutdown] HTTP server closed gracefully.');
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
