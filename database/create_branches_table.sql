-- Create branches table
CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(255) PRIMARY KEY,
    institution_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    manager_id VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_code_per_institution (institution_id, code),
    INDEX idx_institution_id (institution_id),
    INDEX idx_status (status),
    INDEX idx_manager_id (manager_id)
);

-- Add branch_id column to employees table if it doesn't exist
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS branch_id VARCHAR(255),
ADD INDEX IF NOT EXISTS idx_branch_id (branch_id),
ADD CONSTRAINT IF NOT EXISTS fk_employee_branch 
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;

-- Insert sample branches for testing
INSERT IGNORE INTO branches (id, institution_id, name, code, address, phone, email, status) VALUES
('branch-001', 'inst-001', 'الفرع الرئيسي', 'MAIN', 'الرياض - حي الملك فهد', '0112345678', 'main@company.com', 'active'),
('branch-002', 'inst-001', 'فرع جدة', 'JED', 'جدة - حي الروضة', '0122345678', 'jeddah@company.com', 'active'),
('branch-003', 'inst-002', 'فرع الدمام', 'DAM', 'الدمام - حي الفيصلية', '0132345678', 'dammam@company.com', 'active');
