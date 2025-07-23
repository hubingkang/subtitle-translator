import { SubtitleFile, SubtitleEntry, OutputFormat } from '@/types/translation'
import subsrt from 'subsrt-ts'

interface ContentCaption {
  type: 'caption'
  index: number
  start: number
  end: number
  duration: number
  content: string
  text: string
}

export class SubtitleParser {
  /**
   * Parse subtitle file content and return structured data
   */
  public static parseSubtitle(
    content: string,
    filename: string
  ): Omit<SubtitleFile, 'id' | 'textEntries'> {
    try {
      // Detect format from filename extension
      const format = this.detectFormat(filename)

      // Parse using subsrt-ts
      const parsed = subsrt.parse(content)
      
      // Filter for caption entries only
      const captionEntries = parsed.filter((item): item is ContentCaption => 
        item.type === 'caption'
      )

      // Convert to our format
      const entries: SubtitleEntry[] = captionEntries.map((item, index) => ({
        id: item.index || index + 1,
        startTime: item.start,
        endTime: item.end,
        text: item.text.replace(/<[^>]*>/g, '').trim(), // Remove HTML tags
      }))

      return {
        name: filename,
        content,
        format,
        entries,
      }
    } catch (error) {
      throw new Error(
        `Failed to parse subtitle file: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  /**
   * Detect subtitle format from filename
   */
  private static detectFormat(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase()

    switch (extension) {
      case 'srt':
        return 'srt'
      case 'vtt':
      case 'webvtt':
        return 'vtt'
      case 'ass':
        return 'ass'
      case 'ssa':
        return 'ssa'
      default:
        return 'srt' // Default to SRT
    }
  }

  /**
   * Extract plain text from subtitle entries for translation
   */
  public static extractTextForTranslation(entries: SubtitleEntry[]): string[] {
    return entries
      .map((entry) => entry.text.trim())
      .filter((text) => text.length > 0)
  }

  /**
   * Update subtitle entries with translation results
   */
  public static updateWithTranslations(
    entries: SubtitleEntry[],
    translations: string[]
  ): SubtitleEntry[] {
    if (translations.length !== entries.length) {
      throw new Error('Translation count does not match subtitle entry count')
    }

    return entries.map((entry, index) => ({
      ...entry,
      translatedText: translations[index],
    }))
  }

  /**
   * Generate output subtitle file content
   */
  public static generateOutput(
    entries: SubtitleEntry[],
    format: OutputFormat = 'srt',
    layout: 'original-top' | 'translation-top' = 'original-top'
  ): string {
    const outputEntries = entries.map((entry) => {
      let text: string

      if (entry.translatedText) {
        if (layout === 'original-top') {
          text = `${entry.text}\n${entry.translatedText}`
        } else {
          text = `${entry.translatedText}\n${entry.text}`
        }
      } else {
        text = entry.text
      }

      return {
        start: entry.startTime,
        end: entry.endTime,
        text,
      }
    })

    try {
      return subsrt.build(outputEntries.map(entry => ({
        type: 'caption' as const,
        index: 0,
        start: entry.start,
        end: entry.end,
        duration: entry.end - entry.start,
        content: entry.text,
        text: entry.text
      })), { format })
    } catch (error) {
      throw new Error(
        `Failed to generate ${format} output: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  /**
   * Validate subtitle file content
   */
  public static validateSubtitleContent(content: string): {
    isValid: boolean
    error?: string
  } {
    try {
      const parsed = subsrt.parse(content)
      const contentCaptions = parsed.filter((item): item is ContentCaption => 
        item.type === 'caption'
      )

      if (!Array.isArray(contentCaptions) || contentCaptions.length === 0) {
        return { isValid: false, error: 'No subtitle entries found' }
      }

      // Check for basic required fields
      const hasValidEntries = contentCaptions.every(
        (entry) =>
          typeof entry.start === 'number' &&
          typeof entry.end === 'number' &&
          typeof entry.text === 'string' &&
          entry.start < entry.end
      )

      if (!hasValidEntries) {
        return { isValid: false, error: 'Invalid subtitle entry format' }
      }

      return { isValid: true }
    } catch (error) {
      return {
        isValid: false,
        error: `Parse error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      }
    }
  }

  /**
   * Get subtitle file statistics
   */
  public static getStatistics(entries: SubtitleEntry[]): {
    totalEntries: number
    totalDuration: number
    averageLength: number
    longestEntry: number
  } {
    if (entries.length === 0) {
      return {
        totalEntries: 0,
        totalDuration: 0,
        averageLength: 0,
        longestEntry: 0,
      }
    }

    const totalDuration =
      Math.max(...entries.map((e) => e.endTime)) -
      Math.min(...entries.map((e) => e.startTime))
    const totalTextLength = entries.reduce((sum, e) => sum + e.text.length, 0)
    const longestEntry = Math.max(...entries.map((e) => e.text.length))

    return {
      totalEntries: entries.length,
      totalDuration: totalDuration / 1000, // Convert to seconds
      averageLength: Math.round(totalTextLength / entries.length),
      longestEntry,
    }
  }
}
