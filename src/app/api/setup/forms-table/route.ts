import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

// POST /api/setup/forms-table - Update forms table structure
export async function POST(request: NextRequest) {
  try {
    console.log('Updating forms table structure...');

    // Add new columns to forms table
    const alterQueries = [
      `ALTER TABLE forms 
       ADD COLUMN IF NOT EXISTS icon_name VARCHAR(50) NULL COMMENT 'Icon name for display'`,
      
      `ALTER TABLE forms 
       ADD COLUMN IF NOT EXISTS icon_color VARCHAR(20) NULL COMMENT 'Icon color (hex or name)'`,
      
      `ALTER TABLE forms 
       ADD COLUMN IF NOT EXISTS file_path VARCHAR(500) NULL COMMENT 'Path to uploaded form file'`,
      
      `ALTER TABLE forms 
       ADD COLUMN IF NOT EXISTS file_url VARCHAR(500) NULL COMMENT 'URL to access the file'`,
      
      `ALTER TABLE forms 
       ADD COLUMN IF NOT EXISTS file_name VARCHAR(255) NULL COMMENT 'Original file name'`,
      
      `ALTER TABLE forms 
       ADD COLUMN IF NOT EXISTS file_size INT NULL COMMENT 'File size in bytes'`,
      
      `ALTER TABLE forms 
       ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100) NULL COMMENT 'File MIME type'`,
      
      `ALTER TABLE forms 
       ADD COLUMN IF NOT EXISTS download_count INT DEFAULT 0 COMMENT 'Number of downloads'`
    ];

    // Execute alter queries
    for (const query of alterQueries) {
      try {
        await executeQuery(query);
        console.log('✓ Executed:', query.split('ADD COLUMN')[1]?.split('VARCHAR')[0]?.trim());
      } catch (error: any) {
        if (error.message.includes('Duplicate column name')) {
          console.log('✓ Column already exists, skipping...');
        } else {
          console.error('Error in query:', error.message);
        }
      }
    }

    // Update existing forms with icons
    const updateQueries = [
      `UPDATE forms SET 
        icon_name = 'Calendar',
        icon_color = '#3b82f6',
        description = 'نموذج طلب إجازة للموظفين مع تحديد نوع الإجازة والمدة'
       WHERE id = 'form-001'`,
      
      `UPDATE forms SET 
        icon_name = 'DollarSign',
        icon_color = '#10b981',
        description = 'نموذج طلب سلفة مالية مع تحديد المبلغ وعدد الأقساط'
       WHERE id = 'form-002'`,
      
      `UPDATE forms SET 
        icon_name = 'Clock',
        icon_color = '#f59e0b',
        description = 'نموذج تقرير الحضور والانصراف الشهري للموظفين'
       WHERE id = 'form-003'`
    ];

    for (const query of updateQueries) {
      try {
        await executeQuery(query);
        console.log('✓ Updated existing form');
      } catch (error: any) {
        console.log('Note: Form may not exist yet');
      }
    }

    // Add new sample forms
    const insertQueries = [
      `INSERT IGNORE INTO forms (id, title, description, category, icon_name, icon_color, is_active) VALUES
       ('form-004', 'طلب نقل كفالة', 'نموذج طلب نقل كفالة موظف إلى مؤسسة أخرى', 'hr', 'UserCheck', '#8b5cf6', TRUE)`,
      
      `INSERT IGNORE INTO forms (id, title, description, category, icon_name, icon_color, is_active) VALUES
       ('form-005', 'تقرير مالي شهري', 'نموذج التقرير المالي الشهري للمؤسسة', 'finance', 'TrendingUp', '#ef4444', TRUE)`,
      
      `INSERT IGNORE INTO forms (id, title, description, category, icon_name, icon_color, is_active) VALUES
       ('form-006', 'طلب تجديد إقامة', 'نموذج طلب تجديد إقامة للموظفين', 'hr', 'CreditCard', '#06b6d4', TRUE)`,
      
      `INSERT IGNORE INTO forms (id, title, description, category, icon_name, icon_color, is_active) VALUES
       ('form-007', 'شهادة راتب', 'نموذج شهادة راتب للموظفين', 'finance', 'Receipt', '#84cc16', TRUE)`,
      
      `INSERT IGNORE INTO forms (id, title, description, category, icon_name, icon_color, is_active) VALUES
       ('form-008', 'طلب إجازة مرضية', 'نموذج طلب إجازة مرضية مع المستندات الطبية', 'hr', 'Heart', '#ec4899', TRUE)`,
      
      `INSERT IGNORE INTO forms (id, title, description, category, icon_name, icon_color, is_active) VALUES
       ('form-009', 'تقرير أداء', 'نموذج تقييم الأداء السنوي للموظفين', 'hr', 'Star', '#f97316', TRUE)`,
      
      `INSERT IGNORE INTO forms (id, title, description, category, icon_name, icon_color, is_active) VALUES
       ('form-010', 'طلب مكافأة', 'نموذج طلب مكافأة أو حافز للموظفين', 'finance', 'Gift', '#22c55e', TRUE)`
    ];

    for (const query of insertQueries) {
      try {
        await executeQuery(query);
        console.log('✓ Added sample form');
      } catch (error: any) {
        console.log('Note: Sample form may already exist');
      }
    }

    // Create indexes
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_forms_category ON forms(category)',
      'CREATE INDEX IF NOT EXISTS idx_forms_active ON forms(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_forms_downloads ON forms(download_count)'
    ];

    for (const query of indexQueries) {
      try {
        await executeQuery(query);
        console.log('✓ Created index');
      } catch (error: any) {
        console.log('Note: Index may already exist');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Forms table updated successfully'
    });

  } catch (error) {
    console.error('Error updating forms table:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update forms table' },
      { status: 500 }
    );
  }
}
