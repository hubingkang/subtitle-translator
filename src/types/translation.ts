// Translation configuration and types
export interface AIProvider {
  id?: string
  name: string
  apiKey: string
  baseURL?: string
  models: string[]
  defaultModel?: string
  selectedModel?: string
  isCustom?: boolean
}

export interface TranslationConfig {
  providers: Record<string, AIProvider>
  defaultProvider: string
  defaultModel: string
  concurrency: number
  outputFormat: 'original-top' | 'translation-top'
  maxRetries: number
  subtitleBatchSize: number
}

export interface SubtitleEntry {
  id: number
  startTime: number
  endTime: number
  text: string
  translatedText?: string
}

export interface TranslationProgress {
  total: number
  completed: number
  failed: number
  current?: string
}

export interface TranslationRequest {
  text: string
  sourceLanguage: string
  targetLanguage: string
  provider: string
  model: string
}

export interface TranslationResult {
  originalText: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
}

export interface LanguageOption {
  code: string
  name: string
  native: string
}

export interface SubtitleFile {
  id: string
  name: string
  content: string
  format: string
  entries: SubtitleEntry[]
  textEntries: string[]
  sourceLanguage?: string
  targetLanguage?: string
  translatedEntries?: SubtitleEntry[]
  progress?: TranslationProgress
  isTranslating?: boolean
}

export type OutputFormat =
  | 'sub'
  | 'srt'
  | 'sbv'
  | 'vtt'
  | 'ssa'
  | 'ass'
  | 'smi'
  | 'lrc'
  | 'json'

export interface ExportOptions {
  format: OutputFormat;
  layout: 'original-top' | 'translation-top';
  includeTimestamps: boolean;
}

// JSON file translation types
export interface JsonTextEntry {
  text: string;
  translation?: string;
  [key: string]: unknown; // Allow other fields to be preserved
}

export interface JsonFile {
  id: string;
  name: string;
  entries: JsonTextEntry[];
  textEntries: string[];
  sourceLanguage?: string;
  targetLanguage?: string;
  translatedEntries?: JsonTextEntry[];
  progress?: TranslationProgress;
  isTranslating?: boolean;
  isJsonFile: true;
}

// Union type for all uploadable files
export type UploadedFile = SubtitleFile | JsonFile;

// Type guard to check if a file is a JSON file
export function isJsonFile(file: UploadedFile): file is JsonFile {
  return 'isJsonFile' in file && file.isJsonFile === true;
}
