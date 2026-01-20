import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; tag?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Get filter parameters
  const typeFilter = params.type;
  const tagFilter = params.tag;

  // Fetch content
  let items = await db
    .select()
    .from(content)
    .where(eq(content.userId, session.user.id))
    .orderBy(desc(content.createdAt));

  // Apply filters
  if (typeFilter) {
    items = items.filter((item) => item.type === typeFilter);
  }
  if (tagFilter) {
    items = items.filter(
      (item) =>
        item.tags.includes(tagFilter) || item.autoTags.includes(tagFilter)
    );
  }

  // Get all unique tags
  const allTags = new Set<string>();
  await db
    .select()
    .from(content)
    .where(eq(content.userId, session.user.id))
    .then((items) => {
      items.forEach((item) => {
        item.tags.forEach((tag) => allTags.add(tag));
        item.autoTags.forEach((tag) => allTags.add(tag));
      });
    });

  const tags = Array.from(allTags).sort();

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Library</h1>
        <p className="mt-2 text-muted-foreground">
          Browse and organize all your saved content
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Type</label>
          <div className="flex gap-2">
            <Link
              href="/library"
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                !typeFilter ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              All
            </Link>
            <Link
              href="/library?type=note"
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                typeFilter === 'note' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              Notes
            </Link>
            <Link
              href="/library?type=link"
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                typeFilter === 'link' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              Links
            </Link>
            <Link
              href="/library?type=file"
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                typeFilter === 'file' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              Files
            </Link>
          </div>
        </div>

        {tags.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 10).map((tag) => (
                <Link
                  key={tag}
                  href={`/library?tag=${encodeURIComponent(tag)}`}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    tagFilter === tag ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                  }`}
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content Grid */}
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            {typeFilter || tagFilter
              ? 'No content matches your filters.'
              : 'No content yet. Start capturing your ideas!'}
          </p>
          <Link
            href="/capture"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create Content
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {items.length} item{items.length !== 1 ? 's' : ''}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                    {item.type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-semibold line-clamp-2 mb-2">{item.title}</h3>

                {item.body && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {item.body}
                  </p>
                )}

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-primary hover:underline mb-3 truncate"
                  >
                    {item.url}
                  </a>
                )}

                {(item.tags.length > 0 || item.autoTags.length > 0) && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.autoTags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-secondary px-2 py-0.5 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
