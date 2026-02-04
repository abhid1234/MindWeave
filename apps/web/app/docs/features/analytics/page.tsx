import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Track your knowledge growth and usage patterns with the Mindweave analytics dashboard.',
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-bold mb-3">Analytics</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          The analytics dashboard gives you insight into your knowledge base growth,
          content distribution, and usage patterns over time.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Dashboard Overview</h2>
        <p className="text-muted-foreground leading-relaxed">
          The analytics dashboard is accessible from the main navigation. It provides
          at-a-glance metrics about your knowledge base:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li><strong>Total content count</strong> — Number of notes, links, and files saved.</li>
          <li><strong>Content by type</strong> — Breakdown of content types.</li>
          <li><strong>Growth over time</strong> — Chart showing content creation trends.</li>
          <li><strong>Tag distribution</strong> — Most used tags across your knowledge base.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Content Metrics</h2>
        <p className="text-muted-foreground leading-relaxed">
          Track how your knowledge base is growing:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Total items created per day, week, or month.</li>
          <li>Content type distribution (notes vs. links vs. files).</li>
          <li>Average tags per item.</li>
          <li>Most active creation periods.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Tag Analytics</h2>
        <p className="text-muted-foreground leading-relaxed">
          Understand how you organize your content:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li><strong>Top tags</strong> — Your most frequently used tags.</li>
          <li><strong>Tag trends</strong> — How tag usage changes over time.</li>
          <li><strong>Untagged content</strong> — Content that may need better organization.</li>
          <li><strong>AI vs. manual tags</strong> — Comparison of auto-generated and manual tags.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Export</h2>
        <p className="text-muted-foreground leading-relaxed">
          You can export your analytics data for external analysis or record-keeping.
          Export options include CSV format for spreadsheet tools.
        </p>
      </section>
    </div>
  );
}
