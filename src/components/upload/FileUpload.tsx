'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void
  loading?: boolean
  multiple?: boolean
}

export function FileUpload({
  onFilesSelect,
  loading = false,
  multiple = true,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const validateFile = (file: File): string | null => {
    const allowedExtensions = ['.srt', '.vtt', '.ass', '.ssa']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!allowedExtensions.includes(fileExtension)) {
      return `Unsupported file type. Allowed types: ${allowedExtensions.join(
        ', '
      )}`
    }

    if (file.size > 10 * 1024 * 1024) {
      return 'File size too large. Maximum size is 10MB.'
    }

    return null
  }

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const validFiles: File[] = []
      const errors: string[] = []

      Array.from(files).forEach((file) => {
        const validationError = validateFile(file)
        if (validationError) {
          errors.push(`${file.name}: ${validationError}`)
        } else {
          validFiles.push(file)
        }
      })

      setErrors(errors)

      if (validFiles.length > 0) {
        onFilesSelect(validFiles)
      }
    },
    [onFilesSelect]
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFiles(files)
      }
    },
    [handleFiles]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFiles(files)
      }
    },
    [handleFiles]
  )

  return (
    <div className="w-full space-y-4">
      <Card
        className={`
          relative border-2 border-dashed transition-all cursor-pointer
          ${
            dragActive
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
        <CardContent>
          <input
            type="file"
            accept=".srt,.vtt,.ass,.ssa"
            multiple={multiple}
            onChange={handleFileInput}
            disabled={loading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="flex flex-col items-center gap-4 text-center">
            {loading ? (
              <div className="flex items-center justify-center p-2">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {loading
                  ? 'Processing files...'
                  : `Upload subtitle file${multiple ? 's' : ''}`}
              </h3>
              <p className="text-sm text-muted-foreground">
                {multiple
                  ? 'Drag and drop your subtitle files here, or click to browse'
                  : 'Drag and drop your subtitle file here, or click to browse'}
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap justify-center">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-4 w-4" />
                {/* <span>Max file size: 10MB</span> */}
              </div>

              <div className="flex gap-1">
                {['.srt', '.vtt', '.ass', '.ssa'].map((ext) => (
                  <Badge key={ext} variant="secondary" className="text-xs">
                    {ext}
                  </Badge>
                ))}
              </div>
            </div>

            {/* {!loading && (
              <Button variant="outline" size="sm" className="mt-2">
                Choose File{multiple ? 's' : ''}
              </Button>
            )} */}
          </div>
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Upload Errors</span>
            </div>
            <div className="space-y-1">
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-destructive/80">
                  {error}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
