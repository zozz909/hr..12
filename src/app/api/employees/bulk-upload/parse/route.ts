import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { executeQuery } from '@/lib/db';

// Excel and CSV parser using xlsx library
function parseFileBuffer(buffer: ArrayBuffer, filename: string): any[][] {
  try {
    // Use xlsx library to parse Excel files
    const workbook = XLSX.read(buffer, {
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false
    });

    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to array of arrays
    const data = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false
    }) as any[][];

    console.log('Parsed Excel data:', data.slice(0, 5)); // Debug log

    return data;
  } catch (error) {
    console.error('Error parsing Excel file:', error);

    // Fallback to CSV parsing for non-Excel files
    try {
      const decoder = new TextDecoder('utf-8');
      let text = decoder.decode(buffer);

      // Remove BOM if present
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
      }

      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        throw new Error('الملف فارغ');
      }

      // Determine separator
      const firstLine = lines[0];
      const tabCount = (firstLine.match(/\t/g) || []).length;
      const commaCount = (firstLine.match(/,/g) || []).length;
      const separator = tabCount > commaCount ? '\t' : ',';

      return lines.map(line => {
        if (separator === '\t') {
          return line.split('\t').map(cell => cell.trim());
        } else {
          // Simple CSV parsing
          return line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
        }
      });
    } catch (fallbackError) {
      console.error('Fallback parsing also failed:', fallbackError);
      throw new Error('فشل في تحليل الملف - تأكد من أن الملف بصيغة Excel أو CSV صحيحة');
    }
  }
}

interface EmployeeData {
  name: string;
  fileNumber: string;
  phone: string;
  email?: string;
  nationality: string;
  position?: string;
  institution?: string;
  salary?: number;
  iqamaExpiryDate?: string;
  workPermitExpiryDate?: string;
  contractExpiryDate?: string;
  healthInsuranceExpiryDate?: string;
  lifeCertificateExpiryDate?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: any;
}

// Column mapping (Arabic to English)
const COLUMN_MAPPING: { [key: string]: string } = {
  'اسم الموظف *': 'name',
  'اسم الموظف': 'name',
  'الاسم': 'name',
  'Name': 'name',
  'رقم الملف *': 'fileNumber',
  'رقم الملف': 'fileNumber',
  'File Number': 'fileNumber',
  'رقم الجوال *': 'phone',
  'رقم الجوال': 'phone',
  'الجوال': 'phone',
  'Phone': 'phone',
  'Mobile': 'phone',
  'البريد الإلكتروني': 'email',
  'الإيميل': 'email',
  'Email': 'email',
  'الجنسية *': 'nationality',
  'الجنسية': 'nationality',
  'Nationality': 'nationality',
  'المنصب': 'position',
  'الوظيفة': 'position',
  'Position': 'position',
  'Job Title': 'position',
  'المؤسسة / الكفيل': 'institution',
  'المؤسسة': 'institution',
  'الكفيل': 'institution',
  'Institution': 'institution',
  'Sponsor': 'institution',
  'راتب': 'salary',
  'الراتب': 'salary',
  'Salary': 'salary',
  'انتهاء الإقامة (mm/dd/yyyy)': 'iqamaExpiryDate',
  'انتهاء الإقامة': 'iqamaExpiryDate',
  'تاريخ انتهاء الإقامة': 'iqamaExpiryDate',
  'Iqama Expiry': 'iqamaExpiryDate',
  'انتهاء رخصة العمل (mm/dd/yyyy)': 'workPermitExpiryDate',
  'انتهاء رخصة العمل': 'workPermitExpiryDate',
  'تاريخ انتهاء رخصة العمل': 'workPermitExpiryDate',
  'Work Permit Expiry': 'workPermitExpiryDate',
  'انتهاء العقد (mm/dd/yyyy)': 'contractExpiryDate',
  'انتهاء العقد': 'contractExpiryDate',
  'تاريخ انتهاء العقد': 'contractExpiryDate',
  'Contract Expiry': 'contractExpiryDate',
  'انتهاء التأمين الصحي (mm/dd/yyyy)': 'healthInsuranceExpiryDate',
  'انتهاء التأمين الصحي': 'healthInsuranceExpiryDate',
  'تاريخ انتهاء التأمين الصحي': 'healthInsuranceExpiryDate',
  'Health Insurance Expiry': 'healthInsuranceExpiryDate',
  'انتهاء الشهادة الحية': 'lifeCertificateExpiryDate',
  'تاريخ انتهاء الشهادة الحية': 'lifeCertificateExpiryDate',
  'Life Certificate Expiry': 'lifeCertificateExpiryDate'
};

async function validateEmployee(employee: any, rowIndex: number): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  // Required fields validation
  if (!employee.name || employee.name.toString().trim() === '') {
    errors.push({
      row: rowIndex + 1,
      field: 'اسم الموظف',
      message: 'اسم الموظف مطلوب',
      value: employee.name
    });
  }

  if (!employee.fileNumber || employee.fileNumber.toString().trim() === '') {
    errors.push({
      row: rowIndex + 1,
      field: 'رقم الملف',
      message: 'رقم الملف مطلوب',
      value: employee.fileNumber
    });
  }

  if (!employee.phone || employee.phone.toString().trim() === '') {
    errors.push({
      row: rowIndex + 1,
      field: 'رقم الجوال',
      message: 'رقم الجوال مطلوب',
      value: employee.phone
    });
  } else {
    // Validate phone format
    const phone = employee.phone.toString().trim();
    if (!/^05\d{8}$/.test(phone)) {
      errors.push({
        row: rowIndex + 1,
        field: 'رقم الجوال',
        message: 'رقم الجوال يجب أن يبدأ بـ 05 ويكون 10 أرقام',
        value: phone
      });
    }
  }

  if (!employee.nationality || employee.nationality.toString().trim() === '') {
    errors.push({
      row: rowIndex + 1,
      field: 'الجنسية',
      message: 'الجنسية مطلوبة',
      value: employee.nationality
    });
  }

  // Validate institution if provided
  if (employee.institution && employee.institution !== 'غير مكفول') {
    try {
      const institutionResult = await executeQuery(
        'SELECT id, name FROM institutions WHERE name = ? AND status = "active"',
        [employee.institution]
      );

      if (institutionResult.length === 0) {
        errors.push({
          row: rowIndex + 1,
          field: 'المؤسسة / الكفيل',
          message: `المؤسسة "${employee.institution}" غير موجودة في النظام. يرجى اختيار مؤسسة أخرى أو وضع الموظف كـ "غير مكفول"`,
          value: employee.institution
        });
      }
    } catch (dbError) {
      console.error('Database error during institution validation:', dbError);
      // Don't add error for database issues, just log it
    }
  }

  // Email validation
  if (employee.email && employee.email.toString().trim() !== '') {
    const email = employee.email.toString().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({
        row: rowIndex + 1,
        field: 'البريد الإلكتروني',
        message: 'صيغة البريد الإلكتروني غير صحيحة',
        value: email
      });
    }
  }

  // Phone validation
  if (employee.phone && employee.phone.toString().trim() !== '') {
    const phone = employee.phone.toString().trim();
    if (!/^[0-9+\-\s()]{10,15}$/.test(phone)) {
      errors.push({
        row: rowIndex + 1,
        field: 'رقم الهاتف',
        message: 'صيغة رقم الهاتف غير صحيحة',
        value: phone
      });
    }
  }

  // Date validations
  const dateFields = [
    { field: 'iqamaExpiryDate', name: 'انتهاء الإقامة' },
    { field: 'workPermitExpiryDate', name: 'انتهاء رخصة العمل' },
    { field: 'contractExpiryDate', name: 'انتهاء العقد' },
    { field: 'healthInsuranceExpiryDate', name: 'انتهاء التأمين الصحي' },
    { field: 'lifeCertificateExpiryDate', name: 'انتهاء الشهادة الحية' }
  ];

  dateFields.forEach(({ field, name }) => {
    if (employee[field] && employee[field].toString().trim() !== '') {
      const dateValue = employee[field];
      let isValidDate = false;

      // Try to parse different date formats
      if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
        isValidDate = true;
      } else if (typeof dateValue === 'string') {
        const parsedDate = new Date(dateValue);
        if (!isNaN(parsedDate.getTime())) {
          isValidDate = true;
        }
      } else if (typeof dateValue === 'number') {
        // Excel date serial number
        const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
        if (!isNaN(excelDate.getTime())) {
          isValidDate = true;
        }
      }

      if (!isValidDate) {
        errors.push({
          row: rowIndex + 1,
          field: name,
          message: 'صيغة التاريخ غير صحيحة',
          value: dateValue
        });
      }
    }
  });

  // Salary validation
  if (employee.salary && employee.salary.toString().trim() !== '') {
    const salary = parseFloat(employee.salary.toString());
    if (isNaN(salary) || salary < 0) {
      errors.push({
        row: rowIndex + 1,
        field: 'الراتب',
        message: 'الراتب يجب أن يكون رقم موجب',
        value: employee.salary
      });
    }
  }

  return errors;
}

function formatDate(dateValue: any): string | undefined {
  if (!dateValue) return undefined;

  try {
    let date: Date;

    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'number') {
      // Excel date serial number
      date = new Date((dateValue - 25569) * 86400 * 1000);
    } else {
      date = new Date(dateValue);
    }

    if (isNaN(date.getTime())) return undefined;

    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'لم يتم اختيار ملف' },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = await file.arrayBuffer();

    // Parse the file (supports CSV, TSV, and basic Excel formats)
    const rawData = parseFileBuffer(buffer, file.name);

    if (rawData.length < 2) {
      return NextResponse.json(
        { success: false, error: 'الملف فارغ أو لا يحتوي على بيانات كافية' },
        { status: 400 }
      );
    }

    // Find the header row (skip instruction rows)
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
      const row = rawData[i];
      if (row && row.some(cell => cell && cell.toString().includes('اسم الموظف'))) {
        headerRowIndex = i;
        break;
      }
    }

    // Get headers and map them
    const headers = rawData[headerRowIndex] as string[];
    console.log('Headers found:', headers); // Debug log

    const mappedHeaders = headers.map(header => {
      const trimmedHeader = header?.toString().trim();
      const mapped = COLUMN_MAPPING[trimmedHeader];
      console.log(`Mapping "${trimmedHeader}" -> "${mapped}"`); // Debug log
      return mapped || trimmedHeader?.toLowerCase().replace(/\s+/g, '_');
    });

    console.log('Mapped headers:', mappedHeaders); // Debug log

    // Process data rows (start from after header row)
    const employees: EmployeeData[] = [];
    const allErrors: ValidationError[] = [];

    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const row = rawData[i] as any[];

      // Skip empty rows and example rows
      if (row.length === 0 || row.every(cell => !cell)) continue;
      if (row[0] && row[0].toString().includes('مثال:')) continue;
      if (row.every(cell => !cell || cell.toString().trim() === '')) continue;

      const employee: any = {};

      // Map row data to employee object
      mappedHeaders.forEach((header, index) => {
        if (header && row[index] !== undefined && row[index] !== null && row[index] !== '') {
          const cellValue = row[index].toString().trim();
          if (cellValue && !cellValue.includes('مثال:')) {
            employee[header] = cellValue;
          }
        }
      });

      console.log(`Row ${i} employee data:`, employee); // Debug log

      // Clean and format data
      let institutionValue = employee.institution?.toString().trim() || undefined;

      // Handle empty institution field - default to "غير مكفول"
      if (!institutionValue || institutionValue === '' || institutionValue === '-') {
        institutionValue = 'غير مكفول';
      }

      const cleanEmployee: EmployeeData = {
        name: employee.name?.toString().trim() || '',
        fileNumber: employee.fileNumber?.toString().trim() || '',
        phone: employee.phone?.toString().trim() || '',
        email: employee.email?.toString().trim() || undefined,
        nationality: employee.nationality?.toString().trim() || '',
        position: employee.position?.toString().trim() || undefined,
        institution: institutionValue,
        salary: employee.salary ? parseFloat(employee.salary.toString()) : undefined,
        iqamaExpiryDate: formatDate(employee.iqamaExpiryDate),
        workPermitExpiryDate: formatDate(employee.workPermitExpiryDate),
        contractExpiryDate: formatDate(employee.contractExpiryDate),
        healthInsuranceExpiryDate: formatDate(employee.healthInsuranceExpiryDate),
        lifeCertificateExpiryDate: formatDate(employee.lifeCertificateExpiryDate)
      };

      // Only validate if we have some data
      if (Object.keys(employee).length > 0) {
        // Validate employee data (now async)
        const errors = await validateEmployee(cleanEmployee, i - headerRowIndex);
        allErrors.push(...errors);

        // Add employee to list regardless of errors (for preview and editing)
        // Mark employee with error status for UI handling
        const employeeWithStatus = {
          ...cleanEmployee,
          hasErrors: errors.length > 0,
          errorFields: errors.map(e => e.field),
          rowIndex: i - headerRowIndex
        };

        employees.push(employeeWithStatus);

        console.log(`Row ${i}: ${errors.length} errors, employee:`, cleanEmployee); // Debug log
      }
    }

    console.log(`Final result: ${employees.length} valid employees, ${allErrors.length} total errors`); // Debug log

    return NextResponse.json({
      success: true,
      data: employees,
      errors: allErrors,
      totalRows: rawData.length - headerRowIndex - 1,
      validRows: employees.length,
      errorRows: allErrors.filter((e, i, arr) =>
        arr.findIndex(err => err.row === e.row) === i
      ).length,
      debug: {
        headerRowIndex,
        totalRawRows: rawData.length,
        mappedHeaders,
        sampleData: rawData.slice(headerRowIndex, headerRowIndex + 3)
      }
    });

  } catch (error) {
    console.error('Error parsing Excel file:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في تحليل ملف Excel' },
      { status: 500 }
    );
  }
}
