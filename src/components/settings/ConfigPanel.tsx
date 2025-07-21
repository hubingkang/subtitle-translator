'use client';

import { useState, useEffect } from 'react';
import { Settings, Key, Zap, Save, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { configManager } from '@/lib/config-manager';
import { TranslationConfig, AIProvider } from '@/types/translation';

interface ConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConfigPanel({ isOpen, onClose }: ConfigPanelProps) {
  const [config, setConfig] = useState<TranslationConfig>(configManager.getConfig());
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; error?: string }>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setConfig(configManager.getConfig());
    }
  }, [isOpen]);

  const handleProviderUpdate = (providerId: string, field: keyof AIProvider, value: string) => {
    setConfig(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [providerId]: {
          ...prev.providers[providerId],
          [field]: value
        }
      }
    }));
  };

  const handleConfigUpdate = (field: keyof TranslationConfig, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    configManager.updateConfig(config);
    onClose();
  };

  const handleTestConnection = async (providerId: string) => {
    const provider = config.providers[providerId];
    if (!provider.apiKey.trim()) {
      setTestResults(prev => ({
        ...prev,
        [providerId]: { success: false, error: 'API key is required' }
      }));
      return;
    }

    setTesting(prev => ({ ...prev, [providerId]: true }));
    
    try {
      const response = await fetch(`/api/translate?provider=${providerId}&model=${provider.models[0]}`);
      const result = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [providerId]: result
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [providerId]: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Connection failed' 
        }
      }));
    } finally {
      setTesting(prev => ({ ...prev, [providerId]: false }));
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Translation Configuration
          </SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-8">
          {/* AI Providers */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-4 w-4" />
              <h3 className="text-lg font-medium">AI Providers</h3>
            </div>
            
            <div className="space-y-4">
              {Object.entries(config.providers).map(([providerId, provider]) => (
                <Card key={providerId}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{provider.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {testResults[providerId] && (
                          <Badge 
                            variant={testResults[providerId].success ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {testResults[providerId].success ? 'Connected' : 'Failed'}
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestConnection(providerId)}
                          disabled={testing[providerId] || !provider.apiKey.trim()}
                        >
                          {testing[providerId] ? (
                            <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
                          ) : (
                            <TestTube className="h-3 w-3" />
                          )}
                          <span className="ml-1">Test</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${providerId}-key`}>API Key</Label>
                      <Input
                        id={`${providerId}-key`}
                        type="password"
                        value={provider.apiKey}
                        onChange={(e) => handleProviderUpdate(providerId, 'apiKey', e.target.value)}
                        placeholder="Enter your API key"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`${providerId}-url`}>Base URL (Optional)</Label>
                      <Input
                        id={`${providerId}-url`}
                        type="url"
                        value={provider.baseURL || ''}
                        onChange={(e) => handleProviderUpdate(providerId, 'baseURL', e.target.value)}
                        placeholder="Custom API endpoint"
                      />
                    </div>
                    
                    {testResults[providerId] && !testResults[providerId].success && (
                      <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                        <strong>Error:</strong> {testResults[providerId].error}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Separator />

          {/* General Settings */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4" />
              <h3 className="text-lg font-medium">General Settings</h3>
            </div>
            
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label>Default Provider</Label>
                  <Select
                    value={config.defaultProvider}
                    onValueChange={(value) => handleConfigUpdate('defaultProvider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(config.providers).map(([providerId, provider]) => (
                        <SelectItem key={providerId} value={providerId}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Default Model</Label>
                  <Select
                    value={config.defaultModel}
                    onValueChange={(value) => handleConfigUpdate('defaultModel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {config.providers[config.defaultProvider]?.models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Concurrency</Label>
                    <Badge variant="outline">{config.concurrency} simultaneous</Badge>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={config.concurrency}
                    onChange={(e) => handleConfigUpdate('concurrency', parseInt(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>10</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Output Format</Label>
                  <Select
                    value={config.outputFormat}
                    onValueChange={(value) => handleConfigUpdate('outputFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="original-top">Original text on top</SelectItem>
                      <SelectItem value="translation-top">Translation on top</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-retries">Max Retries</Label>
                  <Input
                    id="max-retries"
                    type="number"
                    min="0"
                    max="5"
                    value={config.maxRetries}
                    onChange={(e) => handleConfigUpdate('maxRetries', parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}