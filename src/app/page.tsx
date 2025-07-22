'use client'

import { useState } from 'react'
import { Settings, Languages, AlertCircle } from 'lucide-react'
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
import {
  SubtitleFile,
  OutputFormat,
} from '@/types/translation'
import { SubtitleParserClient } from '@/lib/client/subtitle-parser-client'
import { TranslatorClient } from '@/lib/client/translator-client'

import { configManager } from '@/lib/config-manager'

export default function Home() {
  const [subtitleFiles, setSubtitleFiles] = useState<SubtitleFile[]>([])
  const [sourceLanguage, setSourceLanguage] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFilesSelect = async (files: File[]) => {
    setIsUploading(true)
    setError(null)

    const newFiles: SubtitleFile[] = []

    for (const file of files) {
      try {
        // Process file using client-side parser
        const result = await SubtitleParserClient.processFile(file)

        const subtitleFile: SubtitleFile = {
          id: crypto.randomUUID(),
          name: result.subtitle.name,
          content: result.subtitle.content || '',
          format: result.subtitle.format || 'srt',
          entries: result.subtitle.entries,
          textEntries: result.textEntries,
        }

        newFiles.push(subtitleFile)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : `Failed to process ${file.name}`
        )
      }
    }

    if (newFiles.length > 0) {
      setSubtitleFiles((prev) => [...prev, ...newFiles])
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

    // Update files to set source/target languages and mark as translating
    const updatedFiles = subtitleFiles.map((file) => ({
      ...file,
      sourceLanguage,
      targetLanguage,
      isTranslating: !file.translatedEntries?.length,
      progress: !file.translatedEntries?.length
        ? { total: file.textEntries.length, completed: 0, failed: 0 }
        : file.progress,
    }))

    setSubtitleFiles(updatedFiles)

    // console.log('updatedFiles', updatedFiles)
    // return
    // Translate files that haven't been translated yet
    const filesToTranslate = updatedFiles.filter((file) => file.isTranslating)

    // Process all files concurrently
    const translationPromises = filesToTranslate.map(async (file) => {
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

    // Wait for all translations to complete
    await Promise.allSettled(translationPromises)
  }

  const handleDownload = async (fileId: string) => {
    const file = subtitleFiles.find((f) => f.id === fileId)
    if (!file?.translatedEntries?.length) return

    setError(null)

    try {
      // Generate filename with original format
      const baseName = file.name.replace(/\.[^/.]+$/, '')
      const filename = `${baseName}_translated`
      
      // Use client-side download method with original format and default layout
      SubtitleParserClient.downloadFile(
        file.translatedEntries,
        file.format as OutputFormat,
        'original-top',
        filename
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
    }
  }

  const handleRemoveFile = (fileId: string) => {
    setSubtitleFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const handleClearAllFiles = () => {
    setSubtitleFiles([])
  }

  const config = configManager.getConfig()
  const validation = configManager.validateConfig()
  const hasValidConfig = validation.isValid
  const isAnyTranslating = subtitleFiles.some((file) => file.isTranslating)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Languages className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Subtitle Translator</h1>
                <p className="text-xs text-muted-foreground">
                  AI-powered subtitle translation
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setShowConfig(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

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
                    <span className="font-medium">Error</span>
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
              files={subtitleFiles}
              onRemoveFile={handleRemoveFile}
              onClearAll={handleClearAllFiles}
              onDownload={handleDownload}
            />

          </div>

          {/* Right Panel - Main Content */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">AI Provider</Label>
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
                    Configure Providers
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
              files={subtitleFiles}
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
