import { NextRequest, NextResponse } from 'next/server';
import { EmployeeModel } from '@/lib/models/Employee';
import { InstitutionModel } from '@/lib/models/Institution';
import { executeQuery, generateId, formatDateForMySQL, getDocumentStatus } from '@/lib/db';
import { z } from 'zod';

// Validation schema for document upload
const documentSchema = z.object({
  entityType: z.enum(['employee', 'institution']),
  entityId: z.string().min(1, 'Entity ID is required'),
  documentType: z.string().min(1, 'Document type is required'),
  fileName: z.string().min(1, 'File name is required'),
  filePath: z.string().optional(),
  fileUrl: z.string().optional(),
  expiryDate: z.string().optional().nullable(),
  originalName: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional()
});

// GET /api/documents - Get documents with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type') as 'employee' | 'institution' | null;
    const entityId = searchParams.get('entity_id');
    const documentType = searchParams.get('document_type');
    const expiring = searchParams.get('expiring') === 'true';
    const expired = searchParams.get('expired') === 'true';
    const days = searchParams.get('days');

    let query = '';
    let values: any[] = [];

    if (entityType === 'employee') {
      query = `
        SELECT
          ed.id, ed.employee_id as entityId, 'employee' as entityType,
          ed.document_type as documentType, ed.file_name as fileName,
          ed.file_path as filePath, ed.file_url as fileUrl,
          ed.expiry_date as expiryDate, ed.status,
          ed.upload_date as uploadDate, ed.created_at as createdAt,
          e.name as entityName
        FROM employee_documents ed
        JOIN employees e ON ed.employee_id = e.id
        WHERE 1=1
      `;

      if (entityId) {
        query += ' AND ed.employee_id = ?';
        values.push(entityId);
      }

      if (documentType) {
        query += ' AND ed.document_type = ?';
        values.push(documentType);
      }

      if (expiring) {
        const expiringDays = days ? parseInt(days) : 30;
        query += ' AND ed.expiry_date IS NOT NULL AND ed.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY) AND ed.expiry_date > CURDATE()';
        values.push(expiringDays);
      }

      if (expired) {
        query += ' AND ed.expiry_date IS NOT NULL AND ed.expiry_date <= CURDATE()';
      }

    } else if (entityType === 'institution') {
      query = `
        SELECT
          id.id, id.institution_id as entityId, 'institution' as entityType,
          id.document_type as documentType, id.name as fileName,
          id.file_path as filePath, id.file_url as fileUrl,
          NULL as expiryDate, 'active' as status,
          id.upload_date as uploadDate, id.created_at as createdAt,
          i.name as entityName
        FROM institution_documents id
        JOIN institutions i ON id.institution_id = i.id
        WHERE 1=1
      `;

      if (entityId) {
        query += ' AND id.institution_id = ?';
        values.push(entityId);
      }

      if (documentType) {
        query += ' AND id.document_type = ?';
        values.push(documentType);
      }

    } else {
      // Get all documents from both tables
      query = `
        SELECT
          ed.id, ed.employee_id as entityId, 'employee' as entityType,
          ed.document_type as documentType, ed.file_name as fileName,
          ed.file_path as filePath, ed.file_url as fileUrl,
          ed.expiry_date as expiryDate, ed.status,
          ed.upload_date as uploadDate, ed.created_at as createdAt,
          e.name as entityName
        FROM employee_documents ed
        JOIN employees e ON ed.employee_id = e.id

        UNION ALL

        SELECT
          id.id, id.institution_id as entityId, 'institution' as entityType,
          id.document_type as documentType, id.name as fileName,
          id.file_path as filePath, id.file_url as fileUrl,
          NULL as expiryDate, 'active' as status,
          id.upload_date as uploadDate, id.created_at as createdAt,
          i.name as entityName
        FROM institution_documents id
        JOIN institutions i ON id.institution_id = i.id
      `;

      if (expiring) {
        const expiringDays = days ? parseInt(days) : 30;
        query = `
          SELECT * FROM (${query}) as all_docs
          WHERE expiryDate IS NOT NULL
          AND expiryDate <= DATE_ADD(CURDATE(), INTERVAL ${expiringDays} DAY)
          AND expiryDate > CURDATE()
        `;
      }

      if (expired) {
        query = `
          SELECT * FROM (${query}) as all_docs
          WHERE expiryDate IS NOT NULL
          AND expiryDate <= CURDATE()
        `;
      }
    }

    query += ' ORDER BY createdAt DESC';

    const documents = await executeQuery(query, values);

    return NextResponse.json({
      success: true,
      data: documents,
      count: documents.length
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch documents',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/documents - Upload/Create new document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received document data:', body);

    // Validate request body
    const validationResult = documentSchema.safeParse(body);
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error.flatten().fieldErrors);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const documentData = validationResult.data;

    // Verify entity exists
    if (documentData.entityType === 'employee') {
      const employee = await EmployeeModel.findById(documentData.entityId);
      if (!employee) {
        return NextResponse.json(
          { success: false, error: 'Employee not found' },
          { status: 404 }
        );
      }

      // Add document to employee
      const newDocument = await EmployeeModel.addDocument(documentData.entityId, {
        documentType: documentData.documentType as any,
        fileName: documentData.fileName,
        filePath: documentData.filePath,
        fileUrl: documentData.fileUrl,
        expiryDate: documentData.expiryDate
      });

      return NextResponse.json(
        {
          success: true,
          data: newDocument,
          message: 'Employee document uploaded successfully'
        },
        { status: 201 }
      );

    } else if (documentData.entityType === 'institution') {
      const institution = await InstitutionModel.findById(documentData.entityId);
      if (!institution) {
        return NextResponse.json(
          { success: false, error: 'Institution not found' },
          { status: 404 }
        );
      }

      // Add document to institution
      const newDocument = await InstitutionModel.addDocument(documentData.entityId, {
        name: documentData.fileName,
        filePath: documentData.filePath,
        fileUrl: documentData.fileUrl,
        documentType: documentData.documentType as any
      });

      return NextResponse.json(
        {
          success: true,
          data: newDocument,
          message: 'Institution document uploaded successfully'
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Invalid entity type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload document',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}