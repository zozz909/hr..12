# دليل المطور - نظام إدارة الموارد البشرية

## 📋 جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [متطلبات النظام](#متطلبات-النظام)
3. [التثبيت والإعداد](#التثبيت-والإعداد)
4. [هيكل المشروع](#هيكل-المشروع)
5. [قاعدة البيانات](#قاعدة-البيانات)
6. [API Documentation](#api-documentation)
7. [الأمان](#الأمان)
8. [الاختبارات](#الاختبارات)
9. [النشر](#النشر)
10. [المساهمة](#المساهمة)

---

## 🔍 نظرة عامة

### التقنيات المستخدمة
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MySQL 8.0
- **Authentication**: NextAuth.js, JWT
- **UI Components**: Radix UI, Shadcn/ui
- **State Management**: React Query (TanStack Query)
- **File Upload**: Multer, Sharp (image processing)
- **Testing**: Jest, React Testing Library
- **Monitoring**: Custom error handling and logging

### الميزات التقنية
- ✅ Server-Side Rendering (SSR)
- ✅ API Routes with TypeScript
- ✅ Real-time data updates
- ✅ File upload and processing
- ✅ Responsive design
- ✅ Error monitoring and logging
- ✅ Automated backups
- ✅ Performance optimization
- ✅ Security best practices

---

## 💻 متطلبات النظام

### متطلبات التطوير
- Node.js 18+ 
- MySQL 8.0+
- npm أو yarn
- Git

### متطلبات الإنتاج
- Node.js 18+
- MySQL 8.0+
- Nginx (موصى به)
- SSL Certificate
- 2GB RAM (الحد الأدنى)
- 10GB Storage

---

## 🚀 التثبيت والإعداد

### 1. استنساخ المشروع
```bash
git clone https://github.com/your-repo/hr-management-system.git
cd hr-management-system
```

### 2. تثبيت التبعيات
```bash
npm install
```

### 3. إعداد متغيرات البيئة
```bash
cp .env.example .env.local
```

قم بتحديث الملف `.env.local`:
```env
# Database
DATABASE_URL=mysql://username:password@localhost:3306/hr_system

# Authentication
JWT_SECRET=your-super-secret-jwt-key
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Monitoring (optional)
SENTRY_DSN=your-sentry-dsn
```

### 4. إعداد قاعدة البيانات
```bash
# إنشاء قاعدة البيانات
mysql -u root -p -e "CREATE DATABASE hr_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# تشغيل سكريبت الإعداد
npm run setup-db
```

### 5. تشغيل النظام
```bash
# وضع التطوير
npm run dev

# بناء الإنتاج
npm run build
npm start
```

---

## 📁 هيكل المشروع

```
hr-management-system/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # صفحات المصادقة
│   │   ├── (main)/            # الصفحات الرئيسية
│   │   ├── api/               # API Routes
│   │   ├── globals.css        # الأنماط العامة
│   │   └── layout.tsx         # التخطيط الرئيسي
│   ├── components/            # مكونات React
│   │   ├── ui/               # مكونات UI الأساسية
│   │   ├── forms/            # نماذج الإدخال
│   │   └── charts/           # الرسوم البيانية
│   ├── hooks/                # React Hooks مخصصة
│   ├── lib/                  # المكتبات والأدوات
│   │   ├── models/           # نماذج قاعدة البيانات
│   │   ├── security/         # أدوات الأمان
│   │   ├── monitoring/       # مراقبة الأخطاء
│   │   ├── performance/      # تحسين الأداء
│   │   └── backup/           # النسخ الاحتياطي
│   ├── types/                # تعريفات TypeScript
│   └── __tests__/            # الاختبارات
├── docs/                     # الوثائق
├── scripts/                  # سكريبتات الأتمتة
├── uploads/                  # ملفات المستخدمين
└── backups/                  # النسخ الاحتياطية
```

---

## 🗄️ قاعدة البيانات

### الجداول الرئيسية

#### users - المستخدمين
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'employee') DEFAULT 'employee',
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### institutions - المؤسسات
```sql
CREATE TABLE institutions (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cr_number VARCHAR(50) UNIQUE NOT NULL,
  cr_expiry_date DATE NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### employees - الموظفين
```sql
CREATE TABLE employees (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  file_number VARCHAR(50) UNIQUE NOT NULL,
  nationality VARCHAR(50) NOT NULL,
  position VARCHAR(100),
  institution_id VARCHAR(36),
  branch_id VARCHAR(36),
  salary DECIMAL(10,2),
  status ENUM('active', 'archived') DEFAULT 'active',
  iqama_number VARCHAR(20),
  iqama_expiry DATE,
  work_permit_expiry DATE,
  contract_expiry DATE,
  insurance_expiry DATE,
  health_cert_expiry DATE,
  photo_url VARCHAR(500),
  hire_date DATE,
  archive_reason ENUM('resignation', 'termination', 'retirement', 'transfer', 'contract_end', 'medical_leave', 'disciplinary', 'other'),
  archived_at TIMESTAMP NULL,
  archive_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);
```

### الفهارس المهمة
```sql
-- فهارس الأداء
CREATE INDEX idx_employees_institution ON employees(institution_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_expiry ON employees(iqama_expiry, work_permit_expiry, contract_expiry);
CREATE INDEX idx_documents_expiry ON documents(expiry_date);
CREATE INDEX idx_payroll_month ON payroll_runs(month, institution_id);
```

---

## 🔌 API Documentation

### Authentication Endpoints

#### POST /api/auth/login
تسجيل الدخول

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "admin@example.com",
      "role": "admin"
    },
    "token": "jwt-token"
  }
}
```

### Employee Endpoints

#### GET /api/employees
جلب قائمة الموظفين

**Query Parameters:**
- `search` - البحث في الاسم أو رقم الملف
- `institutionId` - تصفية حسب المؤسسة
- `status` - تصفية حسب الحالة
- `page` - رقم الصفحة
- `limit` - عدد النتائج

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "emp-id",
      "name": "أحمد محمد",
      "mobile": "0501234567",
      "email": "ahmed@example.com",
      "fileNumber": "EMP001",
      "nationality": "سعودي",
      "position": "مطور",
      "institutionId": "inst-id",
      "salary": 5000,
      "status": "active",
      "iqamaExpiry": "2025-12-31",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

#### POST /api/employees
إضافة موظف جديد

**Request Body:**
```json
{
  "name": "أحمد محمد",
  "mobile": "0501234567",
  "email": "ahmed@example.com",
  "fileNumber": "EMP001",
  "nationality": "سعودي",
  "position": "مطور",
  "institutionId": "inst-id",
  "salary": 5000,
  "status": "active"
}
```

### Institution Endpoints

#### GET /api/institutions
جلب قائمة المؤسسات

#### POST /api/institutions
إضافة مؤسسة جديدة

#### PUT /api/institutions/[id]
تحديث بيانات المؤسسة

#### DELETE /api/institutions/[id]
حذف المؤسسة

### Error Responses
```json
{
  "success": false,
  "error": "رسالة الخطأ",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 🔒 الأمان

### المصادقة والتخويل
- JWT tokens للمصادقة
- Role-based access control
- Session management
- Password hashing with bcrypt

### حماية البيانات
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- File upload security

### Security Headers
```typescript
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
}
```

### Rate Limiting
```typescript
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'تم تجاوز الحد المسموح من الطلبات'
})
```

---

## 🧪 الاختبارات

### تشغيل الاختبارات
```bash
# جميع الاختبارات
npm test

# الاختبارات مع التغطية
npm run test:coverage

# الاختبارات في وضع المراقبة
npm run test:watch
```

### كتابة الاختبارات
```typescript
// src/__tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

---

## 🚀 النشر

### النشر على الخادم
```bash
# بناء التطبيق
npm run build

# تشغيل في الإنتاج
npm start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🤝 المساهمة

### إرشادات المساهمة
1. Fork المشروع
2. إنشاء branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى البranch (`git push origin feature/amazing-feature`)
5. فتح Pull Request

### معايير الكود
- استخدم TypeScript
- اتبع ESLint rules
- اكتب اختبارات للميزات الجديدة
- اكتب تعليقات واضحة
- استخدم أسماء متغيرات وصفية

---

*آخر تحديث: يناير 2024*
