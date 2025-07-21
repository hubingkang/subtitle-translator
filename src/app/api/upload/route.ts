import { NextRequest, NextResponse } from 'next/server';
import { SubtitleParser } from '@/lib/subtitle-parser';
import { LanguageDetector } from '@/lib/language-detector';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedExtensions = ['.srt', '.vtt', '.ass', '.ssa'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Unsupported file type. Allowed types: ${allowedExtensions.join(', ')}` },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    // Validate subtitle content
    const validation = SubtitleParser.validateSubtitleContent(content);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: `Invalid subtitle file: ${validation.error}` },
        { status: 400 }
      );
    }

    // Parse subtitle file
    const parsedSubtitle = SubtitleParser.parseSubtitle(content, file.name);
    
    // Get statistics
    const statistics = SubtitleParser.getStatistics(parsedSubtitle.entries);

    // Extract text for language detection
    const textEntries = SubtitleParser.extractTextForTranslation(parsedSubtitle.entries);
    
    // Detect language
    const detectedLanguage = LanguageDetector.detectLanguageFromEntries(textEntries);
    const detectedLanguageName = detectedLanguage ? LanguageDetector.getLanguageName(detectedLanguage) : null;
    const confidence = detectedLanguage ? LanguageDetector.getDetectionConfidence(textEntries.join(' ')) : 0;

    // Prepare response
    const response = {
      subtitle: {
        name: parsedSubtitle.name,
        format: parsedSubtitle.format,
        entries: parsedSubtitle.entries
      },
      statistics,
      detectedLanguage: detectedLanguage ? {
        code: detectedLanguage,
        name: detectedLanguageName,
        confidence
      } : null,
      textEntries // For translation
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('File upload error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process subtitle file' 
      },
      { status: 500 }
    );
  }
}