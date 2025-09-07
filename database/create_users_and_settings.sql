-- إنشاء قاعدة البيانات
CREATE DATABASE IF NOT EXISTS hr_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hr_system;

-- إنشاء جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'hr_manager', 'employee', 'viewer') NOT NULL DEFAULT 'employee',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    permissions JSON,
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
    INDEX idx_user_locked (locked_until)
);

-- إنشاء جدول إعدادات الأمان
CREATE TABLE IF NOT EXISTS security_settings (
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
    INDEX idx_setting_active (is_active)
);

-- إدراج المستخدمين الأوليين
INSERT IGNORE INTO users (id, name, email, password, role, status, permissions, email_verified) VALUES
('user-001', 'أحمد محمد', 'admin@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active', 
 JSON_ARRAY('view_employees', 'edit_employees', 'delete_employees', 'view_payroll', 'edit_payroll', 'calculate_payroll', 'view_reports', 'generate_reports', 'export_reports', 'manage_users', 'system_settings', 'view_advances', 'approve_advances', 'manage_compensations', 'manage_leaves', 'approve_leaves'), TRUE),
('user-002', 'فاطمة علي', 'hr@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'hr_manager', 'active',
 JSON_ARRAY('view_employees', 'edit_employees', 'view_payroll', 'edit_payroll', 'calculate_payroll', 'view_reports', 'generate_reports', 'export_reports', 'view_advances', 'approve_advances', 'manage_compensations', 'manage_leaves', 'approve_leaves'), TRUE),
('user-003', 'محمد سالم', 'employee@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employee', 'active',
 JSON_ARRAY('view_employees', 'view_reports'), TRUE);

-- إدراج إعدادات الأمان الأولية
INSERT IGNORE INTO security_settings (setting_key, setting_value, description, category) VALUES
('two_factor_auth', JSON_OBJECT('enabled', FALSE), 'إعدادات المصادقة الثنائية', 'authentication'),
('session_timeout', JSON_OBJECT('enabled', TRUE, 'minutes', 30), 'إعدادات انتهاء الجلسة', 'session'),
('password_policy', JSON_OBJECT('enabled', TRUE, 'min_length', 8, 'require_special_chars', TRUE, 'require_numbers', TRUE, 'require_uppercase', TRUE, 'require_lowercase', TRUE), 'سياسة كلمات المرور', 'password'),
('login_attempts', JSON_OBJECT('max_attempts', 5, 'lockout_duration_minutes', 15), 'إعدادات محاولات تسجيل الدخول', 'authentication'),
('audit_logging', JSON_OBJECT('enabled', TRUE, 'retention_days', 90), 'إعدادات سجل التدقيق', 'audit'),
('ip_whitelist', JSON_OBJECT('enabled', FALSE, 'allowed_ips', JSON_ARRAY('192.168.1.0/24', '10.0.0.0/8')), 'قائمة عناوين IP المسموحة', 'authentication'),
('backup_settings', JSON_OBJECT('frequency', 'daily', 'retention_days', 30, 'auto_backup', TRUE), 'إعدادات النسخ الاحتياطي', 'backup'),
('encryption_settings', JSON_OBJECT('enabled', TRUE, 'algorithm', 'AES-256', 'key_rotation_days', 90), 'إعدادات التشفير', 'encryption');

-- إضافة المفاتيح الخارجية بعد إنشاء الجداول
ALTER TABLE users ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE security_settings ADD CONSTRAINT fk_security_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

-- عرض النتائج
SELECT 'إحصائيات المستخدمين:' as info;
SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
    SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users,
    SUM(CASE WHEN role = 'hr_manager' THEN 1 ELSE 0 END) as hr_managers
FROM users;

SELECT 'إحصائيات إعدادات الأمان:' as info;
SELECT 
    COUNT(*) as total_settings,
    SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_settings
FROM security_settings;

SELECT 'تم إعداد نظام المستخدمين وإعدادات الأمان بنجاح!' as result;
