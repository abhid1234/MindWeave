import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tagging',
  description: 'Learn about manual and AI-powered tagging in Mindweave.',
};

export default function TaggingPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-bold mb-3">Tagging</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Tags are the primary way to organize content in Mindweave. Use manual tags for
          precise categorization, and let AI auto-tagging handle the rest.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Manual Tags</h2>
        <p className="text-muted-foreground leading-relaxed">
          Add tags to any piece of content when creating or editing it. Tags are free-form
          text labels that help you categorize and filter your knowledge base.
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Type a tag name and press Enter to add it.</li>
          <li>Click the &times; on a tag to remove it.</li>
          <li>Tags are case-insensitive and deduplicated automatically.</li>
          <li>Use descriptive, consistent naming (e.g., &quot;machine-learning&quot;, &quot;project-alpha&quot;).</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">AI Auto-Tagging</h2>
        <p className="text-muted-foreground leading-relaxed">
          Mindweave uses Google Gemini AI to automatically analyze your content and suggest
          relevant tags. Auto-generated tags appear with a distinct style so you can tell them
          apart from your manual tags.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          How auto-tagging works:
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
          <li>When you save content, Mindweave sends the title and body to Google Gemini.</li>
          <li>Gemini analyzes the content and returns a set of suggested tags.</li>
          <li>These tags are stored as <strong>autoTags</strong>, separate from your manual tags.</li>
          <li>Both manual and auto tags are searchable and filterable in the library.</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Tag Management</h2>
        <p className="text-muted-foreground leading-relaxed">
          Your tags are visible across the application:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>
            <strong>Library filter bar</strong> — Filter content by clicking on tags.
          </li>
          <li>
            <strong>Content cards</strong> — Tags are displayed on each content card.
          </li>
          <li>
            <strong>Search</strong> — Tags are included in{' '}
            <Link href="/docs/features/search" className="text-primary hover:underline">full-text search</Link>{' '}
            results.
          </li>
          <li>
            <strong>Analytics</strong> — View tag distribution and usage in the{' '}
            <Link href="/docs/features/analytics" className="text-primary hover:underline">analytics dashboard</Link>.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Tips for Effective Tagging</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>
            <strong>Be consistent</strong> — Use the same tag format throughout
            (e.g., lowercase with hyphens: &quot;web-development&quot;).
          </li>
          <li>
            <strong>Use hierarchies</strong> — Create broad and specific tags
            (e.g., &quot;programming&quot; and &quot;python&quot;) for flexible filtering.
          </li>
          <li>
            <strong>Review auto-tags</strong> — Check AI suggestions and add or remove
            tags as needed to improve accuracy over time.
          </li>
          <li>
            <strong>Don&apos;t over-tag</strong> — 3-5 tags per item is usually enough
            for effective organization.
          </li>
        </ul>
      </section>
    </div>
  );
}
