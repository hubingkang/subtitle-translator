import { NextRequest, NextResponse } from 'next/server';
import { Translator } from '@/lib/translator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      texts, 
      sourceLanguage, 
      targetLanguage, 
      provider, 
      model 
    } = body;

    // Validate request
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: 'Texts array is required and cannot be empty' },
        { status: 400 }
      );
    }

    if (!sourceLanguage || !targetLanguage || !provider || !model) {
      return NextResponse.json(
        { error: 'Missing required parameters: sourceLanguage, targetLanguage, provider, model' },
        { status: 400 }
      );
    }

    // Validate individual translation request
    const validationResult = Translator.validateRequest({
      text: texts[0], // Validate using first text as sample
      sourceLanguage,
      targetLanguage,
      provider,
      model
    });

    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }

    const translator = new Translator();

    // For streaming progress, we'll use Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const results = await translator.translateBatch(
            texts,
            sourceLanguage,
            targetLanguage,
            provider,
            model,
            (progress) => {
              // Send progress updates
              const data = `data: ${JSON.stringify({ type: 'progress', data: progress })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          );

          // Send final results
          const finalData = `data: ${JSON.stringify({ type: 'complete', data: results })}\n\n`;
          controller.enqueue(encoder.encode(finalData));
          
          controller.close();
        } catch (error) {
          const errorData = `data: ${JSON.stringify({ 
            type: 'error', 
            error: error instanceof Error ? error.message : 'Translation failed' 
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
      cancel() {
        // Cancel translation if stream is cancelled
        translator.cancel();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Translation API error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Translation service failed' 
      },
      { status: 500 }
    );
  }
}

// Test connection endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');
    const model = searchParams.get('model');

    if (!provider || !model) {
      return NextResponse.json(
        { error: 'Provider and model parameters are required' },
        { status: 400 }
      );
    }

    const translator = new Translator();
    const result = await translator.testConnection(provider, model);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Connection test error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection test failed' 
      },
      { status: 500 }
    );
  }
}