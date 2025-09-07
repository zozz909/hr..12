-- Migration to add renewable document fields to institution_documents table
-- Run this to update the database schema

-- Add is_renewable and expiry_date columns to institution_documents table
ALTER TABLE institution_documents 
ADD COLUMN is_renewable BOOLEAN DEFAULT FALSE,
ADD COLUMN expiry_date DATE NULL,
ADD COLUMN status ENUM('active', 'expired', 'expiring_soon') DEFAULT 'active';

-- Add index for expiry_date for better performance
ALTER TABLE institution_documents 
ADD INDEX idx_institution_documents_expiry (expiry_date);

-- Add index for status
ALTER TABLE institution_documents 
ADD INDEX idx_institution_documents_status (status);
