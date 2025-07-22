'use client'

import { useState } from 'react'
import { Settings, Languages, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { ProgressTracker } from '@/components/progress/ProgressTracker'
import { OutputPanel } from '@/components/output/OutputPanel'
import { SubtitleFile, OutputFormat } from '@/types/translation'
import { configManager } from '@/lib/config-manager'

export default function Home() {
  const [subtitleFiles, setSubtitleFiles] = useState<SubtitleFile[]>([])
  const [sourceLanguage, setSourceLanguage] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFilesSelect = async (files: File[]) => {
    setIsUploading(true)
    setError(null)

    const newFiles: SubtitleFile[] = []

    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Upload failed')
        }

        const data = await response.json()

        const subtitleFile: SubtitleFile = {
          id: crypto.randomUUID(),
          name: data.subtitle.name,
          content: data.subtitle.content || '',
          format: data.subtitle.format || 'srt',
          entries: data.subtitle.entries,
          textEntries: data.textEntries,
          detectedLanguage: data.detectedLanguage || null,
        }

        newFiles.push(subtitleFile)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : `Failed to upload ${file.name}`
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

    // Translate files that haven't been translated yet
    const filesToTranslate = updatedFiles.filter((file) => file.isTranslating)

    for (const file of filesToTranslate) {
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            texts: file.textEntries,
            sourceLanguage,
            targetLanguage,
            provider: config.defaultProvider,
            model: config.defaultModel,
          }),
        })

        if (!response.ok) {
          throw new Error('Translation failed')
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response stream')

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.type === 'progress') {
                  setSubtitleFiles((prev) =>
                    prev.map((f) =>
                      f.id === file.id ? { ...f, progress: data.data } : f
                    )
                  )
                } else if (data.type === 'complete') {
                  const translatedEntries = file.entries.map(
                    (entry, index) => ({
                      ...entry,
                      translatedText:
                        data.data[index]?.translatedText || entry.text,
                    })
                  )

                  setSubtitleFiles((prev) =>
                    prev.map((f) =>
                      f.id === file.id
                        ? {
                            ...f,
                            translatedEntries,
                            isTranslating: false,
                          }
                        : f
                    )
                  )
                } else if (data.type === 'error') {
                  throw new Error(data.error)
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError)
              }
            }
          }
        }
      } catch (err) {
        setSubtitleFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, isTranslating: false } : f
          )
        )
        setError(
          err instanceof Error
            ? err.message
            : `Translation failed for ${file.name}`
        )
      }
    }
  }

  const handleExport = async (
    fileId: string,
    format: OutputFormat,
    layout: 'original-top' | 'translation-top',
    filename: string
  ) => {
    const file = subtitleFiles.find((f) => f.id === fileId)
    if (!file?.translatedEntries?.length) return

    setIsExporting(true)
    setError(null)

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entries: file.translatedEntries,
          format,
          layout,
          filename,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Export failed')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
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
  const translatedFiles = subtitleFiles.filter(
    (file) => file.translatedEntries?.length
  )

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
            />

            {/* Progress Display */}
            {isAnyTranslating && (
              <div className="space-y-4">
                {subtitleFiles
                  .filter((file) => file.isTranslating && file.progress)
                  .map((file) => (
                    <Card key={file.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{file.name}</span>
                          <Badge variant="outline">Translating</Badge>
                        </div>
                        <ProgressTracker
                          progress={file.progress!}
                          isActive={file.isTranslating || false}
                        />
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}

            {/* Export Panel */}
            {translatedFiles.length > 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Export Results</h2>
                  <p className="text-muted-foreground mb-6">
                    Download your translated subtitle files.
                  </p>
                </div>

                <div className="space-y-4">
                  {translatedFiles.map((file) => (
                    <Card key={file.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">{file.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {file.sourceLanguage} → {file.targetLanguage}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Ready to Export
                          </Badge>
                        </div>
                        <OutputPanel
                          entries={file.translatedEntries!}
                          originalFilename={file.name}
                          sourceLanguage={file.sourceLanguage!}
                          targetLanguage={file.targetLanguage!}
                          onExport={(format, layout, filename) =>
                            handleExport(file.id, format, layout, filename)
                          }
                          exporting={isExporting}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
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
