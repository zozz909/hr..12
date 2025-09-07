import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as string;
    const entityId = formData.get('entityId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!entityType || !entityId) {
      return NextResponse.json(
        { success: false, error: 'Entity type and ID are required' },
        { status: 400 }
      );
    }

    // Validate file type - PDF only for forms
    if (entityType === 'form' && file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'Only PDF files are allowed for forms' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size too large (max 10MB)' },
        { status: 400 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${entityType}_${entityId}_${timestamp}.${fileExtension}`;

    // Determine if this is an image file
    const isImage = file.type.startsWith('image/');
    const folderType = isImage ? 'images' : 'documents';

    // Create directory path
    const uploadDir = join(process.cwd(), 'public', 'uploads', folderType, entityType);

    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Full file path
    const filePath = join(uploadDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return file info
    const fileUrl = `/uploads/${folderType}/${entityType}/${fileName}`;

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        savedFileName: fileName,
        filePath: filePath,
        fileUrl: fileUrl,
        fileSize: file.size,
        mimeType: file.type
      }
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
