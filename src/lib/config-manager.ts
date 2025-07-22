import { TranslationConfig } from '@/types/translation';
import defaultConfig from '@/config/translation-config.json';

class ConfigManager {
  private config: TranslationConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): TranslationConfig {
    // Load from localStorage if available (browser)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('translation-config');
      if (stored) {
        try {
          const config = { ...defaultConfig, ...JSON.parse(stored) };
          // Ensure all providers have defaultModel set
          Object.keys(config.providers).forEach(providerId => {
            const provider = config.providers[providerId];
            if (!provider.defaultModel && provider.models.length > 0) {
              provider.defaultModel = provider.models[0];
            }
            // Initialize selectedModel to defaultModel if not set
            if (!provider.selectedModel && provider.defaultModel) {
              provider.selectedModel = provider.defaultModel;
            }
          });
          return config;
        } catch (error) {
          console.warn('Invalid stored config, using defaults:', error);
        }
      }
    }
    const config = defaultConfig as TranslationConfig;
    // Ensure all providers have defaultModel set
    Object.keys(config.providers).forEach(providerId => {
      const provider = config.providers[providerId];
      if (!provider.defaultModel && provider.models.length > 0) {
        provider.defaultModel = provider.models[0];
      }
      // Initialize selectedModel to defaultModel if not set
      if (!provider.selectedModel && provider.defaultModel) {
        provider.selectedModel = provider.defaultModel;
      }
    });
    return config;
  }

  public getConfig(): TranslationConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<TranslationConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  public updateProvider(providerId: string, providerData: Partial<TranslationConfig['providers'][string]>): void {
    this.config.providers[providerId] = {
      ...this.config.providers[providerId],
      ...providerData
    };
    this.saveConfig();
  }

  public addCustomProvider(provider: TranslationConfig['providers'][string]): string {
    const providerId = provider.id || provider.name.toLowerCase().replace(/\s+/g, '-');
    const defaultModel = provider.defaultModel || provider.models[0] || '';
    this.config.providers[providerId] = {
      ...provider,
      id: providerId,
      isCustom: true,
      defaultModel,
      selectedModel: provider.selectedModel || defaultModel
    };
    this.saveConfig();
    return providerId;
  }

  public removeProvider(providerId: string): boolean {
    const provider = this.config.providers[providerId];
    if (!provider || !provider.isCustom) {
      return false; // Can't remove built-in providers
    }
    
    delete this.config.providers[providerId];
    
    // Update default provider if it was the removed one
    if (this.config.defaultProvider === providerId) {
      const availableProviders = Object.keys(this.config.providers);
      this.config.defaultProvider = availableProviders[0] || 'openai';
    }
    
    this.saveConfig();
    return true;
  }

  public getBuiltInProviders(): Record<string, TranslationConfig['providers'][string]> {
    const builtInProviders: Record<string, TranslationConfig['providers'][string]> = {};
    for (const [id, provider] of Object.entries(this.config.providers)) {
      if (!provider.isCustom) {
        builtInProviders[id] = provider;
      }
    }
    return builtInProviders;
  }

  public getCustomProviders(): Record<string, TranslationConfig['providers'][string]> {
    const customProviders: Record<string, TranslationConfig['providers'][string]> = {};
    for (const [id, provider] of Object.entries(this.config.providers)) {
      if (provider.isCustom) {
        customProviders[id] = provider;
      }
    }
    return customProviders;
  }

  private saveConfig(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('translation-config', JSON.stringify(this.config));
    }
  }

  public getAvailableProviders(): string[] {
    return Object.keys(this.config.providers).filter(
      providerId => this.config.providers[providerId].apiKey?.trim()
    );
  }

  public getProviderModels(providerId: string): string[] {
    return this.config.providers[providerId]?.models || [];
  }

  public isProviderConfigured(providerId: string): boolean {
    const provider = this.config.providers[providerId];
    return !!(provider?.apiKey?.trim());
  }

  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.config.defaultProvider) {
      errors.push('Default provider is not set');
    }
    
    if (!this.config.providers[this.config.defaultProvider]) {
      errors.push('Default provider does not exist in providers');
    }
    
    if (!this.isProviderConfigured(this.config.defaultProvider)) {
      errors.push('Default provider is not configured with API key');
    }
    
    if (this.config.concurrency < 1 || this.config.concurrency > 100) {
      errors.push('Concurrency must be between 1 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public resetToDefaults(): void {
    this.config = defaultConfig as TranslationConfig;
    this.saveConfig();
  }
}

export const configManager = new ConfigManager();
export default ConfigManager;