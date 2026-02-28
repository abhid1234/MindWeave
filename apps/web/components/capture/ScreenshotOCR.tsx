'use client';

import { useState, useRef, useCallback } from 'react';
import { ScanText, Loader2, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NextImage from 'next/image';

export interface ScreenshotOCRProps {
  onTextExtracted: (text: string) => void;
  disabled?: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ScreenshotOCR({ onTextExtracted, disabled = false }: ScreenshotOCRProps) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload a JPEG, PNG, GIF, or WebP image.');
      return;
    }

    if (file.size > MAX_SIZE) {
      setError('Image must be smaller than 10MB.');
      return;
    }

    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExtract = async () => {
    if (!image) return;

    setIsExtracting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to extract text');
        return;
      }

      if (!data.text) {
        setError('No text was found in the image.');
        return;
      }

      onTextExtracted(data.text);
      // Clear state after successful extraction
      setImage(null);
      setPreview(null);
    } catch {
      setError('Failed to extract text. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleRemove = () => {
    setImage(null);
    setPreview(null);
    setError(null);
  };

  // Show upload zone if no image selected
  if (!image) {
    return (
      <div>
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Upload image for text extraction. Click or drag and drop."
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`
            rounded-lg border-2 border-dashed p-6 text-center cursor-pointer
            transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
            ${isDragging ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/50'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            disabled={disabled || isExtracting}
            data-testid="ocr-file-input"
          />
          <div className="flex flex-col items-center gap-2">
            <ScanText className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium text-sm">
              {isDragging ? 'Drop image here' : 'Upload image for OCR'}
            </p>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, GIF, WebP up to 10MB
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-2 flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        )}
      </div>
    );
  }

  // Show preview + extract button
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-input bg-background p-4">
        <div className="flex items-center gap-4">
          {preview && (
            <NextImage
              src={preview}
              alt="Image to extract text from"
              width={64}
              height={64}
              className="h-16 w-16 rounded object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-sm">{image.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(image.size)}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled || isExtracting}
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={handleExtract}
        disabled={disabled || isExtracting}
        className="w-full gap-2"
      >
        {isExtracting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Extracting text...
          </>
        ) : (
          <>
            <ScanText className="h-4 w-4" />
            Extract Text (OCR)
          </>
        )}
      </Button>

      {error && (
        <p className="flex items-center gap-1 text-sm text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}
