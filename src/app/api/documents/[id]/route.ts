import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, getDocumentStatus, formatDateForMySQL } from '@/lib/db';
import { z } from 'zod';

// Validation schema for document updates
const updateDocumentSchema = z.object({
  fileName: z.string().min(1, 'File name is required').optional(),
  filePath: z.string().optional(),
  fileUrl: z.string().optional(), // Changed from url() to string() to allow local paths
  expiryDate: z.string().optional(),
  documentType: z.string().optional()
});

// GET /api/documents/[id] - Get specific document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Try to find in employee documents first
    let query = `
      SELECT
        ed.id, ed.employee_id as entityId, 'employee' as entityType,
        ed.document_type as documentType, ed.file_name as fileName,
        ed.file_path as filePath, ed.file_url as fileUrl,
        ed.expiry_date as expiryDate, ed.status,
        ed.upload_date as uploadDate, ed.created_at as createdAt,
        e.name as entityName
      FROM employee_documents ed
      JOIN employees e ON ed.employee_id = e.id
      WHERE ed.id = ?
    `;

    let results = await executeQuery(query, [id]);

    if (results.length === 0) {
      // Try institution documents
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
        WHERE id.id = ?
      `;

      results = await executeQuery(query, [id]);
    }

    if (results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: results[0]
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch document',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/documents/[id] - Update specific document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = updateDocumentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // First, determine if this is an employee or institution document
    let checkQuery = 'SELECT id FROM employee_documents WHERE id = ?';
    let checkResults = await executeQuery(checkQuery, [id]);
    let isEmployeeDoc = checkResults.length > 0;

    if (!isEmployeeDoc) {
      checkQuery = 'SELECT id FROM institution_documents WHERE id = ?';
      checkResults = await executeQuery(checkQuery, [id]);
      if (checkResults.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Document not found' },
          { status: 404 }
        );
      }
    }

    // Build update query based on document type
    const updateFields: string[] = [];
    const values: any[] = [];

    if (isEmployeeDoc) {
      if (updateData.fileName !== undefined) {
        updateFields.push('file_name = ?');
        values.push(updateData.fileName);
      }
      if (updateData.filePath !== undefined) {
        updateFields.push('file_path = ?');
        values.push(updateData.filePath);
      }
      if (updateData.fileUrl !== undefined) {
        updateFields.push('file_url = ?');
        values.push(updateData.fileUrl);
      }
      if (updateData.expiryDate !== undefined) {
        updateFields.push('expiry_date = ?');
        values.push(formatDateForMySQL(updateData.expiryDate));

        // Update status based on expiry date
        const status = updateData.expiryDate ? getDocumentStatus(updateData.expiryDate) : 'active';
        updateFields.push('status = ?');
        values.push(status);
      }
      if (updateData.documentType !== undefined) {
        updateFields.push('document_type = ?');
        values.push(updateData.documentType);
      }

      if (updateFields.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No fields to update' },
          { status: 400 }
        );
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const query = `UPDATE employee_documents SET ${updateFields.join(', ')} WHERE id = ?`;
      await executeQuery(query, values);

    } else {
      // Institution document
      if (updateData.fileName !== undefined) {
        updateFields.push('name = ?');
        values.push(updateData.fileName);
      }
      if (updateData.filePath !== undefined) {
        updateFields.push('file_path = ?');
        values.push(updateData.filePath);
      }
      if (updateData.fileUrl !== undefined) {
        updateFields.push('file_url = ?');
        values.push(updateData.fileUrl);
      }
      if (updateData.documentType !== undefined) {
        updateFields.push('document_type = ?');
        values.push(updateData.documentType);
      }

      if (updateFields.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No fields to update' },
          { status: 400 }
        );
      }

      values.push(id);
      const query = `UPDATE institution_documents SET ${updateFields.join(', ')} WHERE id = ?`;
      await executeQuery(query, values);
    }

    // Fetch and return updated document
    const updatedDocument = await GET(request, { params });
    const updatedData = await updatedDocument.json();

    return NextResponse.json({
      success: true,
      data: updatedData.data,
      message: 'Document updated successfully'
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update document',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - Delete specific document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // First, determine if this is an employee or institution document
    let checkQuery = 'SELECT id FROM employee_documents WHERE id = ?';
    let checkResults = await executeQuery(checkQuery, [id]);
    let isEmployeeDoc = checkResults.length > 0;

    if (!isEmployeeDoc) {
      checkQuery = 'SELECT id FROM institution_documents WHERE id = ?';
      checkResults = await executeQuery(checkQuery, [id]);
      if (checkResults.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Document not found' },
          { status: 404 }
        );
      }
    }

    // Delete the document
    let deleteQuery: string;
    if (isEmployeeDoc) {
      deleteQuery = 'DELETE FROM employee_documents WHERE id = ?';
    } else {
      deleteQuery = 'DELETE FROM institution_documents WHERE id = ?';
    }

    const result = await executeQuery(deleteQuery, [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete document',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}