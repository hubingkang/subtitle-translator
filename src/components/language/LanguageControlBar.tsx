'use client'

import { Languages, Play, AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SubtitleFile } from '@/types/translation'

interface LanguageControlBarProps {
  files: SubtitleFile[]
  sourceLanguage: string
  targetLanguage: string
  onSourceLanguageChange: (language: string) => void
  onTargetLanguageChange: (language: string) => void
  onTranslateAll: () => void
  isTranslating: boolean
  hasValidConfig: boolean
}

export function LanguageControlBar({
  files,
  sourceLanguage,
  targetLanguage,
  onSourceLanguageChange,
  onTargetLanguageChange,
  onTranslateAll,
  isTranslating,
  hasValidConfig,
}: LanguageControlBarProps) {
  const t = useTranslations('translation')
  if (files.length === 0) {
    return null
  }

  const canTranslate =
    files.length > 0 &&
    sourceLanguage.trim() !== '' &&
    targetLanguage.trim() !== '' &&
    sourceLanguage !== targetLanguage &&
    hasValidConfig &&
    !isTranslating

  const pendingFiles = files.filter(
    (file) => !file.translatedEntries?.length && !file.isTranslating
  )
  const translatingFiles = files.filter((file) => file.isTranslating)
  const completedFiles = files.filter((file) => file.translatedEntries?.length)

  return (
    <div className="bg-background/95 backdrop-blur-sm border-t pt-4">
      <Card>
        <CardContent>
          <div className="space-y-4">
            {/* File Status Summary */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                <h3 className="font-semibold">{t('translationControls')}</h3>
              </div>
              <div className="flex items-center gap-2">
                {pendingFiles.length > 0 && (
                  <Badge variant="secondary">
                    {pendingFiles.length} {t('status.pending')}
                  </Badge>
                )}
                {translatingFiles.length > 0 && (
                  <Badge variant="default" className="bg-blue-500">
                    {translatingFiles.length} {t('status.translating')}
                  </Badge>
                )}
                {completedFiles.length > 0 && (
                  <Badge variant="default" className="bg-green-500">
                    {completedFiles.length} {t('status.completed')}
                  </Badge>
                )}
              </div>
            </div>

            {/* Language Controls */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source-language" className="text-sm font-medium">
                  {t('sourceLanguage')}
                </Label>
                <Input
                  id="source-language"
                  value={sourceLanguage}
                  onChange={(e) => onSourceLanguageChange(e.target.value)}
                  placeholder={t('sourceLanguagePlaceholder')}
                  disabled={isTranslating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-language" className="text-sm font-medium">
                  {t('targetLanguage')}
                </Label>
                <Input
                  id="target-language"
                  value={targetLanguage}
                  onChange={(e) => onTargetLanguageChange(e.target.value)}
                  placeholder={t('targetLanguagePlaceholder')}
                  disabled={isTranslating}
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={onTranslateAll}
                  disabled={!canTranslate}
                  size="lg"
                  className="w-full h-[42px]"
                >
                  {isTranslating ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border border-current border-t-transparent rounded-full" />
                      {t('translating')}
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      {t('startTranslation')}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Validation Messages */}
            {!hasValidConfig && (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>
                  {t('configurationError')}
                </span>
              </div>
            )}

            {sourceLanguage &&
              targetLanguage &&
              sourceLanguage === targetLanguage && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>{t('languagesDifferentError')}</span>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
