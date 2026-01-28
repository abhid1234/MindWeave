'use client';

import { useState } from 'react';
import { createContentAction } from '@/app/actions/content';

export default function CreateContentStep() {
  const [type, setType] = useState<'note' | 'link'>('note');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(formData: FormData) {
    setError('');
    formData.set('type', type);
    const result = await createContentAction(formData);
    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.message);
    }
  }

  if (submitted) {
    return (
      <div className="text-center">
        <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl">&#10003;</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Content Created!</h2>
        <p className="text-muted-foreground">
          Great job! You can always add more content from the Capture page.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-center">Create Your First Content</h2>
      <p className="text-muted-foreground mb-6 text-center">
        Try adding a quick note or bookmark. You can skip this step if you prefer.
      </p>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setType('note')}
          className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            type === 'note' ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-accent'
          }`}
        >
          Note
        </button>
        <button
          type="button"
          onClick={() => setType('link')}
          className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            type === 'link' ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-accent'
          }`}
        >
          Link
        </button>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder={type === 'note' ? 'My first note' : 'Interesting article'}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>

        {type === 'link' && (
          <div>
            <label htmlFor="url" className="block text-sm font-medium mb-1">
              URL
            </label>
            <input
              id="url"
              name="url"
              type="url"
              placeholder="https://example.com"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
        )}

        <div>
          <label htmlFor="body" className="block text-sm font-medium mb-1">
            {type === 'note' ? 'Content' : 'Notes (optional)'}
          </label>
          <textarea
            id="body"
            name="body"
            rows={3}
            placeholder={type === 'note' ? 'Write your thoughts...' : 'Why is this interesting?'}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>

        <input type="hidden" name="tags" value="" />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create {type === 'note' ? 'Note' : 'Link'}
        </button>
      </form>
    </div>
  );
}
