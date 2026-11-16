/**
 * Enquiry Controller (MongoDB / Mongoose)
 * Handles enquiry validation, MongoDB persistence, and email triggering.
 */

const validator = require('validator');
const Enquiry = require('../models/Enquiry');
const { isDatabaseConnected } = require('../config/database');
const { sendEnquiryEmail } = require('../services/emailService');

/**
 * Server-side input validation and sanitization
 */
function validateEnquiryPayload(body) {
  const errors = [];

  const name = (body.name || body.user_name || '').trim();
  const mobileNumber = (body.mobile_number || body.phone || '').trim();
  const email = (body.email || body.user_email || '').trim();
  const companyName = (body.company_name || body.company || '').trim();
  const applicationUseCase = (body.application_use_case || body.application || body.use_case || '').trim();
  const requirement = (body.requirement || body.message || '').trim();

  // Validate Name
  if (!name) {
    errors.push('Full name is required.');
  } else if (name.length < 2 || name.length > 150) {
    errors.push('Full name must be between 2 and 150 characters.');
  }

  // Validate Mobile Number
  if (!mobileNumber) {
    errors.push('Mobile number is required.');
  } else {
    const digitsOnly = mobileNumber.replace(/\D/g, '');
    if (digitsOnly.length < 8 || digitsOnly.length > 15) {
      errors.push('Please provide a valid mobile number with at least 8 to 15 digits.');
    }
  }

  // Validate Email
  if (!email) {
    errors.push('Email address is required.');
  } else if (!validator.isEmail(email)) {
    errors.push('Please provide a valid email address.');
  } else if (email.length > 191) {
    errors.push('Email address cannot exceed 191 characters.');
  }

  // Length boundaries
  if (companyName && companyName.length > 150) {
    errors.push('Company name cannot exceed 150 characters.');
  }

  if (applicationUseCase && applicationUseCase.length > 150) {
    errors.push('Application / Use Case cannot exceed 150 characters.');
  }

  if (requirement && requirement.length > 5000) {
    errors.push('Requirement text cannot exceed 5000 characters.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      name,
      mobileNumber,
      email: email.toLowerCase(),
      companyName: companyName || null,
      applicationUseCase: applicationUseCase || null,
      requirement: requirement || null
    }
  };
}

/**
 * POST /api/enquiries
 * Creates enquiry in MongoDB and triggers SMTP email.
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

    const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim().slice(0, 45);
    const userAgent = (req.headers['user-agent'] || '').slice(0, 255);

    // 1. Save enquiry to MongoDB FIRST
    const enquiryDoc = await Enquiry.create({
      name: sanitized.name,
      mobile_number: sanitized.mobileNumber,
      email: sanitized.email,
      company_name: sanitized.companyName,
      application_use_case: sanitized.applicationUseCase,
      requirement: sanitized.requirement,
      email_status: 'PENDING',
      ip_address: ipAddress,
      user_agent: userAgent
    });

    console.log(`[Enquiry] Successfully saved enquiry to MongoDB: ID ${enquiryDoc._id} for ${sanitized.email}`);

    // Build saved enquiry object for email service
    const savedEnquiry = {
      id: enquiryDoc._id.toString(),
      name: enquiryDoc.name,
      mobile_number: enquiryDoc.mobile_number,
      email: enquiryDoc.email,
      company_name: enquiryDoc.company_name,
      application_use_case: enquiryDoc.application_use_case,
      requirement: enquiryDoc.requirement,
      created_at: enquiryDoc.createdAt
    };

    // 2. Trigger SMTP email delivery
    let emailStatus = 'PENDING';
    let emailErrorMsg = null;

    try {
      const emailResult = await sendEnquiryEmail(savedEnquiry);
      if (emailResult.success) {
        emailStatus = 'SENT';
      } else {
        emailStatus = 'FAILED';
        emailErrorMsg = emailResult.error || 'Email dispatch failed';
      }
    } catch (err) {
      emailStatus = 'FAILED';
      emailErrorMsg = err.message;
      console.error(`[Enquiry Error] Email delivery threw exception for enquiry ${enquiryDoc._id}:`, err);
    }

    // 3. Update email status in MongoDB
    enquiryDoc.email_status = emailStatus;
    enquiryDoc.email_error = emailErrorMsg;
    await enquiryDoc.save().catch(e => console.warn('[Enquiry Warning] Failed to update email_status:', e.message));

    // 4. Return success response
    return res.status(201).json({
      success: true,
      message: 'Thank you! Your enquiry has been received and saved successfully.',
      data: {
        enquiryId: enquiryDoc._id,
        emailStatus,
        customerName: sanitized.name
      }
    });

  } catch (error) {
    console.error('[Enquiry Controller Error]', error);
    next(error);
  }
}

/**
 * POST /api/enquiries/:id/retry-email
 * Re-attempts email notification for a saved MongoDB enquiry.
 */
async function retryEnquiryEmail(req, res, next) {
  try {
    const enquiryId = req.params.id;
    const enquiry = await Enquiry.findById(enquiryId);

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    const emailPayload = {
      id: enquiry._id.toString(),
      name: enquiry.name,
      mobile_number: enquiry.mobile_number,
      email: enquiry.email,
      company_name: enquiry.company_name,
      application_use_case: enquiry.application_use_case,
      requirement: enquiry.requirement
    };

    const emailResult = await sendEnquiryEmail(emailPayload);

    enquiry.email_status = emailResult.success ? 'SENT' : 'FAILED';
    enquiry.email_error = emailResult.success ? null : emailResult.error;
    await enquiry.save();

    return res.json({
      success: emailResult.success,
      message: emailResult.success ? 'Email retry sent successfully.' : 'Email retry failed.',
      status: enquiry.email_status,
      error: enquiry.email_error
    });

  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/health
 */
async function getHealth(req, res) {
  const dbConnected = isDatabaseConnected();

  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'healthy' : 'degraded',
    service: 'ENECTRON Enquiry Management API',
    databaseType: 'MongoDB',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      connected: dbConnected
    },
    smtp: {
      configured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
      host: process.env.SMTP_HOST || 'Not set'
    }
  });
}

module.exports = {
  createEnquiry,
  retryEnquiryEmail,
  getHealth
};
