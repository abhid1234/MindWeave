import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content } from '@/lib/db/schema';
import { eq, or, ilike } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user?.id) {
    redirect('/login');
  }

  const query = params.q || '';
  let results: any[] = [];

  if (query) {
    // Simple keyword search for now
    // TODO: Implement semantic search with embeddings in feature development phase
    results = await db
      .select()
      .from(content)
      .where(
        eq(content.userId, session.user.id)
      )
      .then((items) =>
        items.filter(
          (item) =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.body?.toLowerCase().includes(query.toLowerCase()) ||
            item.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
        )
      );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Search</h1>
        <p className="mt-2 text-muted-foreground">
          Find anything in your knowledge base
        </p>
      </div>

      {/* Search Form */}
      <form method="get" className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search your notes, links, and files..."
            className="flex-1 rounded-lg border border-input bg-background px-4 py-3"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Search
          </button>
        </div>
      </form>

      {/* Results */}
      {query && (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            Found {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
          </p>

          {results.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-muted-foreground">No results found. Try a different search term.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((item) => (
                <div key={item.id} className="rounded-lg border bg-card p-4 hover:bg-accent">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{item.title}</h3>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                          {item.type}
                        </span>
                      </div>
                      {item.body && (
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                          {item.body}
                        </p>
                      )}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 block text-sm text-primary hover:underline"
                        >
                          {item.url}
                        </a>
                      )}
                      {(item.tags.length > 0 || item.autoTags.length > 0) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                            >
                              {tag}
                            </span>
                          ))}
                          {item.autoTags.map((tag: string) => (
                            <span
                              key={tag}
                              className="rounded-full bg-secondary px-2 py-1 text-xs font-medium"
                            >
                              {tag} (AI)
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="ml-4 text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!query && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Enter a search term to find content in your knowledge base
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Tip: Semantic search with AI will be available soon!
          </p>
        </div>
      )}
    </div>
  );
}
