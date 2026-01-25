'use client';

import { createContentAction } from '@/app/actions/content';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { FileUpload, type UploadedFile } from '@/components/capture/FileUpload';
import { useToast } from '@/components/ui/toast';

export default function CapturePage() {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<string, string[]>>>({});
  const [contentType, setContentType] = useState<'note' | 'link' | 'file'>('note');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const router = useRouter();
  const { addToast } = useToast();

  async function handleSubmit(formData: FormData) {
    setErrors({});

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

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setContentType(e.target.value as 'note' | 'link' | 'file');
    setUploadedFile(null);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Capture</h1>
        <p className="mt-2 text-muted-foreground">
          Save a note, link, or file to your knowledge hub
        </p>
      </div>

      <form action={handleSubmit} className="space-y-6">
        {/* Type Selection */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium">
            Type
          </label>
          <select
            id="type"
            name="type"
            value={contentType}
            onChange={handleTypeChange}
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
            disabled={isPending}
          >
            <option value="note">Note</option>
            <option value="link">Link</option>
            <option value="file">File</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type[0]}</p>
          )}
        </div>

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
          <label htmlFor="title" className="block text-sm font-medium">
            Title {contentType === 'file' && uploadedFile ? '(Optional)' : ''}
          </label>
          <input
            id="title"
            type="text"
            name="title"
            placeholder={
              contentType === 'file' && uploadedFile
                ? uploadedFile.fileName
                : 'Give your content a title...'
            }
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
            <label htmlFor="body" className="block text-sm font-medium">
              Content (Optional)
            </label>
            <textarea
              id="body"
              name="body"
              rows={8}
              placeholder="Add your notes, thoughts, or content..."
              className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled={isPending}
            />
            {errors.body && (
              <p className="mt-1 text-sm text-red-600">{errors.body[0]}</p>
            )}
          </div>
        )}

        {/* Description for file type */}
        {contentType === 'file' && (
          <div>
            <label htmlFor="body" className="block text-sm font-medium">
              Description (Optional)
            </label>
            <textarea
              id="body"
              name="body"
              rows={4}
              placeholder="Add a description for this file..."
              className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
            <label htmlFor="url" className="block text-sm font-medium">
              URL
            </label>
            <input
              id="url"
              type="url"
              name="url"
              placeholder="https://example.com"
              className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
              disabled={isPending}
            />
            {errors.url && (
              <p className="mt-1 text-sm text-red-600">{errors.url[0]}</p>
            )}
          </div>
        )}

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium">
            Tags (Optional)
          </label>
          <input
            id="tags"
            type="text"
            name="tags"
            placeholder="comma, separated, tags"
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={isPending}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Separate tags with commas. AI will suggest additional tags automatically.
          </p>
          {errors.tags && (
            <p className="mt-1 text-sm text-red-600">{errors.tags[0]}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isPending || (contentType === 'file' && !uploadedFile)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? 'Saving...' : 'Save'}
          </button>
          <Link
            href="/dashboard"
            className="rounded-lg border border-border px-6 py-2.5 font-medium hover:bg-accent inline-block"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
