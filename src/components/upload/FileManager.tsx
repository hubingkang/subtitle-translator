'use client'

import { X, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SubtitleFile } from '@/types/translation'

interface FileManagerProps {
  files: SubtitleFile[]
  onRemoveFile: (fileId: string) => void
  onClearAll: () => void
}

export function FileManager({
  files,
  onRemoveFile,
  onClearAll,
}: FileManagerProps) {
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
      return 'Translating...'
    }
    if (file.translatedEntries && file.translatedEntries.length > 0) {
      return 'Translated'
    }
    return 'Ready'
  }

  const getProgressPercentage = (file: SubtitleFile) => {
    if (!file.progress || file.progress.total === 0) return 0
    return Math.round((file.progress.completed / file.progress.total) * 100)
  }

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h3 className="text-lg font-semibold">
              Uploaded Files ({files.length})
            </h3>
          </div>
          {files.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="text-muted-foreground hover:text-destructive"
            >
              Clear All
            </Button>
          )}
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
                      {file.entries.length} entries
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



                {file.sourceLanguage && file.targetLanguage && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>
                      {file.sourceLanguage} → {file.targetLanguage}
                    </span>
                  </div>
                )}

                {file.isTranslating && file.progress && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        Progress: {file.progress.completed}/
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
                        <span>{file.progress.failed} failed</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveFile(file.id)}
                className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
