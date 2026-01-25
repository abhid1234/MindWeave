'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Image as ImageIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NextImage from 'next/image';

export type UploadedFile = {
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
};

export type FileUploadProps = {
  onFileUploaded: (file: UploadedFile) => void;
  onFileRemoved: () => void;
  uploadedFile: UploadedFile | null;
  disabled?: boolean;
};

export function FileUpload({
  onFileUploaded,
  onFileRemoved,
  uploadedFile,
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onFileUploaded(result.data);
      } else {
        setError(result.message || 'Failed to upload file');
      }
    } catch {
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onFileRemoved();
    setError(null);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" aria-hidden="true" />;
    }
    if (fileType === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" aria-hidden="true" />;
    }
    return <File className="h-8 w-8 text-gray-500" aria-hidden="true" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (uploadedFile) {
    return (
      <div className="rounded-lg border border-input bg-background p-4">
        <div className="flex items-center gap-4">
          {uploadedFile.fileType.startsWith('image/') ? (
            <NextImage
              src={uploadedFile.filePath}
              alt={uploadedFile.fileName}
              width={64}
              height={64}
              className="h-16 w-16 rounded object-cover"
            />
          ) : (
            getFileIcon(uploadedFile.fileType)
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{uploadedFile.fileName}</p>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(uploadedFile.fileSize)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`
          relative rounded-lg border-2 border-dashed p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.txt,.md,.doc,.docx"
          className="hidden"
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">
              {isDragging ? 'Drop file here' : 'Click or drag file to upload'}
            </p>
            <p className="text-sm text-muted-foreground">
              PDF, images, text files up to 10MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
