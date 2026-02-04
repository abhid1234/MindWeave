import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Content Library',
  description: 'Browse, filter, and manage your knowledge base in the Mindweave library.',
};

export default function LibraryPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-bold mb-3">Content Library</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          The Library is your central hub for browsing and managing all saved content.
          Use filters, sorting, and bulk actions to keep your knowledge base organized.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Browsing Content</h2>
        <p className="text-muted-foreground leading-relaxed">
          Your library displays content as cards showing the title, content type, tags, and
          creation date. Each card includes a preview of the content body, making it easy to
          scan through your knowledge at a glance.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Filtering</h2>
        <p className="text-muted-foreground leading-relaxed">
          The filter bar at the top of the library lets you narrow down your content:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li><strong>Content type</strong> — Show only notes, links, or files.</li>
          <li><strong>Tags</strong> — Filter by one or more tags to find related content.</li>
          <li><strong>Date range</strong> — View content created within a specific time period.</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          Filters can be combined. For example, you can show only notes tagged with &quot;project-ideas&quot;
          created in the last month.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Sorting</h2>
        <p className="text-muted-foreground leading-relaxed">
          Sort your content by:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li><strong>Newest first</strong> — Most recently created content appears first (default).</li>
          <li><strong>Oldest first</strong> — Chronological order from earliest to latest.</li>
          <li><strong>Alphabetical</strong> — Sort by title A-Z.</li>
          <li><strong>Recently updated</strong> — Content modified most recently appears first.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Content Cards</h2>
        <p className="text-muted-foreground leading-relaxed">
          Each content card in the library shows:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Content type icon (note, link, or file).</li>
          <li>Title and body preview.</li>
          <li>Tags (both manual and AI-generated).</li>
          <li>Creation date.</li>
          <li>Quick actions for editing and deleting.</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          Click on any card to view the full content details, or use the action buttons for
          quick edits and management.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Bulk Actions</h2>
        <p className="text-muted-foreground leading-relaxed">
          Select multiple content items to perform bulk operations such as tagging, deleting,
          or moving to collections. This is useful when reorganizing your knowledge base
          or cleaning up old content.
        </p>
      </section>
    </div>
  );
}
