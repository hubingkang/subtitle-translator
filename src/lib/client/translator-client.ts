import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import {
  TranslationRequest,
  TranslationResult,
  TranslationProgress,
  AIProvider,
} from '@/types/translation'
import { configManager } from '../config-manager'

export class TranslatorClient {
  private abortController?: AbortController

  /**
   * Create AI model instance based on provider
   */
  private createModel(
    providerId: string,
    provider: AIProvider,
    modelName: string
  ) {
    // Determine provider type based on baseURL and provider ID for built-in providers
    let providerType = 'openai' // default to OpenAI-compatible

    if (
      providerId === 'anthropic' ||
      provider.baseURL?.includes('anthropic.com')
    ) {
      providerType = 'anthropic'
    } else if (
      providerId === 'google' ||
      provider.baseURL?.includes('googleapis.com')
    ) {
      providerType = 'google'
    } else if (
      providerId === 'openai' ||
      provider.baseURL?.includes('openai.com') ||
      providerId === 'siliconflow' ||
      provider.baseURL?.includes('siliconflow.cn') ||
      provider.isCustom
    ) {
      providerType = 'openai' // OpenAI-compatible (includes SiliconFlow and custom providers)
    }

    switch (providerType) {
      case 'openai':
        const openaiClient = createOpenAI({
          apiKey: provider.apiKey,
          baseURL: provider.baseURL || undefined,
        })
        return openaiClient(modelName)

      case 'anthropic':
        const anthropicClient = createAnthropic({
          apiKey: provider.apiKey,
          baseURL: provider.baseURL || undefined,
        })
        return anthropicClient(modelName)

      case 'google':
        const googleClient = createGoogleGenerativeAI({
          apiKey: provider.apiKey,
          baseURL: provider.baseURL || undefined,
        })
        return googleClient(modelName)

      default:
        throw new Error(`Unsupported AI provider type: ${providerType}`)
    }
  }

  /**
   * Create enhanced translation prompt for subtitles
   */
  private createSubtitlePrompt(
    texts: string[],
    sourceLanguage: string,
    targetLanguage: string
  ): string {
    const textList = texts
      .map((text, index) => `${index + 1}. ${text}`)
      .join('\n')

    return `You are a professional subtitle translator. Translate the following ${texts.length} subtitle entries from ${sourceLanguage} to ${targetLanguage}.

IMPORTANT INSTRUCTIONS:
- Maintain the exact same number of entries in your response
- Preserve subtitle timing and formatting conventions
- Keep translations concise and readable for subtitles
- Maintain natural dialogue flow and context
- Use appropriate cultural adaptations when necessary
- Number each translation entry exactly as shown below

Subtitle entries to translate:
${textList}

Provide the translations in the same numbered format:`
  }

  /**
   * Translate a single text (legacy method for compatibility)
   */
  private async translateSingle(
    request: TranslationRequest
  ): Promise<TranslationResult> {
    const config = configManager.getConfig()
    const provider = config.providers[request.provider]

    if (!provider) {
      throw new Error(`Provider ${request.provider} not found in configuration`)
    }

    const model = this.createModel(request.provider, provider, request.model)

    const prompt = this.createSubtitlePrompt(
      [request.text],
      request.sourceLanguage,
      request.targetLanguage
    )

    try {
      const result = await generateText({
        model,
        prompt,
        temperature: 0.3,
        maxTokens: 2000,
        abortSignal: this.abortController?.signal,
      })

      // Parse the response to extract the translation
      const translatedText =
        this.parseTranslationResponse(result.text.trim(), 1)[0] ||
        result.text.trim()

      return {
        originalText: request.text,
        translatedText,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Translation cancelled by user')
        }
        throw new Error(`Translation failed: ${error.message}`)
      }
      throw new Error('Translation failed: Unknown error')
    }
  }

  /**
   * Translate a batch of subtitle texts
   */
  private async translateSubtitleBatch(
    texts: string[],
    sourceLanguage: string,
    targetLanguage: string,
    provider: string,
    model: string
  ): Promise<string[]> {
    const config = configManager.getConfig()
    const providerConfig = config.providers[provider]

    if (!providerConfig) {
      throw new Error(`Provider ${provider} not found in configuration`)
    }

    const modelInstance = this.createModel(provider, providerConfig, model)
    const prompt = this.createSubtitlePrompt(
      texts,
      sourceLanguage,
      targetLanguage
    )

    try {
      const result = await generateText({
        model: modelInstance,
        prompt,
        temperature: 0.3,
        maxTokens: 4000,
        abortSignal: this.abortController?.signal,
      })

      return this.parseTranslationResponse(result.text.trim(), texts.length)
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Translation cancelled by user')
        }
        throw new Error(`Translation failed: ${error.message}`)
      }
      throw new Error('Translation failed: Unknown error')
    }
  }

  /**
   * Parse translation response and extract individual translations
   */
  private parseTranslationResponse(
    response: string,
    expectedCount: number
  ): string[] {
    // Try to parse numbered format first
    const numberedMatches = response.match(/^\d+\.\s*(.+)$/gm)

    if (numberedMatches && numberedMatches.length === expectedCount) {
      return numberedMatches.map((match) =>
        match.replace(/^\d+\.\s*/, '').trim()
      )
    }

    // Fallback: split by lines and take first N non-empty lines
    const lines = response
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.match(/^\d+\.?\s*$/))

    if (lines.length >= expectedCount) {
      return lines.slice(0, expectedCount)
    }

    // Last resort: if we can't parse properly, return the original response split by expected count
    const result: string[] = []
    for (let i = 0; i < expectedCount; i++) {
      result.push(lines[i] || `[Translation error: Unable to parse response]`)
    }

    return result
  }

  /**
   * Translate multiple texts with intelligent batching and concurrency control
   */
  public async translateBatch(
    texts: string[],
    sourceLanguage: string,
    targetLanguage: string,
    provider: string,
    model: string,
    onProgress?: (progress: TranslationProgress) => void
  ): Promise<TranslationResult[]> {
    this.abortController = new AbortController()

    const config = configManager.getConfig()
    const concurrency = config.concurrency || 3
    const maxRetries = config.maxRetries || 2
    const batchSize = config.subtitleBatchSize || 5

    const results: TranslationResult[] = new Array(texts.length)
    const failed: number[] = []
    let processedSubtitles = 0

    // Create batches of texts
    const batches: { texts: string[]; startIndex: number }[] = []
    for (let i = 0; i < texts.length; i += batchSize) {
      const batchTexts = texts.slice(i, Math.min(i + batchSize, texts.length))
      batches.push({ texts: batchTexts, startIndex: i })
    }

    // Progress tracking
    const updateProgress = (currentBatch?: {
      texts: string[]
      startIndex: number
    }) => {
      const current = currentBatch
        ? `Subtitles ${currentBatch.startIndex + 1}-${Math.min(
            currentBatch.startIndex + currentBatch.texts.length,
            texts.length
          )}`
        : undefined

      onProgress?.({
        total: texts.length,
        completed: processedSubtitles,
        failed: failed.length,
        current,
      })
    }

    updateProgress()

    // Process batch with retry logic
    const processBatchWithRetry = async (
      batch: { texts: string[]; startIndex: number },
      retryCount = 0
    ): Promise<void> => {
      try {
        updateProgress(batch)

        const translatedTexts = await this.translateSubtitleBatch(
          batch.texts,
          sourceLanguage,
          targetLanguage,
          provider,
          model
        )

        // Map translated texts back to results array
        for (let i = 0; i < batch.texts.length; i++) {
          const resultIndex = batch.startIndex + i
          results[resultIndex] = {
            originalText: batch.texts[i],
            translatedText:
              translatedTexts[i] ||
              `[Translation failed: No response for item ${i + 1}]`,
            sourceLanguage,
            targetLanguage,
          }
        }

        processedSubtitles += batch.texts.length
        updateProgress()
      } catch (error) {
        if (retryCount < maxRetries) {
          // Retry with exponential backoff
          const delay = Math.pow(2, retryCount) * 1000
          await new Promise((resolve) => setTimeout(resolve, delay))
          return processBatchWithRetry(batch, retryCount + 1)
        } else {
          // Max retries reached, mark batch as failed
          for (let i = 0; i < batch.texts.length; i++) {
            const resultIndex = batch.startIndex + i
            failed.push(resultIndex)
            results[resultIndex] = {
              originalText: batch.texts[i],
              translatedText: `[Translation failed: ${
                error instanceof Error ? error.message : 'Unknown error'
              }]`,
              sourceLanguage,
              targetLanguage,
            }
          }
          processedSubtitles += batch.texts.length
          updateProgress()
        }
      }
    }

    // Create worker pool for batches
    const workers: Promise<void>[] = []
    let currentBatchIndex = 0

    const createWorker = async (): Promise<void> => {
      while (currentBatchIndex < batches.length) {
        const batchIndex = currentBatchIndex++
        await processBatchWithRetry(batches[batchIndex])
      }
    }

    // Start concurrent workers
    for (let i = 0; i < Math.min(concurrency, batches.length); i++) {
      workers.push(createWorker())
    }

    // Wait for all workers to complete
    await Promise.all(workers)

    if (failed.length > 0) {
      console.warn(
        `${failed.length} subtitle entries failed after ${maxRetries} retries`
      )
    }

    return results
  }

  /**
   * Cancel ongoing translation
   */
  public cancel(): void {
    if (this.abortController) {
      this.abortController.abort()
    }
  }

  /**
   * Test connection to AI provider
   */
  public async testConnection(
    provider: string,
    model: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const testRequest: TranslationRequest = {
        text: 'Hello, world!',
        sourceLanguage: 'eng',
        targetLanguage: 'spa',
        provider,
        model,
      }

      await this.translateSingle(testRequest)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Estimate translation cost (tokens)
   */
  public estimateTokens(texts: string[]): number {
    // Rough estimation: 1 token ≈ 4 characters for input + similar for output
    const inputTokens = texts.reduce(
      (sum, text) => sum + Math.ceil(text.length / 4),
      0
    )
    const outputTokens = inputTokens // Assume similar output length
    const promptTokens = texts.length * 50 // Rough estimate for prompt overhead

    return inputTokens + outputTokens + promptTokens
  }

  /**
   * Get supported models for provider
   */
  public static getSupportedModels(provider: string): string[] {
    const config = configManager.getConfig()
    return config.providers[provider]?.models || []
  }

  /**
   * Validate translation request
   */
  public static validateRequest(request: TranslationRequest): {
    isValid: boolean
    error?: string
  } {
    if (!request.text?.trim()) {
      return { isValid: false, error: 'Text is required' }
    }

    if (!request.sourceLanguage) {
      return { isValid: false, error: 'Source language is required' }
    }

    if (!request.targetLanguage) {
      return { isValid: false, error: 'Target language is required' }
    }

    if (request.sourceLanguage === request.targetLanguage) {
      return {
        isValid: false,
        error: 'Source and target languages cannot be the same',
      }
    }

    if (!request.provider) {
      return { isValid: false, error: 'Provider is required' }
    }

    if (!request.model) {
      return { isValid: false, error: 'Model is required' }
    }

    const config = configManager.getConfig()
    if (!config.providers[request.provider]) {
      return { isValid: false, error: 'Invalid provider' }
    }

    if (!configManager.isProviderConfigured(request.provider)) {
      return { isValid: false, error: 'Provider is not configured' }
    }

    return { isValid: true }
  }

  /**
   * Create a streaming response that mimics server-sent events for compatibility
   */
  public async translateBatchWithStreaming(
    texts: string[],
    sourceLanguage: string,
    targetLanguage: string,
    provider: string,
    model: string,
    onProgress?: (data: {
      type: 'progress' | 'complete' | 'error'
      data?: TranslationResult[] | TranslationProgress
      error?: string
    }) => void
  ): Promise<TranslationResult[]> {
    try {
      const results = await this.translateBatch(
        texts,
        sourceLanguage,
        targetLanguage,
        provider,
        model,
        (progress) => {
          onProgress?.({ type: 'progress', data: progress })
        }
      )

      onProgress?.({ type: 'complete', data: results })
      return results
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Translation failed'
      onProgress?.({ type: 'error', error: errorMessage })
      throw error
    }
  }
}
