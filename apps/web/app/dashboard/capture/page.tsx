import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export default async function CapturePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  async function createContent(formData: FormData) {
    'use server';

    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const type = formData.get('type') as 'note' | 'link' | 'file';
    const title = formData.get('title') as string;
    const body = formData.get('body') as string;
    const url = formData.get('url') as string;
    const tags = (formData.get('tags') as string)
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    await db.insert(content).values({
      userId: session.user.id,
      type,
      title,
      body: body || null,
      url: url || null,
      tags,
      autoTags: [], // TODO: Generate with Claude in feature development phase
    });

    revalidatePath('/library');
    revalidatePath('/dashboard');
    redirect('/library');
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Capture</h1>
        <p className="mt-2 text-muted-foreground">
          Save a note, link, or file to your knowledge hub
        </p>
      </div>

      <form action={createContent} className="space-y-6">
        {/* Type Selection */}
        <div>
          <label className="block text-sm font-medium">Type</label>
          <select
            name="type"
            defaultValue="note"
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2"
            required
          >
            <option value="note">Note</option>
            <option value="link">Link</option>
            <option value="file">File</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            type="text"
            name="title"
            placeholder="Give your content a title..."
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2"
            required
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-medium">Content (Optional)</label>
          <textarea
            name="body"
            rows={8}
            placeholder="Add your notes, thoughts, or content..."
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2"
          />
        </div>

        {/* URL */}
        <div>
          <label className="block text-sm font-medium">URL (Optional)</label>
          <input
            type="url"
            name="url"
            placeholder="https://example.com"
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium">Tags (Optional)</label>
          <input
            type="text"
            name="tags"
            placeholder="comma, separated, tags"
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Separate tags with commas. AI will suggest additional tags automatically.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-lg border border-border px-6 py-2.5 font-medium hover:bg-accent"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
