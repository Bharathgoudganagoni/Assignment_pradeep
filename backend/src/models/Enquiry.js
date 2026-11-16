/**
 * Enquiry Model (MongoDB / Mongoose)
 */

const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: 2,
      maxlength: 150
    },
    mobile_number: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      maxlength: 30
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true,
      maxlength: 191
    },
    company_name: {
      type: String,
      trim: true,
      default: null,
      maxlength: 150
    },
    application_use_case: {
      type: String,
      trim: true,
      default: null,
      maxlength: 150
    },
    requirement: {
      type: String,
      trim: true,
      default: null,
      maxlength: 5000
    },
    email_status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING',
      index: true
    },
    email_error: {
      type: String,
      default: null
    },
    ip_address: {
      type: String,
      default: null
    },
    user_agent: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true // Automatically creates createdAt and updatedAt
  }
);

// Indexes for query performance
enquirySchema.index({ email: 1 });
enquirySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Enquiry', enquirySchema);
