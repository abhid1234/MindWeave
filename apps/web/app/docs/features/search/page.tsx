import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Learn about full-text and semantic search in Mindweave.',
};

export default function SearchPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-bold mb-3">Search</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Mindweave provides two search modes: traditional keyword search for exact matches
          and AI-powered semantic search that understands meaning and context.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Keyword Search</h2>
        <p className="text-muted-foreground leading-relaxed">
          Full-text keyword search looks for exact and partial word matches across your content.
          It searches through:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Content titles</li>
          <li>Body text</li>
          <li>Tags (both manual and auto-generated)</li>
          <li>URLs (for link content)</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          Keyword search is fast and useful when you know the exact terms you&apos;re
          looking for. Results are ranked by relevance.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Semantic Search</h2>
        <p className="text-muted-foreground leading-relaxed">
          Semantic search uses AI to understand the meaning behind your query, returning
          results that are conceptually similar even when they don&apos;t share the same words.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          How it works:
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
          <li>Your search query is converted into a 768-dimensional vector embedding using Google Gemini.</li>
          <li>This embedding is compared against the embeddings of all your saved content using pgvector.</li>
          <li>Results are ranked by cosine similarity — the closer the vectors, the more relevant the result.</li>
        </ol>
        <p className="text-muted-foreground leading-relaxed">
          For example, searching for &quot;machine learning algorithms&quot; might return a note
          titled &quot;Neural network training techniques&quot; because the concepts are semantically related.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">When to Use Which</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-muted-foreground">
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-4 text-left font-semibold text-foreground">Use Case</th>
                <th className="py-2 pr-4 text-left font-semibold text-foreground">Search Mode</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4">Looking for a specific title or tag</td>
                <td className="py-2 pr-4">Keyword</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Finding content about a topic or concept</td>
                <td className="py-2 pr-4">Semantic</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Searching for a URL or domain</td>
                <td className="py-2 pr-4">Keyword</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Exploring related ideas</td>
                <td className="py-2 pr-4">Semantic</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Filtering by exact tag name</td>
                <td className="py-2 pr-4">Keyword or Library filter</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Search Tips</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>
            <strong>Be descriptive for semantic search</strong> — Longer, more descriptive queries
            give better semantic results. Instead of &quot;react&quot;, try &quot;react component
            state management patterns&quot;.
          </li>
          <li>
            <strong>Use keyword search for precision</strong> — When you know the exact term, keyword
            search is faster and more precise.
          </li>
          <li>
            <strong>Combine with filters</strong> — Use the{' '}
            <Link href="/docs/features/library" className="text-primary hover:underline">library filters</Link>{' '}
            alongside search to narrow results by type, tags, or date.
          </li>
        </ul>
      </section>
    </div>
  );
}
