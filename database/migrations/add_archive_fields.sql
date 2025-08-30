-- Migration to add new archive fields to employees table
-- Run this to update the database schema

-- First, modify the archive_reason enum to include new values
ALTER TABLE employees MODIFY COLUMN archive_reason ENUM(
    'resignation', 
    'termination', 
    'retirement', 
    'transfer', 
    'contract_end', 
    'medical_leave', 
    'disciplinary', 
    'other',
    'terminated',  -- Keep old values for backward compatibility
    'final_exit'   -- Keep old values for backward compatibility
) NULL;

-- Add archived_at column
ALTER TABLE employees ADD COLUMN archived_at TIMESTAMP NULL AFTER archive_reason;

-- Add index for archived_at
ALTER TABLE employees ADD INDEX idx_archived_at (archived_at);

-- Update existing archived employees to have archived_at timestamp if they don't have one
UPDATE employees 
SET archived_at = updated_at 
WHERE status = 'archived' AND archived_at IS NULL;
