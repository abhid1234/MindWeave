'use client';

import { createContentAction } from '@/app/actions/content';
import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, LinkIcon, Upload, Loader2, PenLine, Sparkles } from 'lucide-react';
import { FileUpload, type UploadedFile } from '@/components/capture/FileUpload';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TagInput, type TagInputHandle } from '@/components/ui/tag-input';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { getTemplate, fillTemplatePlaceholders } from '@/lib/templates';
import { TemplateSelector } from '@/components/capture/TemplateSelector';

type ContentType = 'note' | 'link' | 'file';

const TYPE_OPTIONS: {
  value: ContentType;
  label: string;
  icon: typeof FileText;
  accent: {
    border: string;
    bg: string;
    ring: string;
    text: string;
    iconBg: string;
  };
}[] = [
  {
    value: 'note',
    label: 'Note',
    icon: FileText,
    accent: {
      border: 'border-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      ring: 'ring-blue-500/30',
      text: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    },
  },
  {
    value: 'link',
    label: 'Link',
    icon: LinkIcon,
    accent: {
      border: 'border-green-500',
      bg: 'bg-green-50 dark:bg-green-950/30',
      ring: 'ring-green-500/30',
      text: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-900/50',
    },
  },
  {
    value: 'file',
    label: 'File',
    icon: Upload,
    accent: {
      border: 'border-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      ring: 'ring-purple-500/30',
      text: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/50',
    },
  },
];

export default function CapturePage() {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<string, string[]>>>({});
  const [contentType, setContentType] = useState<ContentType>('note');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [body, setBody] = useState('');
  const tagInputRef = useRef<TagInputHandle>(null);
  const router = useRouter();
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Auto-select template from URL params
  useEffect(() => {
    const templateParam = searchParams.get('template');
    if (templateParam) {
      handleTemplateSelect(templateParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleTemplateSelect = (templateId: string | null) => {
    setSelectedTemplate(templateId);
    if (!templateId) return;

    const template = getTemplate(templateId);
    if (!template) return;

    setContentType(template.type);
    setBody(fillTemplatePlaceholders(template.bodyTemplate));
    setTags(template.defaultTags);

    // Set title via DOM since it's an uncontrolled input
    const titleInput = document.getElementById('title') as HTMLInputElement | null;
    if (titleInput) {
      titleInput.value = fillTemplatePlaceholders(template.defaultTitle);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    // Commit any pending tag text before submitting
    tagInputRef.current?.commitPending();

    const formData = new FormData(e.currentTarget);

    // Add file metadata to form data if file is uploaded
    if (contentType === 'file' && uploadedFile) {
      formData.set('metadata', JSON.stringify({
        fileType: uploadedFile.fileType,
        fileSize: uploadedFile.fileSize,
        filePath: uploadedFile.filePath,
        fileName: uploadedFile.fileName,
      }));
      // Set URL to file path for easy access
      formData.set('url', uploadedFile.filePath);
      // Use filename as title if not provided
      const title = formData.get('title') as string;
      if (!title || title.trim() === '') {
        formData.set('title', uploadedFile.fileName);
      }
    }

    startTransition(async () => {
      const result = await createContentAction(formData);

      if (result.success) {
        addToast({
          variant: 'success',
          title: 'Content saved',
          description: result.message,
        });
        // Reset form by redirecting to same page
        setTimeout(() => {
          router.push('/dashboard/library');
        }, 1000);
      } else {
        addToast({
          variant: 'error',
          title: 'Failed to save',
          description: result.message,
        });
        if (result.errors) {
          setErrors(result.errors);
        }
      }
    });
  }

  const handleTypeChange = (type: ContentType) => {
    setContentType(type);
    setUploadedFile(null);
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div
        className="mb-8 animate-fade-up"
        style={{ animationFillMode: 'backwards' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <PenLine className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Capture</h1>
            <p className="text-muted-foreground">
              Save a note, link, or file to your knowledge hub
            </p>
          </div>
        </div>
      </div>

      {/* Template Selector */}
      <div
        className="mb-6 animate-fade-up"
        style={{ animationDelay: '50ms', animationFillMode: 'backwards' }}
      >
        <TemplateSelector
          onSelect={handleTemplateSelect}
          selectedTemplate={selectedTemplate}
        />
      </div>

      {/* Type Selector Cards */}
      <div
        className="mb-6 animate-fade-up"
        style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}
        role="radiogroup"
        aria-label="Content type"
      >
        <div className="grid grid-cols-3 gap-3">
          {TYPE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = contentType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={option.label}
                onClick={() => handleTypeChange(option.value)}
                disabled={isPending}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200',
                  'hover:shadow-soft-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'disabled:pointer-events-none disabled:opacity-50',
                  isSelected
                    ? cn(option.accent.border, option.accent.bg, 'ring-2', option.accent.ring, 'shadow-soft')
                    : 'border-border bg-card hover:-translate-y-0.5'
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                  isSelected ? option.accent.iconBg : 'bg-muted'
                )}>
                  <Icon className={cn(
                    'h-5 w-5 transition-colors',
                    isSelected ? option.accent.text : 'text-muted-foreground'
                  )} />
                </div>
                <span className={cn(
                  'text-sm font-medium transition-colors',
                  isSelected ? option.accent.text : 'text-muted-foreground'
                )}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hidden type input for FormData */}
      <input type="hidden" name="type" value={contentType} form="capture-form" />

      {/* Form Card */}
      <Card
        className="animate-fade-up"
        style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}
      >
        <CardContent className="pt-6">
          <form id="capture-form" onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload - only show when type is file */}
            {contentType === 'file' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Upload File
                </label>
                <FileUpload
                  onFileUploaded={setUploadedFile}
                  onFileRemoved={() => setUploadedFile(null)}
                  uploadedFile={uploadedFile}
                  disabled={isPending}
                />
                {!uploadedFile && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Select a file to upload. Title will be auto-filled from filename.
                  </p>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Title {contentType === 'file' && uploadedFile ? '(Optional)' : ''}
              </label>
              <Input
                id="title"
                name="title"
                placeholder={
                  contentType === 'file' && uploadedFile
                    ? uploadedFile.fileName
                    : 'Give your content a title...'
                }
                required={contentType !== 'file' || !uploadedFile}
                disabled={isPending}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title[0]}</p>
              )}
            </div>

            {/* Body - hide for file type */}
            {contentType !== 'file' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {contentType === 'link' ? 'Description (Optional)' : 'Content (Optional)'}
                </label>
                <TiptapEditor
                  content={body}
                  onChange={setBody}
                  placeholder={
                    contentType === 'link'
                      ? 'Add notes about this link...'
                      : 'Add your notes, thoughts, or content...'
                  }
                  disabled={isPending}
                  minHeight="200px"
                />
                <input type="hidden" name="body" value={body} />
                {errors.body && (
                  <p className="mt-1 text-sm text-red-600">{errors.body[0]}</p>
                )}
              </div>
            )}

            {/* Description for file type */}
            {contentType === 'file' && (
              <div>
                <label htmlFor="body" className="block text-sm font-medium mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="body"
                  name="body"
                  rows={4}
                  placeholder="Add a description for this file..."
                  className={cn(
                    'w-full rounded-lg border border-input bg-background px-4 py-3 text-sm leading-relaxed',
                    'transition-all duration-200 ease-smooth',
                    'ring-offset-background',
                    'placeholder:text-muted-foreground',
                    'hover:border-primary/50',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'focus-visible:border-primary',
                    'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-input'
                  )}
                  disabled={isPending}
                />
                {errors.body && (
                  <p className="mt-1 text-sm text-red-600">{errors.body[0]}</p>
                )}
              </div>
            )}

            {/* URL - only show for link type */}
            {contentType === 'link' && (
              <div>
                <label htmlFor="url" className="block text-sm font-medium mb-2">
                  URL
                </label>
                <Input
                  id="url"
                  type="text"
                  inputMode="url"
                  name="url"
                  placeholder="https://example.com"
                  required
                  disabled={isPending}
                />
                {errors.url && (
                  <p className="mt-1 text-sm text-red-600">{errors.url[0]}</p>
                )}
              </div>
            )}

            {/* Tags */}
            <fieldset disabled={isPending}>
              <legend className="block text-sm font-medium mb-2">
                Tags (Optional)
              </legend>
              <TagInput
                ref={tagInputRef}
                tags={tags}
                onChange={setTags}
                placeholder="Add tags..."
              />
              <input type="hidden" name="tags" value={tags.join(',')} />
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                <span>AI will suggest additional tags automatically</span>
              </div>
              {errors.tags && (
                <p className="mt-1 text-sm text-red-600">{errors.tags[0]}</p>
              )}
            </fieldset>
          </form>
        </CardContent>
      </Card>

      {/* Actions */}
      <div
        className="mt-6 flex gap-4 animate-fade-up"
        style={{ animationDelay: '225ms', animationFillMode: 'backwards' }}
      >
        <Button
          type="submit"
          form="capture-form"
          size="lg"
          disabled={isPending || (contentType === 'file' && !uploadedFile)}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? 'Saving...' : 'Save'}
        </Button>
        <Link
          href="/dashboard"
          className="inline-flex h-12 items-center rounded-lg border border-border px-6 text-base font-medium hover:bg-accent transition-all"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
