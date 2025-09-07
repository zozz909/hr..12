-- Create advance_deductions table for tracking automatic deductions
USE hr_system;

-- Create advance_deductions table
CREATE TABLE IF NOT EXISTS advance_deductions (
    id VARCHAR(50) PRIMARY KEY,
    advance_id VARCHAR(50) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    payroll_run_id VARCHAR(50) NOT NULL,
    deduction_amount DECIMAL(10,2) NOT NULL,
    remaining_amount DECIMAL(10,2) NOT NULL,
    deduction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (advance_id) REFERENCES advances(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_advance_deduction_advance (advance_id),
    INDEX idx_advance_deduction_employee (employee_id),
    INDEX idx_advance_deduction_payroll (payroll_run_id),
    INDEX idx_advance_deduction_date (deduction_date)
);
