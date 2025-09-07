-- Update forms table to support file uploads and icons
USE hr_system;

-- Add new columns to forms table
ALTER TABLE forms 
ADD COLUMN icon_name VARCHAR(50) NULL COMMENT 'Icon name for display',
ADD COLUMN icon_color VARCHAR(20) NULL COMMENT 'Icon color (hex or name)',
ADD COLUMN file_path VARCHAR(500) NULL COMMENT 'Path to uploaded form file',
ADD COLUMN file_url VARCHAR(500) NULL COMMENT 'URL to access the file',
ADD COLUMN file_name VARCHAR(255) NULL COMMENT 'Original file name',
ADD COLUMN file_size INT NULL COMMENT 'File size in bytes',
ADD COLUMN mime_type VARCHAR(100) NULL COMMENT 'File MIME type',
ADD COLUMN download_count INT DEFAULT 0 COMMENT 'Number of downloads';

-- Update existing forms with icons and sample data
UPDATE forms SET 
  icon_name = 'Calendar',
  icon_color = '#3b82f6',
  description = 'نموذج طلب إجازة للموظفين مع تحديد نوع الإجازة والمدة'
WHERE id = 'form-001';

UPDATE forms SET 
  icon_name = 'DollarSign',
  icon_color = '#10b981',
  description = 'نموذج طلب سلفة مالية مع تحديد المبلغ وعدد الأقساط'
WHERE id = 'form-002';

UPDATE forms SET 
  icon_name = 'Clock',
  icon_color = '#f59e0b',
  description = 'نموذج تقرير الحضور والانصراف الشهري للموظفين'
WHERE id = 'form-003';

-- Add more sample forms
INSERT INTO forms (id, title, description, category, icon_name, icon_color, is_active) VALUES
('form-004', 'طلب نقل كفالة', 'نموذج طلب نقل كفالة موظف إلى مؤسسة أخرى', 'hr', 'UserCheck', '#8b5cf6', TRUE),
('form-005', 'تقرير مالي شهري', 'نموذج التقرير المالي الشهري للمؤسسة', 'finance', 'TrendingUp', '#ef4444', TRUE),
('form-006', 'طلب تجديد إقامة', 'نموذج طلب تجديد إقامة للموظفين', 'hr', 'CreditCard', '#06b6d4', TRUE),
('form-007', 'شهادة راتب', 'نموذج شهادة راتب للموظفين', 'finance', 'Receipt', '#84cc16', TRUE),
('form-008', 'طلب إجازة مرضية', 'نموذج طلب إجازة مرضية مع المستندات الطبية', 'hr', 'Heart', '#ec4899', TRUE),
('form-009', 'تقرير أداء', 'نموذج تقييم الأداء السنوي للموظفين', 'hr', 'Star', '#f97316', TRUE),
('form-010', 'طلب مكافأة', 'نموذج طلب مكافأة أو حافز للموظفين', 'finance', 'Gift', '#22c55e', TRUE);

-- Create indexes for better performance
CREATE INDEX idx_forms_category ON forms(category);
CREATE INDEX idx_forms_active ON forms(is_active);
CREATE INDEX idx_forms_downloads ON forms(download_count);

-- Show updated table structure
DESCRIBE forms;
