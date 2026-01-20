'use client';

import { createContentAction } from '@/app/actions/content';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CapturePage() {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string[]>>>({});
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setFeedback(null);
    setErrors({});

    startTransition(async () => {
      const result = await createContentAction(formData);

      if (result.success) {
        setFeedback({ type: 'success', message: result.message });
        // Reset form by redirecting to same page
        setTimeout(() => {
          router.push('/dashboard/library');
        }, 1500);
      } else {
        setFeedback({ type: 'error', message: result.message });
        if (result.errors) {
          setErrors(result.errors);
        }
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Capture</h1>
        <p className="mt-2 text-muted-foreground">
          Save a note, link, or file to your knowledge hub
        </p>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div
          className={`mb-6 rounded-lg p-4 ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
          role="alert"
        >
          <p className="font-medium">{feedback.message}</p>
        </div>
      )}

      <form action={handleSubmit} className="space-y-6">
        {/* Type Selection */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium">
            Type
          </label>
          <select
            id="type"
            name="type"
            defaultValue="note"
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

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            type="text"
            name="title"
            placeholder="Give your content a title..."
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
            disabled={isPending}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title[0]}</p>
          )}
        </div>

        {/* Body */}
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

        {/* URL */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium">
            URL (Optional)
          </label>
          <input
            id="url"
            type="url"
            name="url"
            placeholder="https://example.com"
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={isPending}
          />
          {errors.url && (
            <p className="mt-1 text-sm text-red-600">{errors.url[0]}</p>
          )}
        </div>

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
            disabled={isPending}
            className="rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
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
