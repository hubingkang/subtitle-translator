import { franc } from 'franc';
import langs from 'langs';
import { LanguageOption } from '@/types/translation';

export class LanguageDetector {
  /**
   * Detect language of given text using franc
   */
  public static detectLanguage(text: string): string | null {
    // Clean text: remove HTML tags, numbers, and special characters
    const cleanText = text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\d+/g, '') // Remove numbers
      .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    if (cleanText.length < 10) {
      return null; // Text too short for reliable detection
    }

    try {
      const detected = franc(cleanText);
      return detected === 'und' ? null : detected; // 'und' means undetermined
    } catch {
      console.warn('Language detection failed');
      return null;
    }
  }

  /**
   * Detect language from multiple subtitle entries
   */
  public static detectLanguageFromEntries(textEntries: string[]): string | null {
    // Combine text from multiple entries for better detection
    const combinedText = textEntries
      .slice(0, 10) // Use first 10 entries for faster processing
      .join(' ');

    return this.detectLanguage(combinedText);
  }

  /**
   * Get language name from ISO 639-3 code
   */
  public static getLanguageName(code: string): string | null {
    try {
      const language = langs.where('3', code);
      return language ? language.name : null;
    } catch {
      return null;
    }
  }

  /**
   * Get native language name from ISO 639-3 code
   */
  public static getNativeLanguageName(code: string): string | null {
    try {
      const language = langs.where('3', code);
      return language ? language.local || language.name : null;
    } catch {
      return null;
    }
  }

  /**
   * Get popular languages for selection
   */
  public static getPopularLanguages(): LanguageOption[] {
    const popularCodes = [
      'eng', // English
      'spa', // Spanish
      'fra', // French
      'deu', // German
      'ita', // Italian
      'por', // Portuguese
      'rus', // Russian
      'jpn', // Japanese
      'kor', // Korean
      'cmn', // Chinese (Mandarin)
      'ara', // Arabic
      'hin', // Hindi
      'tha', // Thai
      'vie', // Vietnamese
      'nld', // Dutch
      'pol', // Polish
      'tur', // Turkish
      'swe', // Swedish
      'nor', // Norwegian
      'dan', // Danish
      'fin', // Finnish
      'heb', // Hebrew
      'ces', // Czech
      'hun', // Hungarian
      'ron', // Romanian
      'bul', // Bulgarian
      'hrv', // Croatian
      'slv', // Slovenian
      'est', // Estonian
      'lav', // Latvian
      'lit', // Lithuanian
      'ell', // Greek
      'ukr', // Ukrainian
    ];

    return popularCodes
      .map(code => {
        const lang = langs.where('3', code);
        if (!lang) return null;
        
        return {
          code,
          name: lang.name,
          native: lang.local || lang.name
        };
      })
      .filter((lang): lang is LanguageOption => lang !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Search languages by name
   */
  public static searchLanguages(query: string): LanguageOption[] {
    if (!query || query.length < 2) {
      return [];
    }

    const searchTerm = query.toLowerCase();
    const allLanguages = this.getAllLanguages();
    
    return allLanguages
      .filter(lang => 
        lang.name.toLowerCase().includes(searchTerm) ||
        lang.native.toLowerCase().includes(searchTerm) ||
        lang.code.toLowerCase().includes(searchTerm)
      )
      .slice(0, 20); // Limit results
  }

  /**
   * Get all available languages
   */
  private static getAllLanguages(): LanguageOption[] {
    return langs.all()
      .filter(lang => lang['3'] && lang.name) // Only languages with ISO 639-3 codes
      .map(lang => ({
        code: lang['3'],
        name: lang.name,
        native: lang.local || lang.name
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Validate language code
   */
  public static isValidLanguageCode(code: string): boolean {
    try {
      return !!langs.where('3', code);
    } catch {
      return false;
    }
  }

  /**
   * Convert ISO 639-1 to ISO 639-3 if needed
   */
  public static normalizeLanguageCode(code: string): string | null {
    if (code.length === 3) {
      // Already ISO 639-3
      return this.isValidLanguageCode(code) ? code : null;
    }
    
    if (code.length === 2) {
      // Convert from ISO 639-1 to ISO 639-3
      try {
        const lang = langs.where('1', code);
        return lang ? lang['3'] : null;
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Get confidence score for language detection
   */
  public static getDetectionConfidence(text: string): number {
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    
    if (cleanText.length < 10) return 0;
    if (cleanText.length < 50) return 0.5;
    if (cleanText.length < 100) return 0.7;
    return 0.9;
  }
}