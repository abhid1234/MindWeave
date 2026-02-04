import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Content Capture',
  description: 'Learn how to capture notes, links, and files in Mindweave.',
};

export default function CapturePage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-bold mb-3">Content Capture</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Mindweave lets you capture three types of content: notes, links, and files.
          Each type is optimized for its use case while sharing the same powerful organization
          and search capabilities.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Notes</h2>
        <p className="text-muted-foreground leading-relaxed">
          Notes are free-form text entries for capturing ideas, thoughts, and information.
          To create a note:
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
          <li>Navigate to <strong>Capture</strong> from the dashboard.</li>
          <li>Select the <strong>Note</strong> content type.</li>
          <li>Enter a title for your note.</li>
          <li>Write your note content in the body field.</li>
          <li>Optionally add tags to organize your note.</li>
          <li>Click <strong>Save</strong> to store your note.</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Links</h2>
        <p className="text-muted-foreground leading-relaxed">
          Save bookmarks and web links with their metadata. When you paste a URL, Mindweave
          automatically extracts the page title when possible.
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
          <li>Navigate to <strong>Capture</strong> from the dashboard.</li>
          <li>Select the <strong>Link</strong> content type.</li>
          <li>Paste the URL you want to save.</li>
          <li>Add or edit the title as needed.</li>
          <li>Optionally add notes in the body field for your own context.</li>
          <li>Add tags and click <strong>Save</strong>.</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Files</h2>
        <p className="text-muted-foreground leading-relaxed">
          Upload files to keep documents, images, and other resources alongside your notes
          and links. Files are stored securely and can be tagged and searched just like other content.
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
          <li>Navigate to <strong>Capture</strong> from the dashboard.</li>
          <li>Select the <strong>File</strong> content type.</li>
          <li>Upload your file using the file picker.</li>
          <li>Add a title and optional description.</li>
          <li>Add tags and click <strong>Save</strong>.</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">AI Auto-Tagging</h2>
        <p className="text-muted-foreground leading-relaxed">
          When you save content, Mindweave can automatically suggest tags using Google Gemini AI.
          The AI analyzes your content and generates relevant tags that you can accept, modify,
          or dismiss. Learn more about{' '}
          <Link href="/docs/features/tagging" className="text-primary hover:underline">
            tagging
          </Link>.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Embeddings</h2>
        <p className="text-muted-foreground leading-relaxed">
          When content is saved, Mindweave generates a vector embedding using Google Gemini&apos;s
          text-embedding-004 model. This 768-dimensional embedding powers{' '}
          <Link href="/docs/features/search" className="text-primary hover:underline">
            semantic search
          </Link>{' '}
          and the{' '}
          <Link href="/docs/features/ask" className="text-primary hover:underline">
            Knowledge Q&amp;A
          </Link>{' '}
          feature, enabling you to find content by meaning rather than exact keywords.
        </p>
      </section>
    </div>
  );
}
