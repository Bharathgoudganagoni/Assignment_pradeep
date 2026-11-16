/**
 * Enquiry Controller
 * Handles enquiry validation, database persistence, and email triggering.
 */

const validator = require('validator');
const { getPool } = require('../config/database');
const { sendEnquiryEmail } = require('../services/emailService');

/**
 * Server-side input validation and sanitization
 */
function validateEnquiryPayload(body) {
  const errors = [];

  // Normalize field names (support both snake_case and camelCase from frontend)
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
    // Strip country code and spaces to verify digit count
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

  // Length boundaries on optional fields
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
 * Creates a new enquiry, persists to MySQL, and triggers SMTP email.
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

    const pool = getPool();
    const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim().slice(0, 45);
    const userAgent = (req.headers['user-agent'] || '').slice(0, 255);

    // 1. Save enquiry to MySQL database FIRST (parameterized query)
    const insertQuery = `
      INSERT INTO enquiries (
        name, 
        mobile_number, 
        email, 
        company_name, 
        application_use_case, 
        requirement, 
        email_status, 
        ip_address, 
        user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `;

    const [result] = await pool.execute(insertQuery, [
      sanitized.name,
      sanitized.mobileNumber,
      sanitized.email,
      sanitized.companyName,
      sanitized.applicationUseCase,
      sanitized.requirement,
      ipAddress,
      userAgent
    ]);

    const enquiryId = result.insertId;
    console.log(`[Enquiry] Successfully saved enquiry #${enquiryId} to MySQL for ${sanitized.email}`);

    // Build saved enquiry object
    const savedEnquiry = {
      id: enquiryId,
      name: sanitized.name,
      mobile_number: sanitized.mobileNumber,
      email: sanitized.email,
      company_name: sanitized.companyName,
      application_use_case: sanitized.applicationUseCase,
      requirement: sanitized.requirement,
      created_at: new Date()
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
      console.error(`[Enquiry Error] Email delivery threw exception for enquiry #${enquiryId}:`, err);
    }

    // 3. Update email status in database
    try {
      await pool.execute(
        `UPDATE enquiries SET email_status = ?, email_error = ? WHERE id = ?`,
        [emailStatus, emailErrorMsg, enquiryId]
      );
    } catch (dbUpdateError) {
      console.warn(`[Enquiry Warning] Could not update email_status for enquiry #${enquiryId}:`, dbUpdateError.message);
    }

    // 4. Return success response to frontend
    // The enquiry was saved in the database, so the submission is successful
    return res.status(201).json({
      success: true,
      message: 'Thank you! Your enquiry has been received and saved successfully.',
      data: {
        enquiryId,
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
 * Re-attempts email notification for a saved enquiry whose email delivery previously failed.
 */
async function retryEnquiryEmail(req, res, next) {
  try {
    const enquiryId = parseInt(req.params.id, 10);
    if (isNaN(enquiryId)) {
      return res.status(400).json({ success: false, message: 'Invalid enquiry ID.' });
    }

    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, name, mobile_number, email, company_name, application_use_case, requirement, email_status FROM enquiries WHERE id = ?',
      [enquiryId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    const enquiry = rows[0];
    const emailResult = await sendEnquiryEmail(enquiry);

    const newStatus = emailResult.success ? 'SENT' : 'FAILED';
    const errorMsg = emailResult.success ? null : emailResult.error;

    await pool.execute(
      'UPDATE enquiries SET email_status = ?, email_error = ? WHERE id = ?',
      [newStatus, errorMsg, enquiryId]
    );

    return res.json({
      success: emailResult.success,
      message: emailResult.success ? 'Email retry sent successfully.' : 'Email retry failed.',
      status: newStatus,
      error: errorMsg
    });

  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/health
 * System health check for Render, uptime monitors, and monitoring dashboards.
 */
async function getHealth(req, res) {
  let dbConnected = false;
  let dbError = null;

  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT 1 AS alive');
    dbConnected = rows && rows[0] && rows[0].alive === 1;
  } catch (err) {
    dbConnected = false;
    dbError = err.message;
  }

  const isHealthy = dbConnected;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'ENECTRON Enquiry Management API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      connected: dbConnected,
      ...(dbError && { error: dbError })
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
