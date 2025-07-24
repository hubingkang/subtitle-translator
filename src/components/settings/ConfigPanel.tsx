'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Settings, TestTube, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ModelManager } from '@/components/settings/ModelManager'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { configManager } from '@/lib/config-manager'
import { TranslationConfig, AIProvider } from '@/types/translation'
import { cn } from '@/lib/utils'

interface ConfigPanelProps {
  isOpen: boolean
  onClose: () => void
}

type ViewMode = 'provider' | 'general' | 'addProvider'

interface ProviderFormData {
  name: string
  apiKey: string
  baseURL: string
  models: string
}

export function ConfigPanel({ isOpen, onClose }: ConfigPanelProps) {
  const t = useTranslations('config')
  const tCommon = useTranslations('common')
  const [config, setConfig] = useState<TranslationConfig>(
    configManager.getConfig()
  )
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; error?: string }>
  >({})
  const [testing, setTesting] = useState<Record<string, boolean>>({})
  const [selectedProvider, setSelectedProvider] = useState<string>('openai')
  const [viewMode, setViewMode] = useState<ViewMode>('provider')
  const [formData, setFormData] = useState<ProviderFormData>({
    name: '',
    apiKey: '',
    baseURL: '',
    models: '',
  })

  useEffect(() => {
    if (isOpen) {
      setConfig(configManager.getConfig())
      // Set first available provider as selected
      const providers = Object.keys(configManager.getConfig().providers)
      if (providers.length > 0) {
        setSelectedProvider(providers[0])
      }
      setViewMode('provider')
      resetForm()
    }
  }, [isOpen])

  const resetForm = () => {
    setFormData({ name: '', apiKey: '', baseURL: '', models: '' })
  }

  const handleAddProvider = () => {
    if (!formData.name.trim() || !formData.apiKey.trim()) return

    const provider: AIProvider = {
      name: formData.name,
      apiKey: formData.apiKey,
      baseURL: formData.baseURL || undefined,
      models: formData.models
        .split('\n')
        .map((m) => m.trim())
        .filter((m) => m.length > 0),
      isCustom: true,
    }

    const providerId = configManager.addCustomProvider(provider)
    setConfig(configManager.getConfig())
    setSelectedProvider(providerId)
    setViewMode('provider')
    resetForm()
  }

  const handleRemoveProvider = (providerId: string) => {
    if (configManager.removeProvider(providerId)) {
      setConfig(configManager.getConfig())
      // Select first available provider if current was removed
      const providers = Object.keys(configManager.getConfig().providers)
      if (providers.length > 0 && selectedProvider === providerId) {
        setSelectedProvider(providers[0])
      }
    }
  }

  const handleModelsChange = (providerId: string, models: string[]) => {
    configManager.updateProviderModels(providerId, models)
    setConfig(configManager.getConfig())
  }

  const handleSelectedModelChange = (providerId: string, model: string) => {
    handleProviderUpdate(providerId, 'selectedModel', model)
  }

  const handleProviderUpdate = (
    providerId: string,
    field: keyof AIProvider,
    value: string | string[]
  ) => {
    const updatedConfig = {
      ...config,
      providers: {
        ...config.providers,
        [providerId]: {
          ...config.providers[providerId],
          [field]: value,
        },
      },
    }
    setConfig(updatedConfig)
    // Immediately sync to configManager and localStorage
    configManager.updateProvider(providerId, { [field]: value })
  }

  const handleConfigUpdate = (
    field: keyof TranslationConfig,
    value: string | number
  ) => {
    const updatedConfig = {
      ...config,
      [field]: value,
    }
    setConfig(updatedConfig)
    // Immediately sync to configManager and localStorage
    configManager.updateConfig({ [field]: value })
  }

  const handleTestConnection = async (providerId: string) => {
    const provider = config.providers[providerId]
    if (!provider.apiKey.trim()) {
      setTestResults((prev) => ({
        ...prev,
        [providerId]: { success: false, error: t('apiKeyRequired') },
      }))
      return
    }

    setTesting((prev) => ({ ...prev, [providerId]: true }))

    try {
      // Import TranslatorClient dynamically to avoid SSR issues
      const { TranslatorClient } = await import(
        '@/lib/client/translator-client'
      )
      const translator = new TranslatorClient()

      // Use the selected model or default model or first model
      const modelToTest =
        provider.selectedModel || provider.defaultModel || provider.models[0]

      const result = await translator.testConnection(providerId, modelToTest)

      setTestResults((prev) => ({
        ...prev,
        [providerId]: result,
      }))
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [providerId]: {
          success: false,
          error: error instanceof Error ? error.message : 'Connection failed',
        },
      }))
    } finally {
      setTesting((prev) => ({ ...prev, [providerId]: false }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-8 min-h-[600px]">
          {/* Left Panel - Provider Selection & Navigation */}
          <div className="w-64 border-r space-y-4 flex flex-col">
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-3">{t('aiProviders')}</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-8">
                {Object.entries(config.providers).map(
                  ([providerId, provider]) => (
                    <Button
                      key={providerId}
                      variant={
                        selectedProvider === providerId &&
                        viewMode === 'provider'
                          ? 'default'
                          : 'ghost'
                      }
                      size="sm"
                      className="w-full justify-start cursor-pointer"
                      onClick={() => {
                        setSelectedProvider(providerId)
                        setViewMode('provider')
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{provider.name}</span>
                        {provider.isCustom && (
                          <Badge variant="secondary" className="text-xs">
                            {t('custom')}
                          </Badge>
                        )}
                      </div>
                    </Button>
                  )
                )}
              </div>

              <div className="pr-8">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 cursor-pointer"
                  onClick={() => setViewMode('addProvider')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addProvider')}
                </Button>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t pr-8">
              <Button
                variant={viewMode === 'general' ? 'default' : 'outline'}
                size="sm"
                className="w-full cursor-pointer"
                onClick={() => setViewMode('general')}
              >
                <Settings className="h-4 w-4 mr-2" />
                {t('generalSettings')}
              </Button>
            </div>
          </div>

          {/* Right Panel - Content Area */}
          <div className="flex-1 overflow-y-auto">
            {viewMode === 'provider' &&
              selectedProvider &&
              config.providers[selectedProvider] && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {config.providers[selectedProvider].name} {t('configuration')}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {testResults[selectedProvider] && (
                          <Badge
                            variant={
                              testResults[selectedProvider].success
                                ? 'default'
                                : 'destructive'
                            }
                            className={cn(
                              'text-xs',
                              testResults[selectedProvider].success
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                            )}
                          >
                            {testResults[selectedProvider].success
                              ? t('connected')
                              : t('failed')}
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestConnection(selectedProvider)}
                          disabled={
                            testing[selectedProvider] ||
                            !config.providers[selectedProvider].apiKey.trim()
                          }
                        >
                          {testing[selectedProvider] ? (
                            <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
                          ) : (
                            <TestTube className="h-3 w-3" />
                          )}
                          <span className="ml-1">{t('testConnection')}</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`${selectedProvider}-key`}>
                          {t('apiKey')}
                        </Label>
                        <Input
                          id={`${selectedProvider}-key`}
                          type="password"
                          value={config.providers[selectedProvider].apiKey}
                          onChange={(e) =>
                            handleProviderUpdate(
                              selectedProvider,
                              'apiKey',
                              e.target.value
                            )
                          }
                          placeholder={t('apiKeyPlaceholder')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${selectedProvider}-url`}>
                          {t('baseUrl')}
                        </Label>
                        <Input
                          id={`${selectedProvider}-url`}
                          type="url"
                          value={
                            config.providers[selectedProvider].baseURL || ''
                          }
                          onChange={(e) =>
                            handleProviderUpdate(
                              selectedProvider,
                              'baseURL',
                              e.target.value
                            )
                          }
                          placeholder={t('customEndpoint')}
                        />
                      </div>

                      <ModelManager
                        models={config.providers[selectedProvider].models}
                        selectedModel={
                          config.providers[selectedProvider].selectedModel ||
                          config.providers[selectedProvider].defaultModel ||
                          ''
                        }
                        onModelsChange={(models) => handleModelsChange(selectedProvider, models)}
                        onSelectedModelChange={(model) => handleSelectedModelChange(selectedProvider, model)}
                      />

                      {config.providers[selectedProvider].isCustom && (
                        <div className="pt-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() =>
                              handleRemoveProvider(selectedProvider)
                            }
                          >
                            {t('removeProvider')}
                          </Button>
                        </div>
                      )}
                    </div>

                    {testResults[selectedProvider] &&
                      !testResults[selectedProvider].success && (
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                          <strong>{t('errorPrefix')}</strong>{' '}
                          {testResults[selectedProvider].error}
                        </div>
                      )}
                  </CardContent>
                </Card>
              )}

            {viewMode === 'addProvider' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('addCustomProvider')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="provider-name">{t('providerName')}</Label>
                      <Input
                        id="provider-name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder={t('providerNamePlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provider-key">{t('apiKey')}</Label>
                      <Input
                        id="provider-key"
                        type="password"
                        value={formData.apiKey}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            apiKey: e.target.value,
                          }))
                        }
                        placeholder={t('apiKeyPlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="provider-url">{t('baseUrl')}</Label>
                    <Input
                      id="provider-url"
                      type="url"
                      value={formData.baseURL}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          baseURL: e.target.value,
                        }))
                      }
                      placeholder={t('baseUrlPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="provider-models">
                      {t('modelNames')}
                    </Label>
                    <Textarea
                      id="provider-models"
                      value={formData.models}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          models: e.target.value,
                        }))
                      }
                      placeholder={t('modelNamesPlaceholder')}
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleAddProvider}
                      disabled={
                        !formData.name.trim() || !formData.apiKey.trim()
                      }
                    >
                      {t('addProvider')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setViewMode('provider')}
                    >
                      {tCommon('cancel')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {viewMode === 'general' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('generalSettings')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm">{t('defaultProvider')}</Label>
                      <Select
                        value={config.defaultProvider}
                        onValueChange={(value) =>
                          handleConfigUpdate('defaultProvider', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                    </div>

                    {config.providers[config.defaultProvider] && (
                      <div className="space-y-2">
                        <Label className="text-sm">{t('defaultModel')}</Label>
                        <Select
                          value={config.defaultModel || ''}
                          onValueChange={(value) =>
                            handleConfigUpdate('defaultModel', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectModel')} />
                          </SelectTrigger>
                          <SelectContent>
                            {config.providers[
                              config.defaultProvider
                            ].models.map((model) => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {t('defaultModelDescription')}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">{t('concurrency')}</Label>
                        <Badge variant="outline" className="text-xs">
                          {config.concurrency}
                        </Badge>
                      </div>
                      <Slider
                        min={1}
                        max={100}
                        value={[config.concurrency]}
                        onValueChange={([value]) =>
                          handleConfigUpdate('concurrency', value)
                        }
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('concurrencyDescription')}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">{t('subtitlesPerBatch')}</Label>
                        <Badge variant="outline" className="text-xs">
                          {config.subtitleBatchSize || 5}
                        </Badge>
                      </div>
                      <Slider
                        min={1}
                        max={20}
                        value={[config.subtitleBatchSize || 5]}
                        onValueChange={([value]) =>
                          handleConfigUpdate('subtitleBatchSize', value)
                        }
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('subtitlesPerBatchDescription')}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">{t('outputFormat')}</Label>
                      <Select
                        value={config.outputFormat}
                        onValueChange={(value) =>
                          handleConfigUpdate('outputFormat', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="original-top">
                            {t('originalOnTop')}
                          </SelectItem>
                          <SelectItem value="translation-top">
                            {t('translationOnTop')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {t('outputFormatDescription')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  )
}
