/**
 * Nodemailer SMTP Configuration
 * Configures authenticated SMTP transport using environment variables.
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

function getSmtpConfig() {
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;

  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: isSecure,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    },
    tls: {
      // Do not fail on invalid certs for self-hosted or testing SMTP
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
    console.error('[SMTP Hint] For Gmail, use an App Password (16 letters) instead of your regular password. Verify SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.');
    return false;
  }
}

module.exports = {
  getTransporter,
  verifySmtp,
  getSmtpConfig
};
