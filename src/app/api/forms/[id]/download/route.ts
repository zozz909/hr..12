import { NextRequest, NextResponse } from 'next/server';
import { FormModel } from '@/lib/models/Form';
import { readFile } from 'fs/promises';
import { join } from 'path';

// GET /api/forms/[id]/download - Download form file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get form details
    const form = await FormModel.findById(id);
    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Form not found' },
        { status: 404 }
      );
    }

    // Check if form has a file
    if (!form.filePath || !form.fileName) {
      return NextResponse.json(
        { success: false, error: 'No file attached to this form' },
        { status: 404 }
      );
    }

    // Read the file
    try {
      const fileBuffer = await readFile(form.filePath);
      
      // Increment download count
      await FormModel.incrementDownloadCount(id);

      // Return file with proper headers
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': form.mimeType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(form.fileName)}`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });

    } catch (fileError) {
      console.error('Error reading file:', fileError);
      return NextResponse.json(
        { success: false, error: 'File not found on server' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Error downloading form:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download form' },
      { status: 500 }
    );
  }
}
