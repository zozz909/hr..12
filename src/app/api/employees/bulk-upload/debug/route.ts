import { NextRequest, NextResponse } from 'next/server';

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
    const decoder = new TextDecoder('utf-8');
    let text = decoder.decode(buffer);
    
    // Remove BOM if present
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
    }
    
    // Split into lines
    const lines = text.split('\n');
    
    // Analyze the file structure
    const analysis = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      totalLines: lines.length,
      nonEmptyLines: lines.filter(line => line.trim()).length,
      firstFiveLines: lines.slice(0, 5),
      lastFiveLines: lines.slice(-5),
      separatorAnalysis: {
        commas: (lines[0]?.match(/,/g) || []).length,
        tabs: (lines[0]?.match(/\t/g) || []).length,
        semicolons: (lines[0]?.match(/;/g) || []).length
      },
      encoding: {
        hasBOM: text.charCodeAt(0) === 0xFEFF,
        hasArabic: /[\u0600-\u06FF]/.test(text),
        firstCharCode: text.charCodeAt(0)
      }
    };

    // Try to parse each line
    const parsedLines = lines.slice(0, 10).map((line, index) => {
      const tabSplit = line.split('\t');
      const commaSplit = line.split(',');
      
      return {
        lineNumber: index + 1,
        originalLine: line,
        tabSplit: tabSplit.length > 1 ? tabSplit : null,
        commaSplit: commaSplit.length > 1 ? commaSplit : null,
        isEmpty: line.trim() === '',
        hasArabic: /[\u0600-\u06FF]/.test(line)
      };
    });

    return NextResponse.json({
      success: true,
      analysis,
      parsedLines
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في تحليل الملف للتشخيص' },
      { status: 500 }
    );
  }
}
