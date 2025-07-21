'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  loading?: boolean;
}

export function FileUpload({ onFileSelect, loading = false }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    const allowedExtensions = ['.srt', '.vtt', '.ass', '.ssa'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return `Unsupported file type. Allowed types: ${allowedExtensions.join(', ')}`;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      return 'File size too large. Maximum size is 10MB.';
    }
    
    return null;
  };

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError(null);
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div className="w-full space-y-4">
      <Card
        className={`
          relative border-2 border-dashed transition-all cursor-pointer
          ${dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }
          ${loading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          <input
            type="file"
            accept=".srt,.vtt,.ass,.ssa"
            onChange={handleFileInput}
            disabled={loading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="flex flex-col items-center gap-4 text-center">
            {loading ? (
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
            )}
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {loading ? 'Processing file...' : 'Upload subtitle file'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop your subtitle file here, or click to browse
              </p>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Max file size: 10MB</span>
              </div>
              
              <div className="flex gap-1">
                {['.srt', '.vtt', '.ass', '.ssa'].map((ext) => (
                  <Badge key={ext} variant="secondary" className="text-xs">
                    {ext}
                  </Badge>
                ))}
              </div>
            </div>
            
            {!loading && (
              <Button variant="outline" size="sm" className="mt-2">
                Choose File
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Upload Error</span>
            </div>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}