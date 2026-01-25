'use client';

import { useCallback, useState } from 'react';
import { Upload, FileUp, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getImportSource, ImportSource } from '@/lib/import/types';
import { cn } from '@/lib/utils';

interface ImportFileUploadProps {
  source: ImportSource;
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  disabled?: boolean;
  error?: string | null;
}

export function ImportFileUpload({
  source,
  onFileSelect,
  selectedFile,
  onClear,
  disabled,
  error,
}: ImportFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const sourceConfig = getImportSource(source);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (validateFile(file, sourceConfig?.acceptedExtensions || [])) {
          onFileSelect(file);
        }
      }
    },
    [disabled, sourceConfig, onFileSelect]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [onFileSelect]
  );

  const validateFile = (file: File, acceptedExtensions: string[]): boolean => {
    const fileName = file.name.toLowerCase();
    return acceptedExtensions.some((ext) => fileName.endsWith(ext.toLowerCase()));
  };

  const acceptString = sourceConfig?.acceptedExtensions.join(',') || '';

  return (
    <div className="space-y-4">
      {selectedFile ? (
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileUp className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              disabled={disabled}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove file</span>
            </Button>
          </div>
        </div>
      ) : (
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
            isDragging && 'border-primary bg-accent',
            !isDragging && 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <input
            type="file"
            accept={acceptString}
            onChange={handleFileChange}
            disabled={disabled}
            className="sr-only"
          />
          <Upload className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm font-medium">
            {isDragging ? 'Drop file here' : 'Drag and drop or click to upload'}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Accepted formats: {sourceConfig?.acceptedExtensions.join(', ')}
          </p>
          <p className="text-xs text-muted-foreground">
            Max file size: {formatFileSize(sourceConfig?.maxFileSize || 0)}
          </p>
        </label>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
