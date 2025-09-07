import { z } from 'zod'

// Common validation schemas
export const schemas = {
  // User input validation
  email: z.string().email('البريد الإلكتروني غير صحيح').max(255),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل').max(128),
  phone: z.string().regex(/^[0-9+\-\s()]+$/, 'رقم الهاتف غير صحيح').max(20),
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100),
  
  // File validation
  fileSize: z.number().max(10 * 1024 * 1024, 'حجم الملف يجب أن يكون أقل من 10 ميجابايت'),
  fileName: z.string().max(255, 'اسم الملف طويل جداً'),
  
  // ID validation
  uuid: z.string().uuid('معرف غير صحيح'),
  objectId: z.string().regex(/^[a-zA-Z0-9\-_]+$/, 'معرف غير صحيح'),
  
  // Date validation
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صحيح'),
  datetime: z.string().datetime('تاريخ ووقت غير صحيح'),
  
  // Number validation
  positiveNumber: z.number().positive('يجب أن يكون رقم موجب'),
  salary: z.number().min(0, 'الراتب لا يمكن أن يكون سالب').max(1000000, 'الراتب مرتفع جداً'),
  
  // Text validation
  description: z.string().max(1000, 'الوصف طويل جداً'),
  address: z.string().max(500, 'العنوان طويل جداً'),
  
  // Status validation
  status: z.enum(['active', 'inactive', 'suspended', 'archived']),
  employeeStatus: z.enum(['active', 'archived']),
  institutionStatus: z.enum(['active', 'inactive', 'suspended']),
  branchStatus: z.enum(['active', 'inactive']),
  
  // Role and permissions
  role: z.enum(['admin', 'employee']),
  permission: z.string().regex(/^[a-z_]+$/, 'صلاحية غير صحيحة'),
}

// Employee validation schema
export const employeeSchema = z.object({
  name: schemas.name,
  mobile: schemas.phone,
  email: schemas.email.optional(),
  fileNumber: z.string().min(1, 'رقم الملف مطلوب').max(50),
  nationality: z.string().min(2, 'الجنسية مطلوبة').max(50),
  position: z.string().max(100).optional(),
  institutionId: schemas.objectId.nullable().optional(),
  branchId: schemas.objectId.nullable().optional(),
  salary: schemas.salary.optional(),
  status: schemas.employeeStatus.optional(),
  iqamaNumber: z.string().max(20).optional(),
  iqamaExpiry: schemas.date.optional(),
  workPermitExpiry: schemas.date.optional(),
  contractExpiry: schemas.date.optional(),
  healthInsuranceExpiry: schemas.date.optional(),
  healthCertExpiry: schemas.date.optional(),
  photoUrl: z.string().optional(),
  hireDate: schemas.date.optional(),
  archiveReason: z.enum(['resignation', 'termination', 'retirement', 'transfer', 'contract_end', 'medical_leave', 'disciplinary', 'other']).nullable().optional(),
  archiveDate: schemas.date.optional(),
})

// Institution validation schema
export const institutionSchema = z.object({
  name: schemas.name,
  crNumber: z.string().min(1, 'رقم السجل التجاري مطلوب').max(50),
  crExpiryDate: schemas.date,
  email: schemas.email.optional(),
  phone: schemas.phone.optional(),
  address: schemas.address.optional(),
  status: schemas.institutionStatus.optional(),
  licenseNumber: z.string().max(50).optional(),
  licenseExpiry: schemas.date.optional(),
  crIssueDate: schemas.date.optional(),
})

// Branch validation schema
export const branchSchema = z.object({
  name: schemas.name,
  code: z.string().min(1, 'كود الفرع مطلوب').max(20),
  institutionId: schemas.objectId,
  address: schemas.address.optional(),
  phone: schemas.phone.optional(),
  email: schemas.email.optional(),
  status: schemas.branchStatus.optional(),
  managerId: schemas.objectId.optional(),
})

// User validation schema
export const userSchema = z.object({
  username: z.string().min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل').max(50),
  email: schemas.email,
  password: schemas.password,
  role: schemas.role,
  status: schemas.status.optional(),
  permissions: z.array(schemas.permission).optional(),
})

// Login validation schema
export const loginSchema = z.object({
  email: schemas.email,
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
})

// Change password validation schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: schemas.password,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
})

// Document validation schema
export const documentSchema = z.object({
  entityType: z.enum(['employee', 'institution']),
  entityId: schemas.objectId,
  documentType: z.string().min(1, 'نوع المستند مطلوب').max(100),
  fileName: schemas.fileName,
  filePath: z.string().optional(),
  fileUrl: z.string().url().optional(),
  expiryDate: schemas.date.optional(),
  originalName: z.string().max(255).optional(),
  fileSize: schemas.fileSize.optional(),
  mimeType: z.string().max(100).optional(),
  isRenewable: z.boolean().optional(),
})

// Leave request validation schema
export const leaveRequestSchema = z.object({
  employeeId: schemas.objectId,
  leaveType: z.enum(['annual', 'sick', 'unpaid', 'emergency']),
  startDate: schemas.date,
  endDate: schemas.date,
  reason: z.string().min(1, 'سبب الإجازة مطلوب').max(500),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: 'تاريخ انتهاء الإجازة يجب أن يكون بعد تاريخ البداية',
  path: ['endDate'],
})

// Form validation schema
export const formSchema = z.object({
  name: schemas.name,
  description: schemas.description.optional(),
  category: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
})

// Payroll validation schema
export const payrollSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'شهر غير صحيح'),
  institutionId: schemas.objectId,
  status: z.enum(['draft', 'processing', 'completed', 'cancelled']).optional(),
})

// Compensation validation schema
export const compensationSchema = z.object({
  employeeId: schemas.objectId,
  type: z.enum(['bonus', 'deduction', 'allowance', 'overtime']),
  amount: schemas.positiveNumber,
  description: schemas.description,
  month: z.string().regex(/^\d{4}-\d{2}$/, 'شهر غير صحيح'),
  isRecurring: z.boolean().optional(),
})

// Validation helper functions
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: string[] } => {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => err.message)
      return { success: false, errors }
    }
    return { success: false, errors: ['خطأ في التحقق من البيانات'] }
  }
}

export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '')
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  return input
}
