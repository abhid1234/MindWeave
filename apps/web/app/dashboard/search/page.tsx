import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content } from '@/lib/db/schema';
import { eq, or, sql, ilike } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { SemanticSearchForm } from '@/components/search/SemanticSearchForm';

type SearchMode = 'keyword' | 'semantic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; mode?: SearchMode }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user?.id) {
    redirect('/login');
  }

  const query = params.q || '';
  const mode = params.mode || 'keyword';
  let keywordResults: Array<typeof content.$inferSelect> = [];

  // Only perform keyword search on server if mode is keyword
  if (query && mode === 'keyword') {
    // Database-level keyword search using ILIKE
    const searchPattern = `%${query}%`;

    keywordResults = await db
      .select()
      .from(content)
      .where(
        sql`${content.userId} = ${session.user.id} AND (
          ${ilike(content.title, searchPattern)} OR
          ${ilike(content.body, searchPattern)} OR
          EXISTS (SELECT 1 FROM unnest(${content.tags}) AS tag WHERE tag ILIKE ${searchPattern}) OR
          EXISTS (SELECT 1 FROM unnest(${content.autoTags}) AS tag WHERE tag ILIKE ${searchPattern})
        )`
      )
      .orderBy(content.createdAt);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Search</h1>
        <p className="mt-2 text-muted-foreground">
          Find anything in your knowledge base
        </p>
      </div>

      {/* Search Form with Mode Toggle */}
      <SemanticSearchForm
        initialQuery={query}
        initialMode={mode}
      />

      {/* Keyword Search Results (server-rendered) */}
      {mode === 'keyword' && query && (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            Found {keywordResults.length} result{keywordResults.length !== 1 ? 's' : ''} for &quot;{query}&quot;
          </p>

          {keywordResults.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-muted-foreground">
                No results found. Try different keywords or switch to semantic search.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {keywordResults.map((item) => (
                <div key={item.id} className="rounded-lg border bg-card p-4 hover:bg-accent transition-colors">
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
                              key={`auto-${tag}`}
                              className="rounded-full bg-secondary px-2 py-1 text-xs font-medium"
                            >
                              {tag} (AI)
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="ml-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Initial State (no query) */}
      {!query && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Enter a search term to find content in your knowledge base
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Use <strong>Keyword Search</strong> for exact matches or{' '}
            <strong>Semantic Search</strong> to find content by meaning
          </p>
        </div>
      )}
    </div>
  );
}
