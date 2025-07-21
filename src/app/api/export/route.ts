import { NextRequest, NextResponse } from 'next/server';
import { SubtitleParser } from '@/lib/subtitle-parser';
import { SubtitleEntry, OutputFormat } from '@/types/translation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      entries, 
      format = 'srt', 
      layout = 'original-top', 
      filename = 'translated-subtitles' 
    }: {
      entries: SubtitleEntry[];
      format: OutputFormat;
      layout: 'original-top' | 'translation-top';
      filename: string;
    } = body;

    // Validate request
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: 'Subtitle entries are required' },
        { status: 400 }
      );
    }

    // Validate entries structure
    const hasValidEntries = entries.every(entry => 
      typeof entry.startTime === 'number' &&
      typeof entry.endTime === 'number' &&
      typeof entry.text === 'string'
    );

    if (!hasValidEntries) {
      return NextResponse.json(
        { error: 'Invalid subtitle entries format' },
        { status: 400 }
      );
    }

    try {
      // Generate output content
      const outputContent = SubtitleParser.generateOutput(entries, format, layout);
      
      // Determine file extension and MIME type
      const extension = format === 'vtt' ? 'vtt' : format === 'ass' ? 'ass' : 'srt';
      const mimeType = format === 'vtt' ? 'text/vtt' : 'text/plain';
      const finalFilename = `${filename}.${extension}`;

      // Return file as download
      return new Response(outputContent, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${finalFilename}"`,
          'Cache-Control': 'no-cache',
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: `Failed to generate ${format} file: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Export API error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Export service failed' 
      },
      { status: 500 }
    );
  }
}