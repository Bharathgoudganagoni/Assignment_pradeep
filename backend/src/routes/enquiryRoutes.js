/**
 * Enquiry Routes
 * Defines API endpoints for enquiries and health check.
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { createEnquiry, retryEnquiryEmail, getHealth } = require('../controllers/enquiryController');

// Rate Limiter: Limit each IP to 15 enquiry submissions per 15 minutes to prevent spam/abuse
const enquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many enquiry submissions from this IP. Please wait a few minutes before trying again.'
  }
});

// POST /api/enquiries - Submit new enquiry
router.post('/enquiries', enquiryLimiter, createEnquiry);

// POST /api/enquiries/:id/retry-email - Retry failed email notification
router.post('/enquiries/:id/retry-email', retryEnquiryEmail);

// GET /api/health - Health check endpoint
router.get('/health', getHealth);

module.exports = router;
