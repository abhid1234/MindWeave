import type { Metadata } from 'next';
import { Search, FileQuestion } from 'lucide-react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content } from '@/lib/db/schema';
import { sql, ilike } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { SemanticSearchForm } from '@/components/search/SemanticSearchForm';
import { SearchResultCard } from '@/components/search/SearchResultCard';

export const metadata: Metadata = {
  title: 'Search | Mindweave',
  description: 'Search your knowledge base by keyword or meaning with semantic search',
};

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
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Search className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Search</h1>
            <p className="text-muted-foreground">
              Find anything in your knowledge base
            </p>
          </div>
        </div>
      </div>

      {/* Search Form with Mode Toggle */}
      <div className="animate-fade-up" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
        <SemanticSearchForm
          initialQuery={query}
          initialMode={mode}
        />
      </div>

      {/* Keyword Search Results (server-rendered) */}
      {mode === 'keyword' && query && (
        <div className="animate-fade-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
          <p className="mb-4 text-sm text-muted-foreground">
            Found {keywordResults.length} result{keywordResults.length !== 1 ? 's' : ''} for &quot;{query}&quot;
          </p>

          {keywordResults.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center shadow-soft animate-fade-up">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FileQuestion className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold">No results found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try different keywords or switch to semantic search.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {keywordResults.map((item, index) => (
                <div
                  key={item.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}
                >
                  <SearchResultCard item={item} query={query} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Initial State (no query) */}
      {!query && (
        <div className="animate-fade-up rounded-xl border bg-card p-12 text-center shadow-soft" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold">Start searching</h3>
          <p className="mt-1 text-sm text-muted-foreground">
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
