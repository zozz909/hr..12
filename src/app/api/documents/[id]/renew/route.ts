import { NextRequest, NextResponse } from 'next/server';
import { InstitutionModel } from '@/lib/models/Institution';
import { verifyAuthToken, hasPermission } from '@/lib/auth-utils';

// PUT /api/documents/[id]/renew - Renew a document
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: إضافة التحقق من المصادقة والصلاحية لاحقاً
    // const user = await verifyAuthToken(request);
    // if (!user || !hasPermission(user, 'institutions_edit')) {
    //   return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    // }

    const documentId = params.id;
    const body = await request.json();
    const { expiryDate } = body;

    if (!expiryDate) {
      return NextResponse.json(
        { success: false, error: 'تاريخ انتهاء الصلاحية مطلوب' },
        { status: 400 }
      );
    }

    // تجديد المستند
    await InstitutionModel.renewDocument(documentId, expiryDate);

    return NextResponse.json({
      success: true,
      message: 'تم تجديد المستند بنجاح'
    });

  } catch (error) {
    console.error('Error renewing document:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء تجديد المستند' },
      { status: 500 }
    );
  }
}
