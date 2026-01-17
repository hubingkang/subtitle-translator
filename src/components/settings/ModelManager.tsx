'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface ModelManagerProps {
  models: string[]
  selectedModel?: string
  onModelsChange: (models: string[]) => void
  onSelectedModelChange: (model: string) => void
  className?: string
}

export function ModelManager({
  models,
  selectedModel,
  onModelsChange,
  onSelectedModelChange,
  className,
}: ModelManagerProps) {
  const t = useTranslations('modelManager')
  const tCommon = useTranslations('common')
  const [newModelName, setNewModelName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [modelToDelete, setModelToDelete] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAddModel = () => {
    const trimmedName = newModelName.trim()

    // Validation
    if (!trimmedName) {
      setError(t('modelNameEmpty'))
      return
    }

    if (models.includes(trimmedName)) {
      setError(t('modelAlreadyExists'))
      return
    }

    // Add the new model
    const updatedModels = [...models, trimmedName]
    onModelsChange(updatedModels)

    // If this is the first model, set it as selected
    if (models.length === 0) {
      onSelectedModelChange(trimmedName)
    }

    // Reset form
    setNewModelName('')
    setIsAdding(false)
    setError(null)
  }

  const handleDeleteModel = (modelToDelete: string) => {
    const updatedModels = models.filter((model) => model !== modelToDelete)
    onModelsChange(updatedModels)

    // If we deleted the selected model, select the first remaining one
    if (selectedModel === modelToDelete && updatedModels.length > 0) {
      onSelectedModelChange(updatedModels[0])
    }

    setModelToDelete(null)
  }

  const handleSelectedModelChange = (model: string) => {
    onSelectedModelChange(model)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddModel()
    } else if (e.key === 'Escape') {
      setIsAdding(false)
      setNewModelName('')
      setError(null)
    }
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        <Label className="text-sm">{t('availableModels')}</Label>

        {models.length > 0 ? (
          <RadioGroup
            value={selectedModel || ''}
            onValueChange={handleSelectedModelChange}
          >
            {models.map((model) => (
              <div
                key={model}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center space-x-2 flex-1">
                  <RadioGroupItem value={model} id={`model-${model}`} />
                  <Label
                    htmlFor={`model-${model}`}
                    className="text-sm font-normal flex-1 cursor-pointer"
                  >
                    {model}
                  </Label>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive cursor-pointer"
                  onClick={() => setModelToDelete(model)}
                  disabled={models.length === 1} // Don't allow deleting the last model
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <div className="text-sm text-muted-foreground py-2">
            {t('noModelsConfigured')}
          </div>
        )}

        {/* Add Model Section */}
        <div className="pt-2 border-t">
          {!isAdding ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAdding(true)}
              className="w-full"
            >
              <Plus className="h-3 w-3 mr-2" />
              {t('addModel')}
            </Button>
          ) : (
            <div className="space-y-2">
              <Input
                value={newModelName}
                onChange={(e) => {
                  setNewModelName(e.target.value)
                  setError(null) // Clear error when user types
                }}
                onKeyDown={handleKeyPress}
                placeholder={t('addModelPlaceholder')}
                autoFocus
                className="text-sm"
              />

              {error && (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false)
                    setNewModelName('')
                    setError(null)
                  }}
                >
                  {tCommon('cancel')}
                </Button>

                <Button
                  size="sm"
                  onClick={handleAddModel}
                  disabled={!newModelName.trim()}
                >
                  {tCommon('add')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!modelToDelete}
        onOpenChange={() => setModelToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteModel')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteModelConfirm', { model: modelToDelete as string })}
              {selectedModel === modelToDelete && models.length > 1 && (
                <Badge variant="outline" className="text-xs mt-2">
                  {t('deleteModelNote', {
                    newModel: models.find((m) => m !== modelToDelete) as string,
                  })}
                </Badge>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => modelToDelete && handleDeleteModel(modelToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
