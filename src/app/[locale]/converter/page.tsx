'use client'

import { useState } from 'react'
import { FileText, Download, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { FileUpload } from '@/components/upload/FileUpload'
import { SubtitleFile, OutputFormat } from '@/types/translation'
import { SubtitleParserClient } from '@/lib/client/subtitle-parser-client'

export default function ConverterPage() {
  const t = useTranslations('converter')
  
  const availableFormats: { value: OutputFormat; label: string; descriptionKey: string }[] = [
    { value: 'sub', label: 'SUB', descriptionKey: 'formatDescriptions.sub' },
    { value: 'srt', label: 'SRT', descriptionKey: 'formatDescriptions.srt' },
    { value: 'sbv', label: 'SBV', descriptionKey: 'formatDescriptions.sbv' },
    { value: 'vtt', label: 'VTT', descriptionKey: 'formatDescriptions.vtt' },
    { value: 'ssa', label: 'SSA', descriptionKey: 'formatDescriptions.ssa' },
    { value: 'ass', label: 'ASS', descriptionKey: 'formatDescriptions.ass' },
    { value: 'smi', label: 'SMI', descriptionKey: 'formatDescriptions.smi' },
    { value: 'lrc', label: 'LRC', descriptionKey: 'formatDescriptions.lrc' },
    { value: 'json', label: 'JSON', descriptionKey: 'formatDescriptions.json' },
  ]
  
  const [subtitleFiles, setSubtitleFiles] = useState<ConversionFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [globalSelectedFormats, setGlobalSelectedFormats] = useState<OutputFormat[]>([])

  const handleFilesSelect = async (files: File[]) => {
    setIsUploading(true)
    setError(null)

    const newFiles: ConversionFile[] = []

    for (const file of files) {
      try {
        // Process file using client-side parser
        const result = await SubtitleParserClient.processFile(file)

        const conversionFile: ConversionFile = {
          id: crypto.randomUUID(),
          name: result.subtitle.name,
          content: result.subtitle.content || '',
          format: result.subtitle.format || 'srt',
          entries: result.subtitle.entries,
        }

        newFiles.push(conversionFile)
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

  const handleRemoveFile = (fileId: string) => {
    setSubtitleFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const handleGlobalFormatToggle = (format: OutputFormat, checked: boolean) => {
    setGlobalSelectedFormats((prev) =>
      checked ? [...prev, format] : prev.filter((f) => f !== format)
    )
  }

  const handleSelectAllFormats = () => {
    setGlobalSelectedFormats([...availableFormats.map(f => f.value)])
  }

  const handleDeselectAllFormats = () => {
    setGlobalSelectedFormats([])
  }

  const handleConvertFile = async (fileId: string) => {
    const file = subtitleFiles.find((f) => f.id === fileId)
    if (!file || globalSelectedFormats.length === 0) return

    setSubtitleFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, isConverting: true } : f))
    )

    setError(null)

    try {
      // Generate downloads for each selected format
      for (const format of globalSelectedFormats) {
        // Generate filename for the new format
        const baseName = file.name.replace(/\.[^/.]+$/, '')
        const filename = `${baseName}.${format}`

        // Use client-side download method (even for same format)
        SubtitleParserClient.downloadFile(
          file.entries,
          format,
          'original-top', // Default layout for conversion
          filename
        )

        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed')
    } finally {
      setSubtitleFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, isConverting: false } : f))
      )
    }
  }

  const handleConvertAll = async () => {
    if (globalSelectedFormats.length === 0 || subtitleFiles.length === 0) return

    const filesToConvert = subtitleFiles.filter((file) => !file.isConverting)

    // Mark all files as converting
    setSubtitleFiles((prev) =>
      prev.map((f) =>
        filesToConvert.some((cf) => cf.id === f.id)
          ? { ...f, isConverting: true }
          : f
      )
    )

    setError(null)

    try {
      // Process all files sequentially to avoid overwhelming the browser
      for (const file of filesToConvert) {
        for (const format of globalSelectedFormats) {
          // Generate filename for the new format
          const baseName = file.name.replace(/\.[^/.]+$/, '')
          const filename = `${baseName}.${format}`

          // Use client-side download method (even for same format)
          SubtitleParserClient.downloadFile(
            file.entries,
            format,
            'original-top', // Default layout for conversion
            filename
          )

          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch conversion failed')
    } finally {
      // Mark all files as not converting
      setSubtitleFiles((prev) =>
        prev.map((f) =>
          filesToConvert.some((cf) => cf.id === f.id)
            ? { ...f, isConverting: false }
            : f
        )
      )
    }
  }

  const handleClearAllFiles = () => {
    setSubtitleFiles([])
  }

  const hasFilesAndFormats = subtitleFiles.length > 0 && globalSelectedFormats.length > 0
  const isAnyConverting = subtitleFiles.some((file) => file.isConverting)

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground">
              {t('description')}
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">{t('error')}</span>
                </div>
                <p className="text-destructive/80 mt-1">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('uploadFiles')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFilesSelect={handleFilesSelect}
                loading={isUploading}
                multiple={true}
              />
            </CardContent>
          </Card>

          {/* Global Format Selection */}
          {subtitleFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t('formatSelection')} ({globalSelectedFormats.length}{t('selectedCount')})
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllFormats}
                      disabled={isAnyConverting}
                    >
                      {t('selectAll')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAllFormats}
                      disabled={isAnyConverting}
                    >
                      {t('deselectAll')}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {t('selectFormatsDescription')}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {availableFormats.map((format) => {
                      const isSelected = globalSelectedFormats.includes(format.value)
                      
                      return (
                        <div
                          key={format.value}
                          className="flex items-start space-x-3 p-3 rounded-lg border bg-background"
                        >
                          <Checkbox
                            id={`global-${format.value}`}
                            checked={isSelected}
                            disabled={isAnyConverting}
                            onCheckedChange={(checked) =>
                              handleGlobalFormatToggle(format.value, checked as boolean)
                            }
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor={`global-${format.value}`}
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              {format.label}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              {t(format.descriptionKey)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Files List */}
          {subtitleFiles.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('fileList')} ({subtitleFiles.length})</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearAllFiles}
                      disabled={isAnyConverting}
                    >
                      {t('clearAll')}
                    </Button>
                    <Button
                      onClick={handleConvertAll}
                      disabled={!hasFilesAndFormats || isAnyConverting}
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t('convertAll')} ({globalSelectedFormats.length}{t('formats')})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subtitleFiles.map((file) => (
                    <div
                      key={file.id}
                      className="border rounded-lg p-4"
                    >
                      {/* File Info */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">{file.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {t('originalFormat')}: {file.format.toUpperCase()} • {file.entries.length}{t('subtitleCount')}
                            {globalSelectedFormats.length > 0 && (
                              <span className="ml-2">
                                {t('convertTo')}: {globalSelectedFormats.map(f => f.toUpperCase()).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleConvertFile(file.id)}
                            disabled={globalSelectedFormats.length === 0 || file.isConverting}
                            size="sm"
                          >
                            {file.isConverting ? (
                              <>{t('converting')}</>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                {t('convertDownload')}
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(file.id)}
                            disabled={file.isConverting}
                          >
                            {t('remove')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}