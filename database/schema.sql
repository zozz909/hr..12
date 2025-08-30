-- HR Management System Database Schema
-- MySQL Database Schema for Multi-Institution HR Application

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS document_files;
DROP TABLE IF EXISTS payroll_entries;
DROP TABLE IF EXISTS payroll_runs;
DROP TABLE IF EXISTS advances;
DROP TABLE IF EXISTS compensations;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS employee_documents;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS institution_documents;
DROP TABLE IF EXISTS institutions;
DROP TABLE IF EXISTS forms;

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS hr_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hr_system;

-- Institutions table
CREATE TABLE institutions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100),
    license_expiry DATE,
    cr_number VARCHAR(100) NOT NULL,
    cr_issue_date DATE,
    cr_expiry_date DATE NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_license_expiry (license_expiry),
    INDEX idx_cr_expiry (cr_expiry_date),
    INDEX idx_status (status)
);

-- Institution documents table
CREATE TABLE institution_documents (
    id VARCHAR(50) PRIMARY KEY,
    institution_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_url VARCHAR(500),
    document_type ENUM('license', 'commercial_record', 'tax_certificate', 'other') DEFAULT 'other',
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
    INDEX idx_institution_docs (institution_id),
    INDEX idx_doc_type (document_type)
);

-- Subscriptions table (for government platforms)
CREATE TABLE subscriptions (
    id VARCHAR(50) PRIMARY KEY,
    institution_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(100),
    expiry_date DATE NOT NULL,
    status ENUM('active', 'expired', 'expiring_soon') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
    INDEX idx_subscription_expiry (expiry_date),
    INDEX idx_subscription_status (status)
);

-- Employees table
CREATE TABLE employees (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    photo_url VARCHAR(500),
    mobile VARCHAR(20),
    iqama_number VARCHAR(20) UNIQUE,
    iqama_expiry DATE,
    insurance_expiry DATE,
    work_permit_expiry DATE,
    health_cert_expiry DATE,
    contract_expiry DATE,
    institution_id VARCHAR(50) NULL, -- NULL for unsponsored employees
    salary DECIMAL(10,2) DEFAULT 0.00,
    file_number VARCHAR(50),
    status ENUM('active', 'archived') DEFAULT 'active',
    unsponsored_reason ENUM('transferred', 'new', 'temporary_hold') NULL,
    last_status_update TIMESTAMP NULL,
    archive_reason ENUM('terminated', 'final_exit') NULL,
    archive_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL,
    INDEX idx_employee_institution (institution_id),
    INDEX idx_employee_status (status),
    INDEX idx_iqama_expiry (iqama_expiry),
    INDEX idx_insurance_expiry (insurance_expiry),
    INDEX idx_work_permit_expiry (work_permit_expiry),
    INDEX idx_health_cert_expiry (health_cert_expiry),
    INDEX idx_contract_expiry (contract_expiry),
    INDEX idx_unsponsored (institution_id, status) -- For finding unsponsored employees
);

-- Employee documents table (for additional document files)
CREATE TABLE employee_documents (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    document_type ENUM('iqama', 'passport', 'contract', 'health_certificate', 'insurance', 'work_permit', 'other') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_url VARCHAR(500),
    expiry_date DATE,
    status ENUM('active', 'expired', 'expiring_soon') DEFAULT 'active',
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee_docs (employee_id),
    INDEX idx_doc_expiry (expiry_date),
    INDEX idx_doc_status (status),
    INDEX idx_doc_type (document_type)
);

-- Leave requests table
CREATE TABLE leave_requests (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    leave_type ENUM('annual', 'sick', 'unpaid', 'emergency') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by VARCHAR(50) NULL,
    approved_date TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_leave_employee (employee_id),
    INDEX idx_leave_status (status),
    INDEX idx_leave_dates (start_date, end_date)
);

-- Compensations table (deductions and rewards)
CREATE TABLE compensations (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    type ENUM('deduction', 'reward') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL,
    date DATE NOT NULL,
    created_by VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_compensation_employee (employee_id),
    INDEX idx_compensation_type (type),
    INDEX idx_compensation_date (date)
);

-- Payroll runs table
CREATE TABLE payroll_runs (
    id VARCHAR(50) PRIMARY KEY,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    run_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    institution_id VARCHAR(50) NULL, -- NULL for all institutions
    total_employees INT DEFAULT 0,
    total_gross DECIMAL(12,2) DEFAULT 0.00,
    total_deductions DECIMAL(12,2) DEFAULT 0.00,
    total_net DECIMAL(12,2) DEFAULT 0.00,
    status ENUM('completed', 'pending', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL,
    INDEX idx_payroll_month (month),
    INDEX idx_payroll_institution (institution_id),
    INDEX idx_payroll_status (status)
);

-- Payroll entries table (individual employee payroll records)
CREATE TABLE payroll_entries (
    id VARCHAR(50) PRIMARY KEY,
    payroll_run_id VARCHAR(50) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    base_salary DECIMAL(10,2) NOT NULL,
    rewards DECIMAL(10,2) DEFAULT 0.00,
    deductions DECIMAL(10,2) DEFAULT 0.00,
    advance_deduction DECIMAL(10,2) DEFAULT 0.00,
    gross_pay DECIMAL(10,2) NOT NULL,
    net_pay DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_payroll_entry_run (payroll_run_id),
    INDEX idx_payroll_entry_employee (employee_id)
);

-- Advances table
CREATE TABLE advances (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'approved', 'paid', 'rejected') DEFAULT 'pending',
    installments INT DEFAULT 1,
    paid_amount DECIMAL(10,2) DEFAULT 0.00,
    remaining_amount DECIMAL(10,2) NOT NULL,
    approved_by VARCHAR(50) NULL,
    approved_date TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_advance_employee (employee_id),
    INDEX idx_advance_status (status)
);

-- Forms table (HR forms and templates)
CREATE TABLE forms (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('hr', 'finance', 'general') DEFAULT 'general',
    form_data JSON, -- Store form structure as JSON
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_form_category (category),
    INDEX idx_form_active (is_active)
);

-- Document files table (for file upload management)
CREATE TABLE document_files (
    id VARCHAR(50) PRIMARY KEY,
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    entity_type ENUM('employee', 'institution') NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    document_type VARCHAR(100),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_document_entity (entity_type, entity_id),
    INDEX idx_document_type (document_type)
);

-- Insert some initial data
INSERT INTO institutions (id, name, cr_number, cr_expiry_date) VALUES
('inst-001', 'شركة البناة الحديثة', 'CR-2024-001', '2025-12-31'),
('inst-002', 'مؤسسة التقنية المتقدمة', 'CR-2024-002', '2025-06-30'),
('inst-003', 'شركة الخدمات الطبية', 'CR-2024-003', '2025-09-15');

INSERT INTO forms (id, title, description, category) VALUES
('form-001', 'طلب إجازة', 'نموذج طلب إجازة للموظفين', 'hr'),
('form-002', 'طلب سلفة', 'نموذج طلب سلفة مالية', 'finance'),
('form-003', 'تقرير حضور وانصراف', 'نموذج تقرير الحضور الشهري', 'hr');