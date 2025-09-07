-- إنشاء جدول إعدادات الأمان
CREATE TABLE IF NOT EXISTS security_settings (
    id VARCHAR(50) PRIMARY KEY,
    ip_whitelist_enabled BOOLEAN DEFAULT FALSE,
    max_login_attempts INT DEFAULT 5,
    session_timeout_minutes INT DEFAULT 60,
    require_strong_passwords BOOLEAN DEFAULT TRUE,
    password_min_length INT DEFAULT 8,
    password_require_uppercase BOOLEAN DEFAULT TRUE,
    password_require_lowercase BOOLEAN DEFAULT TRUE,
    password_require_numbers BOOLEAN DEFAULT TRUE,
    password_require_symbols BOOLEAN DEFAULT FALSE,
    password_expiry_days INT DEFAULT 90,
    lockout_duration_minutes INT DEFAULT 15,
    two_factor_required BOOLEAN DEFAULT FALSE,
    allow_password_reuse BOOLEAN DEFAULT FALSE,
    password_history_count INT DEFAULT 5,
    audit_log_retention_days INT DEFAULT 365,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- إنشاء جدول الأجهزة المصرح لها
CREATE TABLE IF NOT EXISTS allowed_devices (
    id VARCHAR(50) PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    added_by VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ip_address (ip_address),
    INDEX idx_is_active (is_active),
    INDEX idx_added_at (added_at)
);

-- إنشاء جدول سجل محاولات تسجيل الدخول
CREATE TABLE IF NOT EXISTS login_attempts (
    id VARCHAR(50) PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    user_email VARCHAR(255) NULL,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(255) NULL,
    user_agent TEXT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ip_address (ip_address),
    INDEX idx_attempted_at (attempted_at),
    INDEX idx_success (success)
);

-- إنشاء جدول سجل الأنشطة الأمنية
CREATE TABLE IF NOT EXISTS security_audit_log (
    id VARCHAR(50) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id VARCHAR(50) NULL,
    ip_address VARCHAR(45) NULL,
    description TEXT NULL,
    metadata JSON NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_user_id (user_id),
    INDEX idx_ip_address (ip_address),
    INDEX idx_created_at (created_at),
    INDEX idx_severity (severity)
);

-- إدراج إعدادات افتراضية
INSERT IGNORE INTO security_settings (
    id, ip_whitelist_enabled, max_login_attempts, 
    session_timeout_minutes, require_strong_passwords,
    password_min_length, password_require_uppercase,
    password_require_lowercase, password_require_numbers,
    password_require_symbols, password_expiry_days,
    lockout_duration_minutes, two_factor_required,
    allow_password_reuse, password_history_count,
    audit_log_retention_days
) VALUES (
    'default-settings',
    FALSE, -- ip_whitelist_enabled
    5,     -- max_login_attempts
    60,    -- session_timeout_minutes
    TRUE,  -- require_strong_passwords
    8,     -- password_min_length
    TRUE,  -- password_require_uppercase
    TRUE,  -- password_require_lowercase
    TRUE,  -- password_require_numbers
    FALSE, -- password_require_symbols
    90,    -- password_expiry_days
    15,    -- lockout_duration_minutes
    FALSE, -- two_factor_required
    FALSE, -- allow_password_reuse
    5,     -- password_history_count
    365    -- audit_log_retention_days
);

-- إضافة بعض الأجهزة الافتراضية (اختياري)
INSERT IGNORE INTO allowed_devices (
    id, ip_address, description, is_active
) VALUES 
    ('device-localhost', '127.0.0.1', 'الخادم المحلي', TRUE),
    ('device-local-network', '192.168.1.1', 'شبكة محلية افتراضية', FALSE);

-- إنشاء فهارس إضافية لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_security_settings_updated_at ON security_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_allowed_devices_updated_at ON allowed_devices(updated_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_email ON login_attempts(user_email);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id_created_at ON security_audit_log(user_id, created_at);

-- إنشاء view لعرض إحصائيات الأمان
CREATE OR REPLACE VIEW security_stats AS
SELECT 
    (SELECT COUNT(*) FROM allowed_devices WHERE is_active = TRUE) as active_devices,
    (SELECT COUNT(*) FROM allowed_devices) as total_devices,
    (SELECT COUNT(*) FROM login_attempts WHERE success = FALSE AND attempted_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)) as failed_logins_24h,
    (SELECT COUNT(*) FROM login_attempts WHERE success = TRUE AND attempted_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)) as successful_logins_24h,
    (SELECT COUNT(*) FROM security_audit_log WHERE severity IN ('high', 'critical') AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)) as critical_events_7d,
    (SELECT ip_whitelist_enabled FROM security_settings ORDER BY created_at DESC LIMIT 1) as ip_whitelist_enabled;
