'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModelManager } from '@/components/settings/ModelManager';
import { AIProvider } from '@/types/translation';

interface ProviderManagerProps {
  providers: Record<string, AIProvider>;
  onAddProvider: (provider: AIProvider) => void;
  onRemoveProvider: (providerId: string) => void;
  onUpdateProvider: (providerId: string, provider: AIProvider) => void;
}

interface ProviderFormData {
  name: string;
  apiKey: string;
  baseURL: string;
  models: string[];
  selectedModel?: string;
}

export function ProviderManager({ 
  providers, 
  onAddProvider, 
  onRemoveProvider, 
  onUpdateProvider 
}: ProviderManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProviderFormData>({
    name: '',
    apiKey: '',
    baseURL: '',
    models: [],
    selectedModel: '',
  });

  const customProviders = Object.entries(providers).filter(([, provider]) => provider.isCustom);

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.apiKey.trim() || formData.models.length === 0) return;

    const provider: AIProvider = {
      name: formData.name,
      apiKey: formData.apiKey,
      baseURL: formData.baseURL || undefined,
      models: formData.models,
      defaultModel: formData.selectedModel || formData.models[0],
      selectedModel: formData.selectedModel || formData.models[0],
      isCustom: true
    };

    if (editingProvider) {
      onUpdateProvider(editingProvider, provider);
      setEditingProvider(null);
    } else {
      onAddProvider(provider);
    }

    resetForm();
  };

  const handleEdit = (providerId: string, provider: AIProvider) => {
    setFormData({
      name: provider.name,
      apiKey: provider.apiKey,
      baseURL: provider.baseURL || '',
      models: provider.models,
      selectedModel: provider.selectedModel || provider.defaultModel || provider.models[0]
    });
    setEditingProvider(providerId);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({ name: '', apiKey: '', baseURL: '', models: [], selectedModel: '' });
    setShowAddForm(false);
    setEditingProvider(null);
  };

  return (
    <div className="space-y-4">
      {/* Add Provider Button */}
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Custom Providers</h4>
        <Button size="sm" onClick={() => setShowAddForm(true)} disabled={showAddForm}>
          <Plus className="h-3 w-3 mr-1" />
          Add Provider
        </Button>
      </div>

      {/* Add/Edit Provider Form */}
      {showAddForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {editingProvider ? 'Edit Provider' : 'Add Custom Provider'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="provider-name">Name</Label>
                <Input
                  id="provider-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Local LLM"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider-key">API Key</Label>
                <Input
                  id="provider-key"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, baseURL: e.target.value }))}
                placeholder="https://api.example.com/v1"
              />
            </div>
            
            <ModelManager
              models={formData.models}
              selectedModel={formData.selectedModel}
              onModelsChange={(models) => setFormData(prev => ({ ...prev, models }))}
              onSelectedModelChange={(model) => setFormData(prev => ({ ...prev, selectedModel: model }))}
            />
            
            <div className="flex gap-2 pt-2">
              <Button 
                size="sm" 
                onClick={handleSubmit}
                disabled={!formData.name.trim() || !formData.apiKey.trim() || formData.models.length === 0}
              >
                {editingProvider ? 'Update' : 'Add'} Provider
              </Button>
              <Button size="sm" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Providers List */}
      {customProviders.length > 0 ? (
        <div className="space-y-2">
          {customProviders.map(([providerId, provider]) => (
            <Card key={providerId} className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{provider.name}</span>
                      <Badge variant="secondary" className="text-xs">Custom</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {provider.models.length} model(s) • {provider.baseURL || 'Default URL'}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(providerId, provider)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveProvider(providerId)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No custom providers configured</p>
          <p className="text-xs">Add custom providers to extend AI support</p>
        </div>
      )}
    </div>
  );
}