import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { TranslationRequest, TranslationResult, TranslationProgress, AIProvider } from '@/types/translation';
import { configManager } from './config-manager';

export class Translator {
  private abortController?: AbortController;

  /**
   * Create AI model instance based on provider
   */
  private createModel(provider: AIProvider, modelName: string) {
    switch (provider.name.toLowerCase()) {
      case 'openai':
        const openaiClient = createOpenAI({
          apiKey: provider.apiKey,
          baseURL: provider.baseURL || undefined
        });
        return openaiClient(modelName);
      
      case 'anthropic':
        const anthropicClient = createAnthropic({
          apiKey: provider.apiKey,
          baseURL: provider.baseURL || undefined
        });
        return anthropicClient(modelName);
      
      case 'google':
      case 'google ai':
        const googleClient = createGoogleGenerativeAI({
          apiKey: provider.apiKey,
          baseURL: provider.baseURL || undefined
        });
        return googleClient(modelName);
      
      default:
        throw new Error(`Unsupported AI provider: ${provider.name}`);
    }
  }

  /**
   * Translate a single text
   */
  private async translateSingle(request: TranslationRequest): Promise<TranslationResult> {
    const config = configManager.getConfig();
    const provider = config.providers[request.provider];
    
    if (!provider) {
      throw new Error(`Provider ${request.provider} not found in configuration`);
    }

    const model = this.createModel(provider, request.model);

    const prompt = `Translate the following text from ${request.sourceLanguage} to ${request.targetLanguage}. 
Only return the translation, no explanations or additional text:

${request.text}`;

    try {
      const result = await generateText({
        model,
        prompt,
        temperature: 0.3,
        maxTokens: 2000,
        abortSignal: this.abortController?.signal
      });

      return {
        originalText: request.text,
        translatedText: result.text.trim(),
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Translation cancelled by user');
        }
        throw new Error(`Translation failed: ${error.message}`);
      }
      throw new Error('Translation failed: Unknown error');
    }
  }

  /**
   * Translate multiple texts with concurrency control
   */
  public async translateBatch(
    texts: string[],
    sourceLanguage: string,
    targetLanguage: string,
    provider: string,
    model: string,
    onProgress?: (progress: TranslationProgress) => void
  ): Promise<TranslationResult[]> {
    this.abortController = new AbortController();
    
    const config = configManager.getConfig();
    const concurrency = config.concurrency || 3;
    const maxRetries = config.maxRetries || 2;
    
    const results: TranslationResult[] = new Array(texts.length);
    const failed: number[] = [];
    let completed = 0;

    // Create translation requests
    const requests: TranslationRequest[] = texts.map(text => ({
      text,
      sourceLanguage,
      targetLanguage,
      provider,
      model
    }));

    // Progress tracking
    const updateProgress = (currentText?: string) => {
      onProgress?.({
        total: texts.length,
        completed,
        failed: failed.length,
        current: currentText
      });
    };

    updateProgress();

    // Process with concurrency control
    const processWithRetry = async (index: number, retryCount = 0): Promise<void> => {
      try {
        updateProgress(requests[index].text.substring(0, 50) + '...');
        
        const result = await this.translateSingle(requests[index]);
        results[index] = result;
        completed++;
        updateProgress();
      } catch (error) {
        if (retryCount < maxRetries) {
          // Retry with exponential backoff
          const delay = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return processWithRetry(index, retryCount + 1);
        } else {
          // Max retries reached, mark as failed
          failed.push(index);
          results[index] = {
            originalText: requests[index].text,
            translatedText: `[Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}]`,
            sourceLanguage,
            targetLanguage
          };
          completed++;
          updateProgress();
        }
      }
    };

    // Create worker pool
    const workers: Promise<void>[] = [];
    let currentIndex = 0;

    const createWorker = async (): Promise<void> => {
      while (currentIndex < requests.length) {
        const index = currentIndex++;
        await processWithRetry(index);
      }
    };

    // Start concurrent workers
    for (let i = 0; i < Math.min(concurrency, requests.length); i++) {
      workers.push(createWorker());
    }

    // Wait for all workers to complete
    await Promise.all(workers);

    if (failed.length > 0) {
      console.warn(`${failed.length} translations failed after ${maxRetries} retries`);
    }

    return results;
  }

  /**
   * Cancel ongoing translation
   */
  public cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Test connection to AI provider
   */
  public async testConnection(provider: string, model: string): Promise<{ success: boolean; error?: string }> {
    try {
      const testRequest: TranslationRequest = {
        text: 'Hello, world!',
        sourceLanguage: 'eng',
        targetLanguage: 'spa',
        provider,
        model
      };

      await this.translateSingle(testRequest);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Estimate translation cost (tokens)
   */
  public estimateTokens(texts: string[]): number {
    // Rough estimation: 1 token ≈ 4 characters for input + similar for output
    const inputTokens = texts.reduce((sum, text) => sum + Math.ceil(text.length / 4), 0);
    const outputTokens = inputTokens; // Assume similar output length
    const promptTokens = texts.length * 50; // Rough estimate for prompt overhead
    
    return inputTokens + outputTokens + promptTokens;
  }

  /**
   * Get supported models for provider
   */
  public static getSupportedModels(provider: string): string[] {
    const config = configManager.getConfig();
    return config.providers[provider]?.models || [];
  }

  /**
   * Validate translation request
   */
  public static validateRequest(request: TranslationRequest): { isValid: boolean; error?: string } {
    if (!request.text?.trim()) {
      return { isValid: false, error: 'Text is required' };
    }

    if (!request.sourceLanguage) {
      return { isValid: false, error: 'Source language is required' };
    }

    if (!request.targetLanguage) {
      return { isValid: false, error: 'Target language is required' };
    }

    if (request.sourceLanguage === request.targetLanguage) {
      return { isValid: false, error: 'Source and target languages cannot be the same' };
    }

    if (!request.provider) {
      return { isValid: false, error: 'Provider is required' };
    }

    if (!request.model) {
      return { isValid: false, error: 'Model is required' };
    }

    const config = configManager.getConfig();
    if (!config.providers[request.provider]) {
      return { isValid: false, error: 'Invalid provider' };
    }

    if (!configManager.isProviderConfigured(request.provider)) {
      return { isValid: false, error: 'Provider is not configured' };
    }

    return { isValid: true };
  }
}