/**
 * Nodemailer SMTP Configuration
 * Configures authenticated SMTP transport using environment variables.
 */

const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config();

let transporter = null;

function getSmtpConfig() {
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;

  return {
    pool: true,              // Reuse connections to send emails much faster
    maxConnections: 3,       // Up to 3 simultaneous SMTP connections
    maxMessages: 100,        // Up to 100 messages per connection
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: isSecure,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    },
    connectionTimeout: 10000, // 10s connection timeout
    greetingTimeout: 10000,   // 10s greeting timeout
    socketTimeout: 15000,     // 15s socket timeout
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  };
}

function getTransporter() {
  if (!transporter) {
    const config = getSmtpConfig();
    transporter = nodemailer.createTransport(config);
  }
  return transporter;
}

/**
 * Verify SMTP credentials and connectivity
 */
async function verifySmtp() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[SMTP Warning] SMTP_USER or SMTP_PASS not set in environment. Email delivery will be skipped until configured.');
    return false;
  }

  const mailTransporter = getTransporter();
  try {
    await mailTransporter.verify();
    console.log(`[SMTP] Connected successfully to ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587} as ${process.env.SMTP_USER}`);
    return true;
  } catch (error) {
    console.error('[SMTP Error] Failed to verify SMTP connection:', error.message);
    console.error('[SMTP Hint] For Gmail, use an App Password (16 characters) created in Google Account Security.');
    return false;
  }
}

function getFromAddress() {
  const fromEnv = process.env.SMTP_FROM;
  const userEnv = process.env.SMTP_USER;

  if (!fromEnv) {
    return `"ENECTRON Enquiries" <${userEnv}>`;
  }

  if (fromEnv.includes('<') && fromEnv.includes('>')) {
    return fromEnv;
  }

  // Handle format: "ENECTRON Enquiries" email@example.com
  const match = fromEnv.match(/^(.*?)\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/);
  if (match) {
    const displayName = match[1].trim() || 'ENECTRON Enquiries';
    const emailAddr = match[2].trim();
    return `${displayName} <${emailAddr}>`;
  }

  return fromEnv;
}

module.exports = {
  getTransporter,
  verifySmtp,
  getSmtpConfig,
  getFromAddress
};
