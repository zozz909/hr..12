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
DROP TABLE IF EXISTS security_settings;
DROP TABLE IF EXISTS users;

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS hr_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hr_system;

-- Users table (System users for authentication and authorization)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'hr_manager', 'employee', 'viewer') NOT NULL DEFAULT 'employee',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    permissions JSON, -- Store permissions as JSON array
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    last_login TIMESTAMP NULL,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    password_changed_at TIMESTAMP NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255) NULL,
    reset_password_token VARCHAR(255) NULL,
    reset_password_expires TIMESTAMP NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NULL,
    updated_by VARCHAR(50) NULL,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role),
    INDEX idx_user_status (status),
    INDEX idx_user_locked (locked_until),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Security Settings table
CREATE TABLE security_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSON NOT NULL,
    description TEXT,
    category ENUM('authentication', 'session', 'password', 'audit', 'backup', 'encryption') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    INDEX idx_setting_category (category),
    INDEX idx_setting_active (is_active),
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

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

-- Insert initial users
INSERT INTO users (id, name, email, password, role, status, permissions, email_verified) VALUES
('user-001', 'أحمد محمد', 'admin@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active',
 JSON_ARRAY('view_employees', 'edit_employees', 'delete_employees', 'view_payroll', 'edit_payroll', 'calculate_payroll', 'view_reports', 'generate_reports', 'export_reports', 'manage_users', 'system_settings', 'view_advances', 'approve_advances', 'manage_compensations', 'manage_leaves', 'approve_leaves'), TRUE),
('user-002', 'فاطمة علي', 'hr@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'hr_manager', 'active',
 JSON_ARRAY('view_employees', 'edit_employees', 'view_payroll', 'edit_payroll', 'calculate_payroll', 'view_reports', 'generate_reports', 'export_reports', 'view_advances', 'approve_advances', 'manage_compensations', 'manage_leaves', 'approve_leaves'), TRUE),
('user-003', 'محمد سالم', 'employee@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employee', 'active',
 JSON_ARRAY('view_employees', 'view_reports'), TRUE);

-- Insert initial security settings
INSERT INTO security_settings (setting_key, setting_value, description, category) VALUES
('two_factor_auth', JSON_OBJECT('enabled', FALSE), 'إعدادات المصادقة الثنائية', 'authentication'),
('session_timeout', JSON_OBJECT('enabled', TRUE, 'minutes', 30), 'إعدادات انتهاء الجلسة', 'session'),
('password_policy', JSON_OBJECT('enabled', TRUE, 'min_length', 8, 'require_special_chars', TRUE, 'require_numbers', TRUE, 'require_uppercase', TRUE, 'require_lowercase', TRUE), 'سياسة كلمات المرور', 'password'),
('login_attempts', JSON_OBJECT('max_attempts', 5, 'lockout_duration_minutes', 15), 'إعدادات محاولات تسجيل الدخول', 'authentication'),
('audit_logging', JSON_OBJECT('enabled', TRUE, 'retention_days', 90), 'إعدادات سجل التدقيق', 'audit'),
('ip_whitelist', JSON_OBJECT('enabled', FALSE, 'allowed_ips', JSON_ARRAY('192.168.1.0/24', '10.0.0.0/8')), 'قائمة عناوين IP المسموحة', 'authentication'),
('backup_settings', JSON_OBJECT('frequency', 'daily', 'retention_days', 30, 'auto_backup', TRUE), 'إعدادات النسخ الاحتياطي', 'backup'),
('encryption_settings', JSON_OBJECT('enabled', TRUE, 'algorithm', 'AES-256', 'key_rotation_days', 90), 'إعدادات التشفير', 'encryption');