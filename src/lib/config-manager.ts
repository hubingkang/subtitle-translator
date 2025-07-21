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
          return { ...defaultConfig, ...JSON.parse(stored) };
        } catch (error) {
          console.warn('Invalid stored config, using defaults:', error);
        }
      }
    }
    return defaultConfig as TranslationConfig;
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
    
    if (this.config.concurrency < 1 || this.config.concurrency > 10) {
      errors.push('Concurrency must be between 1 and 10');
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