'use client'

import { useState, useEffect } from 'react'
import { Settings, TestTube, Save, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

  const handleProviderUpdate = (
    providerId: string,
    field: keyof AIProvider,
    value: string | string[]
  ) => {
    setConfig((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [providerId]: {
          ...prev.providers[providerId],
          [field]: value,
        },
      },
    }))
  }

  const handleConfigUpdate = (
    field: keyof TranslationConfig,
    value: string | number
  ) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = () => {
    configManager.updateConfig(config)
    onClose()
  }

  const handleTestConnection = async (providerId: string) => {
    const provider = config.providers[providerId]
    if (!provider.apiKey.trim()) {
      setTestResults((prev) => ({
        ...prev,
        [providerId]: { success: false, error: 'API key is required' },
      }))
      return
    }

    setTesting((prev) => ({ ...prev, [providerId]: true }))

    try {
      const response = await fetch(
        `/api/translate?provider=${providerId}&model=${provider.models[0]}`
      )
      const result = await response.json()

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
            Translation Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-8 min-h-[600px]">
          {/* Left Panel - Provider Selection & Navigation */}
          <div className="w-64 border-r pr-8 space-y-4 flex flex-col">
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-3">AI Providers</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
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
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedProvider(providerId)
                        setViewMode('provider')
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{provider.name}</span>
                        {provider.isCustom && (
                          <Badge variant="secondary" className="text-xs">
                            Custom
                          </Badge>
                        )}
                      </div>
                    </Button>
                  )
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => setViewMode('addProvider')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
            </div>

            <div className="mt-auto pt-4">
              <Button
                variant={viewMode === 'general' ? 'default' : 'ghost'}
                size="sm"
                className="w-full"
                onClick={() => setViewMode('general')}
              >
                <Settings className="h-4 w-4 mr-2" />
                General Settings
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
                        {config.providers[selectedProvider].name} Configuration
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {testResults[selectedProvider] && (
                          <Badge
                            variant={
                              testResults[selectedProvider].success
                                ? 'default'
                                : 'destructive'
                            }
                            className="text-xs"
                          >
                            {testResults[selectedProvider].success
                              ? 'Connected'
                              : 'Failed'}
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
                          <span className="ml-1">Test Connection</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`${selectedProvider}-key`}>
                          API Key
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
                          placeholder="Enter your API key"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${selectedProvider}-url`}>
                          Base URL (Optional)
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
                          placeholder="Custom API endpoint"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Available Models</Label>
                        <div className="flex flex-wrap gap-2">
                          {config.providers[selectedProvider].models.map(
                            (model, index) => (
                              <Badge key={index} variant="outline">
                                {model}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>

                      {config.providers[selectedProvider].isCustom && (
                        <div className="pt-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleRemoveProvider(selectedProvider)
                            }
                          >
                            Remove Provider
                          </Button>
                        </div>
                      )}
                    </div>

                    {testResults[selectedProvider] &&
                      !testResults[selectedProvider].success && (
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                          <strong>Error:</strong>{' '}
                          {testResults[selectedProvider].error}
                        </div>
                      )}
                  </CardContent>
                </Card>
              )}

            {viewMode === 'addProvider' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add Custom Provider</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="provider-name">Provider Name</Label>
                      <Input
                        id="provider-name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="e.g., Local LLM"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provider-key">API Key</Label>
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
                        placeholder="Enter API key"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="provider-url">Base URL (Optional)</Label>
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
                      placeholder="https://api.example.com/v1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="provider-models">
                      Model Names (one per line)
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
                      placeholder="gpt-4\ngpt-3.5-turbo"
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
                      Add Provider
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setViewMode('provider')}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {viewMode === 'general' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">General Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Default Provider</Label>
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

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">Concurrency</Label>
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
                        Number of simultaneous translations to process
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Output Format</Label>
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
                            Original on top
                          </SelectItem>
                          <SelectItem value="translation-top">
                            Translation on top
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Default layout for exported subtitle files
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
