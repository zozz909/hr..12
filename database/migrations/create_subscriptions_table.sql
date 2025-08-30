-- Create subscriptions table for institution subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(50) PRIMARY KEY,
    institution_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(50) DEFAULT 'ShieldCheck',
    expiry_date DATE NULL,
    status ENUM('active', 'expired', 'expiring_soon') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
    INDEX idx_subscription_institution (institution_id),
    INDEX idx_subscription_expiry (expiry_date),
    INDEX idx_subscription_status (status)
);
