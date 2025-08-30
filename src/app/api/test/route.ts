import { NextResponse } from 'next/server';
import { checkDatabaseConnection, executeQuery } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    const isConnected = await checkDatabaseConnection();

    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed'
      }, { status: 500 });
    }

    // Test basic queries
    const tests = [];

    // Test 1: Check if tables exist
    try {
      const tablesQuery = `
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = 'hr_system'
        ORDER BY TABLE_NAME
      `;
      const tables = await executeQuery(tablesQuery);
      tests.push({
        name: 'Database Tables',
        status: 'success',
        result: `Found ${tables.length} tables: ${tables.map((t: any) => t.TABLE_NAME).join(', ')}`
      });
    } catch (error) {
      tests.push({
        name: 'Database Tables',
        status: 'error',
        result: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Count institutions
    try {
      const institutionsCount = await executeQuery('SELECT COUNT(*) as count FROM institutions');
      tests.push({
        name: 'Institutions Count',
        status: 'success',
        result: `${institutionsCount[0].count} institutions found`
      });
    } catch (error) {
      tests.push({
        name: 'Institutions Count',
        status: 'error',
        result: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 3: Count employees
    try {
      const employeesCount = await executeQuery('SELECT COUNT(*) as count FROM employees');
      tests.push({
        name: 'Employees Count',
        status: 'success',
        result: `${employeesCount[0].count} employees found`
      });
    } catch (error) {
      tests.push({
        name: 'Employees Count',
        status: 'error',
        result: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 4: Check for expiring documents
    try {
      const expiringQuery = `
        SELECT COUNT(*) as count
        FROM employees
        WHERE status = 'active'
        AND (
          (iqama_expiry IS NOT NULL AND iqama_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY))
          OR (insurance_expiry IS NOT NULL AND insurance_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY))
          OR (work_permit_expiry IS NOT NULL AND work_permit_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY))
          OR (health_cert_expiry IS NOT NULL AND health_cert_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY))
          OR (contract_expiry IS NOT NULL AND contract_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY))
        )
      `;
      const expiringCount = await executeQuery(expiringQuery);
      tests.push({
        name: 'Expiring Documents',
        status: 'success',
        result: `${expiringCount[0].count} employees with expiring documents (30 days)`
      });
    } catch (error) {
      tests.push({
        name: 'Expiring Documents',
        status: 'error',
        result: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 5: Test institution insert/delete
    try {
      const testId = 'test-' + Date.now();
      const insertQuery = `
        INSERT INTO institutions (id, name, cr_number, cr_expiry_date, status)
        VALUES (?, ?, ?, ?, ?)
      `;
      await executeQuery(insertQuery, [testId, 'Test Institution', '1234567890', '2025-12-31', 'active']);

      // Verify it was inserted
      const selectQuery = 'SELECT * FROM institutions WHERE id = ?';
      const inserted = await executeQuery(selectQuery, [testId]);

      // Delete it
      const deleteQuery = 'DELETE FROM institutions WHERE id = ?';
      await executeQuery(deleteQuery, [testId]);

      tests.push({
        name: 'Institution Insert/Delete Test',
        status: 'success',
        result: `Successfully inserted and deleted test institution. Found: ${inserted.length} record(s)`
      });
    } catch (error) {
      tests.push({
        name: 'Institution Insert/Delete Test',
        status: 'error',
        result: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Create branches table if not exists
    try {
      const createBranchesTable = `
        CREATE TABLE IF NOT EXISTS branches (
            id VARCHAR(255) PRIMARY KEY,
            institution_id VARCHAR(255) NULL,
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

            INDEX idx_institution_id (institution_id),
            INDEX idx_status (status),
            INDEX idx_manager_id (manager_id),
            INDEX idx_code (code)
        )
      `;

      await executeQuery(createBranchesTable);

      tests.push({
        name: 'Create Branches Table',
        status: 'success',
        result: 'Branches table created successfully'
      });
    } catch (error) {
      tests.push({
        name: 'Create Branches Table',
        status: 'error',
        result: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Add new columns to employees table
    try {
      const addNewColumns = `
        ALTER TABLE employees
        ADD COLUMN IF NOT EXISTS branch_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS email VARCHAR(255),
        ADD COLUMN IF NOT EXISTS health_insurance_expiry DATE,
        ADD COLUMN IF NOT EXISTS photo_url TEXT
      `;
      await executeQuery(addNewColumns);

      tests.push({
        name: 'Add New Employee Columns',
        status: 'success',
        result: 'New columns added to employees table'
      });
    } catch (error) {
      tests.push({
        name: 'Add New Employee Columns',
        status: 'info',
        result: 'Columns might already exist'
      });
    }

    // Insert sample branches
    try {
      const insertSampleBranches = `
        INSERT IGNORE INTO branches (id, institution_id, name, code, address, phone, email, status) VALUES
        ('branch-001', 'inst-001', 'الفرع الرئيسي', 'MAIN', 'الرياض - حي الملك فهد', '0112345678', 'main@company.com', 'active'),
        ('branch-002', 'inst-001', 'فرع جدة', 'JED', 'جدة - حي الروضة', '0122345678', 'jeddah@company.com', 'active'),
        ('branch-003', NULL, 'فرع مستقل', 'IND', 'الدمام - حي الفيصلية', '0132345678', 'independent@company.com', 'active')
      `;
      await executeQuery(insertSampleBranches);

      tests.push({
        name: 'Insert Sample Branches',
        status: 'success',
        result: 'Sample branches inserted successfully'
      });
    } catch (error) {
      tests.push({
        name: 'Insert Sample Branches',
        status: 'info',
        result: 'Sample branches might already exist'
      });
    }

    // Insert sample employees
    try {
      const insertSampleEmployees = `
        INSERT IGNORE INTO employees (
          id, institution_id, branch_id, name, file_number, mobile, email, nationality, position,
          salary, iqama_number, iqama_expiry, work_permit_expiry, contract_expiry, health_insurance_expiry,
          status, created_at, updated_at
        ) VALUES
        ('emp-001', 'inst-001', 'branch-001', 'أحمد محمد علي', 'EMP001', '0501234567', 'ahmed@company.com', 'سعودي', 'مطور برمجيات', 8000, '2123456789', '2025-12-31', '2025-11-30', '2025-10-31', '2025-09-30', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('emp-002', 'inst-001', 'branch-002', 'فاطمة أحمد', 'EMP002', '0509876543', 'fatima@company.com', 'مصري', 'محاسبة', 6000, '2987654321', '2025-06-15', '2025-05-15', '2025-12-31', '2025-08-15', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('emp-003', 'inst-002', NULL, 'محمد عبدالله', 'EMP003', '0551234567', 'mohammed@company.com', 'أردني', 'مدير مشروع', 12000, '2555666777', '2024-12-31', '2024-11-30', '2025-06-30', '2025-07-31', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
      await executeQuery(insertSampleEmployees);

      tests.push({
        name: 'Insert Sample Employees',
        status: 'success',
        result: 'Sample employees inserted successfully'
      });
    } catch (error) {
      tests.push({
        name: 'Insert Sample Employees',
        status: 'info',
        result: 'Sample employees might already exist'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Database tests completed and branches table setup',
      timestamp: new Date().toISOString(),
      tests: tests,
      summary: {
        total: tests.length,
        passed: tests.filter(t => t.status === 'success').length,
        failed: tests.filter(t => t.status === 'error').length
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}