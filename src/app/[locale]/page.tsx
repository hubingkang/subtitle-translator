'use client'

import { useState } from 'react'
import { Settings, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileUpload } from '@/components/upload/FileUpload'
import { FileManager } from '@/components/upload/FileManager'
import { LanguageControlBar } from '@/components/language/LanguageControlBar'
import { ConfigPanel } from '@/components/settings/ConfigPanel'
import { SubtitleFile, OutputFormat, JsonFile, UploadedFile, isJsonFile } from '@/types/translation'
import { SubtitleParserClient } from '@/lib/client/subtitle-parser-client'
import { TranslatorClient } from '@/lib/client/translator-client'

import { configManager } from '@/lib/config-manager'

export default function Home() {
  const t = useTranslations('translation')
  const tCommon = useTranslations('common')
  const [subtitleFiles, setSubtitleFiles] = useState<SubtitleFile[]>([])
  const [jsonFiles, setJsonFiles] = useState<JsonFile[]>([])
  const [sourceLanguage, setSourceLanguage] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Combined files for display
  const allFiles: UploadedFile[] = [...subtitleFiles, ...jsonFiles]

  const handleFilesSelect = async (files: File[]) => {
    setIsUploading(true)
    setError(null)

    const newSubtitleFiles: SubtitleFile[] = []
    const newJsonFiles: JsonFile[] = []

    for (const file of files) {
      try {
        // Check if it's a JSON file
        if (SubtitleParserClient.isJsonFileByExtension(file.name)) {
          // Process JSON file
          const result = await SubtitleParserClient.processJsonFile(file)

          console.log('JSON result', result)

          const jsonFile: JsonFile = {
            id: crypto.randomUUID(),
            name: result.jsonFile.name,
            entries: result.jsonFile.entries,
            textEntries: result.textEntries,
            isJsonFile: true,
          }

          newJsonFiles.push(jsonFile)
        } else {
          // Process subtitle file using client-side parser
          const result = await SubtitleParserClient.processFile(file)

          console.log('Subtitle result', result)

          const subtitleFile: SubtitleFile = {
            id: crypto.randomUUID(),
            name: result.subtitle.name,
            content: result.subtitle.content || '',
            format: result.subtitle.format || 'srt',
            entries: result.subtitle.entries,
            textEntries: result.textEntries,
          }

          newSubtitleFiles.push(subtitleFile)
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : `Failed to process ${file.name}`
        )
      }
    }

    if (newSubtitleFiles.length > 0) {
      setSubtitleFiles((prev) => [...prev, ...newSubtitleFiles])
    }

    if (newJsonFiles.length > 0) {
      setJsonFiles((prev) => [...prev, ...newJsonFiles])
    }

    setIsUploading(false)
  }

  const handleTranslateAll = async () => {
    if (!sourceLanguage || !targetLanguage) return

    const config = configManager.getConfig()
    const validation = configManager.validateConfig()

    if (!validation.isValid) {
      setError(`Configuration error: ${validation.errors.join(', ')}`)
      return
    }

    setError(null)

    // Update subtitle files to set source/target languages and mark as translating
    const updatedSubtitleFiles = subtitleFiles.map((file) => ({
      ...file,
      sourceLanguage,
      targetLanguage,
      isTranslating: !file.translatedEntries?.length,
      progress: !file.translatedEntries?.length
        ? { total: file.textEntries.length, completed: 0, failed: 0 }
        : file.progress,
    }))

    // Update JSON files to set source/target languages and mark as translating
    const updatedJsonFiles = jsonFiles.map((file) => ({
      ...file,
      sourceLanguage,
      targetLanguage,
      isTranslating: !file.translatedEntries?.length,
      progress: !file.translatedEntries?.length
        ? { total: file.textEntries.length, completed: 0, failed: 0 }
        : file.progress,
    }))

    setSubtitleFiles(updatedSubtitleFiles)
    setJsonFiles(updatedJsonFiles)

    // Translate subtitle files that haven't been translated yet
    const subtitleFilesToTranslate = updatedSubtitleFiles.filter((file) => file.isTranslating)
    const jsonFilesToTranslate = updatedJsonFiles.filter((file) => file.isTranslating)

    // Process all subtitle files concurrently
    const subtitleTranslationPromises = subtitleFilesToTranslate.map(async (file) => {
      try {
        const translator = new TranslatorClient()

        // Use optimized batch translation that only translates text content
        const translationResults = await translator.translateBatch(
          file.textEntries, // Only translate the extracted text content
          sourceLanguage,
          targetLanguage,
          config.defaultProvider,
          config.providers[config.defaultProvider]?.selectedModel ||
            config.defaultModel,
          (progress) => {
            // Update progress in real-time
            setSubtitleFiles((prev) =>
              prev.map((f) => (f.id === file.id ? { ...f, progress } : f))
            )
          }
        )

        // Map translation results back to subtitle entries
        const translatedEntries = file.entries.map((entry, index) => ({
          ...entry,
          translatedText:
            translationResults[index]?.translatedText || entry.text,
        }))

        setSubtitleFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  translatedEntries,
                  isTranslating: false,
                  progress: {
                    total: file.textEntries.length,
                    completed: file.textEntries.length,
                    failed: 0,
                  },
                }
              : f
          )
        )
      } catch (err) {
        setSubtitleFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  isTranslating: false,
                  progress: {
                    total: file.textEntries.length,
                    completed: 0,
                    failed: file.textEntries.length,
                  },
                }
              : f
          )
        )
        setError(
          err instanceof Error
            ? `${file.name}: ${err.message}`
            : `Translation failed for ${file.name}`
        )
      }
    })

    // Process all JSON files concurrently
    const jsonTranslationPromises = jsonFilesToTranslate.map(async (file) => {
      try {
        const translator = new TranslatorClient()

        // Use optimized batch translation that only translates text content
        const translationResults = await translator.translateBatch(
          file.textEntries, // Only translate the extracted text content
          sourceLanguage,
          targetLanguage,
          config.defaultProvider,
          config.providers[config.defaultProvider]?.selectedModel ||
            config.defaultModel,
          (progress) => {
            // Update progress in real-time
            setJsonFiles((prev) =>
              prev.map((f) => (f.id === file.id ? { ...f, progress } : f))
            )
          }
        )

        // Map translation results back to JSON entries
        const translatedEntries = file.entries.map((entry, index) => ({
          ...entry,
          translation: translationResults[index]?.translatedText || entry.text,
        }))

        setJsonFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  translatedEntries,
                  isTranslating: false,
                  progress: {
                    total: file.textEntries.length,
                    completed: file.textEntries.length,
                    failed: 0,
                  },
                }
              : f
          )
        )
      } catch (err) {
        setJsonFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  isTranslating: false,
                  progress: {
                    total: file.textEntries.length,
                    completed: 0,
                    failed: file.textEntries.length,
                  },
                }
              : f
          )
        )
        setError(
          err instanceof Error
            ? `${file.name}: ${err.message}`
            : `Translation failed for ${file.name}`
        )
      }
    })

    // Wait for all translations to complete
    await Promise.allSettled([...subtitleTranslationPromises, ...jsonTranslationPromises])
  }

  const handleDownload = async (fileId: string) => {
    // Check if it's a subtitle file
    const subtitleFile = subtitleFiles.find((f) => f.id === fileId)
    if (subtitleFile?.translatedEntries?.length) {
      setError(null)
      try {
        // Generate filename with original format
        const baseName = subtitleFile.name.replace(/\.[^/.]+$/, '')
        const filename = `${baseName}`

        // Use client-side download method with original format and default layout
        SubtitleParserClient.downloadFile(
          subtitleFile.translatedEntries,
          subtitleFile.format as OutputFormat,
          'original-top',
          filename
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Download failed')
      }
      return
    }

    // Check if it's a JSON file
    const jsonFile = jsonFiles.find((f) => f.id === fileId)
    if (jsonFile?.translatedEntries?.length) {
      setError(null)
      try {
        // Generate filename
        const baseName = jsonFile.name.replace(/\.[^/.]+$/, '')

        // Use client-side download method for JSON
        SubtitleParserClient.downloadJsonFile(
          jsonFile.translatedEntries,
          baseName
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Download failed')
      }
      return
    }
  }

  const handleRemoveFile = (fileId: string) => {
    // Try to remove from subtitle files
    setSubtitleFiles((prev) => prev.filter((file) => file.id !== fileId))
    // Try to remove from JSON files
    setJsonFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const handleDownloadAll = async () => {
    const completedSubtitleFiles = subtitleFiles.filter(file => 
      file.translatedEntries && file.translatedEntries.length > 0
    )
    const completedJsonFiles = jsonFiles.filter(file => 
      file.translatedEntries && file.translatedEntries.length > 0
    )

    if (completedSubtitleFiles.length === 0 && completedJsonFiles.length === 0) return

    setError(null)

    try {
      // Download all completed subtitle files sequentially
      for (const file of completedSubtitleFiles) {
        // Generate filename with original format
        const baseName = file.name.replace(/\.[^/.]+$/, '')
        const filename = `${baseName}`

        // Use client-side download method with original format and default layout
        SubtitleParserClient.downloadFile(
          file.translatedEntries!,
          file.format as OutputFormat,
          'original-top',
          filename
        )

        // Small delay between downloads to ensure proper browser handling
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Download all completed JSON files sequentially
      for (const file of completedJsonFiles) {
        // Generate filename
        const baseName = file.name.replace(/\.[^/.]+$/, '')

        // Use client-side download method for JSON
        SubtitleParserClient.downloadJsonFile(
          file.translatedEntries!,
          baseName
        )

        // Small delay between downloads to ensure proper browser handling
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch download failed')
    }
  }

  const handleClearAllFiles = () => {
    setSubtitleFiles([])
    setJsonFiles([])
  }

  const config = configManager.getConfig()
  const validation = configManager.validateConfig()
  const hasValidConfig = validation.isValid
  const isAnyTranslating = subtitleFiles.some((file) => file.isTranslating) || jsonFiles.some((file) => file.isTranslating)

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* <div className="grid lg:grid-cols-[320px,1fr] gap-8"> */}
        <div className="grid sm:grid-cols-[1fr_320px] gap-8">
          {/* Left Panel - Settings */}
          <div className="space-y-8 overflow-hidden">
            {/* Error Display */}
            {error && (
              <Card className="border-destructive bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">{tCommon('error')}</span>
                  </div>
                  <p className="text-destructive/80 mt-1">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* File Upload */}
            <div className="space-y-6">
              {/* <div>
                <h2 className="text-2xl font-bold mb-2">
                  Upload Subtitle Files
                </h2>
                <p className="text-muted-foreground mb-6">
                  Upload one or more subtitle files to get started with
                  translation.
                </p>
              </div> */}

              <FileUpload
                onFilesSelect={handleFilesSelect}
                loading={isUploading}
                multiple={true}
              />
            </div>

            {/* File Manager */}
            <FileManager
              files={allFiles}
              onRemoveFile={handleRemoveFile}
              onClearAll={handleClearAllFiles}
              onDownload={handleDownload}
              onDownloadAll={handleDownloadAll}
            />
          </div>

          {/* Right Panel - Main Content */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {t('settings')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('aiProvider')}</Label>
                  <Select
                    value={config.defaultProvider}
                    onValueChange={(value) =>
                      configManager.updateConfig({ defaultProvider: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(config.providers).map(
                        ([providerId, provider]) => (
                          <SelectItem key={providerId} value={providerId}>
                            {provider.name}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfig(true)}
                    className="w-full mt-2"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {t('configureProviders')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Translation Controls */}
            {/* <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Translation Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LanguageControlBar
                  files={subtitleFiles}
                  sourceLanguage={sourceLanguage}
                  targetLanguage={targetLanguage}
                  onSourceLanguageChange={setSourceLanguage}
                  onTargetLanguageChange={setTargetLanguage}
                  onTranslateAll={handleTranslateAll}
                  isTranslating={isAnyTranslating}
                  hasValidConfig={hasValidConfig}
                />
              </CardContent>
            </Card> */}

            <LanguageControlBar
              files={allFiles}
              sourceLanguage={sourceLanguage}
              targetLanguage={targetLanguage}
              onSourceLanguageChange={setSourceLanguage}
              onTargetLanguageChange={setTargetLanguage}
              onTranslateAll={handleTranslateAll}
              isTranslating={isAnyTranslating}
              hasValidConfig={hasValidConfig}
            />
          </div>
        </div>
      </main>

      {/* Configuration Panel */}
      <ConfigPanel isOpen={showConfig} onClose={() => setShowConfig(false)} />
    </div>
  )
}