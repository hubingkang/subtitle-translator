'use client';

import { useState } from 'react';
import { Download, FileText, Settings as SettingsIcon, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { SubtitleEntry, OutputFormat } from '@/types/translation';

interface OutputPanelProps {
  entries: SubtitleEntry[];
  originalFilename: string;
  sourceLanguage: string;
  targetLanguage: string;
  onExport: (format: OutputFormat, layout: 'original-top' | 'translation-top', filename: string) => void;
  exporting?: boolean;
}

export function OutputPanel({ 
  entries, 
  originalFilename, 
  sourceLanguage, 
  targetLanguage,
  onExport,
  exporting = false 
}: OutputPanelProps) {
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>('srt');
  const [selectedLayout, setSelectedLayout] = useState<'original-top' | 'translation-top'>('original-top');
  const [customFilename, setCustomFilename] = useState(() => {
    const baseName = originalFilename.replace(/\.[^/.]+$/, '');
    return `${baseName}_translated`;
  });
  const [showPreview, setShowPreview] = useState(false);

  const handleExport = () => {
    onExport(selectedFormat, selectedLayout, customFilename);
  };

  const hasTranslations = entries.some(entry => entry.translatedText);
  const translatedCount = entries.filter(e => e.translatedText).length;

  // Generate preview content
  const previewContent = entries.slice(0, 3).map((entry, index) => {
    let text: string;
    if (entry.translatedText) {
      if (selectedLayout === 'original-top') {
        text = `${entry.text}\n${entry.translatedText}`;
      } else {
        text = `${entry.translatedText}\n${entry.text}`;
      }
    } else {
      text = entry.text;
    }

    return `${index + 1}\n${new Date(entry.startTime).toISOString().substr(11, 12)} --> ${new Date(entry.endTime).toISOString().substr(11, 12)}\n${text}\n`;
  }).join('\n');

  if (!hasTranslations) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No translations available</h3>
            <p className="text-sm">Complete the translation process to export results</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Translated Subtitles
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Export Statistics */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm font-medium">Ready for Export</p>
            <p className="text-xs text-muted-foreground">
              {translatedCount} of {entries.length} entries translated
            </p>
          </div>
          <Badge variant="secondary" className="font-mono">
            {Math.round((translatedCount / entries.length) * 100)}%
          </Badge>
        </div>

        {/* Format Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Export Format</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['srt', 'vtt', 'ass'] as OutputFormat[]).map((format) => (
              <Button
                key={format}
                variant={selectedFormat === format ? "default" : "outline"}
                onClick={() => setSelectedFormat(format)}
                className="flex flex-col h-auto py-3"
              >
                <span className="font-medium">{format.toUpperCase()}</span>
                <span className="text-xs opacity-75">
                  {format === 'srt' && 'SubRip'}
                  {format === 'vtt' && 'WebVTT'}
                  {format === 'ass' && 'Advanced SSA'}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Layout Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Subtitle Layout</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="original-top"
                name="layout"
                value="original-top"
                checked={selectedLayout === 'original-top'}
                onChange={(e) => setSelectedLayout(e.target.value as 'original-top')}
                className="w-4 h-4"
              />
              <Label htmlFor="original-top" className="flex-1 cursor-pointer">
                <div className="font-medium">Original on Top</div>
                <div className="text-xs text-muted-foreground">
                  {sourceLanguage} text first, then {targetLanguage}
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="translation-top"
                name="layout"
                value="translation-top"
                checked={selectedLayout === 'translation-top'}
                onChange={(e) => setSelectedLayout(e.target.value as 'translation-top')}
                className="w-4 h-4"
              />
              <Label htmlFor="translation-top" className="flex-1 cursor-pointer">
                <div className="font-medium">Translation on Top</div>
                <div className="text-xs text-muted-foreground">
                  {targetLanguage} text first, then {sourceLanguage}
                </div>
              </Label>
            </div>
          </div>
        </div>

        {/* Filename */}
        <div className="space-y-2">
          <Label htmlFor="filename">Filename</Label>
          <div className="flex gap-2">
            <Input
              id="filename"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              placeholder="Enter filename"
              className="flex-1"
            />
            <div className="px-3 py-2 bg-muted border rounded-md text-muted-foreground font-mono text-sm flex items-center">
              .{selectedFormat}
            </div>
          </div>
        </div>

        {/* Preview Toggle */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Preview</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="space-y-2">
            <Textarea
              value={previewContent}
              readOnly
              className="font-mono text-sm h-32 resize-none"
              placeholder="Preview will appear here..."
            />
            {entries.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                Showing first 3 entries of {entries.length} total
              </p>
            )}
          </div>
        )}

        <Separator />

        {/* Export Button */}
        <Button 
          onClick={handleExport}
          disabled={exporting || !customFilename.trim()}
          className="w-full"
          size="lg"
        >
          {exporting ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              Generating File...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export {selectedFormat.toUpperCase()} File
            </>
          )}
        </Button>

        {/* Export Info */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <SettingsIcon className="h-3 w-3" />
          <span>File will include {translatedCount} translated entries</span>
        </div>
      </CardContent>
    </Card>
  );
}