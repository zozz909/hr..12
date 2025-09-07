import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { z } from 'zod';

// Validation schema for employee data
const employeeSchema = z.object({
  name: z.string().min(1, 'اسم الموظف مطلوب'),
  fileNumber: z.string().min(1, 'رقم الملف مطلوب'),
  phone: z.string().min(1, 'رقم الجوال مطلوب'),
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة').optional().or(z.literal('')),
  nationality: z.string().min(1, 'الجنسية مطلوبة'),
  position: z.string().optional(),
  institution: z.string().optional(),
  salary: z.number().optional(),
  iqamaExpiryDate: z.string().optional(),
  workPermitExpiryDate: z.string().optional(),
  contractExpiryDate: z.string().optional(),
  healthInsuranceExpiryDate: z.string().optional(),
  lifeCertificateExpiryDate: z.string().optional()
});

const bulkUploadSchema = z.object({
  employees: z.array(employeeSchema)
});

interface UploadResult {
  success: boolean;
  processed: number;
  created: number;
  updated: number;
  errors: number;
  errorDetails: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = bulkUploadSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'بيانات غير صحيحة',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { employees } = validationResult.data;
    
    const result: UploadResult = {
      success: true,
      processed: 0,
      created: 0,
      updated: 0,
      errors: 0,
      errorDetails: []
    };

    // Process each employee
    for (const employee of employees) {
      try {
        result.processed++;

        // Check if employee exists by file number
        const existingEmployee = await executeQuery(
          'SELECT id FROM employees WHERE file_number = ?',
          [employee.fileNumber]
        );

        // Handle institution assignment
        let institutionId = null;
        let unsponsoredReason = null;
        let institutionName = employee.institution;

        if (employee.institution === 'غير مكفول' || !employee.institution) {
          institutionId = null;
          unsponsoredReason = 'new';
          institutionName = 'غير مكفول';
        } else if (employee.institution) {
          // Try to find institution by name (exact match)
          const institutionResult = await executeQuery(
            'SELECT id, name FROM institutions WHERE name = ? AND status = "active"',
            [employee.institution]
          );

          if (institutionResult.length > 0) {
            institutionId = institutionResult[0].id;
            institutionName = institutionResult[0].name;
            console.log(`Found institution: ${institutionName} with ID: ${institutionId}`);
          } else {
            // Institution not found - this will be handled as validation error
            console.log(`Institution not found: ${employee.institution}`);
          }
        }

        const employeeData = {
          name: employee.name,
          file_number: employee.fileNumber,
          mobile: employee.phone,
          email: employee.email || null,
          nationality: employee.nationality,
          position: employee.position || null,
          institution: institutionName,
          institution_id: institutionId,
          unsponsored_reason: unsponsoredReason,
          salary: employee.salary || null,
          iqama_expiry: employee.iqamaExpiryDate || null,
          work_permit_expiry: employee.workPermitExpiryDate || null,
          contract_expiry: employee.contractExpiryDate || null,
          health_insurance_expiry: employee.healthInsuranceExpiryDate || null,
          health_cert_expiry: employee.lifeCertificateExpiryDate || null,
          status: 'active',
          updated_at: new Date().toISOString()
        };

        if (existingEmployee.length > 0) {
          // Update existing employee
          const updateFields = Object.keys(employeeData)
            .filter(key => key !== 'file_number')
            .map(key => `${key} = ?`)
            .join(', ');

          const updateValues = Object.values(employeeData)
            .filter((_, index) => Object.keys(employeeData)[index] !== 'file_number');

          await executeQuery(
            `UPDATE employees SET ${updateFields} WHERE file_number = ?`,
            [...updateValues, employee.fileNumber]
          );

          result.updated++;
        } else {
          // Create new employee
          const employeeId = `emp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

          await executeQuery(
            `INSERT INTO employees (
              id, name, file_number, mobile, email, nationality, position,
              institution, institution_id, unsponsored_reason, salary,
              iqama_expiry, work_permit_expiry, contract_expiry,
              health_insurance_expiry, health_cert_expiry,
              status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              employeeId,
              employeeData.name,
              employeeData.file_number,
              employeeData.mobile,
              employeeData.email,
              employeeData.nationality,
              employeeData.position,
              employeeData.institution,
              employeeData.institution_id,
              employeeData.unsponsored_reason,
              employeeData.salary,
              employeeData.iqama_expiry,
              employeeData.work_permit_expiry,
              employeeData.contract_expiry,
              employeeData.health_insurance_expiry,
              employeeData.health_cert_expiry,
              employeeData.status,
              new Date().toISOString(),
              employeeData.updated_at
            ]
          );

          result.created++;
        }

      } catch (error) {
        console.error(`Error processing employee ${employee.name}:`, error);
        result.errors++;
        result.errorDetails.push(`خطأ في معالجة الموظف ${employee.name}: ${error}`);
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in bulk upload:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في رفع البيانات' },
      { status: 500 }
    );
  }
}
