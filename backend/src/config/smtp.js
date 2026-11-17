/**
 * Nodemailer SMTP Configuration
 * Configures authenticated SMTP transport using environment variables.
 * Automatically resolves IPv4 preference and Gmail-specific transport settings.
 */

const dns = require('node:dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first'); // Force IPv4 to prevent IPv6 connection timeouts on cloud hosts like Render
}

const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config();

let transporter = null;

function getSmtpConfig() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  const isGmail = host === 'smtp.gmail.com' || (user && user.endsWith('@gmail.com'));

  // If using Gmail, using Nodemailer's native 'gmail' service avoids port/security conflicts
  if (isGmail) {
    return {
      service: 'gmail',
      auth: {
        user,
        pass
      },
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      connectionTimeout: 15000, // 15s timeout
      greetingTimeout: 15000,
      socketTimeout: 20000
    };
  }

  // Generic custom SMTP
  let isSecure = port === 465;
  if (process.env.SMTP_SECURE !== undefined) {
    isSecure = process.env.SMTP_SECURE === 'true';
  }

  return {
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
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
    console.log(`[SMTP] Connected successfully to email service as ${process.env.SMTP_USER}`);
    return true;
  } catch (error) {
    console.error('[SMTP Error] Failed to verify SMTP connection:', error.message);
    console.error('[SMTP Hint] Ensure you are using a 16-character Google App Password (not your normal Gmail password).');
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
