/**
 * Enquiry Routes
 * Defines API endpoints for enquiry submission and health check.
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { createEnquiry, getHealth } = require('../controllers/enquiryController');

// Rate Limiter: 15 submissions per 15 minutes per IP
const enquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many enquiry submissions from this IP. Please wait a few minutes before trying again.'
  }
});

// Primary endpoint: POST /api/enquiry
router.post('/enquiry', enquiryLimiter, createEnquiry);

// Backwards-compatible alias: POST /api/enquiries
router.post('/enquiries', enquiryLimiter, createEnquiry);

// Health check endpoint: GET /api/health
router.get('/health', getHealth);

module.exports = router;
