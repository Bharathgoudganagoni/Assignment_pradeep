-- ==============================================================================
-- ENECTRON FULL-STACK ENQUIRY MANAGEMENT SYSTEM - DATABASE SCHEMA
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+, and Cloud MySQL
-- ==============================================================================

-- Create Database (if not existing)
CREATE DATABASE IF NOT EXISTS enectron_db 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE enectron_db;

-- Enquiries Table
CREATE TABLE IF NOT EXISTS enquiries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  mobile_number VARCHAR(30) NOT NULL,
  email VARCHAR(191) NOT NULL,
  company_name VARCHAR(150) DEFAULT NULL,
  application_use_case VARCHAR(150) DEFAULT NULL,
  requirement TEXT DEFAULT NULL,
  email_status ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
  email_error TEXT DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Performance Indexes
  INDEX idx_email (email),
  INDEX idx_mobile_number (mobile_number),
  INDEX idx_created_at (created_at),
  INDEX idx_email_status (email_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
