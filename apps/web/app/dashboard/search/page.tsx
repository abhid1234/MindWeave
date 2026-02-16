import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content } from '@/lib/db/schema';
import { sql, ilike } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { SemanticSearchForm } from '@/components/search/SemanticSearchForm';
import { SearchResultCard } from '@/components/search/SearchResultCard';

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
                <SearchResultCard key={item.id} item={item} query={query} />
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
