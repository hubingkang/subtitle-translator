// Translation configuration and types
export interface AIProvider {
  name: string;
  apiKey: string;
  baseURL?: string;
  models: string[];
}

export interface TranslationConfig {
  providers: Record<string, AIProvider>;
  defaultProvider: string;
  defaultModel: string;
  concurrency: number;
  outputFormat: 'original-top' | 'translation-top';
  maxRetries: number;
}

export interface SubtitleEntry {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
  translatedText?: string;
}

export interface TranslationProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
}

export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  provider: string;
  model: string;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  native: string;
}

export interface SubtitleFile {
  name: string;
  content: string;
  format: string;
  entries: SubtitleEntry[];
}

export type OutputFormat = 'srt' | 'vtt' | 'ass';

export interface ExportOptions {
  format: OutputFormat;
  layout: 'original-top' | 'translation-top';
  includeTimestamps: boolean;
}