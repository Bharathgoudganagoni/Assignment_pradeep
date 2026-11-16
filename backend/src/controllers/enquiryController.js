/**
 * Enquiry Controller
 * Handles server-side input validation, sanitization, and direct SMTP email delivery.
 * No database required.
 */

const validator = require('validator');
const { sendEnquiryEmail } = require('../services/emailService');

/**
 * Server-side input validation and sanitization
 */
function validateEnquiryPayload(body) {
  const errors = [];

  const userName = (body.user_name || body.name || '').trim();
  const mobileNumber = (body.mobile_number || body.phone || '').trim();
  const userEmail = (body.user_email || body.email || '').trim();
  const companyName = (body.company_name || body.company || '').trim();
  const application = (body.application || body.application_use_case || body.use_case || '').trim();
  const requirement = (body.requirement || body.message || '').trim();

  // 1. Validate User Name
  if (!userName) {
    errors.push('Full name is required.');
  } else if (userName.length < 2 || userName.length > 150) {
    errors.push('Full name must be between 2 and 150 characters.');
  }

  // 2. Validate Mobile Number
  if (!mobileNumber) {
    errors.push('Mobile number is required.');
  } else {
    const digitsOnly = mobileNumber.replace(/\D/g, '');
    if (digitsOnly.length < 8 || digitsOnly.length > 15) {
      errors.push('Please provide a valid mobile number with at least 8 to 15 digits.');
    }
  }

  // 3. Validate Email Address
  if (!userEmail) {
    errors.push('Email address is required.');
  } else if (!validator.isEmail(userEmail)) {
    errors.push('Please provide a valid email address.');
  } else if (userEmail.length > 191) {
    errors.push('Email address cannot exceed 191 characters.');
  }

  // 4. Validate Optional Field Limits
  if (companyName && companyName.length > 150) {
    errors.push('Company name cannot exceed 150 characters.');
  }

  if (application && application.length > 150) {
    errors.push('Application / Use Case cannot exceed 150 characters.');
  }

  if (requirement && requirement.length > 5000) {
    errors.push('Requirement text cannot exceed 5000 characters.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      user_name: userName,
      mobile_number: mobileNumber,
      user_email: userEmail.toLowerCase(),
      company_name: companyName || null,
      application: application || null,
      requirement: requirement || null
    }
  };
}

/**
 * Duplicate submission tracker in memory (cooldown: 5 seconds per email/phone combination)
 */
const recentSubmissions = new Map();
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of recentSubmissions.entries()) {
    if (now - timestamp > 60000) { // Clean up after 1 minute
      recentSubmissions.delete(key);
    }
  }
}, 30000);
if (cleanupInterval.unref) cleanupInterval.unref();

/**
 * POST /api/enquiry
 * Accepts form data, validates, and dispatches email directly via Gmail SMTP.
 */
async function createEnquiry(req, res, next) {
  try {
    const { isValid, errors, sanitized } = validateEnquiryPayload(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please correct the highlighted errors.',
        errors
      });
    }

    // Duplicate submission check within 5 seconds
    const submissionKey = `${sanitized.user_email}:${sanitized.mobile_number}`;
    const lastSubmission = recentSubmissions.get(submissionKey);
    const now = Date.now();
    if (lastSubmission && now - lastSubmission < 5000) {
      return res.status(429).json({
        success: false,
        message: 'A submission is already processing. Please wait a moment.'
      });
    }
    recentSubmissions.set(submissionKey, now);

    console.log(`[Enquiry] Processing enquiry from: ${sanitized.user_name} (${sanitized.user_email})`);

    // Dispatch email via Nodemailer
    const emailResult = await sendEnquiryEmail(sanitized);

    if (!emailResult.success) {
      console.error('[Enquiry Error] Failed to send email via SMTP:', emailResult.error);
      return res.status(500).json({
        success: false,
        message: 'Unable to deliver enquiry email via SMTP. Please try again later or contact us directly.'
      });
    }

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Thank you! Your enquiry has been received and our team will get in touch with you shortly.',
      data: {
        customerName: sanitized.user_name,
        email: sanitized.user_email,
        delivered: true
      }
    });

  } catch (error) {
    console.error('[Enquiry Controller Unhandled Error]', error);
    next(error);
  }
}

/**
 * GET /api/health
 */
async function getHealth(req, res) {
  const isSmtpConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
  const receiverEmail = process.env.RECEIVER_EMAIL || process.env.OWNER_EMAIL || 'Not configured';

  res.status(200).json({
    status: 'healthy',
    service: 'ENECTRON Enquiry Management API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    smtp: {
      configured: isSmtpConfigured,
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      receiverConfigured: receiverEmail !== 'Not configured'
    }
  });
}

module.exports = {
  createEnquiry,
  getHealth,
  validateEnquiryPayload
};
