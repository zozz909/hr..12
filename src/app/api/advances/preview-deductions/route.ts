import { NextRequest, NextResponse } from 'next/server';
import { AdvanceDeductionModel } from '@/lib/models/AdvanceDeduction';
import { executeQuery } from '@/lib/db';

// GET /api/advances/preview-deductions - Preview advance deductions for all employees or specific institution
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institution_id');
    const branchId = searchParams.get('branch_id');

    // Get all active employees with advances
    let employeesQuery = `
      SELECT DISTINCT 
        e.id,
        e.name,
        e.photo_url,
        e.salary,
        e.institution_id,
        i.name as institution_name
      FROM employees e
      LEFT JOIN institutions i ON e.institution_id = i.id
      INNER JOIN advances a ON e.id = a.employee_id
      WHERE e.status = 'active' 
        AND a.status = 'approved' 
        AND a.remaining_amount > 0
    `;
    const employeesValues: any[] = [];

    if (institutionId) {
      employeesQuery += ' AND e.institution_id = ?';
      employeesValues.push(institutionId);
    }

    if (branchId) {
      employeesQuery += ' AND e.branch_id = ?';
      employeesValues.push(branchId);
    }

    employeesQuery += ' ORDER BY e.name';

    const employees = await executeQuery(employeesQuery, employeesValues);

    // Calculate deductions for each employee
    const deductionPreview = [];
    let totalDeductions = 0;

    for (const employee of employees) {
      const monthlyDeduction = await AdvanceDeductionModel.calculateTotalMonthlyDeduction(employee.id);
      const activeAdvances = await AdvanceDeductionModel.getActiveAdvancesForEmployee(employee.id);

      if (monthlyDeduction > 0) {
        deductionPreview.push({
          employeeId: employee.id,
          employeeName: employee.name,
          employeePhotoUrl: employee.photo_url,
          salary: parseFloat(employee.salary || 0),
          institutionName: employee.institution_name,
          monthlyDeduction: monthlyDeduction,
          activeAdvancesCount: activeAdvances.length,
          activeAdvances: activeAdvances.map(advance => ({
            advanceId: advance.advanceId,
            totalAmount: advance.totalAmount,
            remainingAmount: advance.remainingAmount,
            monthlyDeduction: advance.monthlyDeduction
          }))
        });

        totalDeductions += monthlyDeduction;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        employees: deductionPreview,
        summary: {
          totalEmployees: deductionPreview.length,
          totalDeductions: Math.round(totalDeductions * 100) / 100,
          averageDeduction: deductionPreview.length > 0 ? 
            Math.round((totalDeductions / deductionPreview.length) * 100) / 100 : 0
        }
      }
    });

  } catch (error) {
    console.error('Error previewing advance deductions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to preview advance deductions' },
      { status: 500 }
    );
  }
}
