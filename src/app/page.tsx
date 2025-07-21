'use client';

import { useState } from 'react';
import { Settings, Languages, Upload, Zap, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileUpload } from '@/components/upload/FileUpload';
import { LanguageSelector } from '@/components/language/LanguageSelector';
import { ConfigPanel } from '@/components/settings/ConfigPanel';
import { ProgressTracker } from '@/components/progress/ProgressTracker';
import { OutputPanel } from '@/components/output/OutputPanel';
import { SubtitleEntry, TranslationProgress, OutputFormat } from '@/types/translation';
import { LanguageDetector } from '@/lib/language-detector';
import { configManager } from '@/lib/config-manager';

const StepIndicator = ({ step, title, isActive, isCompleted }: {
  step: number;
  title: string;
  isActive: boolean;
  isCompleted: boolean;
}) => (
  <div className="flex items-center gap-3 mb-6">
    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
      isCompleted 
        ? 'bg-green-500 text-white' 
        : isActive 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted text-muted-foreground'
    }`}>
      {isCompleted ? <CheckCircle className="h-4 w-4" /> : step}
    </div>
    <h2 className={`text-lg font-medium ${
      isActive ? 'text-foreground' : 'text-muted-foreground'
    }`}>
      {title}
    </h2>
  </div>
);

export default function Home() {
  const [subtitleFile, setSubtitleFile] = useState<{
    name: string;
    entries: SubtitleEntry[];
    textEntries: string[];
  } | null>(null);
  
  const [detectedLanguage, setDetectedLanguage] = useState<{
    code: string;
    name: string;
    confidence: number;
  } | null>(null);
  
  const [sourceLanguage, setSourceLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [translatedEntries, setTranslatedEntries] = useState<SubtitleEntry[]>([]);
  
  const [progress, setProgress] = useState<TranslationProgress>({ total: 0, completed: 0, failed: 0 });
  const [isTranslating, setIsTranslating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      
      setSubtitleFile({
        name: data.subtitle.name,
        entries: data.subtitle.entries,
        textEntries: data.textEntries
      });
      
      if (data.detectedLanguage) {
        setDetectedLanguage(data.detectedLanguage);
        setSourceLanguage(data.detectedLanguage.code);
      }
      
      setTranslatedEntries([]);
      setProgress({ total: 0, completed: 0, failed: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTranslate = async () => {
    if (!subtitleFile || !sourceLanguage || !targetLanguage) return;
    
    const config = configManager.getConfig();
    const validation = configManager.validateConfig();
    
    if (!validation.isValid) {
      setError(`Configuration error: ${validation.errors.join(', ')}`);
      return;
    }
    
    setIsTranslating(true);
    setError(null);
    setProgress({ total: subtitleFile.textEntries.length, completed: 0, failed: 0 });
    
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: subtitleFile.textEntries,
          sourceLanguage,
          targetLanguage,
          provider: config.defaultProvider,
          model: config.defaultModel,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Translation failed');
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress') {
                setProgress(data.data);
              } else if (data.type === 'complete') {
                const updatedEntries = subtitleFile.entries.map((entry, index) => ({
                  ...entry,
                  translatedText: data.data[index]?.translatedText || entry.text
                }));
                setTranslatedEntries(updatedEntries);
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleExport = async (format: OutputFormat, layout: 'original-top' | 'translation-top', filename: string) => {
    if (!translatedEntries.length) return;
    
    setIsExporting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entries: translatedEntries,
          format,
          layout,
          filename,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const canTranslate = subtitleFile && sourceLanguage && targetLanguage && sourceLanguage !== targetLanguage;
  const currentStep = !subtitleFile ? 1 : !sourceLanguage || !targetLanguage ? 2 : !translatedEntries.length ? 3 : 4;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Languages className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Subtitle Translator</h1>
                <p className="text-xs text-muted-foreground">AI-powered subtitle translation</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setShowConfig(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Error Display */}
          {error && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-destructive/80 mt-1">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Step 1: File Upload */}
          <section>
            <StepIndicator 
              step={1} 
              title="Upload Subtitle File" 
              isActive={currentStep === 1} 
              isCompleted={!!subtitleFile} 
            />
            <FileUpload onFileSelect={handleFileSelect} loading={isUploading} />
          </section>

          {/* Step 2: Language Selection */}
          {subtitleFile && (
            <section>
              <StepIndicator 
                step={2} 
                title="Select Languages" 
                isActive={currentStep === 2} 
                isCompleted={!!sourceLanguage && !!targetLanguage} 
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Language Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* File Info */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{subtitleFile.name}</span>
                    </div>
                    <Badge variant="secondary">
                      {subtitleFile.entries.length} entries
                    </Badge>
                  </div>

                  {/* Language Detection */}
                  {detectedLanguage && (
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                        <Zap className="h-4 w-4" />
                        <span className="font-medium">Language Detected</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 dark:text-blue-300">{detectedLanguage.name}</span>
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          {Math.round(detectedLanguage.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Language Selectors */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <LanguageSelector
                      value={sourceLanguage}
                      onChange={setSourceLanguage}
                      label="Source Language"
                      placeholder="Select source language"
                    />
                    <LanguageSelector
                      value={targetLanguage}
                      onChange={setTargetLanguage}
                      label="Target Language"
                      placeholder="Select target language"
                    />
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Step 3: Translation */}
          {subtitleFile && (
            <section>
              <StepIndicator 
                step={3} 
                title="Translate" 
                isActive={currentStep === 3} 
                isCompleted={translatedEntries.length > 0} 
              />
              
              <Card>
                <CardContent className="pt-6">
                  <Button
                    onClick={handleTranslate}
                    disabled={!canTranslate || isTranslating}
                    size="lg"
                    className="w-full"
                  >
                    {isTranslating ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-pulse" />
                        Translating...
                      </>
                    ) : (
                      <>
                        <Languages className="h-4 w-4 mr-2" />
                        Start Translation
                      </>
                    )}
                  </Button>
                  
                  {!canTranslate && sourceLanguage && targetLanguage && sourceLanguage === targetLanguage && (
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-3 text-center flex items-center justify-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Source and target languages cannot be the same
                    </p>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* Progress Tracker */}
          <ProgressTracker progress={progress} isActive={isTranslating} />

          {/* Step 4: Export */}
          {translatedEntries.length > 0 && (
            <section>
              <StepIndicator 
                step={4} 
                title="Export Results" 
                isActive={currentStep === 4} 
                isCompleted={false} 
              />
              
              <OutputPanel
                entries={translatedEntries}
                originalFilename={subtitleFile?.name || 'subtitle'}
                sourceLanguage={LanguageDetector.getLanguageName(sourceLanguage) || sourceLanguage}
                targetLanguage={LanguageDetector.getLanguageName(targetLanguage) || targetLanguage}
                onExport={handleExport}
                exporting={isExporting}
              />
            </section>
          )}
        </div>
      </main>

      {/* Configuration Panel */}
      <ConfigPanel isOpen={showConfig} onClose={() => setShowConfig(false)} />
    </div>
  );
}