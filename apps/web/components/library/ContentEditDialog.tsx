'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, File, FileText, Image as ImageIcon, X, Check } from 'lucide-react';
import { updateContentAction } from '@/app/actions/content';
import type { ContentType } from '@/lib/db/schema';

export type ContentEditDialogProps = {
  content: {
    id: string;
    type: ContentType;
    title: string;
    body: string | null;
    url: string | null;
    metadata?: {
      fileType?: string;
      fileSize?: number;
      filePath?: string;
      fileName?: string;
      [key: string]: unknown;
    } | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

function getFileIcon(fileType?: string) {
  if (!fileType) return <File className="h-5 w-5 text-muted-foreground" aria-hidden="true" />;
  if (fileType.startsWith('image/'))
    return <ImageIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />;
  if (fileType === 'application/pdf')
    return <FileText className="h-5 w-5 text-red-500" aria-hidden="true" />;
  return <File className="h-5 w-5 text-muted-foreground" aria-hidden="true" />;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ContentEditDialog({
  content,
  open,
  onOpenChange,
  onUpdated,
}: ContentEditDialogProps) {
  const [title, setTitle] = useState(content.title);
  const [body, setBody] = useState(content.body || '');
  const [url, setUrl] = useState(content.url || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // File re-upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form state when dialog opens or content changes
  useEffect(() => {
    if (open) {
      setTitle(content.title);
      setBody(content.body || '');
      setUrl(content.url || '');
      setErrors({});
      setGeneralError(null);
      setUploadedFile(null);
      setUploadError(null);
    }
  }, [open, content.title, content.body, content.url]);

  const handleFileUpload = async (file: globalThis.File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        setUploadError(result.message || 'Failed to upload file');
        return;
      }

      setUploadedFile(result.data);
    } catch {
      setUploadError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      const params: {
        contentId: string;
        title: string;
        body?: string;
        url?: string;
        metadata?: Record<string, string | number | boolean | null>;
      } = {
        contentId: content.id,
        title,
        body: body || undefined,
        url: content.type === 'link' ? url || undefined : undefined,
      };

      // Include new file metadata if a file was re-uploaded
      if (uploadedFile) {
        params.metadata = {
          fileName: uploadedFile.fileName,
          filePath: uploadedFile.filePath,
          fileType: uploadedFile.fileType,
          fileSize: uploadedFile.fileSize,
        };
      }

      const result = await updateContentAction(params);

      if (result.success) {
        onOpenChange(false);
        onUpdated?.();
      } else {
        if (result.errors) {
          setErrors(result.errors as Record<string, string[]>);
        } else {
          setGeneralError(result.message);
        }
      }
    } catch {
      setGeneralError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting && !isUploading) {
      // Reset form state when opening
      if (newOpen) {
        setTitle(content.title);
        setBody(content.body || '');
        setUrl(content.url || '');
        setErrors({});
        setGeneralError(null);
        setUploadedFile(null);
        setUploadError(null);
      }
      onOpenChange(newOpen);
    }
  };

  const currentFile = uploadedFile || content.metadata;
  const hasNewFile = !!uploadedFile;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
            <DialogDescription asChild>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Editing</span>
                <Badge variant="secondary" className="capitalize">
                  {content.type}
                </Badge>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {generalError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {generalError}
              </div>
            )}

            {/* File section for file-type content */}
            {content.type === 'file' && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">File</label>

                {/* Current file display */}
                {currentFile && (
                  <div className="flex items-center gap-3 rounded-md border bg-muted/50 px-3 py-2.5">
                    {getFileIcon(currentFile.fileType)}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {currentFile.fileName || 'Uploaded file'}
                      </p>
                      {currentFile.fileSize && (
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(currentFile.fileSize)}
                        </p>
                      )}
                    </div>
                    {hasNewFile && (
                      <div className="flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">New</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setUploadedFile(null)}
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="sr-only">Remove new file</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload / replace button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.txt,.md,.doc,.docx"
                  className="hidden"
                  disabled={isUploading || isSubmitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isSubmitting}
                >
                  {isUploading ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {content.metadata?.filePath ? 'Replace file' : 'Upload file'}
                    </>
                  )}
                </Button>

                {uploadError && (
                  <p className="text-sm text-destructive">{uploadError}</p>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                disabled={isSubmitting}
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title[0]}</p>
              )}
            </div>

            <div className="grid gap-2">
              <label htmlFor="body" className="text-sm font-medium">
                Content
              </label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter content (optional)"
                rows={5}
                disabled={isSubmitting}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-invalid={!!errors.body}
              />
              {errors.body && (
                <p className="text-sm text-destructive">{errors.body[0]}</p>
              )}
            </div>

            {content.type === 'link' && (
              <div className="grid gap-2">
                <label htmlFor="url" className="text-sm font-medium">
                  URL
                </label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.url}
                />
                {errors.url && (
                  <p className="text-sm text-destructive">{errors.url[0]}</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
