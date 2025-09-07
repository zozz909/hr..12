import { NextRequest, NextResponse } from 'next/server';
import { PayrollModel } from '@/lib/models/Payroll';

// GET /api/payroll/[id]/export/pdf - Export payroll run to PDF
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get payroll run and entries
    const payrollRun = await PayrollModel.findRunById(id);
    if (!payrollRun) {
      return NextResponse.json(
        { success: false, error: 'Payroll run not found' },
        { status: 404 }
      );
    }

    const entries = await PayrollModel.getPayrollEntries(id);

    // Create HTML content for PDF printing
    const htmlContent = generatePayrollHTML(payrollRun, entries);

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="payroll_${payrollRun.month}.html"`,
      },
    });

  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export to PDF' },
      { status: 500 }
    );
  }
}

// Helper functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR'
  }).format(amount);
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}

// Generate HTML content for PDF printing
function generatePayrollHTML(payrollRun: any, entries: any[]): string {
  const monthName = formatMonth(payrollRun.month);
  const institutionName = payrollRun.institutionName || 'جميع المؤسسات';

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مسير الرواتب - ${monthName}</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 20px;
            background: white;
            color: #333;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }

        .header h1 {
            font-size: 24px;
            margin: 0;
            color: #2563eb;
        }

        .header .details {
            margin-top: 10px;
            font-size: 14px;
            color: #666;
        }

        .summary {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
        }

        .summary-item {
            text-align: center;
        }

        .summary-item .label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
        }

        .summary-item .value {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 12px;
        }

        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
        }

        th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #333;
        }

        .employee-name {
            text-align: right;
            font-weight: bold;
        }

        .positive { color: #16a34a; }
        .negative { color: #dc2626; }
        .total-row {
            background-color: #f1f5f9;
            font-weight: bold;
        }

        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 10px;
            color: #666;
        }

        .print-button {
            background: #2563eb;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 20px auto;
            display: block;
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">طباعة التقرير</button>

    <div class="header">
        <h1>مسير الرواتب</h1>
        <div class="details">
            <div>الشهر: ${monthName}</div>
            <div>المؤسسة: ${institutionName}</div>
            <div>تاريخ التنفيذ: ${new Date(payrollRun.runDate).toLocaleDateString('ar-SA')}</div>
        </div>
    </div>

    <div class="summary">
        <div class="summary-item">
            <div class="label">عدد الموظفين</div>
            <div class="value">${payrollRun.totalEmployees}</div>
        </div>
        <div class="summary-item">
            <div class="label">إجمالي الرواتب</div>
            <div class="value">${formatCurrency(payrollRun.totalGross)}</div>
        </div>
        <div class="summary-item">
            <div class="label">إجمالي الخصومات</div>
            <div class="value negative">${formatCurrency(payrollRun.totalDeductions)}</div>
        </div>
        <div class="summary-item">
            <div class="label">صافي الرواتب</div>
            <div class="value positive">${formatCurrency(payrollRun.totalNet)}</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>الموظف</th>
                <th>الراتب الأساسي</th>
                <th>المكافآت</th>
                <th>الخصومات</th>
                <th>خصم السلف</th>
                <th>الراتب الإجمالي</th>
                <th>صافي الراتب</th>
            </tr>
        </thead>
        <tbody>
            ${entries.map(entry => `
                <tr>
                    <td class="employee-name">${entry.employeeName || 'غير محدد'}</td>
                    <td>${formatCurrency(entry.baseSalary)}</td>
                    <td class="positive">${entry.rewards > 0 ? formatCurrency(entry.rewards) : '-'}</td>
                    <td class="negative">${entry.deductions > 0 ? formatCurrency(entry.deductions) : '-'}</td>
                    <td class="negative">${entry.advanceDeduction > 0 ? formatCurrency(entry.advanceDeduction) : '-'}</td>
                    <td>${formatCurrency(entry.grossPay)}</td>
                    <td class="positive">${formatCurrency(entry.netPay)}</td>
                </tr>
            `).join('')}
            <tr class="total-row">
                <td class="employee-name">الإجمالي</td>
                <td>${formatCurrency(entries.reduce((sum, e) => sum + e.baseSalary, 0))}</td>
                <td class="positive">${formatCurrency(entries.reduce((sum, e) => sum + e.rewards, 0))}</td>
                <td class="negative">${formatCurrency(entries.reduce((sum, e) => sum + e.deductions, 0))}</td>
                <td class="negative">${formatCurrency(entries.reduce((sum, e) => sum + e.advanceDeduction, 0))}</td>
                <td>${formatCurrency(entries.reduce((sum, e) => sum + e.grossPay, 0))}</td>
                <td class="positive">${formatCurrency(entries.reduce((sum, e) => sum + e.netPay, 0))}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        تم إنشاء هذا التقرير في ${new Date().toLocaleDateString('ar-SA')} - نظام إدارة الموارد البشرية
    </div>
</body>
</html>
  `;
}
