import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Getting Started',
  description: 'Get up and running with Mindweave in minutes.',
};

export default function GettingStartedPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-bold mb-3">Getting Started</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Get up and running with Mindweave in just a few steps. This guide walks you through creating
          your account, saving your first piece of knowledge, and exploring the core features.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">1. Create Your Account</h2>
        <p className="text-muted-foreground leading-relaxed">
          Sign up for Mindweave using your Google account. Click <strong>Sign In</strong> on
          the home page and authorize with Google OAuth. Your account is created automatically
          on first sign-in.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          After signing in, you can optionally add an email and password in your{' '}
          <Link href="/docs/account" className="text-primary hover:underline">account settings</Link>{' '}
          for credential-based login.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">2. Save Your First Note</h2>
        <p className="text-muted-foreground leading-relaxed">
          Navigate to the <strong>Capture</strong> page from your dashboard. Here you can:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Write a quick note with a title and body text.</li>
          <li>Save a link by pasting a URL — Mindweave will extract the page title automatically.</li>
          <li>Upload a file to store alongside your notes.</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          Add some tags to keep things organized, or let the AI auto-tagger suggest tags for you.
          Learn more about{' '}
          <Link href="/docs/features/capture" className="text-primary hover:underline">content capture</Link>.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">3. Explore Your Library</h2>
        <p className="text-muted-foreground leading-relaxed">
          Once you have saved some content, head to the{' '}
          <Link href="/docs/features/library" className="text-primary hover:underline">Library</Link>{' '}
          to browse, filter, and sort your knowledge base. Use the filter bar to narrow down content
          by type, tags, or date range.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">4. Search Your Knowledge</h2>
        <p className="text-muted-foreground leading-relaxed">
          Mindweave offers two powerful search modes:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>
            <strong>Keyword search</strong> — Traditional full-text search across titles, bodies, and tags.
          </li>
          <li>
            <strong>Semantic search</strong> — AI-powered search that understands meaning, not just keywords.
            Search for concepts and get results even when exact words don&apos;t match.
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          Learn more about{' '}
          <Link href="/docs/features/search" className="text-primary hover:underline">search</Link>.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">5. Ask Questions</h2>
        <p className="text-muted-foreground leading-relaxed">
          The <Link href="/docs/features/ask" className="text-primary hover:underline">Knowledge Q&amp;A</Link>{' '}
          feature lets you ask natural language questions and get answers drawn from your saved content.
          It uses retrieval-augmented generation (RAG) with Google Gemini to provide accurate,
          sourced answers.
        </p>
      </section>

      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-xl font-semibold mb-2">Next Steps</h2>
        <ul className="space-y-2">
          <li>
            <Link href="/docs/features" className="text-primary hover:underline">
              Explore all features
            </Link>
            <span className="text-muted-foreground"> — Deep dive into each Mindweave capability.</span>
          </li>
          <li>
            <Link href="/docs/features/tagging" className="text-primary hover:underline">
              Learn about tagging
            </Link>
            <span className="text-muted-foreground"> — Master manual and AI-powered content organization.</span>
          </li>
          <li>
            <Link href="/docs/faq" className="text-primary hover:underline">
              Read the FAQ
            </Link>
            <span className="text-muted-foreground"> — Find answers to common questions.</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
