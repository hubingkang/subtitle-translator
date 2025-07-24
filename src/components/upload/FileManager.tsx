'use client'

import { X, FileText, CheckCircle, AlertCircle, Clock, Download } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SubtitleFile } from '@/types/translation'

interface FileManagerProps {
  files: SubtitleFile[]
  onRemoveFile: (fileId: string) => void
  onClearAll: () => void
  onDownload: (fileId: string) => void
  onDownloadAll: () => void
}

export function FileManager({
  files,
  onRemoveFile,
  onClearAll,
  onDownload,
  onDownloadAll,
}: FileManagerProps) {
  const t = useTranslations('fileManager')
  if (files.length === 0) {
    return null
  }

  const getFileStatusIcon = (file: SubtitleFile) => {
    if (file.isTranslating) {
      return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
    }
    if (file.translatedEntries && file.translatedEntries.length > 0) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    return <FileText className="h-4 w-4 text-muted-foreground" />
  }

  const getFileStatusText = (file: SubtitleFile) => {
    if (file.isTranslating) {
      return t('translating')
    }
    if (file.translatedEntries && file.translatedEntries.length > 0) {
      return t('translated')
    }
    return t('ready')
  }

  const getProgressPercentage = (file: SubtitleFile) => {
    if (!file.progress || file.progress.total === 0) return 0
    return Math.round((file.progress.completed / file.progress.total) * 100)
  }

  // Check if there are any completed files to download
  const completedFiles = files.filter(file => 
    file.translatedEntries && file.translatedEntries.length > 0
  )

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h3 className="text-lg font-semibold">
              {t('uploadedFiles')} ({files.length})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {completedFiles.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadAll}
                className="text-muted-foreground hover:text-primary"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('downloadAll')} ({completedFiles.length})
              </Button>
            )}
            {files.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAll}
                className="text-muted-foreground hover:text-destructive"
              >
                {t('clearAll')}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border"
            >
              <div className="flex-shrink-0">{getFileStatusIcon(file)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4
                    className="font-medium truncate pr-2 max-w-[60%]"
                    title={file.name}
                  >
                    {file.name}
                  </h4>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {file.entries.length} {t('entries')}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        file.isTranslating
                          ? 'border-blue-300 text-blue-600'
                          : file.translatedEntries?.length
                          ? 'border-green-300 text-green-600'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {getFileStatusText(file)}
                    </Badge>
                  </div>
                </div>

                {file.isTranslating && file.progress && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {t('progress')} {file.progress.completed}/
                        {file.progress.total}
                      </span>
                      <span>{getProgressPercentage(file)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(file)}%` }}
                      />
                    </div>
                    {file.progress.failed > 0 && (
                      <div className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        <span>{file.progress.failed} {t('failed')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 flex items-center gap-1">
                {file.translatedEntries && file.translatedEntries.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(file.id)}
                    className="flex-shrink-0 hover:bg-primary/10 hover:text-primary"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveFile(file.id)}
                  className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
